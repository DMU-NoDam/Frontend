import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripCreationStore } from '@/app/store/trip-creation-store'
import { useTripCreationPipeline } from '../hooks/use-trip-planning-status'

// Renders nothing — mounted once at the app root (RootLayout) so an in-progress trip
// creation keeps advancing even if the user navigates away from the create page.
export function TripGenerationWatcher() {
  useTripCreationPipeline()

  const navigate = useNavigate()
  const tripId = useTripCreationStore((s) => s.tripId)
  const status = useTripCreationStore((s) => s.status)
  const clear = useTripCreationStore((s) => s.clear)

  useEffect(() => {
    if (tripId && status === 'done') {
      navigate(`/trips/${tripId}/select`)
      clear()
    }
  }, [tripId, status, navigate, clear])

  return null
}
