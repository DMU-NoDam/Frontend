import { useEffect, useRef, useState } from 'react'
import { LuPlane } from 'react-icons/lu'
import fukuokaPhoto from '@/assets/city/jp-fukuoka.jpg'
import hiroshimaPhoto from '@/assets/city/jp-hiroshima.jpg'
import kyotoPhoto from '@/assets/city/jp-kyoto.jpg'
import nagoyaPhoto from '@/assets/city/jp-nagoya.jpg'
import nahaPhoto from '@/assets/city/jp-naha.jpg'
import osakaPhoto from '@/assets/city/jp-osaka.jpg'
import sapporoPhoto from '@/assets/city/jp-sapporo.jpg'
import tokyoPhoto from '@/assets/city/jp-tokyo.jpg'
import { getTripStatusLabel } from '@/features/trip/lib/trip-date'
import type { TripSummary } from '@/features/trip/types/trip-types'
import './TravelHero.css'

// 홈 상단 배경: 여행 스크랩북. 큰 도시 이름 위아래로 탑승권·도장·사진 조각·메모지를 붙여 둔다.
// 도시는 하나로 고정한다: 만들어 둔 여행이 있으면 가장 가까운 여행의 도시, 없으면 날짜로 정한 '오늘의 도시'.
// 장식이라 스크린 리더에서는 숨긴다.

type Destination = {
  code: string
  en: string
  ko: string
  airport: string
  photo: string
}

// 사진이 있는 도시 (교토는 공항이 없어 간사이공항으로 들어간다)
const DESTINATIONS: Destination[] = [
  { code: 'jp-tokyo', en: 'TOKYO', ko: '도쿄', airport: 'NRT', photo: tokyoPhoto },
  { code: 'jp-osaka', en: 'OSAKA', ko: '오사카', airport: 'KIX', photo: osakaPhoto },
  { code: 'jp-sapporo', en: 'SAPPORO', ko: '삿포로', airport: 'CTS', photo: sapporoPhoto },
  { code: 'jp-fukuoka', en: 'FUKUOKA', ko: '후쿠오카', airport: 'FUK', photo: fukuokaPhoto },
  { code: 'jp-naha', en: 'NAHA', ko: '나하', airport: 'OKA', photo: nahaPhoto },
  { code: 'jp-nagoya', en: 'NAGOYA', ko: '나고야', airport: 'NGO', photo: nagoyaPhoto },
  { code: 'jp-hiroshima', en: 'HIROSHIMA', ko: '히로시마', airport: 'HIJ', photo: hiroshimaPhoto },
  { code: 'jp-kyoto', en: 'KYOTO', ko: '교토', airport: 'KIX', photo: kyotoPhoto },
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

type Props = {
  // 가장 가까운 여행 (확정 전 포함). 없으면 오늘의 도시를 보여준다
  trip?: TripSummary
  // 위에 겹쳐 뜨는 배지만큼 내린다 (회원 홈은 지도 위 배지, 비회원 홈은 헤더가 따로 있다)
  topInset?: number
}

export function TravelHero({ trip, topInset = 84 }: Props) {
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

  // 여행 도시가 사진 있는 도시 목록에 없으면(요코하마 등) 오늘의 도시로 대신한다
  const tripDestination = trip && DESTINATIONS.find((d) => d.code === trip.regionCodes[0])
  const dest = tripDestination ?? getTodayDestination()

  return (
    <div ref={heroRef} className="travel-hero" aria-hidden="true">
      <div className="scrapbook" style={{ top: topInset, transform: `translateX(-50%) scale(${scale})` }}>
        <p className="scrapbook__eyebrow">
          {tripDestination && trip ? (
            <>
              NEXT STOP <span>{dest.ko} · {getTripStatusLabel(trip)}</span>
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

        <div className="scrapbook__stamp">
          <b style={{ fontSize: getStampWordSize(dest.en) }}>{dest.en}</b>
          <i>JAPAN</i>
          <i>BON VOYAGE</i>
        </div>

        <div className="scrapbook__ticket">
          <div className="scrapbook__ticket-main">
            <span className="scrapbook__ticket-air">ARUBI AIR · BOARDING PASS</span>
            <span className="scrapbook__ticket-route">
              ICN <span className="scrapbook__ticket-arrow">→</span> {dest.airport}
            </span>
          </div>
          {/* 내 여행이면 출발일, 아니면 좌석 번호 */}
          <span className="scrapbook__ticket-stub">
            {tripDestination && trip ? formatTicketDate(trip.startDate) : 'SEAT 12A'}
          </span>
        </div>
        <span className="scrapbook__tape scrapbook__tape--ticket" />

        <svg className="scrapbook__route" viewBox="0 0 393 350" preserveAspectRatio="none">
          <path d="M 200 214 C 210 238, 200 254, 218 266" />
        </svg>
        <LuPlane className="scrapbook__plane" />

        <figure className="scrapbook__photo">
          <img src={dest.photo} alt="" />
        </figure>
        <span className="scrapbook__tape scrapbook__tape--photo" />

        <p className="scrapbook__note">
          어디로
          <br />
          떠나볼까?
        </p>

        {/* 손글씨 준비물 체크리스트 (여행도구 탭의 체크리스트와 같은 이야기) */}
        <p className="scrapbook__checklist">
          <span className="scrapbook__check scrapbook__check--done" />
          여권
          <span className="scrapbook__check" />
          엔화 환전
        </p>
      </div>
    </div>
  )
}
