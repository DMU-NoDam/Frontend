import type { Control } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import type { TripCreateFormValues } from '@/features/trip/types/trip-types'
import './steps.css'

const COUNTRIES = [
  { code: 'JP', name: '일본', flag: '🇯🇵' },
  { code: 'US', name: '미국', flag: '🇺🇸' },
  { code: 'FR', name: '프랑스', flag: '🇫🇷' },
  { code: 'IT', name: '이탈리아', flag: '🇮🇹' },
  { code: 'ES', name: '스페인', flag: '🇪🇸' },
  { code: 'TH', name: '태국', flag: '🇹🇭' },
  { code: 'VN', name: '베트남', flag: '🇻🇳' },
  { code: 'TW', name: '대만', flag: '🇹🇼' },
  { code: 'GB', name: '영국', flag: '🇬🇧' },
  { code: 'DE', name: '독일', flag: '🇩🇪' },
  { code: 'AU', name: '호주', flag: '🇦🇺' },
  { code: 'SG', name: '싱가포르', flag: '🇸🇬' },
]

type Props = {
  control: Control<TripCreateFormValues>
  onNext: () => void
}

export function CountryStep({ control, onNext }: Props) {
  return (
    <div className="step">
      <div className="step-header">
        <span className="step-label">Step 1</span>
        <h2 className="step-title">어느 나라로 떠나고 싶으세요?</h2>
      </div>

      <Controller
        name="country"
        control={control}
        render={({ field, fieldState }) => (
          <div className="step-body">
            <div className="country-grid">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={`country-btn${field.value === c.code ? ' country-btn--selected' : ''}`}
                  onClick={() => field.onChange(c.code)}
                  aria-pressed={field.value === c.code}
                >
                  <span className="country-btn-flag" aria-hidden="true">
                    {c.flag}
                  </span>
                  {c.name}
                </button>
              ))}
            </div>
            {fieldState.error && (
              <p className="step-error" role="alert">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />

      <div className="step-actions">
        <button
          type="button"
          className="step-next"
          onClick={onNext}
        >
          다음
        </button>
      </div>
    </div>
  )
}
