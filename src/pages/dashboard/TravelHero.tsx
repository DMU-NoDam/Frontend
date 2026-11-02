import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import clsx from 'clsx'
import { LuPlane } from 'react-icons/lu'
import fukuokaSticker from '@/assets/city-sticker/jp-fukuoka.svg'
import hiroshimaSticker from '@/assets/city-sticker/jp-hiroshima.svg'
import kyotoSticker from '@/assets/city-sticker/jp-kyoto.svg'
import nagoyaSticker from '@/assets/city-sticker/jp-nagoya.svg'
import nahaSticker from '@/assets/city-sticker/jp-naha.svg'
import osakaSticker from '@/assets/city-sticker/jp-osaka.svg'
import sapporoSticker from '@/assets/city-sticker/jp-sapporo.svg'
import tokyoSticker from '@/assets/city-sticker/jp-tokyo.svg'
import { getTripStatusLabel } from '@/features/trip/lib/trip-date'
import type { TripSummary } from '@/features/trip/types/trip-types'
import './TravelHero.css'

// 홈 상단 배경: 여행 스크랩북. 큰 도시 이름 아래로 탑승권·우표 스티커·도장·메모지를 붙여 둔다.
// 도시는 하나로 고정한다: 만들어 둔 여행이 있으면 가장 가까운 여행의 도시, 없으면 날짜로 정한 '오늘의 도시'.
// 탑승권은 내 여행마다 한 장씩 겹쳐 쌓고, 여러 장이면 몇 초마다(또는 누르면) 맨 위 장을 넘긴다.
// 들어올 때는 조각들이 차례로 붙는 등장 연출이 한 번 재생된다 (TravelHero.css).
// 장식이라 스크린 리더에서는 숨긴다.

type Destination = {
  code: string
  en: string
  ko: string
  airport: string
  // 그 도시의 랜드마크·음식 스티커 (Microsoft Fluent Emoji Flat, MIT — src/assets/city-sticker)
  sticker: string
}

// 스티커가 있는 도시 (교토는 공항이 없어 간사이공항으로 들어간다)
const DESTINATIONS: Destination[] = [
  { code: 'jp-tokyo', en: 'TOKYO', ko: '도쿄', airport: 'NRT', sticker: tokyoSticker }, // 도쿄타워
  { code: 'jp-osaka', en: 'OSAKA', ko: '오사카', airport: 'KIX', sticker: osakaSticker }, // 오사카성
  { code: 'jp-sapporo', en: 'SAPPORO', ko: '삿포로', airport: 'CTS', sticker: sapporoSticker }, // 눈축제 눈사람
  { code: 'jp-fukuoka', en: 'FUKUOKA', ko: '후쿠오카', airport: 'FUK', sticker: fukuokaSticker }, // 하카타 라멘
  { code: 'jp-naha', en: 'NAHA', ko: '나하', airport: 'OKA', sticker: nahaSticker }, // 히비스커스
  { code: 'jp-nagoya', en: 'NAGOYA', ko: '나고야', airport: 'NGO', sticker: nagoyaSticker }, // 새우튀김
  { code: 'jp-hiroshima', en: 'HIROSHIMA', ko: '히로시마', airport: 'HIJ', sticker: hiroshimaSticker }, // 도리이
  { code: 'jp-kyoto', en: 'KYOTO', ko: '교토', airport: 'KIX', sticker: kyotoSticker }, // 말차
]

// 오늘의 도시: 날짜가 같으면 같은 도시, 다음 날이면 다음 도시
function getTodayDestination(): Destination {
  const now = new Date()
  const dayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000)
  return DESTINATIONS[dayNumber % DESTINATIONS.length]
}

// 'yyyy-MM-dd' → '11.02'
function formatTicketDate(date: string): string {
  const [, month, day] = date.split('-')
  return `${month}.${day}`
}

// 조각 배치의 기준 크기 (393px 화면에서 배지 아래 350px 높이)
const DESIGN_WIDTH = 393
const DESIGN_HEIGHT = 350
// 아래 시트의 둥근 모서리와 겹치지 않게 남기는 여백
const BOTTOM_GAP = 28

// 큰 도시 이름: 좌우 16px 안쪽 폭에 들어가게 글자 수로 크기를 정한다 (Anton 대문자 한 글자 ≈ 0.5em)
const WORD_MAX_WIDTH = DESIGN_WIDTH - 32
const WORD_MAX_SIZE = 104

function getWordSize(word: string): number {
  return Math.min(WORD_MAX_SIZE, Math.floor(WORD_MAX_WIDTH / (word.length * 0.5)))
}

// 도장 가운데 이름도 원 안쪽(약 58px)에 들어가게
function getStampWordSize(word: string): number {
  return Math.min(15, Math.floor(58 / (word.length * 0.5)))
}

// 탑승권 묶음: 겹쳐 보이는 최대 장수, 넘기는 간격, 맨 위 장이 빠지는 시간 (CSS 전환과 맞춘다)
const STACK_VISIBLE = 3
const STACK_ROTATE_MS = 4000
const STACK_LEAVE_MS = 450

type TicketItem = {
  // 오늘의 도시 탑승권이면 null
  trip: TripSummary | null
  dest: Destination
}

type Props = {
  // 아직 끝나지 않은 내 여행 (확정 전 포함, 출발일이 가까운 순). 없으면 오늘의 도시를 보여준다
  trips?: TripSummary[]
  // 위에 겹쳐 뜨는 배지만큼 내린다 (회원 홈은 지도 위 배지, 비회원 홈은 헤더가 따로 있다)
  topInset?: number
}

