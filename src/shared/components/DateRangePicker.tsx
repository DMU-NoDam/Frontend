import { useState } from 'react'
import './DateRangePicker.css'

type Props = {
  startDate: string
  endDate: string
  onChange: (startDate: string, endDate: string) => void
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
]

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

type SelectionState = 'idle' | 'start-picked'

export function DateRangePicker({ startDate, endDate, onChange }: Props) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selection, setSelection] = useState<SelectionState>('idle')
  const [pendingStart, setPendingStart] = useState<string>('')

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth)

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  const isPast = (day: number) => toDateStr(viewYear, viewMonth, day) < todayStr

  const handleDayClick = (day: number) => {
    if (isPast(day)) return
    const dateStr = toDateStr(viewYear, viewMonth, day)

    if (selection === 'idle') {
      setPendingStart(dateStr)
      setSelection('start-picked')
      onChange(dateStr, '')
    } else {
      if (dateStr < pendingStart) {
        onChange(dateStr, pendingStart)
      } else {
        onChange(pendingStart, dateStr)
      }
      setSelection('idle')
      setPendingStart('')
    }
  }

  const getDateClass = (day: number): string => {
    const dateStr = toDateStr(viewYear, viewMonth, day)
    const effectiveStart = selection === 'start-picked' ? pendingStart : startDate
    const effectiveEnd = selection === 'start-picked' ? '' : endDate

    const classes: string[] = ['drp-day']

    if (dateStr < todayStr) {
      classes.push('drp-day--disabled')
      return classes.join(' ')
    }

    if (dateStr === effectiveStart) classes.push('drp-day--start')
    if (dateStr === effectiveEnd) classes.push('drp-day--end')
    if (effectiveStart && effectiveEnd && dateStr > effectiveStart && dateStr < effectiveEnd)
      classes.push('drp-day--range')

    if (dateStr === todayStr) classes.push('drp-day--today')

    return classes.join(' ')
  }

  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="drp">
      <div className="drp-header">
        <button type="button" className="drp-nav" onClick={prevMonth} aria-label="이전 달">
          ‹
        </button>
        <span className="drp-title">
          {viewYear}년 {MONTH_NAMES[viewMonth]}
        </span>
        <button type="button" className="drp-nav" onClick={nextMonth} aria-label="다음 달">
          ›
        </button>
      </div>

      <div className="drp-weekdays" aria-hidden="true">
        {WEEK_DAYS.map((d) => (
          <span key={d} className="drp-weekday">
            {d}
          </span>
        ))}
      </div>

      <div className="drp-grid" role="grid" aria-label="날짜 선택">
        {cells.map((day, i) =>
          day === null ? (
            <span key={`empty-${i}`} className="drp-empty" aria-hidden="true" />
          ) : (
            <button
              key={day}
              type="button"
              role="gridcell"
              className={getDateClass(day)}
              onClick={() => handleDayClick(day)}
              aria-label={toDateStr(viewYear, viewMonth, day)}
              aria-pressed={
                toDateStr(viewYear, viewMonth, day) === startDate ||
                toDateStr(viewYear, viewMonth, day) === endDate
              }
            >
              {day}
            </button>
          ),
        )}
      </div>

      {(startDate || endDate) && (
        <p className="drp-summary">
          {startDate || '?'} → {endDate || '?'}
        </p>
      )}
    </div>
  )
}
