import { useEffect, useState } from 'react'
import './mcqueen-scene.css'

/* McQueen.png найз + дээр нь хөдөлдөг нүд.
   Жинхэнэ зурсан цэнхэр нүдэн дээр таарсан цэнхэр солонго (iris) тавьж,
   дотор нь цагаан гялбаатай хар хүүхэн харааг тойруулж хөдөлгөнө.
   Нүдний байрлал McQueen.png (1513×787)-д PIL-ээр тааруулсан хувиуд. */
export function McQueenBuddy({ className = '' }) {
  const [gaze, setGaze] = useState({ x: 0, y: 0 })

  useEffect(() => {
    let t
    const wander = () => {
      setGaze({ x: Math.random() * 1.6 - 0.8, y: Math.random() * 1.0 - 0.5 })
      t = setTimeout(wander, 1100 + Math.random() * 1800)
    }
    t = setTimeout(wander, 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={`mcq-buddy${className ? ` ${className}` : ''}`}
      style={{ '--gx': gaze.x, '--gy': gaze.y }}
      role="img"
      aria-label="Маккуин найз"
    >
      <img className="mcq-buddy-img" src="/McQueen.png" alt="" draggable="false" />
      <span className="mcq-eye mcq-eye--l" aria-hidden="true"><i className="mcq-pupil" /></span>
      <span className="mcq-eye mcq-eye--r" aria-hidden="true"><i className="mcq-pupil" /></span>
    </div>
  )
}
