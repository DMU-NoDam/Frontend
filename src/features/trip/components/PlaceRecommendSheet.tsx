import { motion } from 'framer-motion'
import { LuChevronLeft, LuSparkles } from 'react-icons/lu'
import { MapView } from '@/shared/components/MapView'
import type { PlaceItem } from '@/shared/components/PlaceSearch'
import type { RecommendedPlaceItem } from '../types/plan-types'
import './PlaceRecommendSheet.css'

// change: 고른 장소로 이 일정을 교체한다 (change-place)
// add: 이 일정 바로 다음에 고른 장소를 넣는다 (add-place)
type RecommendMode = 'change' | 'add'

const COPY: Record<RecommendMode, {
  label: string
  question: string
  confirm: string
  confirming: string
}> = {
  change: {
    label: 'AI 대안 일정',
    question: '대신',
    confirm: '이 장소로 변경하기',
    confirming: '변경 중...',
  },
  add: {
    label: 'AI 추천 장소',
    question: '다음에',
    confirm: '이 장소 추가하기',
    confirming: '추가 중...',
  },
}

type Props = {
  mode?: RecommendMode
  originalPlanName: string
  recommendations: RecommendedPlaceItem[]
  selectedIndex: number
  onSelect: (index: number) => void
  onBack: () => void
  onConfirm: () => void
  isConfirming: boolean
  errorMessage?: string | null
  countryCode?: string
}

export function PlaceRecommendSheet({
  mode = 'change',
  originalPlanName,
  recommendations,
  selectedIndex,
  onSelect,
  onBack,
  onConfirm,
  isConfirming,
  errorMessage,
  countryCode,
}: Props) {
  const selected = recommendations[selectedIndex]
  const copy = COPY[mode]

  const mapItems: PlaceItem[] = selected
    ? [{ id: String(selected.place.id), name: selected.place.name, location: { lat: selected.place.lat, lng: selected.place.lon } }]
    : []

  return (
    <motion.div
      className="place-recommend-sheet"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
    >
      <header className="place-recommend-sheet__header">
        <button
          type="button"
          className="place-recommend-sheet__back"
          onClick={onBack}
          aria-label="뒤로 가기"
        >
          <LuChevronLeft size={22} />
        </button>
      </header>

      <div className="place-recommend-sheet__body">
        <div>
          <span className="place-recommend-sheet__label">
            <LuSparkles size={12} aria-hidden="true" />
            {copy.label}
          </span>
          <h1 className="place-recommend-sheet__title">
            {originalPlanName} {copy.question}<br />어디로 갈까요?
          </h1>
        </div>

        <div className="place-recommend-sheet__map">
          <MapView selected={mapItems} countryCode={countryCode} height={200} />
        </div>

        <ul className="place-recommend-sheet__list" role="listbox" aria-label="추천 장소">
          {recommendations.map((item, i) => (
            <li key={item.place.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === selectedIndex}
                className={`place-recommend-sheet__option${i === selectedIndex ? ' place-recommend-sheet__option--selected' : ''}`}
                onClick={() => onSelect(i)}
              >
                <span className="place-recommend-sheet__option-name">{item.place.name}</span>
                {item.place.summary?.trim() && (
                  <span className="place-recommend-sheet__option-summary">{item.place.summary.trim()}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="place-recommend-sheet__footer">
        {errorMessage && (
          <p className="place-recommend-sheet__error" role="alert">{errorMessage}</p>
        )}
        <button
          type="button"
          className="place-recommend-sheet__confirm-btn"
          onClick={onConfirm}
          disabled={isConfirming || !selected}
        >
          {isConfirming ? copy.confirming : copy.confirm}
        </button>
      </div>
    </motion.div>
  )
}
