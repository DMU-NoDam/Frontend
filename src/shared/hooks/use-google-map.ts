import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { waitForGoogleMaps } from '@/shared/lib/google-maps-loader'

export type LatLngLiteral = { lat: number; lng: number }

export type MapPadding = { top: number; right: number; bottom: number; left: number }

export type GoogleMapInstance = {
  fitBounds(bounds: LatLngBoundsInstance, padding?: number | MapPadding): void
  setCenter(latlng: LatLngLiteral): void
  setZoom(zoom: number): void
  panTo(latlng: LatLngLiteral): void
  getBounds(): LatLngBoundsInstance | null
  addListener(event: string, handler: () => void): unknown
}

export type LatLngBoundsInstance = {
  extend(point: LatLngLiteral): void
  isEmpty(): boolean
  contains(point: LatLngLiteral): boolean
}

export type PolylineInstance = {
  setMap(map: GoogleMapInstance | null): void
  setVisible(visible: boolean): void
}

export type PolylineOptions = {
  path: LatLngLiteral[]
  strokeColor?: string
  strokeOpacity?: number
  strokeWeight?: number
  map?: GoogleMapInstance
  icons?: unknown[]
  visible?: boolean
}

export type InfoWindowInstance = {
  open(opts: { map: GoogleMapInstance; anchor?: unknown }): void
  close(): void
  setContent(content: string): void
}

export type MapsLibrary = {
  Map: new (
    el: HTMLElement,
    opts: {
      center: LatLngLiteral
      zoom: number
      mapId?: string
      disableDefaultUI?: boolean
      zoomControl?: boolean
      gestureHandling?: string
    },
  ) => GoogleMapInstance
  // LatLngBounds is in the 'core' library, not 'maps'
  InfoWindow: new (opts?: { content?: string }) => InfoWindowInstance
  Polyline: new (opts: PolylineOptions) => PolylineInstance
}

const COUNTRY_CENTERS: Record<string, LatLngLiteral> = {
  JP: { lat: 35.6762, lng: 139.6503 },
  US: { lat: 40.7580, lng: -73.9855 },
  FR: { lat: 48.8566, lng: 2.3522 },
  IT: { lat: 41.9028, lng: 12.4964 },
  ES: { lat: 40.4168, lng: -3.7038 },
  TH: { lat: 13.7563, lng: 100.5018 },
  VN: { lat: 21.0285, lng: 105.8542 },
  TW: { lat: 25.0330, lng: 121.5654 },
  GB: { lat: 51.5074, lng: -0.1278 },
  DE: { lat: 52.5200, lng: 13.4050 },
  AU: { lat: -33.8688, lng: 151.2093 },
  SG: { lat: 1.3521, lng: 103.8198 },
}

const DEFAULT_CENTER: LatLngLiteral = { lat: 35.6762, lng: 139.6503 }

export function useGoogleMap(
  mapRef: RefObject<HTMLDivElement | null>,
  countryCode?: string,
) {
  const [mapInstance, setMapInstance] = useState<GoogleMapInstance | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!mapRef.current || initializedRef.current) return
    initializedRef.current = true
    let cancelled = false

    const init = async () => {
      try {
        await waitForGoogleMaps()
        if (cancelled || !mapRef.current) return

        const importLib = window.google!.maps.importLibrary as (lib: string) => Promise<unknown>
        const mapsLib = (await Promise.race([
          importLib('maps'),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Maps library load timeout (15s)')), 15_000),
          ),
        ])) as MapsLibrary
        if (cancelled || !mapRef.current) return

        const center = COUNTRY_CENTERS[countryCode ?? ''] ?? DEFAULT_CENTER
        const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID

        const map = new mapsLib.Map(mapRef.current, {
          center,
          zoom: 11,
          ...(mapId ? { mapId } : {}),
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        })

        setMapInstance(map)
        setIsLoaded(true)
        setIsError(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Google Maps failed to initialize'
        console.error('Google Maps failed to initialize', error)
        if (!cancelled) {
          setErrorMessage(message)
          setIsError(true)
        }
      }
    }

    const mapEl = mapRef.current
    init()
    return () => {
      cancelled = true
      initializedRef.current = false        // allow re-init after Strict Mode cleanup / remount
      if (mapEl) {
        mapEl.innerHTML = ''                // clear partial map DOM so re-init starts clean
      }
    }
  // countryCode intentionally excluded: center is fixed at init, markers drive pan/zoom later
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef])

  return { mapInstance, isLoaded, isError, errorMessage }
}
