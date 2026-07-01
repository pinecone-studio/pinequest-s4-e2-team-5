// "Дасгал даалгавар" — 4 бодлогыг Minecraft интерактив болгож нэг хуудсанд.
// Дээд талд явцын алхам (1-4), бодлого бүрийг бодмогц ✓ болж, өөрөө сонгож болно.
import { useState } from 'react'
import { MinecraftFirstProblem } from './MinecraftFirstProblem.jsx'
import { MinecraftComparison } from './MinecraftComparison.jsx'
import { MinecraftLength } from './MinecraftLength.jsx'
import { MinecraftWord } from './MinecraftWord.jsx'
import './minecraft-first-problem.css'

const STEPS = [
  { key: 'calc', label: 'Үйлдэл', icon: '💎' },
  { key: 'compare', label: 'Жиших', icon: '👑' },
  { key: 'length', label: 'Хэмжих', icon: '📏' },
  { key: 'word', label: 'Бодлого', icon: '📚' },
]

export function MinecraftWorksheet({ onBack }) {
  const [active, setActive] = useState(0)
  const [solved, setSolved] = useState([false, false, false, false])

  const markSolved = (i) =>
    setSolved((s) => {
      if (s[i]) return s
      const n = [...s]
      n[i] = true
      return n
    })

  const allDone = solved.every(Boolean)

  return (
    <div className="mcw-page">
      {onBack && (
        <button className="mcw-back" onClick={onBack} aria-label="Буцах">←</button>
      )}

      <header className="mcw-header">
        <h1 className="mcw-h1">⛏️ Дасгал даалгавар</h1>
        <p className="mcw-sub">4 бодлого — тоглоом шиг бод!</p>
      </header>

      {/* Явцын алхмууд */}
      <nav className="mcw-steps" aria-label="Бодлогууд">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            className={`mcw-step${i === active ? ' mcw-step-active' : ''}${solved[i] ? ' mcw-step-done' : ''}`}
            onClick={() => setActive(i)}
          >
            <span className="mcw-step-icon">{solved[i] ? '✓' : s.icon}</span>
            <span className="mcw-step-num">{i + 1}</span>
            <span className="mcw-step-label">{s.label}</span>
          </button>
        ))}
      </nav>

      <div className="mcw-slot">
        {active === 0 && <MinecraftFirstProblem onDone={() => markSolved(0)} />}
        {active === 1 && <MinecraftComparison onDone={() => markSolved(1)} />}
        {active === 2 && <MinecraftLength onDone={() => markSolved(2)} />}
        {active === 3 && <MinecraftWord onDone={() => markSolved(3)} />}
      </div>

      {/* Доод удирдлага */}
      <div className="mcw-nav">
        <button
          className="mcw-nav-btn"
          disabled={active === 0}
          onClick={() => setActive((a) => Math.max(0, a - 1))}
        >
          ← Өмнөх
        </button>
        <span className="mcw-progress">{solved.filter(Boolean).length} / 4 бодогдсон</span>
        <button
          className="mcw-nav-btn mcw-nav-next"
          disabled={active === STEPS.length - 1}
          onClick={() => setActive((a) => Math.min(STEPS.length - 1, a + 1))}
        >
          Дараах →
        </button>
      </div>

      {allDone && (
        <div className="mcw-alldone">🏆 Бүх 4 бодлогыг бодож дууслаа! Гоё байна!</div>
      )}
    </div>
  )
}

export default MinecraftWorksheet
