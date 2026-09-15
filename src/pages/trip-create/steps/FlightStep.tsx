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
  const label = field === 'departFlight' ? '도착' : '출발'

  const getDisplayText = (flight: FlightInfo) => {
    const airport = field === 'departFlight' ? flight.arrivalAirport : flight.departureAirport
    const time = field === 'departFlight' ? flight.arrivalTime : flight.departureTime
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

  // 이번 조회 결과가 있으면 그것을, 없으면 폼에 저장된 값을 보여준다.
  // 예전에는 data와 savedFlight를 각각 렌더링해서, 조회 실패(isError) + 저장된 항공편이
  // 같이 있는 상태에서 결과 카드와 "다시 입력" 버튼이 두 벌씩 나왔다.
  const displayFlight = data ?? savedFlight

  // 조회를 걸었는데 결과도 에러도 아직 없는 순간에는 아무것도 렌더링되지 않아서
  // 섹션이 제목만 남고 납작해졌다. 그 구간도 로딩으로 본다.
  const isPending = isFetching || (!displayFlight && !isError)

  return (
    <div className="flight-section">
      <div className="flight-section-header">
        <p className="flight-section-title">{title}</p>
        {isError && (
          <p className="flight-error" role="alert">
            항공편을 찾을 수 없어요.
          </p>
        )}
      </div>

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
      ) : isPending ? (
        <p className="flight-loading">조회 중...</p>
      ) : (
        <>
          {displayFlight && (
            <div className="flight-result-card">
              <div className="flight-result-row">
                <span className="flight-result-label">{label}</span>
                <span>{getDisplayText(displayFlight)}</span>
              </div>
            </div>
          )}
          {(displayFlight || isError) && (
            <button type="button" className="step-skip" onClick={onClear}>
              다시 입력
            </button>
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
