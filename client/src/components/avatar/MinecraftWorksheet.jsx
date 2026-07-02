// "Дасгал даалгавар" — даалгаврын зургийг ChatGPT-ээр задлаад (analyze-homework),
// гарсан бодлого бүрийг Minecraft интерактив болгож нэг хуудсанд харуулна.
// Дээд талд явцын алхам, бодлого бүрийг бодмогц ✓ болж, өөрөө сонгож болно.
import { useMemo, useState } from 'react'
import { HomeworkUpload } from './HomeworkUpload.jsx'
import { ProblemInteractive } from './TutorAvatar.jsx'
import './minecraft-first-problem.css'

// Бодлогын төрлөөр алхмын дүрс/шошго — хатуу кодтой 4 алхмын оронд динамик.
function stepMeta(problem) {
  switch (problem?.type) {
    case 'comparison':      return { icon: '👑', label: 'Жиших' }
    case 'length_unit':     return { icon: '📏', label: 'Хэмжих' }
    case 'word':            return { icon: '📚', label: 'Бодлого' }
    case 'number_sequence': return { icon: '🔢', label: 'Дараалал' }
    case 'number_neighbor': return { icon: '↔️', label: 'Хөрш' }
    case 'missing_addend':  return { icon: '❓', label: 'Дутуу' }
    case 'tens_ones':       return { icon: '🔟', label: 'Орон' }
    case 'equation_balance':return { icon: '⚖️', label: 'Тэнцэл' }
    default:                return { icon: '💎', label: 'Үйлдэл' }
  }
}

export function MinecraftWorksheet({ onBack }) {
  const [problems, setProblems] = useState([])
  const [active, setActive]     = useState(0)
  const [solved, setSolved]     = useState([])

  // HomeworkUpload задалсан бодлогуудыг ачаалж, явцыг шинээр эхлүүлнэ.
  const handleLoaded = (_context, loaded) => {
    const list = Array.isArray(loaded) ? loaded : []
    setProblems(list)
    setSolved(list.map(() => false))
    setActive(0)
  }

  const markSolved = (i) =>
    setSolved((s) => {
      if (s[i]) return s
      const n = [...s]
      n[i] = true
      return n
    })

  const steps = useMemo(() => problems.map(stepMeta), [problems])
  const solvedCount = solved.filter(Boolean).length
  const allDone = problems.length > 0 && solved.every(Boolean)
  const activeProblem = problems[active]

  return (
    <div className="mcw-page">
      {onBack && (
        <button className="mcw-back" onClick={onBack} aria-label="Буцах">←</button>
      )}

      <header className="mcw-header">
        <h1 className="mcw-h1">⛏️ Дасгал даалгавар</h1>
        <p className="mcw-sub">
          {problems.length
            ? `${problems.length} бодлого — тоглоом шиг бод!`
            : 'Даалгаврын зургаа оруул — тоглоом болгоно!'}
        </p>
      </header>

      {/* Бодлого ороогүй бол: даалгаврын зураг оруулах */}
      {problems.length === 0 ? (
        <div className="mcw-upload-slot">
          <HomeworkUpload onHomeworkLoaded={handleLoaded} />
        </div>
      ) : (
        <>
          {/* Явцын алхмууд — бодлогын тоогоор динамик */}
          <nav className="mcw-steps" aria-label="Бодлогууд">
            {steps.map((s, i) => (
              <button
                key={i}
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
            {activeProblem && (
              <ProblemInteractive
                key={active}
                problem={activeProblem}
                onCorrect={() => markSolved(active)}
                onWrong={() => {}}
              />
            )}
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
            <span className="mcw-progress">{solvedCount} / {problems.length} бодогдсон</span>
            <button
              className="mcw-nav-btn mcw-nav-next"
              disabled={active === problems.length - 1}
              onClick={() => setActive((a) => Math.min(problems.length - 1, a + 1))}
            >
              Дараах →
            </button>
          </div>

          <div className="mcw-nav" style={{ marginTop: 8 }}>
            <button
              className="mcw-nav-btn"
              onClick={() => { setProblems([]); setSolved([]); setActive(0) }}
            >
              ↻ Өөр даалгавар оруулах
            </button>
          </div>

          {allDone && (
            <div className="mcw-alldone">
              🏆 Бүх {problems.length} бодлогыг бодож дууслаа! Гоё байна!
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MinecraftWorksheet
