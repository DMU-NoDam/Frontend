import type { IconType } from 'react-icons'
import {
  LuCloud,
  LuCloudDrizzle,
  LuCloudFog,
  LuCloudLightning,
  LuCloudRain,
  LuCloudRainWind,
  LuCloudSnow,
  LuCloudSun,
  LuSnowflake,
  LuSun,
  LuThermometer,
} from 'react-icons/lu'

// 이모지는 기기마다 모양이 달라 앱 아이콘 세트(Lucide)로 통일한다
type WeatherLabel = { label: string; Icon: IconType }

// Open-Meteo가 내려주는 WMO weather code → 한국어 상태 + 아이콘
// https://open-meteo.com/en/docs (WMO Weather interpretation codes)
export function getWeatherLabel(code: number): WeatherLabel {
  if (code === 0) return { label: '맑음', Icon: LuSun }
  if (code === 1) return { label: '대체로 맑음', Icon: LuCloudSun }
  if (code === 2) return { label: '구름 조금', Icon: LuCloudSun }
  if (code === 3) return { label: '흐림', Icon: LuCloud }
  if (code === 45 || code === 48) return { label: '안개', Icon: LuCloudFog }
  if (code >= 51 && code <= 57) return { label: '이슬비', Icon: LuCloudDrizzle }
  if (code >= 61 && code <= 67) return { label: '비', Icon: LuCloudRain }
  if (code >= 71 && code <= 77) return { label: '눈', Icon: LuCloudSnow }
  if (code >= 80 && code <= 82) return { label: '소나기', Icon: LuCloudRainWind }
  if (code === 85 || code === 86) return { label: '눈 소나기', Icon: LuSnowflake }
  if (code >= 95) return { label: '뇌우', Icon: LuCloudLightning }
  return { label: '알 수 없음', Icon: LuThermometer }
}
