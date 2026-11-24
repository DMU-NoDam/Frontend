import { describe, expect, it } from 'vitest'
import { getWeatherLabel } from './weather-code'
import {
  WEATHER_SCENE_LABEL,
  WEATHER_SCENE_TOP_COLOR,
  WEATHER_SCENES,
  getWeatherScene,
  isWeatherScene,
} from './weather-scene'

describe('getWeatherScene', () => {
  it.each([
    [0, 'clear'],
    [1, 'partly'],
    [2, 'partly'],
    [3, 'cloudy'],
    [45, 'fog'],
    [48, 'fog'],
    [51, 'rain'],
    [67, 'rain'],
    [80, 'rain'],
    [82, 'rain'],
    [71, 'snow'],
    [77, 'snow'],
    [85, 'snow'],
    [86, 'snow'],
    [95, 'storm'],
    [99, 'storm'],
  ])('코드 %i → %s', (code, scene) => {
    expect(getWeatherScene(code)).toBe(scene)
  })

  it.each([4, 50, 68, 70, 83, 87, -1])('정의되지 않은 코드 %i 는 흐림 장면', (code) => {
    expect(getWeatherScene(code)).toBe('cloudy')
  })

  // 아이콘 · 상태 글자와 배경 장면이 서로 다른 날씨를 말하면 안 된다
  it.each([0, 1, 2, 3, 45, 51, 61, 71, 80, 85, 95])('코드 %i 의 장면 이름과 날씨 글자가 같은 계열', (code) => {
    const scene = getWeatherScene(code)
    const { label } = getWeatherLabel(code)
    const sceneLabel = WEATHER_SCENE_LABEL[scene]

    const sameFamily: Record<string, string[]> = {
      맑음: ['맑음'],
      '구름 조금': ['대체로 맑음', '구름 조금'],
      흐림: ['흐림'],
      안개: ['안개'],
      비: ['이슬비', '비', '소나기'],
      눈: ['눈', '눈 소나기'],
      뇌우: ['뇌우'],
    }
    expect(sameFamily[sceneLabel]).toContain(label)
  })
})

describe('isWeatherScene', () => {
  it.each(WEATHER_SCENES)('%s 는 장면', (scene) => {
    expect(isWeatherScene(scene)).toBe(true)
  })

  it.each(['sunny', 'CLEAR', '', ' rain'])('"%s" 는 장면이 아니다', (value) => {
    expect(isWeatherScene(value)).toBe(false)
  })

  it('null 은 장면이 아니다 (URL query 가 없을 때)', () => {
    expect(isWeatherScene(null)).toBe(false)
  })
})

describe('장면별 표시 값', () => {
  it('모든 장면에 이름과 상단 색이 있다', () => {
    for (const scene of WEATHER_SCENES) {
      expect(WEATHER_SCENE_LABEL[scene]).toBeTruthy()
      expect(WEATHER_SCENE_TOP_COLOR[scene]).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('장면 이름이 서로 겹치지 않는다', () => {
    const labels = WEATHER_SCENES.map((scene) => WEATHER_SCENE_LABEL[scene])
    expect(new Set(labels).size).toBe(labels.length)
  })
})
