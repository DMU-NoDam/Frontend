import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { LuPlane } from 'react-icons/lu'
import fukuokaPhoto from '@/assets/city/jp-fukuoka.jpg'
import hiroshimaPhoto from '@/assets/city/jp-hiroshima.jpg'
import nagoyaPhoto from '@/assets/city/jp-nagoya.jpg'
import nahaPhoto from '@/assets/city/jp-naha.jpg'
import osakaPhoto from '@/assets/city/jp-osaka.jpg'
import sapporoPhoto from '@/assets/city/jp-sapporo.jpg'
import tokyoPhoto from '@/assets/city/jp-tokyo.jpg'
import './TravelHero.css'

// 홈 상단 배경: 여행 스크랩북. 큰 도시 이름 위아래로 탑승권·도장·사진 조각·메모지를 붙여 두고,
// 몇 초마다 다음 도시로 넘어가며 이름·공항 코드·도장·사진이 함께 바뀐다. 장식이라 스크린 리더에서는 숨긴다.

type Destination = {
  en: string
  ko: string
  airport: string
  photo: string
}

// 앱에서 고를 수 있는 공항 도시 중 사진이 있는 곳
const DESTINATIONS: Destination[] = [
  { en: 'TOKYO', ko: '도쿄', airport: 'NRT', photo: tokyoPhoto },
  { en: 'OSAKA', ko: '오사카', airport: 'KIX', photo: osakaPhoto },
  { en: 'SAPPORO', ko: '삿포로', airport: 'CTS', photo: sapporoPhoto },
  { en: 'FUKUOKA', ko: '후쿠오카', airport: 'FUK', photo: fukuokaPhoto },
  { en: 'NAHA', ko: '나하', airport: 'OKA', photo: nahaPhoto },
  { en: 'NAGOYA', ko: '나고야', airport: 'NGO', photo: nagoyaPhoto },
  { en: 'HIROSHIMA', ko: '히로시마', airport: 'HIJ', photo: hiroshimaPhoto },
]

const ROTATE_MS = 4000

type Props = {
  // 위에 겹쳐 뜨는 배지만큼 내린다 (회원 홈은 지도 위 배지, 비회원 홈은 헤더가 따로 있다)
  topInset?: number
}

export function TravelHero({ topInset = 84 }: Props) {
  const reduceMotion = useReducedMotion() ?? false
  const [index, setIndex] = useState(0)

  // 움직임 줄이기 설정이면 첫 도시에 멈춰 둔다
  useEffect(() => {
    if (reduceMotion) return
    const id = setInterval(() => setIndex((i) => (i + 1) % DESTINATIONS.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [reduceMotion])

  const dest = DESTINATIONS[index]

  return (
    <div className="travel-hero" aria-hidden="true">
      <div className="scrapbook" style={{ top: topInset }}>
        <p className="scrapbook__eyebrow">
          NEXT STOP <span key={`ko-${index}`} className="scrapbook__swap">{dest.ko}</span>
        </p>

        {/* 바뀔 때마다 key가 바뀌어 등장 애니메이션을 다시 재생한다 */}
        <p key={`word-${index}`} className="scrapbook__word">{dest.en}</p>

        <div key={`stamp-${index}`} className="scrapbook__stamp">
          <b>{dest.en}</b>
          <i>JAPAN</i>
          <i>BON VOYAGE</i>
        </div>

        <div className="scrapbook__ticket">
          <div className="scrapbook__ticket-main">
            <span className="scrapbook__ticket-air">ARUBI AIR · BOARDING PASS</span>
            <span className="scrapbook__ticket-route">
              ICN <span className="scrapbook__ticket-arrow">→</span>{' '}
              <span key={`code-${index}`} className="scrapbook__swap">{dest.airport}</span>
            </span>
          </div>
          <span className="scrapbook__ticket-stub">SEAT 12A</span>
        </div>
        <span className="scrapbook__tape scrapbook__tape--ticket" />

        <svg className="scrapbook__route" viewBox="0 0 393 340" preserveAspectRatio="none">
          <path d="M 226 176 C 262 186, 250 214, 286 218" />
        </svg>
        <LuPlane className="scrapbook__plane" />

        <figure className="scrapbook__photo">
          <img key={dest.photo} src={dest.photo} alt="" />
        </figure>
        <span className="scrapbook__tape scrapbook__tape--photo" />

        <p className="scrapbook__note">
          어디로
          <br />
          떠나볼까?
        </p>

        <p className="scrapbook__doodle">♡ 꼭 가보기!</p>
      </div>
    </div>
  )
}
