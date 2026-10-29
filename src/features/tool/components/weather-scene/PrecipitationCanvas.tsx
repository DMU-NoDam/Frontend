import { useEffect, useRef } from 'react'

export type PrecipitationMode = 'rain' | 'storm' | 'snow'

type Props = {
  mode: PrecipitationMode
  // true면 한 장면만 그리고 움직이지 않는다 (OS의 동작 줄이기 설정)
  still: boolean
}

type Streak = { x: number; y: number; len: number; speed: number }
type Flake = { x: number; y: number; r: number; speed: number; phase: number; sway: number; alpha: number }
// 화면(유리)에 맺힌 물방울. 큰 물방울 일부는 천천히 흘러내리며 자국(trail)을 남긴다
type Drop = { x: number; y: number; r: number; age: number; life: number; vy: number; trail: number }

const RAIN = {
  rain: { density: 0.0009, wind: 0.12, speed: [520, 760], lineWidth: 1, maxDrops: 24, dropEvery: 0.25, maxDropR: 6.5 },
  storm: { density: 0.0018, wind: 0.28, speed: [760, 1050], lineWidth: 1.3, maxDrops: 34, dropEvery: 0.12, maxDropR: 7.5 },
} as const
const SNOW_DENSITY = 0.001

const rand = (min: number, max: number) => min + Math.random() * (max - min)

export function PrecipitationCanvas({ mode, still }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // 고해상도 화면에서도 2배까지만 그린다 (그 이상은 차이에 비해 비용이 크다)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0
    let streaks: Streak[] = []
    let flakes: Flake[] = []
    let drops: Drop[] = []
    let dropTimer = 0
    let time = 0
    let raf = 0
    let last = performance.now()

    const rain = mode === 'snow' ? null : RAIN[mode]

    const newStreak = (anywhere: boolean): Streak => {
      const len = rand(12, 24)
      return {
        x: rand(-width * 0.3, width),
        y: anywhere ? rand(-height, height) : rand(-height * 0.3, 0),
        len,
        speed: rand(rain!.speed[0], rain!.speed[1]),
      }
    }

    const newDrop = (age = 0): Drop => {
      const r = rand(2, rain!.maxDropR)
      const sliding = r > 4.5 && Math.random() < 0.6
      return {
        x: rand(0, width),
        y: rand(0, height),
        r,
        age,
        life: rand(3.5, 7),
        vy: sliding ? rand(18, 55) : 0,
        trail: 0,
      }
    }

    const newFlake = (anywhere: boolean): Flake => ({
      x: rand(0, width),
      y: anywhere ? rand(-height, height) : rand(-20, 0),
      r: rand(1, 3.2),
      speed: rand(20, 55),
      phase: rand(0, Math.PI * 2),
      sway: rand(8, 22),
      alpha: rand(0.55, 0.95),
    })

    const seed = () => {
      const area = width * height
      if (rain) {
        streaks = Array.from({ length: Math.round(area * rain.density) }, () => newStreak(true))
        // 처음부터 화면이 젖어 있도록 물방울을 미리 깔아 둔다
        drops = Array.from({ length: Math.round(rain.maxDrops * 0.6) }, () => newDrop(rand(0.5, 3)))
      } else {
        flakes = Array.from({ length: Math.round(area * SNOW_DENSITY) }, () => newFlake(true))
      }
    }

    const step = (dt: number) => {
      time += dt
      if (rain) {
        for (const s of streaks) {
          s.y += s.speed * dt
          s.x += s.speed * rain.wind * dt
          if (s.y - s.len > height) Object.assign(s, newStreak(false))
        }

        dropTimer += dt
        if (dropTimer > rain.dropEvery && drops.length < rain.maxDrops) {
          dropTimer = 0
          drops.push(newDrop())
        }
        for (const d of drops) {
          d.age += dt
          if (d.vy > 0) {
            d.y += d.vy * dt
            d.trail = Math.min(d.trail + d.vy * dt, 40)
          }
        }
        drops = drops.filter((d) => d.age < d.life && d.y - d.r < height)
      } else {
        for (const f of flakes) {
          f.y += f.speed * dt
          f.x += Math.sin(time * 0.9 + f.phase) * f.sway * dt
          if (f.y - f.r > height) Object.assign(f, newFlake(false))
          if (f.x < -5) f.x = width + 5
          if (f.x > width + 5) f.x = -5
        }
      }
    }

    const drawDrop = (d: Drop) => {
      // 생길 때 빠르게 나타나고, 마지막 1초 동안 서서히 사라진다
      const alpha = Math.min(1, d.age / 0.3) * (1 - Math.max(0, d.age - (d.life - 1)))
      if (alpha <= 0) return

      if (d.trail > 2) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.16 * alpha})`
        ctx.lineWidth = d.r * 0.55
        ctx.beginPath()
        ctx.moveTo(d.x, d.y - d.trail)
        ctx.lineTo(d.x, d.y)
        ctx.stroke()
      }

      // 유리에 맺힌 물방울은 렌즈처럼 하늘을 거꾸로 비춘다 → 위쪽은 어둡고 아래쪽은 밝다
      const rx = d.r * 0.85
      const body = ctx.createLinearGradient(d.x, d.y - d.r, d.x, d.y + d.r)
      body.addColorStop(0, `rgba(15, 25, 35, ${0.32 * alpha})`)
      body.addColorStop(0.55, `rgba(255, 255, 255, ${0.1 * alpha})`)
      body.addColorStop(1, `rgba(255, 255, 255, ${0.5 * alpha})`)
      ctx.fillStyle = body
      ctx.beginPath()
      ctx.ellipse(d.x, d.y, rx, d.r, 0, 0, Math.PI * 2)
      ctx.fill()

      // 가장자리 테두리
      ctx.strokeStyle = `rgba(10, 20, 30, ${0.22 * alpha})`
      ctx.lineWidth = 0.7
      ctx.stroke()

      // 왼쪽 위의 작은 반짝임
      ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * alpha})`
      ctx.beginPath()
      ctx.ellipse(d.x - rx * 0.35, d.y - d.r * 0.45, d.r * 0.22, d.r * 0.16, -0.5, 0, Math.PI * 2)
      ctx.fill()
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      if (rain) {
        ctx.strokeStyle = 'rgba(220, 230, 240, 0.35)'
        ctx.lineWidth = rain.lineWidth
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (const s of streaks) {
          ctx.moveTo(s.x, s.y)
          ctx.lineTo(s.x - s.len * rain.wind, s.y - s.len)
        }
        ctx.stroke()
        drops.forEach(drawDrop)
      } else {
        ctx.fillStyle = '#ffffff'
        for (const f of flakes) {
          ctx.globalAlpha = f.alpha
          ctx.beginPath()
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
      draw()
    }

    const frame = (now: number) => {
      // 탭을 오래 비웠다 돌아와도 한 번에 크게 튀지 않도록 한 프레임 최대 50ms
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      step(dt)
      draw()
      raf = requestAnimationFrame(frame)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()
    if (!still) raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [mode, still])

  return <canvas ref={canvasRef} className="weather-scene__canvas" />
}
