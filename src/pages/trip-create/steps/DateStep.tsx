import type { UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { DateRangePicker } from '@/shared/components/DateRangePicker'
import type { TripCreateFormValues } from '@/features/trip/types/trip-types'
import './steps.css'

type Props = {
  watch: UseFormWatch<TripCreateFormValues>
  setValue: UseFormSetValue<TripCreateFormValues>
  onNext: () => void
}

export function DateStep({ watch, setValue, onNext }: Props) {
  const startDate = watch('startDate')
  const endDate = watch('endDate')

  const handleChange = (start: string, end: string) => {
    const dateChanged = start !== startDate || end !== endDate

    setValue('startDate', start, { shouldValidate: true })
    setValue('endDate', end, { shouldValidate: true })

    if (dateChanged) {
      setValue('departFlight', undefined)
      setValue('arriveFlight', undefined)
    }
  }

  return (
    <div className="step">
      <div className="step-header">
        <h2 className="step-title">언제 떠나시나요?</h2>
        <p className="step-subtitle">달력에 콕 찍어주세요! 날씨도 함께 고려해드릴게요!</p>
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
      </div>
    </div>
  )
}
