// Робот (Joy) аватарт зориулсан батерей/энергийн загвартай интерактив.
// Арифметик бодлого (a ± × ÷ b)-ыг батерейн бүлгээр харуулж, neon pill + сонголтоор бодуулна.
// Op тодорхойгүй (үгэн, урт г.м.) бол зөвхөн асуулт + хариу сонголт горим.
import { useMemo, useState } from 'react'
import { CelebrationBurst } from './CelebrationBurst.jsx'
import { makeChoices } from './mcUtils.js'
import './robot-battery.css'

const OP_SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' }

function opFromProblem(problem) {
  if (problem.operator && OP_SYM[problem.operator]) return problem.operator
  switch (problem.type) {
    case 'addition': return '+'
    case 'subtraction': return '-'
    case 'multiplication': return '*'
    case 'division': return '/'
    default: return null
  }
}

function compute(a, b, op) {
  if (op === '+') return a + b
  if (op === '-') return a - b
  if (op === '*') return a * b
  if (op === '/') return b !== 0 ? a / b : 0
  return 0
}

function titleFor(a, b, op) {
  if (op === '+') return `${a} дээр ${b}-г нэм.`
  if (op === '-') return `${a}-аас ${b}-г хас.`
  if (op === '*') return `${a}-ыг ${b}-аар үржүүл.`
  if (op === '/') return `${a}-ыг ${b}-д хуваа.`
  return ''
}

// Нэг батерей — цэнэгтэй (ногоон) эсвэл хасагдах/цэнэггүй (бүдэг).
function Battery({ i, dim }) {
  return (
    <span className={`rb-batt${dim ? ' rb-batt-dim' : ''}`} style={{ '--i': i }}>
      <span className="rb-batt-cap" />
      <span className="rb-batt-bolt">⚡</span>
    </span>
  )
}

function BatteryGroup({ count, dim }) {
  const shown = Math.min(Math.max(count, 0), 12)
  return (
    <div className="rb-card">
      <div className="rb-batts">
        {Array.from({ length: shown }, (_, i) => <Battery key={i} i={i} dim={dim} />)}
      </div>
      <div className="rb-card-num">{count}</div>
    </div>
  )
}

// Дэвсгэрийн хөвөгч тоон хавтангууд (чимэглэл)
const FLOATS = [
  { n: 1, top: '14%', left: '86%', d: 0 },
  { n: 3, top: '62%', left: '6%', d: 0.6 },
  { n: 6, top: '40%', left: '92%', d: 1.1 },
  { n: 2, top: '8%', left: '54%', d: 1.6 },
  { n: 5, top: '74%', left: '90%', d: 0.9 },
]

export function RobotBatteryInteractive({ problem, onCorrect, onWrong, review = false, mode = 'auto' }) {
  const { a, b, op, isArith, answer } = useMemo(() => {
    const [aa, bb] = (problem.operands ?? []).map(Number)
    const oo = opFromProblem(problem)
    const arith = mode !== 'answer' && !!oo && Number.isFinite(aa) && Number.isFinite(bb)
    const ans = arith ? compute(aa, bb, oo) : (Number(problem.answer) || 0)
    return { a: aa, b: bb, op: oo, isArith: arith, answer: ans }
  }, [problem, mode])
  const choices = useMemo(() => makeChoices(answer), [answer])

  const [phase, setPhase] = useState(review ? 'done' : 'q') // 'q' | 'done'
  const [wrong, setWrong] = useState(null)

  const pick = (n) => {
    if (phase === 'done') return
    if (n === answer) { setWrong(null); setPhase('done'); onCorrect?.() }
    else { setWrong(n); onWrong?.(); setTimeout(() => setWrong(null), 700) }
  }

  const done = phase === 'done'

  return (
    <div className="rb-root">
      <div className="rb-floats" aria-hidden="true">
        {FLOATS.map((f, i) => (
          <span key={i} className="rb-float" style={{ top: f.top, left: f.left, animationDelay: `${f.d}s` }}>{f.n}</span>
        ))}
      </div>

      <div className="rb-card-main">
        <div className="rb-head">
          <span className="rb-robot" aria-hidden="true">🤖</span>
          <h2 className="rb-title">{isArith ? titleFor(a, b, op) : (problem.promptMn || problem.raw)}</h2>
        </div>

        {isArith ? (
          <div className="rb-visual">
            <BatteryGroup count={a} />
            <span className="rb-op">{OP_SYM[op]}</span>
            <BatteryGroup count={b} dim={op === '-'} />
            <span className="rb-op">=</span>
            <span className={`rb-slot${done ? ' rb-slot-done' : ''}`}>{done ? answer : '?'}</span>
          </div>
        ) : (
          <p className="rb-prompt">{problem.promptMn || problem.raw}</p>
        )}

        {isArith && (
          <div className="rb-pill">
            <span className="rb-pill-n">{a}</span>
            <span className="rb-pill-op">{OP_SYM[op]}</span>
            <span className="rb-pill-n">{b}</span>
            <span className="rb-pill-op">=</span>
            <span className="rb-pill-q">{done ? answer : '?'}</span>
          </div>
        )}

        {done ? (
          <div className="rb-done">
            <p className="rb-success">🎉 Зөв! Хариу нь <b>{answer}</b>.</p>
            <CelebrationBurst />
          </div>
        ) : (
          <div className="rb-choices">
            {choices.map((n) => (
              <button
                key={n}
                type="button"
                className={`rb-choice${wrong === n ? ' rb-choice-wrong' : ''}`}
                onClick={() => pick(n)}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RobotBatteryInteractive
