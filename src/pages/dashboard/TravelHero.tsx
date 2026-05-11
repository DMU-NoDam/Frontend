import { motion } from 'framer-motion'
import { LuPlane, LuMapPin } from 'react-icons/lu'
import './TravelHero.css'

type Chip = {
  label: string
  top: string
  left: string
  entranceDelay: number
  floatDelay: number
}

// 여행지 칩 — 화면에 흩어져 float
const CHIPS: Chip[] = [
  { label: '🗼 도쿄',  top: '15%', left: '15%',  entranceDelay: 0.7, floatDelay: 0 },
  { label: '🌴 발리',  top: '12%', left: '61%', entranceDelay: 0.9, floatDelay: 1.0 },
  { label: '🏔️ 제주', top: '70%', left: '20%',  entranceDelay: 1.1, floatDelay: 1.8 },
]

type StarDot = {
  top: string
  left: string
  delay: number
  size: number
}

// 하늘의 별 — 흰 원형 점이 반짝임
const STAR_DOTS: StarDot[] = [
  { top: '6%',  left: '44%', delay: 0.0, size: 4 },
  { top: '22%', left: '27%', delay: 0.5, size: 3 },
  { top: '9%',  left: '82%', delay: 0.8, size: 4 },
  { top: '56%', left: '40%', delay: 1.2, size: 3 },
  { top: '46%', left: '90%', delay: 0.3, size: 4 },
  { top: '74%', left: '19%', delay: 0.6, size: 3 },
]

export function TravelHero() {
  return (
    <div className="travel-hero" aria-hidden="true">

      {/* 여행 루트 — SVG 곡선이 왼쪽에서 오른쪽으로 그려짐 */}
      <svg className="travel-hero__svg" viewBox="0 0 375 200" preserveAspectRatio="none">
        <motion.path
          d="M 38,118 Q 190,38 337,98"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.5"
          strokeDasharray="7 5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.3 }}
        />
      </svg>

      {/* 출발지 핀 */}
      <motion.div
        className="travel-hero__pin"
        style={{ top: '57%', left: '8.5%' }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 1.8 }}
      >
        <motion.div
          className="travel-hero__pin-ring"
          animate={{ scale: [1, 2.4], opacity: [0.55, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 2.3 }}
        />
        <LuMapPin size={14} color="rgba(255,255,255,0.95)" />
      </motion.div>

      {/* 도착지 핀 */}
      <motion.div
        className="travel-hero__pin"
        style={{ top: '47%', left: '88.5%' }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 2.1 }}
      >
        <motion.div
          className="travel-hero__pin-ring"
          animate={{ scale: [1, 2.4], opacity: [0.55, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 2.7 }}
        />
        <LuMapPin size={14} color="rgba(255,255,255,0.95)" />
      </motion.div>

      {/* 여행지 칩 — glassmorphism + floating */}
      {CHIPS.map(({ label, top, left, entranceDelay, floatDelay }, i) => (
        <motion.div
          key={i}
          className="travel-hero__chip"
          style={{ top, left }}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1, y: [0, -7, 0] }}
          transition={{
            opacity: { duration: 0.35, delay: entranceDelay },
            scale:   { type: 'spring', stiffness: 300, damping: 22, delay: entranceDelay },
            y: { duration: 3.5, delay: floatDelay, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          {label}
        </motion.div>
      ))}

      {/* 별 — 흰 점이 stagger로 반짝임 */}
      {STAR_DOTS.map(({ top, left, delay, size }, i) => (
        <motion.div
          key={i}
          className="travel-hero__star"
          style={{ top, left, width: size, height: size }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.4, 0.7] }}
          transition={{
            duration: 2.5 + delay * 0.4,
            delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* 비행기 — 루트를 따라 왼쪽에서 오른쪽으로 비행 후 반복 */}
      <motion.div
        className="travel-hero__plane"
        style={{ top: '55%', left: '-28px' }}
        animate={{
          x:       [0,   90,  200, 335, 430],
          y:       [0,  -40,  -30, -14,   0],
          opacity: [0,    1,    1,   1,   0],
        }}
        transition={{
          duration:    4.2,
          delay:       1.5,
          repeat:      Infinity,
          repeatDelay: 3.8,
          ease:        'easeInOut',
        }}
      >
        <LuPlane size={20} color="rgba(255,255,255,0.95)" style={{ transform: 'rotate(-8deg)' }} />
      </motion.div>

    </div>
  )
}
