import type { UseFormGetValues, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { PlaceSearch } from '@/shared/components/PlaceSearch'
import type { PlaceItem } from '@/shared/components/PlaceSearch'
import type { TripCreateFormValues } from '@/features/trip/types/trip-types'
import './steps.css'

type Props = {
  watch: UseFormWatch<TripCreateFormValues>
  setValue: UseFormSetValue<TripCreateFormValues>
  getValues: UseFormGetValues<TripCreateFormValues>
  onNext: () => void
  onBack: () => void
}

export function HotelStep({ watch, setValue, getValues, onNext, onBack }: Props) {
  const hotel = watch('hotel')
  const country = watch('country')

  const COUNTRY_CODES: Record<string, string> = {
    JP: 'jp', US: 'us', FR: 'fr', IT: 'it', ES: 'es', TH: 'th',
    VN: 'vn', TW: 'tw', GB: 'gb', DE: 'de', AU: 'au', SG: 'sg',
  }

  const selectedItems: PlaceItem[] = hotel.map((id) => ({ id, name: id }))

  const handleAdd = (item: PlaceItem) => {
    const current = getValues('hotel')
    if (!current.includes(item.id)) {
      setValue('hotel', [...current, item.id])
    }
  }

  const handleRemove = (id: string) => {
    setValue(
      'hotel',
      getValues('hotel').filter((h) => h !== id),
    )
  }

  return (
    <div className="step">
      <div className="step-header">
        <span className="step-label">Step 5</span>
        <h2 className="step-title">묵을 숙소가 있나요?</h2>
        <p className="step-subtitle">이미 예약한 숙소가 있다면 추가해 보세요</p>
      </div>

      <div className="step-body">
        <PlaceSearch
          placeholder="숙소 검색"
          selected={selectedItems}
          types={['lodging']}
          countryCode={COUNTRY_CODES[country] ?? undefined}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      </div>

      <div className="step-actions">
        <button type="button" className="step-next" onClick={onNext}>
          다음
        </button>
        <button type="button" className="step-skip" onClick={onNext}>
          건너뛰기
        </button>
        <button type="button" className="step-back" onClick={onBack}>
          이전
        </button>
      </div>
    </div>
  )
}
