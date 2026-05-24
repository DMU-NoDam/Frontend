import { AnimatePresence, motion } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { useMemo, useState } from 'react'
import { LuSparkles } from 'react-icons/lu'
import { useNavigate, useParams } from 'react-router-dom'
import { mapPlanListToThemeCards } from '@/features/trip/api/plan-mapper'
import { useConfirmTripTheme } from '@/features/trip/hooks/use-confirm-trip-theme'
import { useTripPlans } from '@/features/trip/hooks/use-trip-plans'
import type { PlanThemeCard } from '@/features/trip/types/plan-types'
import './TripSelectPage.css'

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-40%' : '40%',
    opacity: 0,
  }),
}

const slideTransition = { duration: 0.22, ease: 'easeInOut' } as const
const SWIPE_THRESHOLD = 70

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-item">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function ThemeCard({
  card,
  onConfirm,
  isPending,
}: {
  card: PlanThemeCard
  onConfirm: () => void
  isPending: boolean
}) {
  const distanceKm = (card.totalDistanceMeters / 1000).toFixed(1)

  return (
    <article className="theme-card">
      <div className="card-header">
        <span className="duration-pill">
          {card.nightCount}박 {card.dayCount}일
        </span>
        <div className="emoji-badges">
          {card.emojis.map((emoji, i) => (
            <span key={i} className="emoji-badge">
              {emoji}
            </span>
          ))}
        </div>
      </div>

      <div className="card-body">
        <h2 className="card-title">{card.title}</h2>
        <p className="card-subtitle">{card.subtitle}</p>

        <div className="stats-box">
          <StatItem label="일정" value={`${card.scheduleCount}개`} />
          <StatItem label="여행" value={`${card.dayCount}일`} />
          <StatItem label="평균 이동" value={`${card.averageMoveMinutes}분`} />
          <StatItem label="총 이동" value={`${distanceKm}km`} />
        </div>

        <div className="summary-box">
          <p className="summary-text">{card.summary}</p>
        </div>
      </div>

      <div className="card-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={onConfirm}
          disabled={isPending}
        >
          {isPending ? '확정 중...' : '이 일정으로 확정'}
        </button>
      </div>
    </article>
  )
}

export function TripSelectPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const { data, isLoading, isError } = useTripPlans(tripId)
  const { mutate, isPending, isError: isConfirmError } = useConfirmTripTheme()

  const cards = useMemo(
    () => (data ? mapPlanListToThemeCards(data.body) : []),
    [data],
  )

  const selectedCard = cards[selectedIndex]

  const goTo = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= cards.length || newIndex === selectedIndex) return
    setDirection(newIndex > selectedIndex ? 1 : -1)
    setSelectedIndex(newIndex)
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x <= -SWIPE_THRESHOLD) {
      goTo(selectedIndex + 1)
      return
    }

    if (info.offset.x >= SWIPE_THRESHOLD) {
      goTo(selectedIndex - 1)
    }
  }

  const handleConfirm = () => {
    if (!tripId || !selectedCard) return

    mutate(
      { tripId, theme: selectedCard.theme },
      {
        onSuccess: ({ body }) => {
          navigate(`/trips/${body.id}/detail`, {
            state: { tripName: body.name },
          })
        },
      },
    )
  }

  if (!tripId) {
    return <main className="trip-select-page trip-select-state">잘못된 여행 정보입니다.</main>
  }

  if (isLoading) {
    return <main className="trip-select-page trip-select-state">일정을 불러오는 중입니다...</main>
  }

  if (isError) {
    return <main className="trip-select-page trip-select-state">일정을 불러오지 못했습니다.</main>
  }

  if (!selectedCard) {
    return <main className="trip-select-page trip-select-state">추천 일정이 없습니다.</main>
  }

  return (
    <main className="trip-select-page">
      <header className="select-header">
        <span className="select-eyebrow">
          <LuSparkles className="eyebrow-icon" aria-hidden />
          AI 추천 일정
        </span>
        <h1 className="select-title">
          테마에 완벽히 맞는<br />
          <em className="select-title-accent">4가지 여행 일정</em>
        </h1>
      </header>

      <div className="card-viewport">
        <div className="card-viewport-inner">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={selectedIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="card-slide"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={handleDragEnd}
            >
              <ThemeCard
                card={selectedCard}
                onConfirm={handleConfirm}
                isPending={isPending}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {isConfirmError && (
          <p className="confirm-error">일정 확정에 실패했습니다. 다시 시도해 주세요.</p>
        )}
      </div>

      <nav className="dot-nav" aria-label="테마 선택">
        {cards.map((card, i) => (
          <button
            key={card.theme}
            type="button"
            className={`dot${i === selectedIndex ? ' dot--active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={card.title}
            aria-current={i === selectedIndex ? 'true' : undefined}
          />
        ))}
      </nav>
    </main>
  )
}
