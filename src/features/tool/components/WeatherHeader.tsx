import { useDayWeather } from '../hooks/use-weather'
import { getWeatherLabel } from '../lib/weather-code'
import type { TripLocation } from '../lib/trip-location'
import './WeatherHeader.css'

type Props = {
  location: TripLocation | null
  // 날씨를 볼 날짜 (yyyy-MM-dd). 여행지의 오늘 날씨를 보여주므로 오늘 날짜
  date: string | undefined
  isTripsLoading: boolean
}

function formatDateLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  // 'yyyy-MM-dd'를 new Date()에 그대로 넣으면 UTC로 해석돼 요일이 하루 밀릴 수 있다
  return new Date(year, month - 1, day).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

export function WeatherHeader({ location, date, isTripsLoading }: Props) {
  const { day: today, isLoading, isError } = useDayWeather(location?.cityName, date)

  if (!location || !date) {
    return (
      <header className="weather-header">
        <p className="weather-header__place">여행도구</p>
        <p className="weather-header__notice">
          {isTripsLoading ? '여행 정보를 확인하고 있어요' : '확정된 여행이 생기면 날씨를 보여드려요'}
        </p>
      </header>
    )
  }

  const place = location.countryName ? `${location.cityName}, ${location.countryName}` : location.cityName
  const condition = today ? getWeatherLabel(today.weatherCode) : null

  return (
    <header className="weather-header">
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
        // 기온 → 날씨 상태 → 최고·최저를 한 덩어리로 묶어 위에서 아래로 한 번에 읽히게 한다
        <div className="weather-header__current">
          <span className="weather-header__temp">{Math.round(today.maxTemperature)}°</span>
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
