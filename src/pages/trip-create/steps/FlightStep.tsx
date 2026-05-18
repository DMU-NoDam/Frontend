import { useEffect, useState } from 'react'
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { useFlightLookup } from '@/features/trip/hooks/use-flight-lookup'
import type {
  FlightInfo,
  TripCreateFormValues,
} from '@/features/trip/types/trip-types'
import './steps.css'

type Props = {
  watch: UseFormWatch<TripCreateFormValues>
  setValue: UseFormSetValue<TripCreateFormValues>
  onNext: () => void
}

type SectionField = 'departFlight' | 'arriveFlight'
type SavedFlight = FlightInfo | undefined

function FlightSection({
  title,
  field,
  savedFlight,
  searchedIata,
  date,
  onSearch,
  onClear,
  setValue,
}: {
  title: string
  field: SectionField
  savedFlight: SavedFlight
  searchedIata: string
  date: string
  onSearch: (iata: string) => void
  onClear: () => void
  setValue: UseFormSetValue<TripCreateFormValues>
}) {
  const [inputValue, setInputValue] = useState('')
  const { data, isFetching, isError } = useFlightLookup(searchedIata, date)
  const label = field === 'departFlight' ? '출발' : '도착'

  const getDisplayText = (flight: FlightInfo) => {
    const airport = field === 'departFlight' ? flight.departureAirport : flight.arrivalAirport
    const time = field === 'departFlight' ? flight.departureTime : flight.arrivalTime
    return `${flight.flightIata} · ${airport} · ${time}`
  }

  useEffect(() => {
    if (!data || !searchedIata) return

    setValue(field, {
      flightIata: data.flightIata,
      departureAirport: data.departureAirport,
      arrivalAirport: data.arrivalAirport,
      departureTime: data.departureTime,
      arrivalTime: data.arrivalTime,
    })
  }, [data, searchedIata, field, setValue])

  const hasSavedFlight = Boolean(savedFlight)
  const shouldShowInput = !searchedIata && !hasSavedFlight

  return (
    <div className="flight-section">
      <p className="flight-section-title">{title}</p>

      {shouldShowInput ? (
        <div className="flight-input-row">
          <input
            type="text"
            className="flight-input"
            placeholder="예: 항공편 번호"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            maxLength={10}
            aria-label={`${title} 코드`}
          />
          <button
            type="button"
            className="flight-search-btn"
            onClick={() => onSearch(inputValue.trim())}
            disabled={!inputValue.trim() || !date}
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
            <>
              <div className="flight-result-card">
                <div className="flight-result-row">
                  <span className="flight-result-label">{label}</span>
                  <span>{getDisplayText(data)}</span>
                </div>
              </div>
              <button type="button" className="step-skip" onClick={onClear}>
                다시 입력
              </button>
            </>
          )}
          {!data && savedFlight && (
            <>
              <div className="flight-result-card">
                <div className="flight-result-row">
                  <span className="flight-result-label">{label}</span>
                  <span>{getDisplayText(savedFlight)}</span>
                </div>
              </div>
              <button type="button" className="step-skip" onClick={onClear}>
                다시 입력
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}

export function FlightStep({ watch, setValue, onNext }: Props) {
  const [departIata, setDepartIata] = useState('')
  const [arriveIata, setArriveIata] = useState('')
  const departFlight = watch('departFlight')
  const arriveFlight = watch('arriveFlight')
  const startDate = watch('startDate')
  const endDate = watch('endDate')

  return (
    <div className="step">
      <div className="step-header">
        <h2 className="step-title">항공편 시간을 알려주세요</h2>
        <p className="step-subtitle">
          비행 시간에 맞춰 첫날과 마지막 날 일정을 생성해드릴게요!
        </p>
      </div>

      <div className="step-body">
        <FlightSection
          title="출발 항공편"
          field="departFlight"
          savedFlight={departFlight}
          searchedIata={departIata}
          date={startDate}
          onSearch={setDepartIata}
          onClear={() => {
            setDepartIata('')
            setValue('departFlight', undefined)
          }}
          setValue={setValue}
        />
        <FlightSection
          title="귀국 항공편"
          field="arriveFlight"
          savedFlight={arriveFlight}
          searchedIata={arriveIata}
          date={endDate}
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
      </div>
    </div>
  )
}
