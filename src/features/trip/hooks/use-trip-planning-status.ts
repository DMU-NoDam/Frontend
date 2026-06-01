import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tripApi } from '../api/trip-api'

const POLLING_INTERVAL_MS = 2000
const POLLING_TIMEOUT_MS = 10 * 60 * 1000

export type PlanningStatus = 'pending' | 'done' | 'failed' | 'timeout'

export function useTripPlanningStatus(tripId: string | null, startedAt: number | null) {
  const [isTimedOut, setIsTimedOut] = useState(false)

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
    enabled: tripId !== null && !isTimedOut,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return POLLING_INTERVAL_MS
      const { allCompleted, planning } = data.body
      if (allCompleted && !planning) return false   // done
      if (!allCompleted && !planning) return false  // failed
      if (isTimedOut) return false
      return POLLING_INTERVAL_MS
    },
    staleTime: 0,
  })

  const status: PlanningStatus = (() => {
    if (isTimedOut) return 'timeout'
    const body = query.data?.body
    if (!body) return 'pending'
    const { allCompleted, planning } = body
    if (allCompleted && !planning) return 'done'
    if (!allCompleted && !planning) return 'failed'
    return 'pending'  // allCompleted=false,planning=true OR allCompleted=true,planning=true (defensive)
  })()

  return { status, isError: query.isError }
}
