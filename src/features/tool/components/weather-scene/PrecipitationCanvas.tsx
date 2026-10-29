import { useEffect, useRef } from 'react'

export type PrecipitationMode = 'rain' | 'storm' | 'snow'

type Props = {
  mode: PrecipitationMode
  // true면 한 장면만 그리고 움직이지 않는다 (OS의 동작 줄이기 설정)
  still: boolean
  // 장면 하늘의 [위, 아래] 색. 유리 물방울은 렌즈처럼 하늘을 거꾸로 비추므로 이 색을 뒤집어 칠한다
  sky: [string, string]
}

type Streak = { x: number; y: number; len: number; speed: number }
type Flake = { x: number; y: number; r: number; speed: number; phase: number; sway: number; alpha: number }

// 미리 그려 둔 물방울 그림. 매 프레임 그라데이션을 새로 만들지 않고 이 그림을 찍는다
type Sprite = { canvas: HTMLCanvasElement; size: number }

// 흘러내린 물방울이 남기는 자국. 점마다 나이를 먹으며 가늘어지고 사라진다
type TrailPoint = { x: number; y: number; w: number; age: number }
type Trail = { points: TrailPoint[]; done: boolean }

// 유리에 맺힌 물방울
type Drop = {
  x: number
  y: number
  r: number
  shape: number[] // 외곽선 8점의 반지름 배율 → 조금씩 일그러진 모양
  sliding: boolean
  vy: number
  stick: number // 남은 "멈칫" 시간(초)
  wobble: number
  wobbleSpeed: number
  sinceTrail: number
  sinceBead: number
  nextBead: number
  trail: Trail | null
  age: number
  life: number // 맺혀 있는 물방울이 마르는 시간 (흐르는 동안은 무시)
  dead: boolean
  sprite: Sprite | null
  spriteKey: string
}

// 아주 작은 물방울 (김서림, 흘러간 자리에 남은 잔방울)
type Bead = { x: number; y: number; r: number; age: number }

const GLASS = {
  rain: { density: 0.0007, wind: 0.12, speed: [520, 760], lineWidth: 1, streakAlpha: 0.18, maxDrops: 26, spawnEvery: 0.28, beadDensity: 0.0018 },
  storm: { density: 0.0015, wind: 0.28, speed: [760, 1050], lineWidth: 1.3, streakAlpha: 0.24, maxDrops: 36, spawnEvery: 0.15, beadDensity: 0.0024 },
} as const
const SNOW_DENSITY = 0.001

const SLIDE_R = 5.2 // 이 크기 이상이면 무게 때문에 흘러내린다
const MAX_R = 13
const GRAVITY = 160 // px/s²
const MAX_SPEED = 120 // px/s
const TRAIL_LIFE = 2.2 // 물자국이 사라지기까지(초)
const BEAD_SIZES = [0.6, 0.9, 1.2, 1.5, 1.8, 2.2]
const ROUND = Array(8).fill(1) as number[]

const rand = (min: number, max: number) => min + Math.random() * (max - min)

type Rgb = [number, number, number]

