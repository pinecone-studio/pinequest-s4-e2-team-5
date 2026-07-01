// Баганан бичлэг (босоо) нэмэх/хасах — ӨНГӨТ АРАВТ / НЭГЖ багана.
// Аравтыг цэнхэр, нэгжийг ногоон блокоор. Нэгжийн баганаас эхэлж, зөөх/зээлэхийг
// шар блокоор тайлбарлан, СОНГОЛТООР бодуулна (бичихгүй).
import { useMemo, useState } from 'react'
import { CelebrationBurst } from './CelebrationBurst.jsx'
import { planColumns } from './columnPlan.js'

const SYM = { '+': '+', '-': '−' }

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
  for (const d of [1, -1, 2, -2, 3, -3, 10, -10]) {
    const v = answer + d
    if (v >= 0) set.add(v)
    if (set.size >= 3) break
  }
  return shuffle([...set].slice(0, 3))
}

function Blocks({ n, kind }) {
  return (
    <span className="cc-blocks">
      {[...Array(Math.max(0, n))].map((_, i) => (
        <span key={i} className={`cc-block cc-block-${kind}`} />
      ))}
    </span>
  )
}

export function ColumnMathInteractive({ problem, onCorrect, onWrong }) {
  const [a, b] = useMemo(() => (problem.operands ?? []).map(Number), [problem])
  const op = (problem.operator === '-' || problem.type === 'subtraction') ? '-' : '+'
  const plan = useMemo(() => planColumns(a || 0, b || 0, op), [a, b, op])

  const [stepIdx, setStepIdx] = useState(0)
  const [onesDigit, setOnesDigit] = useState(null)
  const [tensDigit, setTensDigit] = useState(null)
  const [wrongPick, setWrongPick] = useState(null)

  const done = onesDigit != null && (plan.steps.length === 1 ? true : tensDigit != null)
  const step = plan.steps[stepIdx]
  const choices = useMemo(() => (step ? makeChoices(step.ask) : []), [step])

  const pick = (n) => {
    if (done || !step) return
    if (n !== step.ask) {
      setWrongPick(n)
      onWrong?.()
      setTimeout(() => setWrongPick(null), 700)
      return
    }
    setWrongPick(null)
    if (step.col === 'ones') {
      const d = op === '+' ? step.ask % 10 : step.ask
      setOnesDigit(d)
      const carry = op === '+' ? Math.floor(step.ask / 10) : 0
      if (plan.hasTens) setStepIdx(1)
      else { if (carry > 0) setTensDigit(carry); onCorrect?.() }
    } else {
      setTensDigit(step.ask)
      onCorrect?.()
    }
  }

  const showTens = plan.hasTens || plan.answer >= 10
  const ansTens = tensDigit != null ? tensDigit : (done && plan.answer >= 10 ? Math.floor(plan.answer / 10) : null)
  const ansOnes = onesDigit
  const activeOnes = step?.col === 'ones' && !done
  const activeTens = step?.col === 'tens' && !done
  const carryShown = showTens && op === '+' && onesDigit != null && plan.oa + plan.ob >= 10

  return (
    <div className="cc-root">
      <div className="vm-word-prompt">
        {problem.promptMn || 'Баганаар бод: эхлээд НЭГЖ, дараа нь АРАВТ.'}
      </div>

      <div className="cc-board">
        <div className="cc-head">
          {showTens && <span className="cc-head-cell cc-head-tens">АРАВТ</span>}
          <span className="cc-head-cell cc-head-ones">НЭГЖ</span>
          <span className="cc-head-val" />
        </div>

        {carryShown && (
          <div className={`cc-carry${showTens ? '' : ' cc-carry-notens'}`}>
            <span className="cc-carry-block">+1</span>
          </div>
        )}

        {[{ n: a, ta: plan.ta, ones: plan.oa, sign: '' }, { n: b, ta: plan.tb, ones: plan.ob, sign: SYM[op] }].map((row, ri) => (
          <div className="cc-row" key={ri}>
            <span className="cc-sign">{row.sign}</span>
            {showTens && <span className="cc-col cc-col-tens"><Blocks n={row.ta} kind="tens" /></span>}
            <span className="cc-col cc-col-ones"><Blocks n={row.ones} kind="ones" /></span>
            <span className="cc-val">{row.n}</span>
          </div>
        ))}

        <div className="cc-line" />

        <div className="cc-row cc-row-ans">
          <span className="cc-sign" />
          {showTens && (
            <span className={`cc-ansbox${activeTens ? ' cc-ansbox-active' : ''}${ansTens != null ? ' cc-ansbox-filled' : ''}`}>
              {ansTens != null ? ansTens : '?'}
            </span>
          )}
          <span className={`cc-ansbox${activeOnes ? ' cc-ansbox-active' : ''}${ansOnes != null ? ' cc-ansbox-filled' : ''}`}>
            {ansOnes != null ? ansOnes : '?'}
          </span>
          <span className="cc-val cc-val-ans">{done ? plan.answer : ''}</span>
        </div>
      </div>

      {done ? (
        <div className="seq-success">
          Зөв! {a} {SYM[op]} {b} = {plan.answer}.
          <CelebrationBurst />
        </div>
      ) : (
        <>
          <div className="cc-hint">
            {step.col === 'ones' ? 'Эхлээд НЭГЖийн баганыг нэм 👇' : 'Одоо АРАВТын баганыг нэм 👇'}
            {step.op === '+' && step.carryIn ? ` (зөөсөн ${step.carryIn} нэм)` : ''}
            {step.op === '-' && step.borrow ? ' (аравтаас 10 зээлсэн)' : ''}
          </div>

          <div className="cc-mini">
            <span className="cc-mini-num">{step.a}</span>
            <span className="cc-mini-op">{SYM[step.op]}</span>
            <span className="cc-mini-num">{step.b}</span>
            {step.op === '+' && step.carryIn ? (
              <>
                <span className="cc-mini-op">+</span>
                <span className="cc-mini-num cc-mini-carry">{step.carryIn}</span>
              </>
            ) : null}
            <span className="cc-mini-op">=</span>
            <span className="cc-mini-q">?</span>
          </div>

          <div className="vm-choice-grid cc-choice-grid">
            {choices.map((n) => (
              <button
                key={n}
                type="button"
                className={`vm-choice-btn cc-choice-btn${wrongPick === n ? ' vm-choice-wrong' : ''}`}
                onClick={() => pick(n)}
              >
                <span className="cc-choice-num">{n}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
