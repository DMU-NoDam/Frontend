import { useEffect, useState } from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import { useFlightLookup } from '@/features/trip/hooks/use-flight-lookup'
import type { TripCreateFormValues } from '@/features/trip/types/trip-types'
import './steps.css'

type Props = {
  setValue: UseFormSetValue<TripCreateFormValues>
  onNext: () => void
  onBack: () => void
}

type SectionField = 'departFlight' | 'arriveFlight'

function FlightSection({
  title,
  field,
  searchedIata,
  onSearch,
  onClear,
  setValue,
}: {
  title: string
  field: SectionField
  searchedIata: string
  onSearch: (iata: string) => void
  onClear: () => void
  setValue: UseFormSetValue<TripCreateFormValues>
}) {
  const [inputValue, setInputValue] = useState('')
  const { data, isFetching, isError } = useFlightLookup(searchedIata)

  useEffect(() => {
    if (!data || !searchedIata) return
    if (field === 'departFlight') {
      setValue('departFlight', {
        departureAirport: data.departureAirport,
        departureTime: data.departureTime,
      })
    } else {
      setValue('arriveFlight', {
        arrivalAirport: data.arrivalAirport,
        arrivalTime: data.arrivalTime,
      })
    }
  }, [data, searchedIata, field, setValue])

  return (
    <div className="flight-section">
      <p className="flight-section-title">{title}</p>

      {!searchedIata ? (
        <div className="flight-input-row">
          <input
            type="text"
            className="flight-input"
            placeholder="항공편 코드 (예: KE123)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            maxLength={10}
            aria-label={`${title} 항공편 코드`}
          />
          <button
            type="button"
            className="flight-search-btn"
            onClick={() => onSearch(inputValue.trim())}
            disabled={!inputValue.trim()}
          >
            조회
          </button>
        </div>
      ) : (
        <>
          {isFetching && <p className="flight-loading">조회 중...</p>}
          {isError && (
            <p className="flight-error">
              항공편을 찾을 수 없어요.{' '}
              <button type="button" className="step-skip" onClick={onClear}>
                다시 입력
              </button>
            </p>
          )}
          {data && (
            <div className="flight-result-card">
              <div className="flight-result-row">
                <span className="flight-result-label">출발</span>
                <span>{data.departureAirport} · {data.departureTime}</span>
              </div>
              <div className="flight-result-row">
                <span className="flight-result-label">도착</span>
                <span>{data.arrivalAirport} · {data.arrivalTime}</span>
              </div>
              <button type="button" className="step-skip" onClick={onClear}>
                다시 입력
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function FlightStep({ setValue, onNext, onBack }: Props) {
  const [departIata, setDepartIata] = useState('')
  const [arriveIata, setArriveIata] = useState('')

  const handleSkip = () => {
    setValue('departFlight', undefined)
    setValue('arriveFlight', undefined)
    onNext()
  }

  return (
    <div className="step">
      <div className="step-header">
        <span className="step-label">Step 6</span>
        <h2 className="step-title">항공편 정보를 알고 있나요?</h2>
        <p className="step-subtitle">항공편 코드를 입력하면 자동으로 불러와요</p>
      </div>

      <div className="step-body">
        <FlightSection
          title="출발편"
          field="departFlight"
          searchedIata={departIata}
          onSearch={setDepartIata}
          onClear={() => {
            setDepartIata('')
            setValue('departFlight', undefined)
          }}
          setValue={setValue}
        />
        <FlightSection
          title="귀국편"
          field="arriveFlight"
          searchedIata={arriveIata}
          onSearch={setArriveIata}
          onClear={() => {
            setArriveIata('')
            setValue('arriveFlight', undefined)
          }}
          setValue={setValue}
        />
      </div>

      <div className="step-actions">
        <button type="button" className="step-next" onClick={onNext}>
          다음
        </button>
        <button type="button" className="step-skip" onClick={handleSkip}>
          건너뛰기
        </button>
        <button type="button" className="step-back" onClick={onBack}>
          이전
        </button>
      </div>
    </div>
  )
}
