import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { LuLocateFixed } from 'react-icons/lu'
import { useGoogleMap } from '@/shared/hooks/use-google-map'
import type {
  GoogleMapInstance,
  LatLngBoundsInstance,
  LatLngLiteral,
  MapsLibrary,
  PolylineInstance,
  PolylineOptions,
} from '@/shared/hooks/use-google-map'
import type { PlacePlan } from '../types/plan-types'
import './TripRouteMap.css'

type AdvancedMarkerInstance = {
  map: GoogleMapInstance | null
  position?: LatLngLiteral
  addEventListener(event: string, handler: () => void): void
}
type LegacyMarkerInstance = { setMap(map: GoogleMapInstance | null): void }

type PinElementInstance = { element: Element }

type MarkerLibrary = {
  AdvancedMarkerElement: new (opts: {
    map: GoogleMapInstance
    position: LatLngLiteral
    title?: string
    content?: Element
  }) => AdvancedMarkerInstance
  PinElement?: new (opts: {
    background?: string
    borderColor?: string
    glyphColor?: string
    glyphText?: string
    scale?: number
  }) => PinElementInstance
  Marker?: new (opts: {
    map: GoogleMapInstance
    position: LatLngLiteral
    title?: string
  }) => LegacyMarkerInstance
}

type MarkerData = {
  marker: AdvancedMarkerInstance | LegacyMarkerInstance
  position: LatLngLiteral
  planId: number
  content: HTMLElement | null
}

type PolylineGroup = {
  transportId: number
  polylines: PolylineInstance[]
}

// Padding (px) when fitting bounds to a single transport segment — adjust to shift the focus
const SEGMENT_FIT_PADDING = { top: 80, right: 60, bottom: 80, left: 60 }
const ROUTE_BORDER_COLOR = '#3f3f46'
const ROUTE_BORDER_EXTRA_WEIGHT = 3

const ROUTE_STYLE: Record<string, Pick<PolylineOptions, 'strokeColor' | 'strokeOpacity' | 'strokeWeight'>> = {
  WALK:  { strokeColor: '#ff5f9a', strokeWeight: 4, strokeOpacity: 0.85 },
  TRAIN: { strokeColor: '#ff5f9a', strokeWeight: 4, strokeOpacity: 0.85 },
}
const DEFAULT_ROUTE_STYLE = { strokeColor: '#ff5f9a', strokeWeight: 4, strokeOpacity: 0.85 }

function routeStyle(method: string): Pick<PolylineOptions, 'strokeColor' | 'strokeOpacity' | 'strokeWeight'> {
  return ROUTE_STYLE[method] ?? DEFAULT_ROUTE_STYLE
}

function createPlaceMarkerContent(label: string): HTMLElement {
  const marker = document.createElement('button')
  marker.type = 'button'
  marker.className = 'trip-route-marker'
  marker.setAttribute('aria-label', `${label}번째 일정`)

  const number = document.createElement('span')
  number.className = 'trip-route-marker__number'
  number.textContent = label
  marker.appendChild(number)

  return marker
}

// ── Marker visual states ──────────────────────────────────────
function setMarkerState(el: HTMLElement, state: 'default' | 'hover' | 'focused') {
  if (state === 'focused') {
    el.style.background = '#FFF0F5'
    el.style.color = '#ff5f9a'
    el.style.transform = 'scale(1.2)'
    el.style.filter    = 'drop-shadow(0 0 8px rgba(255, 95, 154, 0.65))'
    el.style.zIndex    = '10'
  } else if (state === 'hover') {
    el.style.transform = 'scale(1.18)'
    el.style.filter    = 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.28))'
    el.style.zIndex    = '5'
  } else {
    el.style.background = ''
    el.style.color = ''
    el.style.transform = ''
    el.style.filter    = ''
    el.style.zIndex    = ''
  }
}

export type TripRouteMapProps = {
  plans: PlacePlan[]
  selectedDate: string | null
  focusedPlanId?: number | null
  onMarkerClick?: (planId: number) => void
  currentLocation?: { lat: number; lng: number } | null
  countryCode?: string
  highlightedTransportId?: number | null
}

