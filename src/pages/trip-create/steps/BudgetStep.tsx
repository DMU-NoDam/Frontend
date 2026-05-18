import type { Control } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import type { PriceType, TripCreateFormValues } from '@/features/trip/types/trip-types'
import './steps.css'

const OPTIONS: { value: PriceType; emoji: string; title: string; desc: string }[] = [
  { value: 'CHEEP', emoji: '🪙', title: '알뜰하게', desc: '가성비를 최우선으로 여행해요' },
  { value: 'NORMAL', emoji: '💳', title: '적당하게', desc: '균형 잡힌 지출로 즐겨요' },
  { value: 'LUXURY', emoji: '💎', title: '럭셔리하게', desc: '최고의 경험을 위해 아끼지 않아요' },
]

type Props = {
  control: Control<TripCreateFormValues>
  onNext: () => void
}

export function BudgetStep({ control, onNext }: Props) {
  return (
    <div className="step">
      <div className="step-header">
        <h2 className="step-title">여행 예산은 어느 정도인가요?</h2>
        <p className="step-subtitle">예산에 맞춰 식사, 장소를 조절해드릴게요!</p>
      </div>

      <Controller
        name="priceType"
        control={control}
        render={({ field }) => (
          <div className="step-body">
            <div className="step-card-grid">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`step-card${field.value === opt.value ? ' step-card--selected' : ''}`}
                  onClick={() =>
                    field.onChange(field.value === opt.value ? undefined : opt.value)
                  }
                  aria-pressed={field.value === opt.value}
                >
                  <span className="step-card-emoji" aria-hidden="true">
                    {opt.emoji}
                  </span>
                  <span className="step-card-text">
                    <span className="step-card-title">{opt.title}</span>
                    <span className="step-card-desc">{opt.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      />

      <div className="step-actions">
        <button type="button" className="step-next" onClick={onNext}>
          다음
        </button>
      </div>
    </div>
  )
}
