import type { Control, UseFormGetValues, UseFormSetValue } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { PlaceSearch } from '@/shared/components/PlaceSearch'
import type { PlaceItem } from '@/shared/components/PlaceSearch'
import type { TripCreateFormValues } from '@/features/trip/types/trip-types'
import './steps.css'

const COUNTRIES: Record<string, string> = {
  JP: 'jp', US: 'us', FR: 'fr', IT: 'it', ES: 'es', TH: 'th',
  VN: 'vn', TW: 'tw', GB: 'gb', DE: 'de', AU: 'au', SG: 'sg',
}

type Props = {
  control: Control<TripCreateFormValues>
  setValue: UseFormSetValue<TripCreateFormValues>
  getValues: UseFormGetValues<TripCreateFormValues>
  onNext: () => void
  onBack: () => void
}

export function CityStep({ control, setValue, getValues, onNext, onBack }: Props) {
  const country = useWatch({ control, name: 'country' })
  const region = useWatch({ control, name: 'region' })

  const selectedItems: PlaceItem[] = region.map((name) => ({ id: name, name }))

  const handleAdd = (item: PlaceItem) => {
    const current = getValues('region')
    if (!current.includes(item.name)) {
      setValue('region', [...current, item.name], { shouldValidate: true })
    }
  }

  const handleRemove = (id: string) => {
    setValue(
      'region',
      getValues('region').filter((name) => name !== id),
      { shouldValidate: true },
    )
  }

  return (
    <div className="step">
      <div className="step-header">
        <span className="step-label">Step 2</span>
        <h2 className="step-title">어떤 도시를 여행할 건가요?</h2>
        <p className="step-subtitle">최대 2개까지 선택할 수 있어요</p>
      </div>

      <div className="step-body">
        <PlaceSearch
          placeholder="도시 검색"
          selected={selectedItems}
          maxItems={2}
          types={['locality']}
          countryCode={COUNTRIES[country] ?? undefined}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      </div>

      <div className="step-actions">
        <button
          type="button"
          className="step-next"
          onClick={onNext}
          disabled={region.length === 0}
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
