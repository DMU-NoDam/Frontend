import { useEffect, useState } from 'react'

export type LocationError = 'denied' | 'unavailable' | 'timeout'

export type CurrentLocationState = {
  position: { lat: number; lng: number } | null
  error: LocationError | null
  isSupported: boolean
}

export function useCurrentLocation(options?: { enabled?: boolean }): CurrentLocationState {
  const { enabled = true } = options ?? {}
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError]       = useState<LocationError | null>(null)

  useEffect(() => {
    if (!enabled || !isSupported) return

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setError(null)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED)    setError('denied')
        else if (err.code === err.POSITION_UNAVAILABLE) setError('unavailable')
        else                                        setError('timeout')
        setPosition(null)
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [enabled, isSupported])

  return { position, error, isSupported }
}
