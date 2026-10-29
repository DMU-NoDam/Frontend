type WeatherLabel = { label: string; emoji: string }

// Open-Meteo가 내려주는 WMO weather code → 한국어 상태
// https://open-meteo.com/en/docs (WMO Weather interpretation codes)
export function getWeatherLabel(code: number): WeatherLabel {
  if (code === 0) return { label: '맑음', emoji: '☀️' }
  if (code === 1) return { label: '대체로 맑음', emoji: '🌤️' }
  if (code === 2) return { label: '구름 조금', emoji: '⛅' }
  if (code === 3) return { label: '흐림', emoji: '☁️' }
  if (code === 45 || code === 48) return { label: '안개', emoji: '🌫️' }
  if (code >= 51 && code <= 57) return { label: '이슬비', emoji: '🌦️' }
  if (code >= 61 && code <= 67) return { label: '비', emoji: '🌧️' }
  if (code >= 71 && code <= 77) return { label: '눈', emoji: '🌨️' }
  if (code >= 80 && code <= 82) return { label: '소나기', emoji: '🌦️' }
  if (code === 85 || code === 86) return { label: '눈 소나기', emoji: '🌨️' }
  if (code >= 95) return { label: '뇌우', emoji: '⛈️' }
  return { label: '알 수 없음', emoji: '🌡️' }
}
