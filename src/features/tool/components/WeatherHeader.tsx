import type { ReactNode } from 'react'
import { LuArrowRight, LuCloudSun, LuMapPin, LuMoon, LuSun } from 'react-icons/lu'
import { useDayWeather } from '../hooks/use-weather'
import { getWeatherLabel } from '../lib/weather-code'
import type { TripLocation } from '../lib/trip-location'
import './WeatherHeader.css'

type Props = {
  location: TripLocation | null
  // 맨 위에 보여줄 여행 칩 (여행이 있을 때만)
  tripSwitcher?: ReactNode
  // 날씨를 볼 날짜 (yyyy-MM-dd). 여행지의 오늘 날씨를 보여주므로 오늘 날짜
  date: string | undefined
  isTripsLoading: boolean
  // 확정 여행이 없을 때 '내 여행 확정하기'를 누르면
  onFindTrip: () => void
}

// 여행이 없을 때 빈 날씨 카드의 시간대 칸 (여행을 확정하면 무엇이 보일지 미리 보여준다)
const EMPTY_SLOTS = [
  { label: '아침', Icon: LuSun },
  { label: '오후', Icon: LuCloudSun },
  { label: '밤', Icon: LuMoon },
]

function formatDateLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  // 'yyyy-MM-dd'를 new Date()에 그대로 넣으면 UTC로 해석돼 요일이 하루 밀릴 수 있다
  return new Date(year, month - 1, day).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

export function WeatherHeader({ location, tripSwitcher, date, isTripsLoading, onFindTrip }: Props) {
  const { day: today, current, isLoading, isError } = useDayWeather(location?.cityName, date)

  if (!location || !date) {
    if (isTripsLoading) {
      return (
        <header className="weather-header">
          <p className="weather-header__place">여행도구</p>
          <p className="weather-header__notice">여행 정보를 확인하고 있어요</p>
        </header>
      )
    }

    // 확정 여행이 없을 때: 하늘 위에 칸이 비어 있는 날씨 카드를 붙여 두고, 여행을 확정하면 채워진다고 알려준다
    return (
      <header className="weather-header weather-header--empty">
        <div className="weather-empty__top">
          <div>
            <p className="weather-empty__eyebrow">TRAVEL KIT</p>
            <p className="weather-empty__title">여행도구</p>
          </div>
          <button type="button" className="weather-empty__cta" onClick={onFindTrip}>
            내 여행 확정하기 <LuArrowRight aria-hidden="true" />
          </button>
        </div>

        <div className="weather-empty__card">
          <span className="weather-empty__tape" aria-hidden="true" />
          <div className="weather-empty__card-head">
            <span>TODAY'S WEATHER</span>
            <span className="weather-empty__city">
              <LuMapPin aria-hidden="true" />
              여행지 미정
            </span>
          </div>
          <div className="weather-empty__body" aria-hidden="true">
            <div className="weather-empty__now">
              <span className="weather-empty__temp">--°</span>
              <span className="weather-empty__range">최고 --° · 최저 --°</span>
            </div>
            <ul className="weather-empty__slots">
              {EMPTY_SLOTS.map(({ label, Icon }) => (
                <li key={label}>
                  <span>{label}</span>
                  <Icon />
                  <b>--°</b>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="weather-empty__pen">여행을 확정하면 채워져요</p>
      </header>
    )
  }

  const place = location.countryName ? `${location.cityName}, ${location.countryName}` : location.cityName
  // 날씨 상태는 지금 날씨 기준, 지금 날씨가 없으면 하루 예보 기준
  const condition = today ? getWeatherLabel(current?.weatherCode ?? today.weatherCode) : null

  return (
    <header className="weather-header">
      {tripSwitcher}
      <div className="weather-header__place-row">
        <p className="weather-header__place">{place}</p>
        <p className="weather-header__date">오늘 · {formatDateLabel(date)}</p>
      </div>

      {isLoading ? (
        <p className="weather-header__notice">날씨를 불러오는 중...</p>
      ) : isError ? (
        <p className="weather-header__notice">날씨 정보를 찾을 수 없어요</p>
      ) : !today || !condition ? (
        <p className="weather-header__notice">오늘 날씨 정보가 아직 없어요</p>
      ) : (
        // 지금 기온 → 날씨 상태 → 최고·최저를 한 덩어리로 묶어 위에서 아래로 한 번에 읽히게 한다.
        // 지금 기온이 없으면(기후 정보 등) 최고기온을 큰 숫자로 쓰지 않고 최고·최저만 보여준다
        <div className="weather-header__current">
          {current && (
            <span className="weather-header__temp" aria-label={`지금 ${Math.round(current.temperature)}도`}>
              {Math.round(current.temperature)}°
            </span>
          )}
          <span className="weather-header__summary">
            <condition.Icon className="weather-header__icon" aria-hidden="true" />
            {condition.label}
          </span>
          <dl className="weather-header__range">
            <div>
              <dt>최고</dt>
              <dd>{Math.round(today.maxTemperature)}°</dd>
            </div>
            <div>
              <dt>최저</dt>
              <dd>{Math.round(today.minTemperature)}°</dd>
            </div>
          </dl>
        </div>
      )}
    </header>
  )
}
