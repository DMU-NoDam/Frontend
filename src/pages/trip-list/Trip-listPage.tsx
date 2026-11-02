import { useState } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { HiPlus } from 'react-icons/hi2'
import { LuSparkles } from 'react-icons/lu'
import { TabBar } from '@/shared/ui/tab-bar/TabBar'
import { TripCard } from '@/features/trip/components/TripCard'
import { PassportStamps } from '@/features/trip/components/PassportStamps'
import { useTrips } from '@/features/trip/hooks/use-trips'
import { useThemeColor } from '@/shared/hooks/use-theme-color'
import type { TripSummary } from '@/features/trip/types/trip-types'
import './Trip-listPage.css'

type TabType = 'upcoming' | 'past'

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' as const } },
}

function isUpcoming(endDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(endDate) >= today
}

const startTime = (trip: TripSummary) => new Date(trip.startDate).getTime()

export function TripListPage() {
  // 상태바 색을 분홍 종이 배경의 위쪽 색과 잇는다
  useThemeColor('#ffd0e0', '#ffffff')
  const [tab, setTab] = useState<TabType>('upcoming')
  const navigate = useNavigate()
  const { data: trips = [], isLoading, isError } = useTrips()

  // 다가오는 여행은 출발이 가까운 순, 다녀온 여행은 최근에 다녀온 순
  const upcoming = trips.filter((t) => isUpcoming(t.endDate)).sort((a, b) => startTime(a) - startTime(b))
  const past = trips.filter((t) => !isUpcoming(t.endDate)).sort((a, b) => startTime(b) - startTime(a))

  return (
    <main className="trip-list-page">
      <header className="trip-list-page__header">
        <h1 className="trip-list-page__title">나의 여행 일정</h1>
        <button
          type="button"
          className="trip-list-page__create-button"
          aria-label="새로운 일정 생성"
          onClick={() => navigate('/trips/create')}
        >
          <HiPlus className="trip-list-page__create-icon" aria-hidden="true" />
        </button>
      </header>

      <div className="trip-list-page__tabs" role="tablist">
        {(['upcoming', 'past'] as TabType[]).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            className={clsx(
              'trip-list-page__tab',
              tab === t && 'trip-list-page__tab--active',
            )}
            onClick={() => setTab(t)}
          >
            {t === 'upcoming' ? '다가오는 여행' : '다녀온 여행'}
            {!isLoading && !isError && (
              <span className="trip-list-page__tab-count">
                {t === 'upcoming' ? upcoming.length : past.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="trip-list-page__feed">
        {isLoading ? (
          <div className="trip-list-page__skeleton" aria-busy="true" aria-label="로딩 중">
            {[0, 1, 2].map((i) => (
              <div key={i} className="trip-list-page__skeleton-card" />
            ))}
          </div>
        ) : isError ? (
          <div className="trip-list-page__empty trip-list-page__error" role="alert">
            <span>여행 목록을 불러오지 못했어요.</span>
            <span>잠시 후 다시 시도해주세요.</span>
          </div>
        ) : tab === 'past' ? (
          // 다녀온 여행 : 여권 사증 면에 도시 도장을 모은다. 도장을 누르면 그 여행 일정으로
          <PassportStamps trips={past} onSelect={(tripId) => navigate(`/trips/${tripId}/detail`)} />
        ) : upcoming.length === 0 ? (
          // 여행이 없을 때 : 행선지가 비어 있는(ICN → ?) 탑승권 그림 + 안내
          <div className="trip-list-page__empty">
            <div className="trip-list-page__empty-art" aria-hidden="true">
              <div className="trip-list-page__empty-ticket">
                <div>
                  <small>BOARDING PASS</small>
                  <b>ICN → ?</b>
                </div>
                <span>?</span>
              </div>
              <span className="trip-list-page__empty-tape" />
              <span className="trip-list-page__empty-pen">어디로 떠나볼까?</span>
            </div>
            <h2 className="trip-list-page__empty-title">아직 떠날 여행이 없어요</h2>
            <p className="trip-list-page__empty-text">가고 싶은 도시만 고르면 AI가 일정을 짜드려요</p>
            <button
              type="button"
              className="trip-list-page__empty-btn"
              onClick={() => navigate('/trips/create')}
            >
              <LuSparkles aria-hidden="true" />
              나만의 일정 만들기
            </button>
          </div>
        ) : (
          <motion.div
            className="trip-list-page__list"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {upcoming.map((trip) => (
              <motion.div key={trip.id} variants={itemVariants}>
                <button
                  type="button"
                  className="trip-list-page__card-button"
                  onClick={() => navigate(`/trips/${trip.id}/detail`)}
                >
                  <TripCard trip={trip} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <TabBar />
    </main>
  )
}
