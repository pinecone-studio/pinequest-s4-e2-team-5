import { useMemo, useState } from 'react'
import { NumberVisual } from '../lesson/NumberVisual.jsx'
import { CelebrationBurst } from './CelebrationBurst.jsx'

/* ── туслах ── */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeChoices(answer) {
  const set = new Set([answer])
  for (const d of [-2, -1, 1, 2, 3, -3, 4, -4]) {
    const v = answer + d
    if (v >= 0) set.add(v)
    if (set.size >= 3) break
  }
  return shuffle([...set].slice(0, 3))
}

const OP_INFO = {
  '+': { sym: '+', word: 'нэмэх' },
  '-': { sym: '−', word: 'хасах' },
  '*': { sym: '×', word: 'үржих' },
  '/': { sym: '÷', word: 'хуваах' },
}

/* operator-ийг problem-оос, эсвэл operands + answer-аас тааварла */
function inferOp(problem, a, b) {
  const raw = problem.operator
  if (raw === '+' || raw === '-' || raw === '*' || raw === '/') return raw
  const ans = Number(problem.answer)
  if (Number.isFinite(ans)) {
    if (a + b === ans) return '+'
    if (a - b === ans) return '-'
    if (a * b === ans) return '*'
    if (b !== 0 && a / b === ans) return '/'
  }
  return '+'
}

function compute(a, b, op) {
  if (op === '+') return a + b
  if (op === '-') return a - b
  if (op === '*') return a * b
  if (op === '/' && b !== 0) return a / b
  return a + b
}

/* үйлдэл сонгох хувилбарууд (зөв + 1 будлиулагч) */
function opChoices(correct) {
  const distractor = { '+': '-', '-': '+', '*': '+', '/': '-' }[correct] || '-'
  return shuffle([correct, distractor])
}

/* өгүүлбэр доторх тоог тодотгоно */
function HighlightedStory({ text }) {
  const parts = String(text).split(/(\d+)/)
  return (
    <p className="wp-story">
      {parts.map((part, i) =>
        /^\d+$/.test(part)
          ? <span key={i} className="wp-num">{part}</span>
          : <span key={i}>{part}</span>,
      )}
    </p>
  )
}

export function WordProblemInteractive({ problem, onCorrect, onWrong }) {
  const [a, b] = useMemo(
    () => (problem.operands ?? []).map(Number),
    [problem],
  )
  const op = useMemo(() => inferOp(problem, a, b), [problem, a, b])
  const answer = useMemo(() => {
    const given = Number(problem.answer)
    return Number.isFinite(given) ? given : compute(a, b, op)
  }, [problem, a, b, op])

  const opOptions = useMemo(() => opChoices(op), [op])
  const numChoices = useMemo(() => makeChoices(answer), [answer])

  // story → operation → solve → correct
  const [phase, setPhase] = useState('story')
  const [pickedOp, setPickedOp] = useState(null)
  const [opWrong, setOpWrong] = useState(false)
  const [selNum, setSelNum] = useState(null)
  const [numState, setNumState] = useState('choosing')

  const story = problem.promptMn || problem.raw || 'Өгүүлбэртэй бодлого'
  const hasTwo = Number.isFinite(a) && Number.isFinite(b)

  const pickOp = (chosen) => {
    if (pickedOp) return
    setPickedOp(chosen)
    if (chosen === op) {
      setOpWrong(false)
      setTimeout(() => setPhase('solve'), 650)
    } else {
      setOpWrong(true)
      onWrong?.()
      setTimeout(() => { setPickedOp(null); setOpWrong(false) }, 850)
    }
  }

  const pickNum = (n) => {
    if (numState !== 'choosing') return
    setSelNum(n)
    if (n === answer) {
      setNumState('correct')
      setPhase('correct')
      onCorrect?.()
    } else {
      setNumState('wrong')
      onWrong?.()
      setTimeout(() => setNumState('choosing'), 850)
    }
  }

  const numBtnState = (n) => {
    if (numState === 'choosing') return 'idle'
    if (n === answer) return 'correct'
    if (n === selNum) return 'wrong'
    return 'idle'
  }

  return (
    <div className="wp-root">
      {/* ── 1. Өгүүлбэр ── */}
      <div className="wp-card">
        <span className="wp-step-tag">Бодлого</span>
        <HighlightedStory text={story} />
      </div>

      {/* ── 1 → 2 ── */}
      {phase === 'story' && (
        <>
          <p className="wp-guide">Өгүүлбэрээ уншаад бэлэн болмогцоо дар 👇</p>
          <button
            type="button"
            className="seq-check-btn"
            onClick={() => setPhase(hasTwo ? 'operation' : 'solve')}
          >
            Ойлголоо, эхэлье!
          </button>
        </>
      )}

      {/* ── 2. Ямар үйлдэл вэ? ── */}
      {phase === 'operation' && hasTwo && (
        <div className="wp-op-stage">
          <div className="wp-quantities">
            <div className="wp-qty"><NumberVisual value={a} row={a <= 10} /></div>
            <span className={`wp-op-slot${pickedOp && !opWrong ? ' wp-op-filled' : ''}`}>
              {pickedOp && !opWrong ? OP_INFO[pickedOp].sym : '?'}
            </span>
            <div className="wp-qty"><NumberVisual value={b} row={b <= 10} /></div>
          </div>

          <p className="wp-guide">Энд ямар үйлдэл хийх вэ?</p>
          <div className="wp-op-choices">
            {opOptions.map((choice) => {
              const isPicked = pickedOp === choice
              const cls =
                isPicked && opWrong ? ' wp-op-btn-wrong'
                : isPicked ? ' wp-op-btn-correct'
                : ''
              return (
                <button
                  key={choice}
                  type="button"
                  className={`wp-op-btn${cls}`}
                  onClick={() => pickOp(choice)}
                  disabled={!!pickedOp && !opWrong}
                >
                  <span className="wp-op-sym">{OP_INFO[choice].sym}</span>
                  <span className="wp-op-word">{OP_INFO[choice].word}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 3. Хариуг ол ── */}
      {phase === 'solve' && (
        <div className="wp-solve-stage">
          <div className="wp-equation">
            {hasTwo ? (
              <>
                <span className="wp-eq-num">{a}</span>
                <span className="vm-op">{OP_INFO[op].sym}</span>
                <span className="wp-eq-num">{b}</span>
                <span className="vm-op">=</span>
                <span className="wp-eq-q">?</span>
              </>
            ) : (
              <span className="wp-guide">Хариуг сонго:</span>
            )}
          </div>
          <div className="vm-choice-grid">
            {numChoices.map((n) => (
              <button
                key={n}
                type="button"
                className={`vm-choice-btn vm-choice-${numBtnState(n)}`}
                onClick={() => pickNum(n)}
                disabled={numState !== 'choosing'}
              >
                <NumberVisual value={n} row={n <= 10} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Баяр ── */}
      {phase === 'correct' && (
        <div className="seq-success">
          Зөв бодлоо! Хариу нь {answer}.
          <CelebrationBurst />
        </div>
      )}
    </div>
  )
}
