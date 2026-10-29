import type { CSSProperties } from 'react'

// 해에서 퍼지는 빛줄기(썬샤프트). angle 0 = 바로 아래, 양수 = 왼쪽 아래로 기운다.
// 줄기마다 넓이·길이·밝기·일렁이는 주기를 다르게 해서 같은 박자로 움직이지 않게 한다
const SHAFTS = [
  { angle: -28, width: 46, length: 360, opacity: 0.22, duration: 11, delay: -3 },
  { angle: -6, width: 70, length: 460, opacity: 0.3, duration: 9, delay: -7 },
  { angle: 14, width: 54, length: 520, opacity: 0.38, duration: 13, delay: -1 },
  { angle: 31, width: 90, length: 560, opacity: 0.32, duration: 10, delay: -5 },
  { angle: 47, width: 60, length: 520, opacity: 0.4, duration: 12, delay: -9 },
  { angle: 63, width: 80, length: 480, opacity: 0.28, duration: 8, delay: -2 },
  { angle: 82, width: 50, length: 420, opacity: 0.22, duration: 14, delay: -6 },
]

// 렌즈 빛망울: 해 → 아래(살짝 왼쪽) 방향으로 떨어져 놓인다 (distance는 해로부터의 거리 px).
// 왼쪽 위 글씨 영역을 지나가지 않도록 거의 아래쪽으로 떨어뜨린다
const FLARES = [
  { distance: 120, size: 34, color: '255, 236, 200', opacity: 0.15 },
  { distance: 185, size: 14, color: '200, 235, 255', opacity: 0.22 },
  { distance: 270, size: 58, color: '210, 225, 255', opacity: 0.08 },
]

export function Sun() {
  return (
    <div className="weather-scene__sun">
      <div className="weather-scene__sun-haze" />
      <div className="weather-scene__sun-shafts">
        {SHAFTS.map((shaft) => (
          <span
            key={shaft.angle}
            className="weather-scene__sun-shaft"
            style={
              {
                '--shaft-angle': `${shaft.angle}deg`,
                '--shaft-width': `${shaft.width}px`,
                '--shaft-length': `${shaft.length}px`,
                '--shaft-opacity': shaft.opacity,
                '--shaft-duration': `${shaft.duration}s`,
                '--shaft-delay': `${shaft.delay}s`,
              } as CSSProperties
            }
          >
            {/* 쐐기 모양은 안쪽에서 자르고, 흐림은 바깥에 줘야 가장자리가 부드럽다 */}
            <span className="weather-scene__sun-shaft-beam" />
          </span>
        ))}
      </div>
      <div className="weather-scene__sun-glow" />
      <div className="weather-scene__sun-core" />
      {FLARES.map((flare) => (
        <span
          key={flare.distance}
          className="weather-scene__sun-flare"
          style={
            {
              '--flare-x': `${-flare.distance * 0.45}px`,
              '--flare-y': `${flare.distance * 0.89}px`,
              '--flare-size': `${flare.size}px`,
              '--flare-color': flare.color,
              '--flare-opacity': flare.opacity,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
