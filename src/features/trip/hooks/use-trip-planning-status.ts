import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tripApi } from '../api/trip-api'
import { useAuthStore } from '@/app/store/auth-store'
import { useTripCreationStore } from '@/app/store/trip-creation-store'
import type { PlanStatus } from '../types/trip-types'

const POLLING_INTERVAL_MS = 2000
const POLLING_TIMEOUT_MS = 30 * 60 * 1000

// 단계를 쏜 뒤 planning이 false로 돌아왔는데 planStatus가 그대로면 백그라운드 작업이 실패하고
// 끝난 것이다 (백엔드가 202만 주고 실패는 서버 로그에만 남긴다). 이때 재호출한다 —
// 세 단계 모두 멱등이라 이미 끝난 DatePlan은 건너뛰고 죽은 지점부터 이어간다.
// POST 직후 백엔드가 planning=true로 뒤집기 전 폴링이 끼어들 수 있어 몇 번은 지켜본다.
const STALL_POLLS_BEFORE_RETRY = 3
const MAX_RETRIES_PER_STATUS = 3

// Backend pipeline: null -> date-plans -> CREATED/FIXED_PLANNED -> place-plans -> AI_PLANNED -> transport-plans -> TRANSPORT_PLANNED (done)
const nextStepFor = (planStatus: PlanStatus | null): ((tripId: string) => Promise<void>) | null => {
  if (planStatus === null) return tripApi.generateDatePlans
  if (planStatus === 'CREATED' || planStatus === 'FIXED_PLANNED') return tripApi.generatePlacePlans
  if (planStatus === 'AI_PLANNED') return tripApi.generateTransportPlans
  return null
}

