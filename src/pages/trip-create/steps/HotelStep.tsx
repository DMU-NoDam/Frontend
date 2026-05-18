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

const HOTEL_PLACE_TYPES = [
  'bed_and_breakfast',
  'budget_japanese_inn',
  'campground',
  'camping_cabin',
  'cottage',
  'farmstay',
  'guest_house',
  'hostel',
  'hotel',
  'inn',
  'japanese_inn',
  'lodging',
  'motel',
  'private_guest_room',
  'resort_hotel',
]

type Props = {
  watch: UseFormWatch<TripCreateFormValues>
  setValue: UseFormSetValue<TripCreateFormValues>
  getValues: UseFormGetValues<TripCreateFormValues>
  onNext: () => void
}

export function HotelStep({ watch, setValue, getValues, onNext }: Props) {
  const hotel = watch('hotel')
  const country = watch('country')
  const [locationError, setLocationError] = useState<string | null>(null)

  const handleAdd = (item: PlaceItem) => {
    const current = getValues('hotel')
    if (!current.find((h) => h.id === item.id)) {
      setValue('hotel', [...current, item])
    }
  }

  const handleRemove = (id: string) => {
    setValue('hotel', getValues('hotel').filter((h) => h.id !== id))
  }

  return (
    <div className="step">
      <div className="step-header">
        <h2 className="step-title">머무실 숙소가 있나요?</h2>
        <p className="step-subtitle">이미 예약하신 숙소가 있다면 동선을 맞춰드릴게요!</p>
      </div>

      <div className="step-body">
        <PlaceSearch
          placeholder="숙소 검색"
          selected={hotel}
          types={HOTEL_PLACE_TYPES}
          countryCode={COUNTRY_CODES[country] ?? undefined}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onLocationError={setLocationError}
          onLocationErrorClear={() => setLocationError(null)}
        />
        <MapView
          selected={hotel}
          countryCode={COUNTRY_CODES[country] ?? undefined}
          height={240}
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
