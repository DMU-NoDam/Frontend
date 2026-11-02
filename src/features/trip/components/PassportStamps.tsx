import type { CSSProperties } from 'react'
import clsx from 'clsx'
import { getTripStamp } from '../lib/city-stamp'
import type { TripSummary } from '../types/trip-types'
import './PassportStamps.css'

export type PassportView = 'passport' | 'list'

type Props = {
  // 다녀온 여행 (최근 순)
  trips: TripSummary[]
  // 여권(도장을 흩어 찍은 사증 면) 또는 목록(연도별 한 줄씩)
  view: PassportView
  onViewChange: (view: PassportView) => void
  onSelect: (tripId: string) => void
}

// 사증 면 한 쪽에 찍는 도장 자리 (left %, top px). 진짜 여권처럼 여기저기 비스듬히 찍힌 느낌으로,
// 여섯 개를 넘으면 다음 쪽에 같은 자리로 이어 찍는다
const SLOTS: { left: number; top: number; rotate: number }[] = [
  { left: 2, top: 16, rotate: -8 },
  { left: 52, top: 0, rotate: 5 },
  { left: 27, top: 140, rotate: -3 },
  { left: 0, top: 280, rotate: 9 },
  { left: 52, top: 250, rotate: -6 },
  { left: 29, top: 400, rotate: 4 },
]
// 도장 하나(그림 + 아래 글씨)가 차지하는 높이
const STAMP_HEIGHT = 136

const VIEWS: { value: PassportView; label: string }[] = [
  { value: 'passport', label: '여권' },
  { value: 'list', label: '목록' },
]

// 'yyyy-MM-dd' → '2026.09'
function formatYearMonth(date: string): string {
  const [year, month] = date.split('-')
  return `${year}.${month}`
}

// '2026-09-12', '2026-09-14' → '2026.09.12 – 09.14' (해가 바뀌면 끝 날짜에도 연도를 붙인다)
function formatPeriod(startDate: string, endDate: string): string {
  const [startYear, startMonth, startDay] = startDate.split('-')
  const [endYear, endMonth, endDay] = endDate.split('-')
  const end = startYear === endYear ? `${endMonth}.${endDay}` : `${endYear}.${endMonth}.${endDay}`
  return `${startYear}.${startMonth}.${startDay} – ${end}`
}

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size))
}

// 출발한 해별로 묶는다 (trips가 최근 순이라 해도 최근 순)
function groupByYear(trips: TripSummary[]): [string, TripSummary[]][] {
  const groups = new Map<string, TripSummary[]>()
  for (const trip of trips) {
    const year = trip.startDate.slice(0, 4)
    groups.set(year, [...(groups.get(year) ?? []), trip])
  }
  return [...groups]
}

// 다녀온 여행 : 여권 사증 면에 다녀온 도시 도장을 찍어 모은다. 많아지면 목록으로 바꿔 연도별로 찾을 수 있다.
// 도장이나 줄을 누르면 그 여행 일정으로 간다. 다녀온 여행이 없으면 빈 사증 면에 첫 도장 자리를 보여준다
export function PassportStamps({ trips, view, onViewChange, onSelect }: Props) {
  if (trips.length === 0) {
    return (
      <div className="passport">
        <PassportHead />
        <div className="passport__empty">
          <span className="passport__empty-slot" aria-hidden="true">
            FIRST
          </span>
          <span className="passport__empty-pen" aria-hidden="true">
            첫 도장은 어디로?
          </span>
          <p className="passport__empty-title">아직 찍은 도장이 없어요</p>
          <p className="passport__empty-text">여행이 끝나면 그 도시 도장이 여기에 찍혀요</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="passport__bar">
        <p className="passport__count">
          지금까지 찍은 도장 <b>{trips.length}</b>개
        </p>
        <div className="passport__views" role="group" aria-label="보기 방식">
          {VIEWS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={clsx('passport__view', view === value && 'passport__view--active')}
              aria-pressed={view === value}
              onClick={() => onViewChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'list' ? (
        groupByYear(trips).map(([year, yearTrips]) => (
          <section key={year} className="passport__year" aria-label={`${year}년`}>
            <h3 className="passport__year-title">{year}</h3>
            <ul className="passport__rows">
              {yearTrips.map((trip) => (
                <li key={trip.id}>
                  <button type="button" className="passport__row" onClick={() => onSelect(trip.id)}>
                    <span className="passport__row-stamp" aria-hidden="true">
                      <StampInk trip={trip} mini />
                    </span>
                    <span className="passport__row-text">
                      <b>{trip.name}</b>
                      <span>{formatPeriod(trip.startDate, trip.endDate)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        chunk(trips, SLOTS.length).map((page, pageIndex) => (
          <div key={pageIndex} className="passport">
            <PassportHead />
            <ul
              className="passport__stamps"
              style={{ height: Math.max(...page.map((_, i) => SLOTS[i].top)) + STAMP_HEIGHT }}
            >
              {page.map((trip, i) => {
                const slot = SLOTS[i]
                const when = formatYearMonth(trip.startDate)
                return (
                  <li key={trip.id} style={{ left: `${slot.left}%`, top: slot.top }}>
                    <button
                      type="button"
                      className="passport__stamp"
                      aria-label={`${trip.name} · ${when} 일정 보기`}
                      onClick={() => onSelect(trip.id)}
                    >
                      <span
                        className="passport__ink"
                        style={{
                          '--stamp-rotate': `${slot.rotate}deg`,
                          // 쪽마다 처음부터 차례로 쾅쾅 찍힌다
                          animationDelay: `${0.15 + i * 0.15}s`,
                        } as CSSProperties}
                      >
                        <StampInk trip={trip} />
                      </span>
                      <span className="passport__label">
                        {trip.name} · {when}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <span className="passport__page" aria-hidden="true">
              — {pageIndex + 1} —
            </span>
          </div>
        ))
      )}
    </>
  )
}

function PassportHead() {
  return (
    <div className="passport__head" aria-hidden="true">
      <span>PASSPORT · VISAS</span>
      <span>사증</span>
    </div>
  )
}

// 도시 도장 그림, 그림이 없는 도시는 JAPAN · 영문 도시 이름 · 다녀온 달 글자 도장. mini는 목록 줄 앞의 작은 도장
function StampInk({ trip, mini = false }: { trip: TripSummary; mini?: boolean }) {
  const stamp = getTripStamp(trip)
  if (stamp.image) return <img className={clsx(mini && 'passport__mini-img')} src={stamp.image} alt="" />

  const labelSize = stamp.label.length > 8 ? 13 : stamp.label.length > 6 ? 15 : 18
  return (
    <span className={clsx('passport__text-stamp', mini && 'passport__text-stamp--mini')}>
      {!mini && <i>JAPAN</i>}
      <b style={mini ? undefined : { fontSize: labelSize }}>{stamp.label}</b>
      {!mini && <i>{formatYearMonth(trip.startDate)}</i>}
    </span>
  )
}