export function TravelHero({ trips = [], topInset = 84 }: Props) {
  const reduceMotion = useReducedMotion() ?? false
  const heroRef = useRef<HTMLDivElement>(null)
  // 화면이 낮거나 좁으면 시트에 가려지지 않도록 조각 전체를 비율대로 줄인다
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const available = height - topInset - BOTTOM_GAP
      setScale(Math.max(0.5, Math.min(1, width / DESIGN_WIDTH, available / DESIGN_HEIGHT)))
    })
    observer.observe(hero)
    return () => observer.disconnect()
  }, [topInset])

  // 스티커 있는 도시로 가는 여행만 탑승권으로 만든다 (요코하마 등은 공항·그림이 없어 뺀다)
  const tripTickets: TicketItem[] = trips.flatMap((trip) => {
    const dest = DESTINATIONS.find((d) => d.code === trip.regionCodes[0])
    return dest ? [{ trip, dest }] : []
  })
  const lead = tripTickets[0]
  const dest = lead?.dest ?? getTodayDestination()
  const tickets: TicketItem[] = tripTickets.length > 0 ? tripTickets : [{ trip: null, dest }]
  const ticketCount = tickets.length

  // ── 탑승권 넘기기 ──
  const [stackTop, setStackTop] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const leavingRef = useRef(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const cycleStack = useCallback(() => {
    if (leavingRef.current || ticketCount < 2) return
    leavingRef.current = true
    setLeaving(true)
    leaveTimer.current = setTimeout(() => {
      setStackTop((top) => (top + 1) % ticketCount)
      setLeaving(false)
      leavingRef.current = false
    }, STACK_LEAVE_MS)
  }, [ticketCount])

  // 움직임 줄이기 설정이면 저절로 넘기지 않는다 (눌러서 넘기기는 된다)
  useEffect(() => {
    if (reduceMotion || ticketCount < 2) return
    const id = setInterval(cycleStack, STACK_ROTATE_MS)
    return () => clearInterval(id)
  }, [cycleStack, reduceMotion, ticketCount])

  useEffect(() => () => clearTimeout(leaveTimer.current), [])

  // 맨 위부터 겹쳐 보일 탑승권 (pos 0 = 맨 위)
  const visibleTickets = Array.from({ length: Math.min(STACK_VISIBLE, ticketCount) }, (_, pos) => ({
    pos,
    item: tickets[(stackTop + pos) % ticketCount],
  }))

  return (
    <div ref={heroRef} className="travel-hero" aria-hidden="true">
      <div className="scrapbook" style={{ top: topInset, transform: `translateX(-50%) scale(${scale})` }}>
        <p className="scrapbook__eyebrow">
          {lead?.trip ? (
            <>
              NEXT STOP <span>{dest.ko} · {getTripStatusLabel(lead.trip)}</span>
            </>
          ) : (
            <>
              TODAY&apos;S CITY <span>{dest.ko}</span>
            </>
          )}
        </p>

        <p className="scrapbook__word" style={{ fontSize: getWordSize(dest.en) }}>
          {dest.en}
        </p>

        {/* 그림 + 도시 이름이 들어간 우표 모양 스티커, 탑승권 옆에 비스듬히 */}
        <div className="scrapbook__postage">
          <div className="scrapbook__postage-paper">
            <div className="scrapbook__postage-inner">
              <img src={dest.sticker} alt="" />
              <b style={{ fontSize: getStampWordSize(dest.en) }}>{dest.en}</b>
              <i>JAPAN · {dest.airport}</i>
            </div>
          </div>
        </div>

        {/* 내 여행 탑승권 묶음. 장식이라 키보드로는 넘기지 않고, 눌러서 넘기기만 덤으로 둔다 */}
        <div
          className={clsx('scrapbook__stack', ticketCount > 1 && 'scrapbook__stack--multi')}
          onClick={cycleStack}
        >
          {visibleTickets.map(({ pos, item }) => (
            <div
              key={item.trip?.id ?? 'today'}
              className={clsx('scrapbook__ticket', pos === 0 && leaving && 'scrapbook__ticket--leaving')}
              data-pos={pos}
            >
              <div className="scrapbook__ticket-main">
                <span className="scrapbook__ticket-air">BOARDING PASS</span>
                <span className="scrapbook__ticket-route">
                  ICN <span className="scrapbook__ticket-arrow">→</span> {item.dest.airport}
                </span>
              </div>
              {/* 내 여행이면 출발일, 아니면 좌석 번호 */}
              <span className="scrapbook__ticket-stub">
                {item.trip ? (
                  <>
                    <small>DEP</small>
                    <b>{formatTicketDate(item.trip.startDate)}</b>
                  </>
                ) : (
                  <>
                    <small>SEAT</small>
                    <b>12A</b>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
        <span className="scrapbook__tape scrapbook__tape--ticket" />
        {trips.length > 1 && <span className="scrapbook__stack-count">내 여행 {trips.length}</span>}

        <svg className="scrapbook__route" viewBox="0 0 393 350" preserveAspectRatio="none">
          <path d="M 200 214 C 210 238, 200 254, 218 266" />
        </svg>
        <LuPlane className="scrapbook__plane" />

        {/* 도장이 찍힌 여권 사증 면 */}
        <div className="scrapbook__passport">
          <span className="scrapbook__passport-head">
            PASSPORT <span>VISAS · 사증</span>
          </span>
          <span className="scrapbook__passport-lines" />
        </div>
        <span className="scrapbook__tape scrapbook__tape--passport" />

        <div className="scrapbook__stamp">
          <b style={{ fontSize: getStampWordSize(dest.en) }}>{dest.en}</b>
          <i>JAPAN</i>
          <i>BON VOYAGE</i>
        </div>

        <p className="scrapbook__note">
          어디로
          <br />
          떠나볼까?
        </p>
      </div>
    </div>
  )
}
