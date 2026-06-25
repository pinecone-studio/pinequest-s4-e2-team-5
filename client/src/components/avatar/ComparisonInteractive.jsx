// Харьцуулах бодлого: хоёр тоог харьцуулж <, =, > -ийн аль нэгийг сонгоно.
// answer: a<b бол -1, a=b бол 0, a>b бол 1.
import { useState } from 'react'
import { NumberVisual } from '../lesson/NumberVisual.jsx'

const OPTIONS = [
  { sym: '<', val: -1 },
  { sym: '=', val: 0 },
  { sym: '>', val: 1 },
]

// Бодлого солигдоход эцэг компонент `key`-ээр энэ виджетийг дахин mount хийж
// төлвийг (selected/phase) автоматаар цэвэрлэдэг тул reset effect шаардлагагүй.
export function ComparisonInteractive({ problem, onCorrect, onWrong }) {
  const [a, b] = (problem.operands ?? [0, 0]).map(Number)
  const answer = problem.answer ?? (a < b ? -1 : a > b ? 1 : 0)

  const [selected, setSelected] = useState(null)
  const [phase, setPhase] = useState('choosing')

  const handle = (val) => {
    if (phase !== 'choosing') return
    setSelected(val)
    if (val === answer) {
      setPhase('correct')
      onCorrect?.()
    } else {
      setPhase('wrong')
      setTimeout(() => setPhase('choosing'), 900)
      onWrong?.()
    }
  }

  const state = (val) => {
    if (phase === 'choosing') return 'idle'
    if (val === answer) return 'correct'
    if (val === selected) return 'wrong'
    return 'idle'
  }

  const answerSym = OPTIONS.find((o) => o.val === answer)?.sym ?? '?'

  return (
    <div className="vm-root">
      <div className="vm-equation">
        <div className="vm-durs-wrap"><NumberVisual value={a} /></div>

        <div className={`vm-ans-slot${phase === 'correct' ? ' vm-ans-correct' : ''}`}>
          {phase === 'correct' ? (
            <>
              <span className="cmp-sym cmp-sym-answer">{answerSym}</span>
              <div className="adz-burst">
                {['⭐','✨','🎉','💫','🌟','✨'].map((s, i) => (
                  <span key={i} className="adz-burst-item" style={{ '--angle': `${i * 60}deg` }}>{s}</span>
                ))}
              </div>
            </>
          ) : (
            <span className="adz-q">?</span>
          )}
        </div>

        <div className="vm-durs-wrap"><NumberVisual value={b} /></div>
      </div>

      {phase !== 'correct' && (
        <div className="vm-choice-grid">
          {OPTIONS.map((o) => (
            <button
              key={o.sym}
              className={`vm-choice-btn cmp-choice vm-choice-${state(o.val)}`}
              onClick={() => handle(o.val)}
              disabled={phase !== 'choosing'}
            >
              <span className="cmp-sym">{o.sym}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
