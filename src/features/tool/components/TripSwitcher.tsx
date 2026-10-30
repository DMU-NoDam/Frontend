import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { LuCheck, LuChevronDown, LuX } from 'react-icons/lu'
import { formatTripPeriod, getTripStatusLabel } from '@/features/trip/lib/trip-date'
import type { TripSummary } from '@/features/trip/types/trip-types'
import './TripSwitcher.css'

type Props = {
  // 고를 수 있는 여행 (아직 끝나지 않은 확정 여행)
  trips: TripSummary[]
  selected: TripSummary
  onSelect: (tripId: string) => void
}

function getTripSummaryLabel(trip: TripSummary): string {
  return `${formatTripPeriod(trip.startDate, trip.endDate)} · ${getTripStatusLabel(trip)}`
}

// 여행도구 헤더의 "도쿄 여행 · 11/2–11/4 · D-3" 칩. 고를 여행이 둘 이상이면 눌러서 바꾼다
export function TripSwitcher({ trips, selected, onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const chipRef = useRef<HTMLButtonElement>(null)
  const selectedOptionRef = useRef<HTMLButtonElement>(null)

  const close = () => {
    setIsOpen(false)
    chipRef.current?.focus()
  }

  // 열리면 지금 여행에 포커스, Esc로 닫기
  useEffect(() => {
    if (!isOpen) return
    selectedOptionRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        chipRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  const label = (
    <>
      <span className="trip-switcher__name">{selected.name}</span>
      <span className="trip-switcher__meta">· {getTripSummaryLabel(selected)}</span>
    </>
  )

  if (trips.length <= 1) {
    return <p className="trip-switcher">{label}</p>
  }

  return (
    <>
      <button
        ref={chipRef}
        type="button"
        className="trip-switcher trip-switcher--button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        {label}
        <LuChevronDown className="trip-switcher__chevron" aria-hidden="true" />
      </button>

      {isOpen &&
        createPortal(
          <div>
            <button
              type="button"
              className="trip-picker__backdrop"
              aria-label="여행 선택 닫기"
              tabIndex={-1}
              onClick={close}
            />
            <div className="trip-picker" role="dialog" aria-modal="true" aria-labelledby="trip-picker-title">
              <header className="trip-picker__header">
                <h2 id="trip-picker-title" className="trip-picker__title">
                  여행 선택
                </h2>
                <button type="button" className="trip-picker__close" aria-label="닫기" onClick={close}>
                  <LuX aria-hidden="true" />
                </button>
              </header>

              <ul className="trip-picker__list" role="radiogroup" aria-labelledby="trip-picker-title">
                {trips.map((trip) => {
                  const isSelected = trip.id === selected.id
                  return (
                    <li key={trip.id}>
                      <button
                        ref={isSelected ? selectedOptionRef : undefined}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        className={clsx('trip-picker__option', isSelected && 'trip-picker__option--selected')}
                        onClick={() => {
                          onSelect(trip.id)
                          close()
                        }}
                      >
                        <span className="trip-picker__text">
                          <span className="trip-picker__name">{trip.name}</span>
                          <span className="trip-picker__meta">{getTripSummaryLabel(trip)}</span>
                        </span>
                        {isSelected && <LuCheck className="trip-picker__check" aria-hidden="true" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
