import { useState } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { HiPlus } from 'react-icons/hi2'
import { TabBar } from '@/shared/ui/tab-bar/TabBar'
import { TripCard } from '@/features/trip/components/TripCard'
import { useTrips } from '@/features/trip/hooks/use-trips'
import { useThemeColor } from '@/shared/hooks/use-theme-color'
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

export function TripListPage() {
  useThemeColor('#ffffff', '#ffffff')
  const [tab, setTab] = useState<TabType>('upcoming')
  const navigate = useNavigate()
  const { data: trips = [], isLoading, isError } = useTrips()

  const filtered = trips.filter((t) =>
    tab === 'upcoming' ? isUpcoming(t.endDate) : !isUpcoming(t.endDate),
  )

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
        ) : filtered.length === 0 ? (
          <div className="trip-list-page__empty">
            <span>
              {tab === 'upcoming'
                ? '새로운 여행을 만들어보세요 ✈️'
                : '아직 다녀온 여행이 없어요✈️'}
            </span>
          </div>
        ) : (
          <motion.div
            key={tab}
            className="trip-list-page__list"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {filtered.map((trip) => (
              <motion.div key={trip.id} variants={itemVariants}>
                <button
                  type="button"
                  className="trip-list-page__card-button"
                  onClick={() => navigate(`/trips/${trip.id}/detail`)}
                >
                  <TripCard trip={trip} isPast={tab === 'past'} />
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
