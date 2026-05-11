import { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { LuSparkles } from 'react-icons/lu'
import { TabBar } from '@/shared/ui/tab-bar/TabBar'
import { TravelHero } from './TravelHero'
import './DashboardPage.css'

const COLLAPSED = 60   // % of home-feed height
const EXPANDED  = 100  // % of home-feed height — flush with header
const SNAP_MID  = (COLLAPSED + EXPANDED) / 2

export function DashboardPage() {
  const [isExpanded, setIsExpanded] = useState(false)

  const height        = useMotionValue(COLLAPSED)
  const heightPct     = useTransform(height, (v) => `${v}%`)
  const isDragging    = useRef(false)
  const startY        = useRef(0)
  const startH        = useRef(COLLAPSED)

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
    startY.current     = e.clientY
    startH.current     = height.get()
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!isDragging.current) return
    const feed  = e.currentTarget.closest('.home-feed') as HTMLElement | null
    const feedH = feed?.clientHeight ?? 500
    const dy    = startY.current - e.clientY          // positive = dragged up
    const delta = (dy / feedH) * 100
    const next  = Math.max(COLLAPSED, Math.min(EXPANDED, startH.current + delta))
    height.set(next)
  }

  function onPointerUp() {
    if (!isDragging.current) return
    isDragging.current = false
    const target = height.get() >= SNAP_MID ? EXPANDED : COLLAPSED
    setIsExpanded(target === EXPANDED)
    animate(height, target, { type: 'spring', stiffness: 280, damping: 50 })
  }

  return (
    <main className="home-page">
      <header className="home-header">
        <span className="home-header__badge">🗓️ 일정을 확정해주세요</span>
      </header>

      <div className="home-feed">
        <div className="home-map">
          <TravelHero />
        </div>

        <motion.section
          className="home-trips"
          aria-label="내 여행"
          style={{ height: heightPct }}
        >
          <button
            type="button"
            className="home-trips__handle-btn"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? '여행 목록 접기' : '여행 목록 펼치기'}
          >
            <div className="home-trips__handle" aria-hidden="true" />
          </button>

          <div className="home-trips__empty">
            <h2 className="home-trips__empty-title">
              AI 여행 플래너<br />시작하기
            </h2>
            <button type="button" className="home-trips__make-btn">
              <LuSparkles className="home-trips__make-icon" aria-hidden="true" />
              나만의 일정 만들기
            </button>
          </div>
        </motion.section>
      </div>

      <TabBar />
    </main>
  )
}
