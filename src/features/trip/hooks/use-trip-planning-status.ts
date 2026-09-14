import { useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { tripApi } from '../api/trip-api'
import { useAuthStore } from '@/app/store/auth-store'
import { useTripCreationStore } from '@/app/store/trip-creation-store'
import type { PlanStatus, PlanStepResult } from '../types/trip-types'

const PIPELINE_TIMEOUT_MS = 30 * 60 * 1000

// 락 해제 대기 간격. 상시 폴링이 아니다 — 이전 단계 요청이 서버에서 아직 돌고 있는데
// 새로고침 등으로 그 응답을 놓친 복귀 경로에서만 돈다. 정상 흐름에서는 각 단계가 동기 응답을
// 주므로 이 분기에 들어오지 않는다.
const LOCK_RECHECK_INTERVAL_MS = 5000

// 백엔드 파이프라인:
//   null -> date-plans -> CREATED/FIXED_PLANNED -> place-plans -> AI_PLANNED
//        -> transport-plans -> TRANSPORT_PLANNED (완료)
// 백엔드가 동기라(89a8429) 각 단계는 작업이 끝난 뒤 응답한다. 그래서 성공 후의 planStatus를
// 서버에 다시 묻지 않고 `to`로 그대로 알 수 있다 — 단계 사이 폴링이 필요 없는 이유다.
const PIPELINE: {
  from: (PlanStatus | null)[]
  run: (tripId: string) => Promise<PlanStepResult>
  to: PlanStatus
}[] = [
  { from: [null], run: tripApi.generateDatePlans, to: 'CREATED' },
  // FIXED_PLANNED = AI 일정 생성 중 실패해 멈춘 상태. 같은 단계를 다시 호출하면
  // 백엔드가 고정 일정은 건너뛰고 AI 일정만 재생성한다.
  { from: ['CREATED', 'FIXED_PLANNED'], run: tripApi.generatePlacePlans, to: 'AI_PLANNED' },
  { from: ['AI_PLANNED'], run: tripApi.generateTransportPlans, to: 'TRANSPORT_PLANNED' },
]

// 남은 단계가 없으면 null = 일정 완성 (TRANSPORT_PLANNED, 또는 완성 후 수정 중인 EDIT)
const stepFor = (planStatus: PlanStatus | null) =>
  PIPELINE.find((step) => step.from.includes(planStatus)) ?? null

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// 진행 중인 일정 생성을 끝까지 끌고 간다: 각 단계를 순차로 await 하며 파이프라인을 전진시킨다.
// 정확히 한 곳(앱 루트에 한 번 마운트되는 TripGenerationWatcher)에서만 돌아야 하며, 그래서
// 사용자가 어느 페이지에 있든 계속 진행된다 — 진행 상태는 컴포넌트 지역 상태가 아니라
// sessionStorage에 persist되는 공용 store로 읽고 쓴다.
export function useTripCreationPipeline(): void {
  const navigate = useNavigate()
  const tripId = useTripCreationStore((s) => s.tripId)
  const startedAt = useTripCreationStore((s) => s.startedAt)
  const attempt = useTripCreationStore((s) => s.attempt)
  const storedStatus = useTripCreationStore((s) => s.status)
  const setStatus = useTripCreationStore((s) => s.setStatus)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [isTimedOut, setIsTimedOut] = useState(false)
  const [isPipelineError, setIsPipelineError] = useState(false)
  const [isDone, setIsDone] = useState(false)

  // 재시도(retry)는 같은 tripId를 그대로 쓰므로 실행 단위는 tripId가 아니라 tripId+attempt다.
  const runKey = tripId === null ? null : `${tripId}:${attempt}`

  // 이 실행을 이미 시작했는지. StrictMode의 effect 이중 실행이나 리렌더로
  // 같은 파이프라인이 두 번 시작되는 것을 막는다.
  const startedRunRef = useRef<string | null>(null)
  // 타임아웃은 단계 요청이 진행 중일 때도 체인을 멈춰야 해서, 렌더용 state와 별개로
  // 실행 중인 async 루프가 읽을 수 있게 ref로도 들고 있다.
  const timedOutRef = useRef(false)

  // Reset per-run state during render (not in an effect) when the run changes — same
  // "adjusting state on prop change" pattern used in TripDetailPage for server-synced inputs.
  // 재시도로 attempt만 올라간 경우에도 실패/타임아웃 표시가 남지 않도록 runKey 기준으로 지운다.
  const [prevRunKey, setPrevRunKey] = useState(runKey)
  if (runKey !== prevRunKey) {
    setPrevRunKey(runKey)
    setIsTimedOut(false)
    setIsPipelineError(false)
    setIsDone(false)
  }

  useEffect(() => {
    timedOutRef.current = isTimedOut
  }, [isTimedOut])

  // 로그아웃 중에는 체인을 멈추므로(아래 isCurrent), 다시 로그인하면 이어서 돌 수 있도록
  // 시작 기록을 지운다.
  useEffect(() => {
    if (!isAuthenticated) startedRunRef.current = null
  }, [isAuthenticated])

  useEffect(() => {
    if (!startedAt) return

    const remaining = PIPELINE_TIMEOUT_MS - (Date.now() - startedAt)
    const timer = setTimeout(() => setIsTimedOut(true), remaining > 0 ? remaining : 0)
    return () => clearTimeout(timer)
  }, [startedAt])

  useEffect(() => {
    // 비로그인 상태에선 요청하지 않는다. tripId가 sessionStorage에 남아 있어서 로그아웃 후에도
    // /plan/api/{id}/status를 두드렸고, 로그인 흐름과 겹치면서 403을 만들어냈다.
    if (tripId === null || runKey === null || !isAuthenticated) return
    // 실패/타임아웃으로 멈춘 실행은 새로고침이나 화면 재진입으로 저절로 다시 돌지 않는다.
    // 재개는 사용자가 '재생성 하기'를 눌러 retry()가 status를 pending으로 되돌릴 때만 일어난다.
    if (storedStatus !== 'pending') return
    if (startedRunRef.current === runKey) return
    startedRunRef.current = runKey

    // 중단 판단을 effect cleanup이 아니라 store를 다시 읽어서 한다 — StrictMode의 effect
    // 이중 실행에서 첫 번째 cleanup이 방금 시작한 체인을 죽여버리는 것을 피하기 위해서다.
    // attempt까지 보므로 재시도가 시작되면 이전 시도의 체인은 여기서 스스로 멈춘다.
    const isCurrentRun = () => {
      const creation = useTripCreationStore.getState()
      return creation.tripId === tripId && creation.attempt === attempt
    }

    const isCurrent = () =>
      isCurrentRun() && useAuthStore.getState().isAuthenticated && !timedOutRef.current

    const run = async () => {
      // 재개용 1회 조회. 새로고침이나 탭 재진입으로 체인이 끊겼을 때 어디까지 진행됐는지
      // 여기서 한 번만 확인하고, 이후로는 동기 응답만 보고 전진한다.
      let { planStatus, planning } = (await tripApi.getTripStatus(tripId)).body

      while (isCurrent()) {
        if (planning) {
          // 이전 요청이 서버에서 아직 돌고 있다(응답을 놓친 새로고침, 또는 다른 탭).
          // 백엔드 락이 잡혀 있는 동안은 다음 단계를 쏴도 실행되지 않으므로,
          // 이 예외 경로에서만 상태를 다시 읽으며 기다린다.
          await delay(LOCK_RECHECK_INTERVAL_MS)
          if (!isCurrent()) return
          ;({ planStatus, planning } = (await tripApi.getTripStatus(tripId)).body)
          continue
        }

        const step = stepFor(planStatus)
        if (!step) {
          setIsDone(true)
          return
        }

        const result = await step.run(tripId)
        if (!isCurrent()) return

        // 락에 막혀 이 단계가 실제로는 실행되지 않았다. 위 대기 분기로 넘긴다.
        if (result === 'locked') planning = true
        else planStatus = step.to
      }
    }

    run().catch((err) => {
      // 각 단계는 한 번만 쏘고 자동 재시도하지 않으므로, 여기서 안 남기면
      // 무엇이 왜 실패했는지 알 방법이 없다 (실패 화면만 뜨고 원인이 사라짐).
      console.error(
        `[trip-pipeline] step failed — tripId=${tripId}, ` +
          `status=${err?.response?.status ?? '(없음)'}, code=${err?.code ?? '(없음)'}`,
        err?.response?.data ?? err,
      )
      // 재시도가 이미 시작됐다면 이 오류는 이전 실행의 늦은 응답이다 — 로그만 남기고
      // 새 실행의 상태를 덮어쓰지 않는다.
      if (!isCurrentRun()) return
      if (isAxiosError(err) && err.response?.data?.code === '0002') {
        useTripCreationStore.getState().clear()
        sessionStorage.removeItem('trip_form_pending')
        navigate('/trips/create', { replace: true, state: { restartTripCreation: true } })
        return
      }
      setIsPipelineError(true)
    })
  }, [tripId, attempt, runKey, storedStatus, isAuthenticated, navigate])

  useEffect(() => {
    if (tripId === null) return
    // 이 인스턴스가 시작하지 않은 실행(새로고침으로 복원된 실패 상태 등)의 status는 건드리지
    // 않는다 — 지역 state는 마운트 시 전부 false라 persist된 failed를 pending으로 되돌려버린다.
    if (startedRunRef.current !== runKey) return

    // 파이프라인 오류는 pending이 아니라 failed다 — pending으로 두면 실패해도 로딩 화면이
    // 계속 걸린다 (TripCreatePage가 pending을 "생성 중"으로 읽는다).
    const status = isTimedOut
      ? 'timeout'
      : isPipelineError
        ? 'failed'
        : isDone
          ? 'done'
          : 'pending'
    setStatus(status, isPipelineError)
  }, [tripId, runKey, isTimedOut, isDone, isPipelineError, setStatus])
}
