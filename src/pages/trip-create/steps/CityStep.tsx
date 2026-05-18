import { useState } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { getCitiesByCountry } from '@/features/trip/data/cities'
import type { City } from '@/features/trip/data/cities'
import type { TripCreateFormValues } from '@/features/trip/types/trip-types'
import './steps.css'

type Props = {
  control: Control<TripCreateFormValues>
  setValue: UseFormSetValue<TripCreateFormValues>
  onNext: () => void
}

export function CityStep({ control, setValue, onNext }: Props) {
  const country = useWatch({ control, name: 'country' })
  const region = useWatch({ control, name: 'region' })

  const allCities = getCitiesByCountry(country)
  const travelRegions = [...new Set(allCities.map((c) => c.travelRegion))]

  const [activeTab, setActiveTab] = useState<string>(() => travelRegions[0] ?? '')

  const selectedCities = region
    .map((id) => allCities.find((c) => c.id === id))
    .filter((c): c is City => c !== undefined)

  const activeTravelRegion = selectedCities.length > 0 ? selectedCities[0].travelRegion : null

  const tabCities = allCities.filter((c) => c.travelRegion === activeTab)

  const isDisabled = (city: City): boolean => {
    if (region.includes(city.id)) return false
    if (region.length >= 2) return true
    if (activeTravelRegion && city.travelRegion !== activeTravelRegion) return true
    return false
  }

  const handleToggle = (city: City) => {
    if (region.includes(city.id)) {
      setValue('region', region.filter((id) => id !== city.id), { shouldValidate: true })
    } else if (!isDisabled(city)) {
      setValue('region', [...region, city.id], { shouldValidate: true })
    }
  }

  return (
    <div className="step">
      <div className="step-header">
        <h2 className="step-title">어떤 도시를 여행할 건가요?</h2>
        <p className="step-subtitle">도시는 같은 지역에서 최대 2개까지 선택할 수 있어요.</p>
      </div>

      <div className="step-body">
        {selectedCities.length > 0 && (
          <ul className="step-chips" aria-label="선택된 도시">
            {selectedCities.map((city) => (
              <li key={city.id} className="step-chip">
                <span>{city.name}</span>
                <button
                  type="button"
                  className="step-chip-remove"
                  onClick={() =>
                    setValue('region', region.filter((id) => id !== city.id), { shouldValidate: true })
                  }
                  aria-label={`${city.name} 제거`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        {allCities.length === 0 ? (
          <p className="step-subtitle">해당 국가의 도시 데이터가 아직 준비되지 않았어요.</p>
        ) : (
          <>
            <div className="city-tabs" role="tablist">
              {travelRegions.map((tr) => (
                <button
                  key={tr}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tr}
                  className={`city-tab${activeTab === tr ? ' city-tab--active' : ''}`}
                  onClick={() => setActiveTab(tr)}
                >
                  {tr}
                </button>
              ))}
            </div>

            <div className="city-grid">
              {tabCities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  className={`city-btn${region.includes(city.id) ? ' city-btn--selected' : ''}`}
                  onClick={() => handleToggle(city)}
                  disabled={isDisabled(city)}
                  aria-pressed={region.includes(city.id)}
                >
                  <span className="city-btn-name">{city.name}</span>
                  <span className="city-btn-sub">{city.prefecture}</span>
                </button>
              ))}
            </div>
          </>
        )}
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
      </div>
    </div>
  )
}
