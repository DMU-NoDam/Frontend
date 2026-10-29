export type WeatherScene = 'clear' | 'partly' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm'

// Open-Meteo WMO weather code → 배경 장면
// https://open-meteo.com/en/docs (WMO Weather interpretation codes)
export function getWeatherScene(code: number): WeatherScene {
  if (code === 0) return 'clear'
  if (code === 1 || code === 2) return 'partly'
  if (code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'cloudy'
}

// 장면 하늘의 맨 위 색. 상태바(theme-color)를 장면과 이어지게 칠할 때 쓴다
export const WEATHER_SCENE_TOP_COLOR: Record<WeatherScene, string> = {
  clear: '#1665d1',
  partly: '#2a76d6',
  cloudy: '#7f8a97',
  fog: '#aeb6bf',
  rain: '#46505b',
  snow: '#9eaab7',
  storm: '#1f252c',
}