export function TripRouteMap({
  plans,
  selectedDate,
  focusedPlanId,
  onMarkerClick,
  currentLocation,
  countryCode,
  highlightedTransportId,
}: TripRouteMapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const { mapInstance, isLoaded, isError, errorMessage } = useGoogleMap(mapDivRef, countryCode)

  const markersRef         = useRef<MarkerData[]>([])
  const polylineGroupsRef  = useRef<PolylineGroup[]>([])
  const locationMarkerRef  = useRef<AdvancedMarkerInstance | null>(null)
  const syncVersionRef     = useRef(0)
  const hasInitialFocusRef = useRef(false)

  // Latest-ref pattern: keeps callbacks/values fresh without triggering draw effect
  const onMarkerClickRef = useRef(onMarkerClick)
  const focusedPlanIdRef = useRef(focusedPlanId)
  const plansRef         = useRef(plans)
  const selectedDateRef  = useRef(selectedDate)
  const mapInstanceRef   = useRef(mapInstance)

  useLayoutEffect(() => {
    onMarkerClickRef.current = onMarkerClick
    focusedPlanIdRef.current = focusedPlanId
    plansRef.current         = plans
    selectedDateRef.current  = selectedDate
    mapInstanceRef.current   = mapInstance
  })

  const clearAll = useCallback(() => {
    for (const { marker } of markersRef.current) {
      if ('setMap' in marker) marker.setMap(null)
      else marker.map = null
    }
    for (const { polylines } of polylineGroupsRef.current) {
      for (const poly of polylines) poly.setMap(null)
    }
    if (locationMarkerRef.current) {
      locationMarkerRef.current.map = null
      locationMarkerRef.current = null
    }
    markersRef.current        = []
    polylineGroupsRef.current = []
  }, [])

  // Unmount cleanup
  useEffect(() => {
    return () => { clearAll() }
  }, [clearAll])

  // Main draw effect — re-runs only when data/map changes, not on focusedPlanId changes
  useEffect(() => {
    if (!mapInstance || !isLoaded || !selectedDate) return

    const version = ++syncVersionRef.current
    clearAll()
    window.google?.maps?.event?.trigger(mapInstance, 'resize')

    const plansForDay = plans
      .filter((p) => p.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    if (plansForDay.length === 0) return

    const planIdSet = new Set(plansForDay.map((p) => p.id))

    const draw = async () => {
      try {
        const importLib = window.google!.maps.importLibrary as (lib: string) => Promise<unknown>
        const [mapsLib, markerLib, coreLib] = await Promise.all([
          importLib('maps')   as Promise<MapsLibrary>,
          importLib('marker') as Promise<MarkerLibrary>,
          importLib('core')   as Promise<{ LatLngBounds: new () => LatLngBoundsInstance }>,
        ])

        if (syncVersionRef.current !== version) return

        const bounds = new coreLib.LatLngBounds()

        // ── Place markers ─────────────────────────────────────
        for (let i = 0; i < plansForDay.length; i++) {
          const plan     = plansForDay[i]
          const planId   = plan.id
          const position: LatLngLiteral = { lat: plan.placeInfo.lat, lng: plan.placeInfo.lon }
          bounds.extend(position)

          const content = createPlaceMarkerContent(String(i + 1))

          // Apply focused state immediately if this plan is already focused
          if (planId === focusedPlanIdRef.current) {
            setMarkerState(content, 'focused')
          }

          content.addEventListener('mouseenter', () => {
            if (planId !== focusedPlanIdRef.current) setMarkerState(content, 'hover')
          })
          content.addEventListener('mouseleave', () => {
            if (planId !== focusedPlanIdRef.current) setMarkerState(content, 'default')
          })
          content.addEventListener('click', (e) => {
            e.stopPropagation()
            onMarkerClickRef.current?.(planId)
          })

          const marker = new markerLib.AdvancedMarkerElement({
            map: mapInstance,
            position,
            title: plan.placeInfo.name,
            content,
          })

          markersRef.current.push({ marker, position, planId, content })
        }

        // ── Polylines ────────────────────────────────────────
        for (const plan of plansForDay) {
          const { fromTransport } = plan
          if (
            !fromTransport ||
            !planIdSet.has(fromTransport.toPlacePlanId) ||
            !fromTransport.routeInfo
          ) continue

          const group: PolylineGroup = { transportId: fromTransport.id, polylines: [] }
          for (const step of fromTransport.routeInfo.steps) {
            const style = routeStyle(step.method)
            const border = new mapsLib.Polyline({
              path:          step.path,
              map:           mapInstance,
              visible:       false,
              strokeColor:   ROUTE_BORDER_COLOR,
              strokeOpacity: 0.75,
              strokeWeight:  (style.strokeWeight ?? 4) + ROUTE_BORDER_EXTRA_WEIGHT,
            })
            const poly = new mapsLib.Polyline({
              path:    step.path,
              map:     mapInstance,
              visible: false,
              ...style,
            })
            group.polylines.push(border)
            group.polylines.push(poly)
          }
          polylineGroupsRef.current.push(group)
        }

        // ── Fit bounds ───────────────────────────────────────
        if (!bounds.isEmpty()) {
          mapInstance.fitBounds(bounds, { top: 40, right: 20, bottom: 100, left: 20 })
        }
      } catch (err) {
        console.error('[TripRouteMap] draw failed:', err)
      }
    }

    draw()
  }, [mapInstance, isLoaded, plans, selectedDate, clearAll])

  // Focused marker style — runs when focusedPlanId changes without redrawing markers
  useEffect(() => {
    for (const { planId, content } of markersRef.current) {
      if (!content) continue
      setMarkerState(content, planId === focusedPlanId ? 'focused' : 'default')
    }
  }, [focusedPlanId])

  // Polyline visibility — show only the highlighted transport segment, then fit bounds to its two endpoints
  useEffect(() => {
    for (const { transportId, polylines } of polylineGroupsRef.current) {
      const visible = transportId === highlightedTransportId
      for (const poly of polylines) poly.setVisible(visible)
    }

    if (highlightedTransportId == null || !mapInstanceRef.current || !window.google) return

    const fitToSegment = async () => {
      const plansForDay = plansRef.current
        .filter((p) => p.date === selectedDateRef.current)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))

      const target = plansForDay.find((p) => p.fromTransport?.id === highlightedTransportId)
      if (!target?.fromTransport) return

      const fromPlan = plansForDay.find((p) => p.id === target.fromTransport!.fromPlacePlanId)
      const toPlan   = plansForDay.find((p) => p.id === target.fromTransport!.toPlacePlanId)
      if (!fromPlan || !toPlan || !mapInstanceRef.current) return

      const importLib = window.google!.maps.importLibrary as (lib: string) => Promise<unknown>
      const coreLib   = await importLib('core') as { LatLngBounds: new () => LatLngBoundsInstance }
      if (!mapInstanceRef.current) return

      const bounds = new coreLib.LatLngBounds()
      bounds.extend({ lat: fromPlan.placeInfo.lat, lng: fromPlan.placeInfo.lon })
      bounds.extend({ lat: toPlan.placeInfo.lat, lng: toPlan.placeInfo.lon })
      mapInstanceRef.current.fitBounds(bounds, SEGMENT_FIT_PADDING)
    }

    fitToSegment()
  }, [highlightedTransportId])

  // Current location marker
  useEffect(() => {
    if (!mapInstance || !isLoaded) return

    const update = async () => {
      if (locationMarkerRef.current) {
        locationMarkerRef.current.map = null
        locationMarkerRef.current = null
      }
      if (!currentLocation) return

      try {
        const markerLib = (await (window.google!.maps.importLibrary as (lib: string) => Promise<unknown>)('marker')) as MarkerLibrary
        const PinEl = markerLib.PinElement
        const content = PinEl
          ? new PinEl({
              background:  '#4285F4',
              borderColor: '#1a73e8',
              glyphColor:  '#ffffff',
              scale:       1.0,
            }).element
          : undefined

        locationMarkerRef.current = new markerLib.AdvancedMarkerElement({
          map:      mapInstance,
          position: currentLocation,
          title:    '현재 위치',
          ...(content ? { content } : {}),
        })
      } catch (err) {
        console.error('[TripRouteMap] location marker failed:', err)
      }
    }

    update()
  }, [mapInstance, isLoaded, currentLocation])

  // One-time initial focus on current location
  useEffect(() => {
    if (!mapInstance || !isLoaded || !currentLocation || hasInitialFocusRef.current) return
    mapInstance.panTo(currentLocation)
    mapInstance.setZoom(13)
    hasInitialFocusRef.current = true
  }, [mapInstance, isLoaded, currentLocation])

  // Pan to focused place
  useEffect(() => {
    if (!mapInstance || focusedPlanId == null) return
    const found = plans.find((p) => p.id === focusedPlanId)
    if (!found) return
    mapInstance.panTo({ lat: found.placeInfo.lat, lng: found.placeInfo.lon })
    mapInstance.setZoom(15)
  }, [mapInstance, focusedPlanId, plans])

  const handleFocusCurrentLocation = useCallback(() => {
    if (!mapInstance || !currentLocation) return
    mapInstance.panTo(currentLocation)
    mapInstance.setZoom(15)
  }, [mapInstance, currentLocation])

  return (
    <div className="trip-route-map">
      {isError && (
        <div className="trip-route-map__error">
          지도 로딩에 실패했어요.
          {errorMessage && <span className="trip-route-map__error-detail">{errorMessage}</span>}
        </div>
      )}
      {!isLoaded && !isError && (
        <div className="trip-route-map__loading">지도 불러오는 중...</div>
      )}
      <div ref={mapDivRef} className="trip-route-map__canvas" />
      {isLoaded && (
        <button
          type="button"
          className="trip-route-map__locate-btn"
          onClick={handleFocusCurrentLocation}
          disabled={!currentLocation}
          aria-label="현재 위치로 이동"
        >
          <LuLocateFixed className="trip-route-map__locate-icon" />
        </button>
      )}
    </div>
  )
}
