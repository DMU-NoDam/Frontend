import type { CSSProperties } from 'react'
import { getTripStamp } from '../lib/city-stamp'
import type { TripSummary } from '../types/trip-types'
import './PassportStamps.css'

type Props = {
  // 다녀온 여행 (최근 순)
  trips: TripSummary[]
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

// 'yyyy-MM-dd' → '2026.09'
function formatYearMonth(date: string): string {
  const [year, month] = date.split('-')
  return `${year}.${month}`
}

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size))
}

// 다녀온 여행 : 여권 사증 면에 다녀온 도시 도장을 찍어 모은다. 도장을 누르면 그 여행 일정으로 간다.
// 다녀온 여행이 없으면 빈 사증 면에 첫 도장 자리를 보여준다
export function PassportStamps({ trips, onSelect }: Props) {
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

  const pages = chunk(trips, SLOTS.length)

  return (
    <>
      <p className="passport__count">
        지금까지 찍은 도장 <b>{trips.length}</b>개
      </p>
      {pages.map((page, pageIndex) => (
        <div key={pageIndex} className="passport">
          <PassportHead />
          <ul
            className="passport__stamps"
            style={{ height: Math.max(...page.map((_, i) => SLOTS[i].top)) + STAMP_HEIGHT }}
          >
            {page.map((trip, i) => {
              const slot = SLOTS[i]
              const stamp = getTripStamp(trip)
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
                      {stamp.image ? (
                        <img src={stamp.image} alt="" />
                      ) : (
                        <span className="passport__text-stamp">
                          <i>JAPAN</i>
                          <b style={{ fontSize: stamp.label.length > 8 ? 13 : stamp.label.length > 6 ? 15 : 18 }}>
                            {stamp.label}
                          </b>
                          <i>{when}</i>
                        </span>
                      )}
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
      ))}
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
