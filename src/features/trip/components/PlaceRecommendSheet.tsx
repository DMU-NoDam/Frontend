import { motion } from 'framer-motion'
import { LuChevronLeft, LuSparkles } from 'react-icons/lu'
import { MapView } from '@/shared/components/MapView'
import type { PlaceItem } from '@/shared/components/PlaceSearch'
import type { RecommendedPlaceItem } from '../types/plan-types'
import './PlaceRecommendSheet.css'

type Props = {
  originalPlanName: string
  recommendations: RecommendedPlaceItem[]
  selectedIndex: number
  onSelect: (index: number) => void
  onBack: () => void
  onConfirm: () => void
  isConfirming: boolean
  countryCode?: string
}

export function PlaceRecommendSheet({
  originalPlanName,
  recommendations,
  selectedIndex,
  onSelect,
  onBack,
  onConfirm,
  isConfirming,
  countryCode,
}: Props) {
  const selected = recommendations[selectedIndex]

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
            AI 대안 일정
          </span>
          <h1 className="place-recommend-sheet__title">
            {originalPlanName} 대신<br />어디로 갈까요?
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
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="place-recommend-sheet__footer">
        <button
          type="button"
          className="place-recommend-sheet__confirm-btn"
          onClick={onConfirm}
          disabled={isConfirming || !selected}
        >
          {isConfirming ? '변경 중...' : '이 장소로 변경하기'}
        </button>
      </div>
    </motion.div>
  )
}
