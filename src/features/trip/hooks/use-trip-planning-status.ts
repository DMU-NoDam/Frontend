import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tripApi } from '../api/trip-api'
import { useAuthStore } from '@/app/store/auth-store'
import { useTripCreationStore } from '@/app/store/trip-creation-store'
import type { PlanStatus } from '../types/trip-types'

const POLLING_INTERVAL_MS = 2000
const POLLING_TIMEOUT_MS = 30 * 60 * 1000

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
    if (planning) return

    const step = nextStepFor(planStatus)
    if (!step) return

    // 이미 쏜 단계는 다시 쏘지 않는다. 백엔드가 동기라 실패는 아래 catch로 바로 오고,
    // 성공했다면 다음 폴링의 planStatus가 올라가 있다.
    if (planStatus === triggeredStatusRef.current) return

    // Mark triggered before the request settles, not after — otherwise a poll that lands
    // while the POST is still in flight re-reads the same planStatus and fires the same
    // step again (duplicate date-plans/place-plans/transport-plans calls).
    triggeredStatusRef.current = planStatus
    step(tripId).catch((err) => {
      // 이 단계는 한 번만 쏘고 재시도하지 않으므로, 여기서 안 남기면
      // 무엇이 왜 실패했는지 알 방법이 없다 (실패 화면만 뜨고 원인이 사라짐).
      console.error(
        `[trip-pipeline] step failed — tripId=${tripId}, planStatus=${planStatus}, ` +
          `status=${err?.response?.status ?? '(없음)'}, code=${err?.code ?? '(없음)'}`,
        err?.response?.data ?? err,
      )
      setIsPipelineError(true)
    })
  }, [query.data, tripId])

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
