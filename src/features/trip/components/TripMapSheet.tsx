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
}

export function TripMapSheet({ mapContent, overlay, sheetContent, forceExpanded }: TripMapSheetProps) {
  const height    = useMotionValue(SHEET_COLLAPSED)
  const heightPct = useTransform(height, (v) => `${v}%`)

  useEffect(() => {
    if (forceExpanded) {
      animate(height, SHEET_EXPANDED, { type: 'spring', stiffness: 280, damping: 50 })
    }
  }, [forceExpanded, height])

  const isDragging = useRef(false)
  const startY     = useRef(0)
  const startH     = useRef(SHEET_COLLAPSED)

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
    if ((e.target as HTMLElement).closest('button')) return
    startDrag(e)
  }

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (!isDragging.current) return
    const root  = e.currentTarget.closest('.trip-map-sheet') as HTMLElement | null
    const rootH = root?.clientHeight ?? 500
    const dy    = startY.current - e.clientY
    const delta = (dy / rootH) * 100
    const next  = Math.max(SHEET_COLLAPSED, Math.min(SHEET_EXPANDED, startH.current + delta))
    height.set(next)
  }

  function onPointerUp() {
    if (!isDragging.current) return
    isDragging.current = false
    const target = height.get() >= SHEET_SNAP_MID ? SHEET_EXPANDED : SHEET_COLLAPSED
    animate(height, target, { type: 'spring', stiffness: 280, damping: 50 })
  }

  return (
    <div
      className="trip-map-sheet"
      style={{ '--map-height': `${100 - SHEET_COLLAPSED}%` } as React.CSSProperties}
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
