import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tripApi } from '../api/trip-api'

const POLLING_INTERVAL_MS = 2000
const POLLING_TIMEOUT_MS = 3 * 60 * 1000

export type PlanningStatus = 'pending' | 'done' | 'timeout'

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
      if (!data.body.isPlanning) return false
      if (isTimedOut) return false
      return POLLING_INTERVAL_MS
    },
    staleTime: 0,
  })

  const status: PlanningStatus = query.data?.body.isPlanning === false
    ? 'done'
    : isTimedOut
    ? 'timeout'
    : 'pending'

  return { status, isError: query.isError }
}
