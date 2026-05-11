import type { UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { DateRangePicker } from '@/shared/components/DateRangePicker'
import type { TripCreateFormValues } from '@/features/trip/types/trip-types'
import './steps.css'

type Props = {
  watch: UseFormWatch<TripCreateFormValues>
  setValue: UseFormSetValue<TripCreateFormValues>
  onNext: () => void
  onBack: () => void
}

export function DateStep({ watch, setValue, onNext, onBack }: Props) {
  const startDate = watch('startDate')
  const endDate = watch('endDate')

  const handleChange = (start: string, end: string) => {
    setValue('startDate', start, { shouldValidate: true })
    setValue('endDate', end, { shouldValidate: true })
  }

  return (
    <div className="step">
      <div className="step-header">
        <span className="step-label">Step 3</span>
        <h2 className="step-title">언제 여행할 예정인가요?</h2>
        <p className="step-subtitle">출발일과 귀국일을 선택해 주세요</p>
      </div>

      <div className="step-body">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={handleChange}
        />
      </div>

      <div className="step-actions">
        <button
          type="button"
          className="step-next"
          onClick={onNext}
          disabled={!startDate || !endDate}
        >
          다음
        </button>
        <button type="button" className="step-back" onClick={onBack}>
          이전
        </button>
      </div>
    </div>
  )
}
