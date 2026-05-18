import { useState } from 'react'
import './DateRangePicker.css'

type Props = {
  startDate: string
  endDate: string
  onChange: (startDate: string, endDate: string) => void
}

const WEEK_DAYS = ['월', '화', '수', '목', '금', '토', '일']
const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
]
const DAY_SHORT = ['일', '월', '화', '수', '목', '금', '토']

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return toDateStr(date.getFullYear(), date.getMonth(), date.getDate())
}

// Monday-first: Monday=0 … Sunday=6
function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay()
  return (day + 6) % 7
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const dayName = DAY_SHORT[new Date(y, m - 1, d).getDay()]
  return `${m}.${String(d).padStart(2, '0')} (${dayName})`
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
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else { setViewMonth((m) => m - 1) }
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else { setViewMonth((m) => m + 1) }
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
      const rawStart = dateStr < pendingStart ? dateStr : pendingStart
      const rawEnd = dateStr < pendingStart ? pendingStart : dateStr
      const maxEnd = addDays(rawStart, 6)
      onChange(rawStart, rawEnd > maxEnd ? maxEnd : rawEnd)
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

    if (effectiveStart && !effectiveEnd && dateStr === effectiveStart) {
      classes.push('drp-day--start-only')
    } else {
      if (dateStr === effectiveStart) classes.push('drp-day--start')
      if (dateStr === effectiveEnd) classes.push('drp-day--end')
      if (effectiveStart && effectiveEnd && dateStr > effectiveStart && dateStr < effectiveEnd)
        classes.push('drp-day--range')
    }

    if (dateStr === todayStr && dateStr !== effectiveStart && dateStr !== effectiveEnd)
      classes.push('drp-day--today')

    return classes.join(' ')
  }

  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="drp">
      <div className="drp-header">
        <div className="drp-nav-group">
          <button type="button" className="drp-nav" onClick={prevMonth} aria-label="이전 달">‹</button>
          <span className="drp-title">{viewYear}년 {MONTH_NAMES[viewMonth]}</span>
          <button type="button" className="drp-nav" onClick={nextMonth} aria-label="다음 달">›</button>
        </div>
        <span className="drp-hint">최대 7일 선택</span>
      </div>

      <div className="drp-weekdays" aria-hidden="true">
        {WEEK_DAYS.map((d) => (
          <span key={d} className="drp-weekday">{d}</span>
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

      <div className="drp-dates">
        <div className={`drp-date-box${startDate ? ' drp-date-box--filled' : ''}`}>
          <span>{startDate ? formatDateDisplay(startDate) : '출발일'}</span>
        </div>
        <div className={`drp-date-box${endDate ? ' drp-date-box--filled' : ''}`}>
          <span>{endDate ? formatDateDisplay(endDate) : '도착일'}</span>
        </div>
      </div>
    </div>
  )
}
