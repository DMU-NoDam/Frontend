import { useState } from 'react'
import clsx from 'clsx'
import { WEATHER_SCENE_LABEL, WEATHER_SCENES } from '../../lib/weather-scene'
import type { WeatherScene } from '../../lib/weather-scene'
import './WeatherScenePicker.css'

type Props = {
  // 지금 미리보기 중인 장면 (null = 실제 날씨)
  value: WeatherScene | null
  onChange: (scene: WeatherScene | null) => void
}

// 개발용: 실제 날씨와 관계없이 배경 장면을 골라 본다. 개발 서버에서만 렌더링한다(TripToolPage)
export function WeatherScenePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const select = (scene: WeatherScene | null) => {
    onChange(scene)
    setOpen(false)
  }

  return (
    <div className="scene-picker">
      <button
        type="button"
        className="scene-picker__toggle"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        DEV 장면{value ? ` · ${WEATHER_SCENE_LABEL[value]}` : ''}
      </button>

      {open && (
        <div className="scene-picker__menu" role="menu" aria-label="날씨 장면 미리보기">
          <button
            type="button"
            role="menuitemradio"
            aria-checked={value === null}
            className={clsx('scene-picker__item', value === null && 'scene-picker__item--active')}
            onClick={() => select(null)}
          >
            실제 날씨
          </button>
          {WEATHER_SCENES.map((scene) => (
            <button
              key={scene}
              type="button"
              role="menuitemradio"
              aria-checked={value === scene}
              className={clsx('scene-picker__item', value === scene && 'scene-picker__item--active')}
              onClick={() => select(scene)}
            >
              {WEATHER_SCENE_LABEL[scene]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