function hexToRgb(hex: string): Rgb {
  const v = parseInt(hex.replace('#', ''), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

function lighten([r, g, b]: Rgb, amount: number): Rgb {
  return [r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount]
}

const rgba = ([r, g, b]: Rgb, a: number) => `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`

// 물방울 외곽선. 흘러내리는 물방울(elongate)은 아래가 둥글고 위가 좁은 눈물 모양이 된다
function traceDrop(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, shape: number[], elongate: boolean) {
  const n = shape.length
  const pts: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    const down = Math.sin(a)
    let rx = r * shape[i] * 0.94
    let ry = r * shape[i]
    if (elongate) {
      if (down > 0) ry *= 1.15
      else {
        ry *= 0.95
        rx *= 0.8 + 0.2 * (1 + down)
      }
    }
    pts.push([cx + Math.cos(a) * rx, cy + down * ry])
  }

  // 점들을 이은 다각형이 아니라, 중점을 지나는 곡선으로 매끄럽게 잇는다
  const mid = (p: [number, number], q: [number, number]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
  c.beginPath()
  const start = mid(pts[n - 1], pts[0])
  c.moveTo(start[0], start[1])
  for (let i = 0; i < n; i++) {
    const p = pts[i]
    const m = mid(p, pts[(i + 1) % n])
    c.quadraticCurveTo(p[0], p[1], m[0], m[1])
  }
  c.closePath()
}

function renderDrop(r: number, shape: number[], elongate: boolean, dpr: number, skyTop: Rgb, skyBottom: Rgb): Sprite {
  const size = Math.ceil(r * 3 + 6)
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(size * dpr)
  canvas.height = Math.ceil(size * dpr)
  const c = canvas.getContext('2d')!
  c.scale(dpr, dpr)
  const cx = size / 2
  const cy = size / 2

  // 1) 유리에 비친 아래쪽 그림자
  c.save()
  traceDrop(c, cx, cy + r * 0.14, r, shape, elongate)
  c.shadowColor = 'rgba(0, 0, 0, 0.25)'
  c.shadowBlur = r * 0.6
  c.fillStyle = 'rgba(0, 0, 0, 0.2)'
  c.fill()
  c.restore()

  c.save()
  traceDrop(c, cx, cy, r, shape, elongate)
  c.clip()

  // 2) 몸통: 렌즈처럼 하늘을 거꾸로 비춘다 (위 = 하늘 아래쪽의 밝은 색, 아래 = 하늘 위쪽의 어두운 색)
  const body = c.createLinearGradient(0, cy - r, 0, cy + r)
  body.addColorStop(0, rgba(lighten(skyBottom, 0.25), 0.92))
  body.addColorStop(1, rgba(skyTop, 0.92))
  c.fillStyle = body
  c.fillRect(0, 0, size, size)

  // 3) 가장자리의 어두운 테두리 (빛이 꺾여 들어오지 못하는 부분)
  const rim = c.createRadialGradient(cx, cy, r * 0.55, cx, cy, r * 1.15)
  rim.addColorStop(0, 'rgba(0, 0, 0, 0)')
  rim.addColorStop(1, 'rgba(0, 0, 0, 0.45)')
  c.fillStyle = rim
  c.fillRect(0, 0, size, size)

  // 4) 아래쪽 안으로 모이는 밝은 빛
  const glow = c.createRadialGradient(cx, cy + r * 0.6, 0, cx, cy + r * 0.6, r * 0.75)
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.5)')
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
  c.fillStyle = glow
  c.fillRect(0, 0, size, size)
  c.restore()

  // 5) 왼쪽 위 반짝임
  c.fillStyle = 'rgba(255, 255, 255, 0.9)'
  c.beginPath()
  c.ellipse(cx - r * 0.32, cy - r * 0.42, Math.max(0.5, r * 0.2), Math.max(0.4, r * 0.13), -0.6, 0, Math.PI * 2)
  c.fill()

  return { canvas, size }
}

export function PrecipitationCanvas({ mode, still, sky }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [skyTopHex, skyBottomHex] = sky

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // 고해상도 화면에서도 2배까지만 그린다 (그 이상은 차이에 비해 비용이 크다)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const glass = mode === 'snow' ? null : GLASS[mode]
    const skyTop = hexToRgb(skyTopHex)
    const skyBottom = hexToRgb(skyBottomHex)
    const beadSprites = BEAD_SIZES.map((r) => renderDrop(r, ROUND, false, dpr, skyTop, skyBottom))

    let width = 0
    let height = 0
    let streaks: Streak[] = []
    let flakes: Flake[] = []
    let drops: Drop[] = []
    let beads: Bead[] = []
    let trails: Trail[] = []
    let spawnTimer = 0
    let beadTimer = 0
    let time = 0
    let raf = 0
    let last = performance.now()

    const newStreak = (anywhere: boolean): Streak => ({
      x: rand(-width * 0.3, width),
      y: anywhere ? rand(-height, height) : rand(-height * 0.3, 0),
      len: rand(12, 24),
      speed: rand(glass!.speed[0], glass!.speed[1]),
    })

    const newFlake = (anywhere: boolean): Flake => ({
      x: rand(0, width),
      y: anywhere ? rand(-height, height) : rand(-20, 0),
      r: rand(1, 3.2),
      speed: rand(20, 55),
      phase: rand(0, Math.PI * 2),
      sway: rand(8, 22),
      alpha: rand(0.55, 0.95),
    })

    const newDrop = (x: number, y: number, r: number, age = 0): Drop => ({
      x,
      y,
      r,
      shape: Array.from({ length: 8 }, () => rand(0.9, 1.08)),
      sliding: false,
      vy: 0,
      stick: 0,
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(1.5, 3.5),
      sinceTrail: 0,
      sinceBead: 0,
      nextBead: rand(9, 22),
      trail: null,
      age,
      life: rand(6, 14),
      dead: false,
      sprite: null,
      spriteKey: '',
    })

    const newBead = (age = 0): Bead => ({
      x: rand(0, width),
      y: rand(0, height),
      r: BEAD_SIZES[Math.floor(Math.random() * BEAD_SIZES.length)],
      age,
    })

    // 무게가 차면 흐르기 시작한다. 처음엔 잠깐 멈칫했다가 출발한다
    const startSliding = (d: Drop) => {
      d.sliding = true
      d.stick = rand(0.1, 0.5)
      d.trail = { points: [], done: false }
      trails.push(d.trail)
    }

    const stopSliding = (d: Drop) => {
      d.sliding = false
      d.vy = 0
      d.life = d.age + rand(4, 8)
      if (d.trail) d.trail.done = true
      d.trail = null
    }

    const seed = () => {
      const area = width * height
      if (glass) {
        streaks = Array.from({ length: Math.round(area * glass.density) }, () => newStreak(true))
        beads = Array.from({ length: Math.round(area * glass.beadDensity) }, () => newBead(rand(1, 5)))
        // 처음부터 화면이 젖어 있도록 맺힌 물방울을 미리 깔아 둔다
        drops = Array.from({ length: Math.round(glass.maxDrops * 0.6) }, () =>
          newDrop(rand(0, width), rand(0, height), rand(2, 5), rand(0.5, 4)),
        )
        trails = []
      } else {
        flakes = Array.from({ length: Math.round(area * SNOW_DENSITY) }, () => newFlake(true))
      }
    }

    const leaveBead = (d: Drop) => {
      const r = d.r * rand(0.18, 0.32)
      beads.push({ x: d.x + rand(-d.r * 0.3, d.r * 0.3), y: d.y - d.r * 0.7, r, age: 0 })
      // 남긴 만큼 조금 가벼워진다
      d.r = Math.sqrt(Math.max(1, d.r * d.r - r * r * 0.6))
    }

    // 흘러가는 길에 있는 물방울·잔방울을 삼킨다 → 커지고, 지나간 자리는 닦인 듯 비워진다
    const absorb = (d: Drop) => {
      for (const o of drops) {
        if (o === d || o.dead) continue
        if (Math.hypot(o.x - d.x, o.y - d.y) < (d.r + o.r) * 0.75) {
          d.r = Math.min(MAX_R, Math.hypot(d.r, o.r))
          o.dead = true
          if (o.trail) o.trail.done = true
        }
      }
      beads = beads.filter((b) => Math.hypot(b.x - d.x, b.y - d.y) >= d.r + b.r)
    }

    const stepGlass = (dt: number) => {
      const g = glass!

      for (const s of streaks) {
        s.y += s.speed * dt
        s.x += s.speed * g.wind * dt
        if (s.y - s.len > height) Object.assign(s, newStreak(false))
      }

      // 새 빗방울이 유리에 떨어진다. 이미 맺힌 물방울 위에 떨어지면 합쳐진다
      spawnTimer += dt
      if (spawnTimer > g.spawnEvery) {
        spawnTimer = 0
        const big = Math.random() < 0.12
        const nd = newDrop(rand(0, width), rand(0, height * 0.9), big ? rand(5.4, 8) : rand(2, 5))
        const hit = drops.find((o) => !o.dead && Math.hypot(o.x - nd.x, o.y - nd.y) < (o.r + nd.r) * 0.9)
        if (hit) hit.r = Math.min(MAX_R, Math.hypot(hit.r, nd.r))
        else if (drops.length < g.maxDrops) drops.push(nd)
      }

      // 김서림이 천천히 다시 생긴다
      beadTimer += dt
      if (beadTimer > 0.04 && beads.length < width * height * g.beadDensity) {
        beadTimer = 0
        beads.push(newBead())
      }
      for (const b of beads) b.age += dt

      for (const d of drops) {
        if (d.dead) continue
        d.age += dt
        if (!d.sliding && d.r >= SLIDE_R) startSliding(d)

        if (!d.sliding) {
          if (d.age > d.life + 1) d.dead = true
          continue
        }

        // 멈칫했다가 스르륵: 멈춘 동안은 빠르게 느려지고, 아니면 중력으로 빨라진다
        if (d.stick > 0) {
          d.stick -= dt
          d.vy *= Math.max(0, 1 - dt * 6)
        } else {
          d.vy = Math.min(MAX_SPEED * Math.min(1, d.r / 8), d.vy + GRAVITY * dt)
          if (Math.random() < dt * 0.9) d.stick = rand(0.12, 0.6)
        }

        d.wobble += dt * d.wobbleSpeed
        const dx = Math.sin(d.wobble) * 7 * dt
        const dy = d.vy * dt
        d.x += dx
        d.y += dy
        const moved = Math.hypot(dx, dy)

        d.sinceTrail += moved
        if (d.sinceTrail > 2.5 && d.trail) {
          d.sinceTrail = 0
          d.trail.points.push({ x: d.x, y: d.y - d.r * 0.4, w: d.r * 0.8, age: 0 })
          if (d.trail.points.length > 70) d.trail.points.shift()
        }

        d.sinceBead += moved
        if (d.sinceBead > d.nextBead) {
          d.sinceBead = 0
          d.nextBead = rand(9, 22)
          leaveBead(d)
        }

        absorb(d)
        if (d.r < SLIDE_R * 0.75) stopSliding(d)
        if (d.y - d.r > height + 10) {
          d.dead = true
          if (d.trail) d.trail.done = true
        }
      }
      drops = drops.filter((d) => !d.dead)

      for (const t of trails) {
        for (const p of t.points) p.age += dt
        t.points = t.points.filter((p) => p.age < TRAIL_LIFE)
      }
      trails = trails.filter((t) => !t.done || t.points.length > 0)
    }

    const stepSnow = (dt: number) => {
      for (const f of flakes) {
        f.y += f.speed * dt
        f.x += Math.sin(time * 0.9 + f.phase) * f.sway * dt
        if (f.y - f.r > height) Object.assign(f, newFlake(false))
        if (f.x < -5) f.x = width + 5
        if (f.x > width + 5) f.x = -5
      }
    }

    const drawSprite = (sprite: Sprite, x: number, y: number, alpha: number) => {
      ctx.globalAlpha = alpha
      ctx.drawImage(sprite.canvas, x - sprite.size / 2, y - sprite.size / 2, sprite.size, sprite.size)
    }

    // 물자국: 지나온 점들을 따라 하나로 이어진 띠(리본)를 칠한다.
    // 짧은 선을 겹쳐 그리면 이음매가 진해져 사슬처럼 보이므로, 양옆 가장자리를 이어 한 번에 채운다.
    // 오래된 점일수록 좁아지고, 색도 꼬리 쪽으로 갈수록 투명해진다
    const drawTrail = (t: Trail) => {
      const pts = t.points
      if (pts.length < 2) return
      const left: [number, number][] = []
      const right: [number, number][] = []
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]
        const prev = pts[Math.max(i - 1, 0)]
        const next = pts[Math.min(i + 1, pts.length - 1)]
        let nx = -(next.y - prev.y)
        let ny = next.x - prev.x
        const len = Math.hypot(nx, ny) || 1
        nx /= len
        ny /= len
        const fade = Math.max(0, 1 - p.age / TRAIL_LIFE)
        const half = Math.max(0.3, p.w * 0.5 * (0.3 + 0.7 * fade))
        left.push([p.x + nx * half, p.y + ny * half])
        right.push([p.x - nx * half, p.y - ny * half])
      }

      ctx.beginPath()
      ctx.moveTo(left[0][0], left[0][1])
      for (const [x, y] of left) ctx.lineTo(x, y)
      for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1])
      ctx.closePath()

      const tail = pts[0]
      const head = pts[pts.length - 1]
      const color = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y)
      color.addColorStop(0, 'rgba(255, 255, 255, 0)')
      color.addColorStop(1, 'rgba(255, 255, 255, 0.12)')
      ctx.fillStyle = color
      ctx.fill()
    }

    const drawGlass = () => {
      const g = glass!

      // 유리 너머로 내리는 비
      ctx.strokeStyle = `rgba(220, 230, 240, ${g.streakAlpha})`
      ctx.lineWidth = g.lineWidth
      ctx.lineCap = 'round'
      ctx.beginPath()
      for (const s of streaks) {
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(s.x - s.len * g.wind, s.y - s.len)
      }
      ctx.stroke()

      trails.forEach(drawTrail)

      for (const b of beads) {
        const sprite = beadSprites[BEAD_SIZES.indexOf(b.r)] ?? beadSprites[0]
        drawSprite(sprite, b.x, b.y, Math.min(1, b.age / 0.6) * 0.85)
      }

      for (const d of drops) {
        const key = `${Math.round(d.r * 4)}|${d.sliding ? 1 : 0}`
        if (!d.sprite || d.spriteKey !== key) {
          d.sprite = renderDrop(d.r, d.shape, d.sliding, dpr, skyTop, skyBottom)
          d.spriteKey = key
        }
        // 생길 때 빠르게 나타나고, 맺힌 물방울은 마를 때 서서히 사라진다
        const appear = Math.min(1, d.age / 0.25)
        const dry = d.sliding ? 1 : 1 - Math.max(0, d.age - d.life)
        drawSprite(d.sprite, d.x, d.y, Math.max(0, appear * dry))
      }
      ctx.globalAlpha = 1
    }

    const drawSnow = () => {
      ctx.fillStyle = '#ffffff'
      for (const f of flakes) {
        ctx.globalAlpha = f.alpha
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      if (glass) drawGlass()
      else drawSnow()
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
      time += dt
      if (glass) stepGlass(dt)
      else stepSnow(dt)
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
  }, [mode, still, skyTopHex, skyBottomHex])

  return <canvas ref={canvasRef} className="weather-scene__canvas" />
}
