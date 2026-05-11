import type { Control } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import type { ScheduleType, TripCreateFormValues } from '@/features/trip/types/trip-types'
import './steps.css'

const OPTIONS: { value: ScheduleType; emoji: string; title: string; desc: string }[] = [
  { value: 'TIGHT', emoji: '⚡', title: '빡빡하게', desc: '최대한 많은 곳을 돌아다녀요' },
  { value: 'NORMAL', emoji: '🚶', title: '보통으로', desc: '관광과 휴식을 균형 있게 즐겨요' },
  { value: 'LOOSE', emoji: '😴', title: '여유롭게', desc: '느긋하게 쉬면서 여행해요' },
]

type Props = {
  control: Control<TripCreateFormValues>
  onSubmit: () => void
  onBack: () => void
  isPending: boolean
  isError: boolean
}

export function StyleStep({ control, onSubmit, onBack, isPending, isError }: Props) {
  return (
    <div className="step">
      <div className="step-header">
        <span className="step-label">Step 9</span>
        <h2 className="step-title">어떤 스타일로 여행하고 싶으세요?</h2>
      </div>

      <Controller
        name="scheduleType"
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
            {isError && (
              <p className="step-error" role="alert">
                여행 일정 생성에 실패했어요. 다시 시도해 주세요.
              </p>
            )}
          </div>
        )}
      />

      <div className="step-actions">
        <button
          type="button"
          className="step-next"
          onClick={onSubmit}
          disabled={isPending}
        >
          {isPending ? '생성 중...' : '여행 일정 만들기'}
        </button>
        <button type="button" className="step-skip" onClick={onSubmit} disabled={isPending}>
          건너뛰기
        </button>
        <button type="button" className="step-back" onClick={onBack} disabled={isPending}>
          이전
        </button>
      </div>
    </div>
  )
}