// Drives an in-progress trip creation to completion: polls status and fires the next
// pipeline step. Meant to run in exactly one place (TripGenerationWatcher, mounted once
// at the app root) so it keeps advancing regardless of which page the user is on —
// reads/writes progress via the shared, sessionStorage-persisted trip-creation store
// instead of component-local state.
export function useTripCreationPipeline(): void {
  const tripId = useTripCreationStore((s) => s.tripId)
  const startedAt = useTripCreationStore((s) => s.startedAt)
  const setStatus = useTripCreationStore((s) => s.setStatus)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [isTimedOut, setIsTimedOut] = useState(false)
  const [isPipelineError, setIsPipelineError] = useState(false)
  // Guards against re-triggering the step for the same planStatus while its POST is in
  // flight / before the next poll reflects it. `undefined` = nothing triggered yet.
  // A ref, not state: it's never read for rendering, only checked inside the effect below,
  // and must update synchronously (before the next poll can land) which setState can't do.
  const triggeredStatusRef = useRef<PlanStatus | null | undefined>(undefined)
  // 같은 planStatus로 "작업 안 함 + 진전 없음"이 연속으로 관측된 횟수, 그리고 그 status에 대한 재시도 횟수
  const stalledPollsRef = useRef(0)
  const retryCountRef = useRef(0)

  // Reset per-tripId state during render (not in an effect) when tripId changes — same
  // "adjusting state on prop change" pattern used in TripDetailPage for server-synced inputs.
  const [prevTripId, setPrevTripId] = useState(tripId)
  if (tripId !== prevTripId) {
    setPrevTripId(tripId)
    setIsTimedOut(false)
    setIsPipelineError(false)
  }

  // Ref can't be reset during render (React flags that), so it's cleared here instead —
  // runs before the trigger effect below on the same tripId change since effects fire in
  // declaration order.
  useEffect(() => {
    triggeredStatusRef.current = undefined
    stalledPollsRef.current = 0
    retryCountRef.current = 0
  }, [tripId])

  useEffect(() => {
    if (!startedAt) return

    const remaining = POLLING_TIMEOUT_MS - (Date.now() - startedAt)
    const delay = remaining > 0 ? remaining : 0
    const timer = setTimeout(() => setIsTimedOut(true), delay)
    return () => clearTimeout(timer)
  }, [startedAt])

  const query = useQuery({
    queryKey: ['trip-status', tripId],
    queryFn: () => tripApi.getTripStatus(tripId!),
    // 비로그인 상태에선 폴링하지 않는다. tripId가 sessionStorage에 남아 있어서 로그아웃 후에도
    // /plan/api/{id}/status를 계속 두드렸고, 로그인 흐름과 겹치면서 403을 만들어냈다.
    enabled: tripId !== null && isAuthenticated && !isTimedOut,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return POLLING_INTERVAL_MS
      const { planStatus, planning } = data.body
      if (planStatus === 'TRANSPORT_PLANNED' && !planning) return false // done
      if (isTimedOut) return false
      return POLLING_INTERVAL_MS
    },
    staleTime: 0,
  })

  useEffect(() => {
    const body = query.data?.body
    if (!body || tripId === null) return
    const { planStatus, planning } = body
    if (planning) {
      stalledPollsRef.current = 0
      return
    }

    const step = nextStepFor(planStatus)
    if (!step) return

    if (planStatus === triggeredStatusRef.current) {
      // 이미 쐈던 단계다. planning=false인데 status가 안 올라갔으면 그 작업은 실패로 끝났다.
      stalledPollsRef.current += 1
      if (stalledPollsRef.current < STALL_POLLS_BEFORE_RETRY) return

      if (retryCountRef.current >= MAX_RETRIES_PER_STATUS) {
        // 여기서 멈추지 않으면 30분 폴링 타임아웃까지 아무 정보 없이 끌려간다
        console.error(
          `[trip-pipeline] stalled — tripId=${tripId}, planStatus=${planStatus}, ` +
            `재시도 ${MAX_RETRIES_PER_STATUS}회 후에도 진전 없음. 백엔드 로그를 확인해야 한다`,
        )
        setIsPipelineError(true)
        return
      }
      retryCountRef.current += 1
      console.warn(
        `[trip-pipeline] retry ${retryCountRef.current}/${MAX_RETRIES_PER_STATUS} — ` +
          `tripId=${tripId}, planStatus=${planStatus}`,
      )
    } else {
      retryCountRef.current = 0
    }

    // Mark triggered before the request settles, not after — otherwise a poll that lands
    // while the POST is still in flight re-reads the same planStatus and fires the same
    // step again (duplicate date-plans/place-plans/transport-plans calls).
    stalledPollsRef.current = 0
    triggeredStatusRef.current = planStatus
    step(tripId).catch((err) => {
      // 이 단계는 한 번만 쏘고 planStatus가 안 바뀌면 재시도하지 않으므로, 여기서 안 남기면
      // 무엇이 왜 실패했는지 알 방법이 없다 (실패 화면만 뜨고 원인이 사라짐).
      console.error(
        `[trip-pipeline] step failed — tripId=${tripId}, planStatus=${planStatus}, ` +
          `status=${err?.response?.status ?? '(없음)'}, code=${err?.code ?? '(없음)'}`,
        err?.response?.data ?? err,
      )
      setIsPipelineError(true)
    })
    // dataUpdatedAt이 있어야 한다 — 응답이 이전과 완전히 같으면 TanStack Query의 structural
    // sharing이 query.data 참조를 그대로 유지해서 이 effect가 아예 안 돈다. 정체 감지는
    // "같은 응답이 반복되는 것"을 세는 일이라 그 경우가 바로 세야 하는 케이스다.
  }, [query.data, query.dataUpdatedAt, tripId])

  useEffect(() => {
    if (tripId === null) return

    const body = query.data?.body
    const status = isTimedOut
      ? 'timeout'
      : body?.planStatus === 'TRANSPORT_PLANNED' && !body.planning
        ? 'done'
        : 'pending'

    setStatus(status, query.isError || isPipelineError)
  }, [tripId, isTimedOut, query.data, query.isError, isPipelineError, setStatus])
}
