import { useId } from 'react'
import type { CSSProperties } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { WeatherScene as Scene } from '../../lib/weather-scene'
import { PrecipitationCanvas } from './PrecipitationCanvas'
import './WeatherScene.css'

// 구름/안개 한 층. SVG 노이즈(feTurbulence)의 밝기를 투명도로 바꿔 불규칙한 구름 모양을 만든다.
// alpha = slope × 노이즈 + intercept → slope가 크고 intercept가 작을수록 구름이 듬성듬성해진다
type NoiseLayer = {
  kind: 'cloud' | 'fog'
  frequency: number
  seed: number
  color: [number, number, number] // 0~1 RGB
  slope: number
  intercept: number
  opacity: number
  duration: number // 좌우로 한 번 흘러가는 시간(초)
}

const LAYERS: Record<Scene, NoiseLayer[]> = {
  clear: [],
  partly: [
    { kind: 'cloud', frequency: 0.0055, seed: 3, color: [1, 1, 1], slope: 3.0, intercept: -1.45, opacity: 0.95, duration: 90 },
  ],
  cloudy: [
    { kind: 'cloud', frequency: 0.004, seed: 7, color: [0.86, 0.88, 0.91], slope: 2.0, intercept: -0.35, opacity: 1, duration: 140 },
    { kind: 'cloud', frequency: 0.007, seed: 11, color: [0.97, 0.98, 0.99], slope: 2.6, intercept: -0.95, opacity: 0.95, duration: 80 },
  ],
  rain: [
    { kind: 'cloud', frequency: 0.004, seed: 5, color: [0.42, 0.46, 0.51], slope: 2.2, intercept: -0.25, opacity: 1, duration: 150 },
    { kind: 'cloud', frequency: 0.007, seed: 9, color: [0.58, 0.62, 0.67], slope: 2.4, intercept: -0.8, opacity: 0.9, duration: 90 },
  ],
  storm: [
    { kind: 'cloud', frequency: 0.0035, seed: 13, color: [0.15, 0.17, 0.2], slope: 2.4, intercept: -0.2, opacity: 1, duration: 110 },
    { kind: 'cloud', frequency: 0.0065, seed: 17, color: [0.28, 0.31, 0.35], slope: 2.6, intercept: -0.7, opacity: 0.95, duration: 70 },
  ],
  snow: [
    { kind: 'cloud', frequency: 0.004, seed: 21, color: [0.85, 0.88, 0.92], slope: 1.8, intercept: -0.45, opacity: 0.85, duration: 160 },
  ],
  fog: [
    { kind: 'fog', frequency: 0.003, seed: 4, color: [0.95, 0.96, 0.97], slope: 1.6, intercept: -0.2, opacity: 0.75, duration: 60 },
    { kind: 'fog', frequency: 0.005, seed: 8, color: [1, 1, 1], slope: 1.9, intercept: -0.55, opacity: 0.7, duration: 95 },
  ],
}

function NoiseLayerSvg({ layer, index }: { layer: NoiseLayer; index: number }) {
  // useId 결과의 특수문자(:, «» 등)가 url(#...) 참조를 깨지 않도록 영숫자만 남긴다
  const filterId = `noise-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [r, g, b] = layer.color
  const style = {
    '--layer-opacity': layer.opacity,
    '--layer-duration': `${layer.duration}s`,
    // 층마다 출발 위치를 어긋나게 해서 같은 방향으로 겹쳐 움직이지 않게 한다
    '--layer-delay': `${-index * 17}s`,
  } as CSSProperties

  return (
    <svg
      className={`weather-scene__layer weather-scene__layer--${layer.kind}`}
      style={style}
      viewBox="0 0 1000 500"
      preserveAspectRatio="none"
    >
      <filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency={layer.frequency} numOctaves={5} seed={layer.seed} />
        <feColorMatrix
          type="matrix"
          values={`0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  ${layer.slope} 0 0 0 ${layer.intercept}`}
        />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${filterId})`} />
    </svg>
  )
}

type Props = {
  scene: Scene
}

export function WeatherScene({ scene }: Props) {
  // OS의 "동작 줄이기"를 켠 사용자에게는 정지 화면만 보여준다
  const still = useReducedMotion() ?? false
  const hasSun = scene === 'clear' || scene === 'partly'
  const precipitation = scene === 'rain' || scene === 'storm' || scene === 'snow' ? scene : null

  return (
    <div
      className={`weather-scene weather-scene--${scene}${still ? ' weather-scene--still' : ''}`}
      aria-hidden="true"
    >
      <div className="weather-scene__sky" />

      {hasSun && (
        <div className="weather-scene__sun">
          <div className="weather-scene__sun-glow" />
          <div className="weather-scene__sun-rays" />
          <div className="weather-scene__sun-core" />
        </div>
      )}

      {LAYERS[scene].map((layer, index) => (
        <NoiseLayerSvg key={`${scene}-${index}`} layer={layer} index={index} />
      ))}

      {precipitation && <PrecipitationCanvas mode={precipitation} still={still} />}

      {scene === 'storm' && <div className="weather-scene__lightning" />}

      {/* 위쪽을 살짝 어둡게 해서 밝은 하늘에서도 흰 글씨가 읽히게 한다 */}
      <div className="weather-scene__scrim" />
    </div>
  )
}
