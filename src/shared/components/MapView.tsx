import { useEffect, useRef } from 'react'
import { useGoogleMap } from '@/shared/hooks/use-google-map'
import type {
  GoogleMapInstance,
  LatLngLiteral,
  InfoWindowInstance,
  MapsLibrary,
} from '@/shared/hooks/use-google-map'
import type { PlaceItem } from './PlaceSearch'
import './MapView.css'

type AdvancedMarkerInstance = {
  map: GoogleMapInstance | null
  addEventListener(event: string, handler: () => void): void
}

type LegacyMarkerInstance = {
  setMap(map: GoogleMapInstance | null): void
  addListener(event: string, handler: () => void): void
}

type MarkerInstance = AdvancedMarkerInstance | LegacyMarkerInstance

type MarkerLibrary = {
  AdvancedMarkerElement: new (opts: {
    map: GoogleMapInstance
    position: LatLngLiteral
    title?: string
  }) => AdvancedMarkerInstance
  Marker?: new (opts: {
    map: GoogleMapInstance
    position: LatLngLiteral
    title?: string
  }) => LegacyMarkerInstance
}

type Props = {
  selected: PlaceItem[]
  countryCode?: string
  height?: number
  className?: string
}

export function MapView({ selected, countryCode, height = 260, className }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const { mapInstance, isLoaded, isError, errorMessage } = useGoogleMap(mapDivRef, countryCode)

  const markersRef = useRef<Map<string, MarkerInstance>>(new Map())
  const positionsRef = useRef<Map<string, LatLngLiteral>>(new Map())
  const infoWindowRef = useRef<InfoWindowInstance | null>(null)
  const syncVersionRef = useRef(0)

  useEffect(() => {
    const markers = markersRef.current
    const positions = positionsRef.current
    return () => {
      for (const marker of markers.values()) {
        if ('setMap' in marker) {
          marker.setMap(null)
        } else {
          marker.map = null
        }
      }
      markers.clear()
      positions.clear()
      infoWindowRef.current?.close()
    }
  }, [])

  useEffect(() => {
    if (!mapInstance || !isLoaded) return

    const version = ++syncVersionRef.current

    const sync = async () => {
      try {
        const importLib = window.google!.maps.importLibrary as (lib: string) => Promise<unknown>

        const [mapsLib, markerLib] = await Promise.all([
          importLib('maps') as Promise<MapsLibrary>,
          importLib('marker') as Promise<MarkerLibrary>,
        ])

        if (syncVersionRef.current !== version) return

        infoWindowRef.current ??= new mapsLib.InfoWindow()

        const currentIds = new Set(selected.map((p) => p.id))

        for (const [id, marker] of markersRef.current.entries()) {
          if (!currentIds.has(id)) {
            if ('setMap' in marker) {
              marker.setMap(null)
            } else {
              marker.map = null
            }
            markersRef.current.delete(id)
            positionsRef.current.delete(id)
          }
        }

        const newItems = selected.filter((p) => p.location && !markersRef.current.has(p.id))

        const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined

        await Promise.all(
          newItems.map(async (item) => {
            if (syncVersionRef.current !== version || !item.location) return

            const position: LatLngLiteral = item.location
            const marker =
              mapId || !markerLib.Marker
                ? new markerLib.AdvancedMarkerElement({
                    map: mapInstance,
                    position,
                    title: item.name,
                  })
                : new markerLib.Marker({
                    map: mapInstance,
                    position,
                    title: item.name,
                  })

            markersRef.current.set(item.id, marker)
            positionsRef.current.set(item.id, position)

            const iw = infoWindowRef.current!
            const openInfoWindow = () => {
              iw.setContent(
                `<div style="padding:4px 6px;font-size:13px;font-weight:600;color:#111827">${item.name}</div>`,
              )
              iw.open({ map: mapInstance, anchor: marker })
            }

            if ('addListener' in marker) {
              marker.addListener('click', openInfoWindow)
            } else {
              marker.addEventListener('gmp-click', openInfoWindow)
            }
          }),
        )

        if (syncVersionRef.current !== version || positionsRef.current.size === 0) return

        const latestSelectedWithLocation = [...selected].reverse().find((item) => item.location)

        if (latestSelectedWithLocation?.location) {
          mapInstance.panTo(latestSelectedWithLocation.location)
          mapInstance.setZoom(14)
        }
      } catch (error) {
        console.error('Google Maps marker sync failed', error)
      }
    }

    sync()
  }, [selected, mapInstance, isLoaded])

  return (
    <div className={`map-view${className ? ` ${className}` : ''}`} style={{ height }}>
      {isError && (
        <div className="map-view-loading">
          지도 로딩에 실패했어요.
          {errorMessage && <span className="map-view-error-detail">{errorMessage}</span>}
        </div>
      )}
      {!isLoaded && !isError && <div className="map-view-loading">지도 불러오는 중...</div>}
      <div ref={mapDivRef} className="map-view-canvas" />
    </div>
  )
}
