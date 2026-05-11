import type { Control } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import type { TripCreateFormValues } from '@/features/trip/types/trip-types'
import './steps.css'

const MIN = 1
const MAX = 6

type Props = {
  control: Control<TripCreateFormValues>
  onNext: () => void
  onBack: () => void
}

export function PersonStep({ control, onNext, onBack }: Props) {
  return (
    <div className="step">
      <div className="step-header">
        <span className="step-label">Step 4</span>
        <h2 className="step-title">몇 명이서 떠나나요?</h2>
      </div>

      <Controller
        name="personCount"
        control={control}
        render={({ field }) => (
          <div className="step-body">
            <div className="person-count">
              <button
                type="button"
                className="person-count-btn"
                onClick={() => field.onChange(Math.max(MIN, field.value - 1))}
                disabled={field.value <= MIN}
                aria-label="인원 감소"
              >
                −
              </button>
              <span className="person-count-value" aria-live="polite">
                {field.value}
              </span>
              <button
                type="button"
                className="person-count-btn"
                onClick={() => field.onChange(Math.min(MAX, field.value + 1))}
                disabled={field.value >= MAX}
                aria-label="인원 증가"
              >
                +
              </button>
            </div>
          </div>
        )}
      />

      <div className="step-actions">
        <button type="button" className="step-next" onClick={onNext}>
          다음
        </button>
        <button type="button" className="step-back" onClick={onBack}>
          이전
        </button>
      </div>
    </div>
  )
}
