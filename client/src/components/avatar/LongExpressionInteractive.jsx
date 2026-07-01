// Урт илэрхийлэл: "7 + 4 - (15 + 8) =" мэт хаалттай бодлого.
// Хаалт доторхийг ТҮРҮҮЛЖ, дараа нь зүүнээс баруун тийш — зөв дарааллаар,
// алхам бүрийг СОНГУУЛЖ (бичихгүй) заана.
import { useMemo, useState } from 'react'
import { CelebrationBurst } from './CelebrationBurst.jsx'
import { evalExpressionSteps, isNum } from './expressionSteps.js'

const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷', '(': '(', ')': ')' }

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
  for (const d of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5]) {
    set.add(answer + d)
    if (set.size >= 3) break
  }
  return shuffle([...set].slice(0, 3))
}

function renderExpr(tokens, hi) {
  return tokens.map((t, i) => {
    const highlight = hi && hi.includes(i) ? ' lex-hi' : ''
    return (
      <span key={i} className={`${isNum(t) ? 'lex-num' : 'lex-op'}${highlight}`}>
        {isNum(t) ? t : SYM[t] ?? t}
      </span>
    )
  })
}

export function LongExpressionInteractive({ problem, onCorrect, onWrong }) {
  const data = useMemo(() => evalExpressionSteps(problem.raw), [problem.raw])
  const steps = data?.steps ?? []
  const [current, setCurrent] = useState(0)
  const [wrongPick, setWrongPick] = useState(null)
  const done = steps.length > 0 && current >= steps.length

  const step = steps[current]
  const choices = useMemo(() => (step ? makeChoices(step.result) : []), [step])

  if (!steps.length) {
    return (
      <div className="lex-root">
        <div className="vm-word-prompt">{problem.promptMn || problem.raw}</div>
      </div>
    )
  }

  const pick = (n) => {
    if (done) return
    if (n === step.result) {
      setWrongPick(null)
      const next = current + 1
      setCurrent(next)
      if (next >= steps.length) onCorrect?.()
    } else {
      setWrongPick(n)
      onWrong?.()
      setTimeout(() => setWrongPick(null), 700)
    }
  }

  return (
    <div className="lex-root">
      <div className="vm-word-prompt">
        {problem.promptMn || 'Хаалт доторхийг эхэлж бод!'}
      </div>

      {done ? (
        <>
          <div className="lex-expr">
            <span className="lex-num lex-hi">{data.finalValue}</span>
          </div>
          <div className="seq-success">
            Бүх алхмыг зөв бодлоо! Хариу нь {data.finalValue}.
            <CelebrationBurst />
          </div>
        </>
      ) : (
        <>
          <div className="lex-expr" aria-label="Илэрхийлэл">
            {renderExpr(step.beforeTokens, step.hi)}
          </div>

          <div className="lex-hint">
            {step.inParen
              ? 'Эхлээд ХААЛТ доторхийг бод 👇'
              : 'Зүүнээс баруун тийш дараалан бод 👇'}
          </div>

          <div className="lex-mini">
            <span className="lex-num">{step.a}</span>
            <span className="lex-op">{SYM[step.op]}</span>
            <span className="lex-num">{step.b}</span>
            <span className="lex-op">=</span>
            <span className="lex-q">?</span>
          </div>

          <div className="vm-choice-grid lex-choice-grid">
            {choices.map((n) => (
              <button
                key={n}
                type="button"
                className={`vm-choice-btn lex-choice-btn${wrongPick === n ? ' vm-choice-wrong' : ''}`}
                onClick={() => pick(n)}
              >
                <span className="lex-choice-num">{n}</span>
              </button>
            ))}
          </div>

          <div className="lex-progress">Алхам {current + 1} / {steps.length}</div>
        </>
      )}
    </div>
  )
}
