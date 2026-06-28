import { useEffect, useState } from 'react'

/* maynkrap.png найз + дээр нь хөдөлдөг нүд.
   Жинхэнэ зурсан нүд (том харанхуй) дээр таарсан харанхуй овоолго тавьж дараад,
   дотор нь цагаан гэрэлтэй хүүхэн харааг тойруулж хөдөлгөнө. */
export function MinecraftBuddy({ className = '' }) {
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
      className={`mc-buddy${className ? ` ${className}` : ''}`}
      style={{ '--gx': gaze.x, '--gy': gaze.y }}
      role="img"
      aria-label="Майнкрафт найз"
    >
      <img className="mc-buddy-img" src="/maynkrap.png" alt="" draggable="false" />
      <span className="mc-eye mc-eye--l" aria-hidden="true"><i className="mc-pupil" /></span>
      <span className="mc-eye mc-eye--r" aria-hidden="true"><i className="mc-pupil" /></span>
    </div>
  )
}
