import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import './TripMapSheet.css'

export const SHEET_COLLAPSED = 44
export const SHEET_EXPANDED  = 90
export const SHEET_SNAP_MID  = (SHEET_COLLAPSED + SHEET_EXPANDED) / 2

type TripMapSheetProps = {
  mapContent: React.ReactNode
  /** Content that floats over the map, below the sheet (e.g. a badge) */
  overlay?: React.ReactNode
  sheetContent: (motionHeight: MotionValue<number>) => React.ReactNode
  forceExpanded?: boolean
  /** Sheet height (% of container) when collapsed / expanded */
  collapsedPct?: number
  expandedPct?: number
}

export function TripMapSheet({
  mapContent,
  overlay,
  sheetContent,
  forceExpanded,
  collapsedPct = SHEET_COLLAPSED,
  expandedPct = SHEET_EXPANDED,
}: TripMapSheetProps) {
  const snapMid   = (collapsedPct + expandedPct) / 2
  const height    = useMotionValue(collapsedPct)
  const heightPct = useTransform(height, (v) => `${v}%`)

  useEffect(() => {
    animate(
      height,
      forceExpanded ? expandedPct : collapsedPct,
      { type: 'spring', stiffness: 280, damping: 50 },
    )
  }, [forceExpanded, height, collapsedPct, expandedPct])

  const isDragging = useRef(false)
  const startY     = useRef(0)
  const startH     = useRef(collapsedPct)

  function startDrag(e: React.PointerEvent<HTMLElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
    startY.current     = e.clientY
    startH.current     = height.get()
  }

  function onHandlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    startDrag(e)
  }

  function onContentPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // 입력칸에서 포인터를 캡처하면 포커스가 들어가지 않는다
    if ((e.target as HTMLElement).closest('button, input, textarea')) return
    startDrag(e)
  }

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (!isDragging.current) return
    const root  = e.currentTarget.closest('.trip-map-sheet') as HTMLElement | null
    const rootH = root?.clientHeight ?? 500
    const dy    = startY.current - e.clientY
    const delta = (dy / rootH) * 100
    const next  = Math.max(collapsedPct, Math.min(expandedPct, startH.current + delta))
    height.set(next)
  }

  function onPointerUp() {
    if (!isDragging.current) return
    isDragging.current = false
    const target = height.get() >= snapMid ? expandedPct : collapsedPct
    animate(height, target, { type: 'spring', stiffness: 280, damping: 50 })
  }

  return (
    <div
      className="trip-map-sheet"
      style={{ '--map-height': `${100 - collapsedPct}%` } as React.CSSProperties}
    >
      {/* Map fills full background */}
      <div className="trip-map-sheet__map">
        {mapContent}
      </div>

      {/* Optional: floats over map, below sheet */}
      {overlay && (
        <div className="trip-map-sheet__overlay">
          {overlay}
        </div>
      )}

      {/* Sheet slides up over map */}
      <motion.section
        className="trip-map-sheet__sheet"
        aria-label="일정"
        style={{ height: heightPct }}
      >
        <button
          type="button"
          className="trip-map-sheet__handle-btn"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label="시트 높이 조절"
        >
          <div className="trip-map-sheet__handle" aria-hidden="true" />
        </button>

        <div
          className="trip-map-sheet__content"
          onPointerDown={onContentPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {sheetContent(height)}
        </div>
      </motion.section>
    </div>
  )
}

export function MapPlaceholder({ label }: { label?: string }) {
  return (
    <div className="trip-map-sheet__map-placeholder" aria-label="지도 영역">
      <span className="trip-map-sheet__map-emoji" aria-hidden="true">🗺️</span>
      {label && <span className="trip-map-sheet__map-label">{label}</span>}
    </div>
  )
}
