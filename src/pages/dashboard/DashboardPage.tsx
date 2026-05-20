import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { LuSparkles, LuArrowLeft, LuExternalLink } from 'react-icons/lu'
import { TabBar } from '@/shared/ui/tab-bar/TabBar'
import { TravelHero } from './TravelHero'
import './DashboardPage.css'

const COLLAPSED = 60   // % of home-feed height
const EXPANDED  = 100  // % of home-feed height — flush with header
const SNAP_MID  = (COLLAPSED + EXPANDED) / 2

const DESTINATIONS = [
  { emoji: '🗼', city: '프랑스',  country: 'France',    color: '#ffecd2', url: 'https://www.google.com/intl/ko/maps/about/behind-the-scenes/streetview/treks/eiffel-tower/' },
  { emoji: '⛩️', city: '일본',  country: 'Japan',     color: '#d4f1f4', url: 'https://www.google.com/intl/ko/maps/about/behind-the-scenes/streetview/treks/mount-fuji/' },
  { emoji: '🏖️', city: '이탈리아',  country: 'Italy', color: '#fde2e4', url: 'https://www.google.com/intl/ko/maps/about/behind-the-scenes/streetview/treks/venice/' },
  { emoji: '🗽', city: '미국',  country: 'USA',       color: '#e2f0cb', url: 'https://www.google.com/intl/ko/maps/about/behind-the-scenes/streetview/treks/grand-canyon/' },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null)
  const [iframeBlocked, setIframeBlocked] = useState(false)

  const height           = useMotionValue(COLLAPSED)
  const heightPct        = useTransform(height, (v) => `${v}%`)
  const popularMaxHeight = useTransform(height, [SNAP_MID, EXPANDED], ['0px', '200px'])
  const popularOpacity   = useTransform(height, [SNAP_MID, EXPANDED], [0, 1])

  const isDragging    = useRef(false)
  const startY        = useRef(0)
  const startH        = useRef(COLLAPSED)

  function startDrag(e: React.PointerEvent<HTMLElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
    startY.current     = e.clientY
    startH.current     = height.get()
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    startDrag(e)
  }

  function onEmptyPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('button')) return
    startDrag(e)
  }

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (!isDragging.current) return
    const feed  = e.currentTarget.closest('.home-feed') as HTMLElement | null
    const feedH = feed?.clientHeight ?? 500
    const dy    = startY.current - e.clientY
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

  function openDest(url: string | null) {
    if (!url) return
    setIframeBlocked(false)
    setWebViewUrl(url)
  }

  function closeWebView() {
    setWebViewUrl(null)
    setIframeBlocked(false)
    navigate('/dashboard', { replace: true })
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

          <div
            className="home-trips__empty"
            onPointerDown={onEmptyPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div className="home-trips__hero">
              <h2 className="home-trips__empty-title">
                AI 여행 플래너<br />시작하기
              </h2>
              <button type="button" className="home-trips__make-btn">
                <LuSparkles className="home-trips__make-icon" aria-hidden="true" />
                나만의 일정 만들기
              </button>
            </div>

            <motion.section
              className="home-trips__popular"
              style={{ maxHeight: popularMaxHeight, opacity: popularOpacity }}
            >
              <h3 className="home-trips__popular-title">인기 여행지</h3>
              <div className="home-trips__popular-list">
                {DESTINATIONS.map(({ emoji, city, country, color, url }) => (
                  <button
                    key={city}
                    type="button"
                    className="home-trips__dest-card"
                    style={{ background: color }}
                    onClick={() => openDest(url)}
                  >
                    <span className="home-trips__dest-emoji">{emoji}</span>
                    <span className="home-trips__dest-city">{city}</span>
                    <span className="home-trips__dest-country">{country}</span>
                  </button>
                ))}
              </div>
            </motion.section>
          </div>
        </motion.section>
      </div>

      <TabBar />

      {webViewUrl && (
        <div className="webview-overlay">
          <div className="webview-topbar">
            <button
              type="button"
              className="webview-back-btn"
              onClick={closeWebView}
              aria-label="앱으로 돌아가기"
            >
              <LuArrowLeft className="webview-back-icon" aria-hidden="true" />
              돌아가기
            </button>
          </div>

          {iframeBlocked ? (
            <div className="webview-blocked">
              <p className="webview-blocked-msg">
                이 페이지는 앱 내 미리보기를 지원하지 않아요.
              </p>
              <a
                href={webViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="webview-open-btn"
              >
                <LuExternalLink aria-hidden="true" />
                브라우저에서 열기
              </a>
            </div>
          ) : (
            <iframe
              key={webViewUrl}
              src={webViewUrl}
              className="webview-frame"
              title="여행지 탐색"
              onError={() => setIframeBlocked(true)}
            />
          )}
        </div>
      )}
    </main>
  )
}
