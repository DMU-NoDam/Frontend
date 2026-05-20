import type { Control } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { HiMinus, HiPlus } from 'react-icons/hi2'
import type { TripCreateFormValues } from '@/features/trip/types/trip-types'
import './steps.css'

const MIN = 1
const MAX = 6

type Props = {
  control: Control<TripCreateFormValues>
  onNext: () => void
}

export function PersonStep({ control, onNext }: Props) {
  return (
    <div className="step">
      <div className="step-header">
        <h2 className="step-title">누구와 함께 하시나요?</h2>
        <p className="step-subtitle">혼자라도 좋아요! 인원에 맞게 일정을 만들어드려요!</p>
      </div>

      <Controller
        name="personCount"
        control={control}
        render={({ field }) => (
          <div className="step-body">
            <div className="person-row-card">
              <div className="person-row-left">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    stroke="#FF6F9F"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                    stroke="#FF6F9F"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                    stroke="#FF6F9F"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>인원</span>
              </div>
              <div className="person-row-right">
                <button
                  type="button"
                  className="person-count-btn"
                  onClick={() => field.onChange(Math.max(MIN, field.value - 1))}
                  disabled={field.value <= MIN}
                  aria-label="인원 감소"
                >
                  <HiMinus size={16} />
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
                  <HiPlus size={16} />
                </button>
              </div>
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
