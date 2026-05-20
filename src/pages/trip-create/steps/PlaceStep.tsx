import { useState } from 'react'
import type { UseFormGetValues, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { PlaceSearch } from '@/shared/components/PlaceSearch'
import type { PlaceItem } from '@/shared/components/PlaceSearch'
import { MapView } from '@/shared/components/MapView'
import type { TripCreateFormValues } from '@/features/trip/types/trip-types'
import './steps.css'

const COUNTRY_CODES: Record<string, string> = {
  JP: 'jp', US: 'us', FR: 'fr', IT: 'it', ES: 'es', TH: 'th',
  VN: 'vn', TW: 'tw', GB: 'gb', DE: 'de', AU: 'au', SG: 'sg',
}

const PLACE_TYPES = [
  'art_gallery',
  'museum',
  'zoo',
  'park',
  'plaza',
  'garden',
  'tourist_attraction',
  'aquarium',
  'cafe',
  'restaurant',
  'bakery',
  'bar',
  'cafeteria',
  'pub',
  'market',
  'store',
  'supermarket',
  'ski_resort',
  'fishing_pond',
  'golf_course',
  'airport',
]

type Props = {
  watch: UseFormWatch<TripCreateFormValues>
  setValue: UseFormSetValue<TripCreateFormValues>
  getValues: UseFormGetValues<TripCreateFormValues>
  onNext: () => void
}

export function PlaceStep({ watch, setValue, getValues, onNext }: Props) {
  const selectedPlace = watch('selectedPlace')
  const country = watch('country')
  const [locationError, setLocationError] = useState<string | null>(null)

  const handleAdd = (item: PlaceItem) => {
    const current = getValues('selectedPlace')
    if (!current.find((p) => p.id === item.id)) {
      setValue('selectedPlace', [...current, item])
    }
  }

  const handleRemove = (id: string) => {
    setValue('selectedPlace', getValues('selectedPlace').filter((p) => p.id !== id))
  }

  return (
    <div className="step">
      <div className="step-header">
        <h2 className="step-title">가고 싶은 장소가 있나요?</h2>
        <p className="step-subtitle">꼭 가보고 싶은 곳을 미리 담아두세요!</p>
      </div>

      <div className="step-body">
        <PlaceSearch
          placeholder="장소 검색"
          selected={selectedPlace}
          types={PLACE_TYPES}
          countryCode={COUNTRY_CODES[country] ?? undefined}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onLocationError={setLocationError}
          onLocationErrorClear={() => setLocationError(null)}
        />
        <MapView
          selected={selectedPlace}
          countryCode={COUNTRY_CODES[country] ?? undefined}
          height={280}
        />
        {locationError && (
          <p className="map-location-error">{locationError}</p>
        )}
      </div>

      <div className="step-actions">
        <button type="button" className="step-next" onClick={onNext}>
          다음
        </button>
      </div>
    </div>
  )
}
