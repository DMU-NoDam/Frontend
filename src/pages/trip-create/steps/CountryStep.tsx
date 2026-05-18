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
        <h2 className="step-title">어떤 나라로 떠나볼까요?</h2>
        <p className="step-subtitle">여행할 나라를 고르면 도시를 이어서 선택할 수 있어요!</p>
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
        <button type="button" className="step-next" onClick={onNext}>
          다음
        </button>
      </div>
    </div>
  )
}
