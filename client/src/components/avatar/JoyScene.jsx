import { useEffect, useRef, useState } from 'react'
import './joy-scene.css'

/* ── JoyRobot ─────────────────────────────────────────────
   joy.png + дээр нь хөдөлдөг, анивчдаг гэрэлтсэн нүд.
   Жинхэнэ нүд нь зурган дотор тул дэлгэцийг (joy-screen) дарж
   нуугаад, түүн дээр өөрсдийн нүдийг зурж хөдөлгөнө.            */
export function JoyRobot({ mood = 'ready', className = '' }) {
  const [gaze, setGaze] = useState({ x: 0, y: 0 })
  const [blink, setBlink] = useState(false)
  const moodRef = useRef(mood)
  useEffect(() => { moodRef.current = mood }, [mood])

  // Нүд тойрон харах — мэдрэмжээс хамаарч өөр өөр
  useEffect(() => {
    let t
    const wander = () => {
      const m = moodRef.current
      if (m === 'thinking') {
        setGaze({ x: Math.random() * 0.5 - 0.25, y: -0.85 }) // дээш бодолхийлнэ
      } else if (m === 'listening') {
        setGaze({ x: Math.random() * 1.4 - 0.7, y: Math.random() * 0.4 - 0.05 })
      } else {
        setGaze({ x: Math.random() * 1.6 - 0.8, y: Math.random() * 1.0 - 0.5 })
      }
      t = setTimeout(wander, 1000 + Math.random() * 1900)
    }
    t = setTimeout(wander, 500)
    return () => clearTimeout(t)
  }, [])

  // Анивчих
  useEffect(() => {
    let t
    const loop = () => {
      setBlink(true)
      setTimeout(() => setBlink(false), 130)
      t = setTimeout(loop, 2400 + Math.random() * 3200)
    }
    t = setTimeout(loop, 1600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={`joy-robot joy-robot--${mood}${blink ? ' is-blink' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--gx': gaze.x, '--gy': gaze.y }}
      role="img"
      aria-label="Жой робот багш"
    >
      <div className="joy-robot-glow" aria-hidden="true" />
      <div className="joy-robot-figure">
        <img className="joy-robot-img" src="/joy.png" alt="" draggable="false" />
        <div className="joy-screen" aria-hidden="true">
          <span className="joy-eye joy-eye--l"><i /></span>
          <span className="joy-eye joy-eye--r"><i /></span>
        </div>
      </div>
    </div>
  )
}

/* ── JoyBackground ────────────────────────────────────────
   Зургийн адил гэрэлтэй ирээдүйн өрөө: перспектив тор, хөвөгч
   шоонууд, мөн дотроо тоо/тэмдэг солигдох "тоон блокууд".       */
const SYMBOLS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '+', '−', '=']
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]

const NUM_BLOCKS = [
  { id: 0, top: '16%', left: '11%', size: 58, delay: '0s', dur: '7s' },
  { id: 1, top: '28%', left: '83%', size: 48, delay: '1.1s', dur: '8.5s' },
  { id: 2, top: '60%', left: '7%', size: 64, delay: '2.0s', dur: '7.8s' },
  { id: 3, top: '70%', left: '85%', size: 52, delay: '0.6s', dur: '9s' },
  { id: 4, top: '10%', left: '58%', size: 42, delay: '1.6s', dur: '8s' },
  { id: 5, top: '48%', left: '93%', size: 46, delay: '2.6s', dur: '7.4s' },
]

const CUBES = [
  { top: '22%', left: '24%', size: 30, delay: '0s', dur: '9s' },
  { top: '14%', left: '74%', size: 22, delay: '1.5s', dur: '10s' },
  { top: '76%', left: '20%', size: 26, delay: '0.8s', dur: '8.5s' },
  { top: '64%', left: '72%', size: 34, delay: '2.2s', dur: '11s' },
  { top: '40%', left: '15%', size: 18, delay: '3s', dur: '9.5s' },
]

export function JoyBackground() {
  const [vals, setVals] = useState(() => NUM_BLOCKS.map(() => rand(SYMBOLS)))
  const [pop, setPop] = useState(-1)

  // Хааяа нэг блокийн тоог солиод "гарч ирэх" поп эффект өгнө
  useEffect(() => {
    let t
    const tick = () => {
      const i = Math.floor(Math.random() * NUM_BLOCKS.length)
      setVals((prev) => {
        const next = [...prev]
        next[i] = rand(SYMBOLS)
        return next
      })
      setPop(i)
      setTimeout(() => setPop(-1), 360)
      t = setTimeout(tick, 1400 + Math.random() * 1400)
    }
    t = setTimeout(tick, 1200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="joy-bg" aria-hidden="true">
      <div className="joy-bg-grid" />
      <div className="joy-bg-ring" />
      <div className="joy-bg-ring joy-bg-ring--2" />

      {CUBES.map((c, i) => (
        <span
          key={`c${i}`}
          className="joy-cube"
          style={{ top: c.top, left: c.left, '--s': `${c.size}px`, animationDelay: c.delay, animationDuration: c.dur }}
        />
      ))}

      {NUM_BLOCKS.map((b, i) => (
        <span
          key={b.id}
          className={`joy-num-block${pop === i ? ' is-pop' : ''}`}
          style={{ top: b.top, left: b.left, '--s': `${b.size}px`, animationDelay: b.delay, animationDuration: b.dur }}
        >
          {vals[i]}
        </span>
      ))}
    </div>
  )
}
