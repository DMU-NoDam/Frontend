import { describe, expect, it } from 'vitest'
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
import { getWeatherLabel } from './weather-code'

describe('getWeatherLabel', () => {
  it.each([
    [0, '맑음', LuSun],
    [1, '대체로 맑음', LuCloudSun],
    [2, '구름 조금', LuCloudSun],
    [3, '흐림', LuCloud],
    [45, '안개', LuCloudFog],
    [48, '안개', LuCloudFog],
  ])('코드 %i → %s', (code, label, Icon) => {
    expect(getWeatherLabel(code)).toEqual({ label, Icon })
  })

  it.each([51, 53, 55, 56, 57])('이슬비 범위 %i', (code) => {
    expect(getWeatherLabel(code)).toEqual({ label: '이슬비', Icon: LuCloudDrizzle })
  })

  it.each([61, 63, 65, 66, 67])('비 범위 %i', (code) => {
    expect(getWeatherLabel(code)).toEqual({ label: '비', Icon: LuCloudRain })
  })

  it.each([71, 73, 75, 77])('눈 범위 %i', (code) => {
    expect(getWeatherLabel(code)).toEqual({ label: '눈', Icon: LuCloudSnow })
  })

  it.each([80, 81, 82])('소나기 범위 %i', (code) => {
    expect(getWeatherLabel(code)).toEqual({ label: '소나기', Icon: LuCloudRainWind })
  })

  it.each([85, 86])('눈 소나기 %i', (code) => {
    expect(getWeatherLabel(code)).toEqual({ label: '눈 소나기', Icon: LuSnowflake })
  })

  it.each([95, 96, 99])('뇌우 %i', (code) => {
    expect(getWeatherLabel(code)).toEqual({ label: '뇌우', Icon: LuCloudLightning })
  })

  it.each([4, 44, 50, 58, 60, 68, 70, 78, 79, 83, 84, 87, -1])('정의되지 않은 코드 %i 는 알 수 없음', (code) => {
    expect(getWeatherLabel(code)).toEqual({ label: '알 수 없음', Icon: LuThermometer })
  })
})
