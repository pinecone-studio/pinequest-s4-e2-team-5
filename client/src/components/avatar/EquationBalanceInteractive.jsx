// Тэнцэтгэл (Equation balance): "□ - 26 = 6 + 9" мэт хоёр талтай тэгшитгэл.
// Хүүхэд битүү талыг эхэлж бодоод, тэнцэл гаргах дутуу тоог СОНГОНО (бичихгүй).
import { useMemo, useState } from 'react'
import { parseBalance } from './problemNormalizer.js'
import { CelebrationBurst } from './CelebrationBurst.jsx'

const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' }

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
  for (const d of [1, -1, 2, -2, 3, -3, 5, -5, 10, -10]) {
    const v = answer + d
    if (v >= 0) set.add(v)
    if (set.size >= 3) break
  }
  return shuffle([...set].slice(0, 3))
}

export function EquationBalanceInteractive({ problem, onCorrect, onWrong }) {
  const parsed = useMemo(() => parseBalance(problem.raw), [problem.raw])
  const answer = parsed ? parsed.answer : Number(problem.answer)
  const choices = useMemo(
    () => (Number.isFinite(answer) ? makeChoices(answer) : []),
    [answer],
  )
  const [phase, setPhase] = useState('choosing')
  const [wrongPick, setWrongPick] = useState(null)

  const pick = (n) => {
    if (phase === 'correct') return
    if (n === answer) {
      setWrongPick(null)
      setPhase('correct')
      onCorrect?.()
    } else {
      setWrongPick(n)
      onWrong?.()
      setTimeout(() => setWrongPick(null), 700)
    }
  }

  const slot = (
    <span
      key="slot"
      className={`eqb-slot${phase === 'correct' ? ' eqb-slot-correct' : ''}`}
    >
      {phase === 'correct' ? answer : '?'}
    </span>
  )

  // parse амжилтгүй бол зөвхөн асуулт + сонголт харуулна
  if (!parsed) {
    return (
      <div className="eqb-root">
        <div className="vm-word-prompt">
          {problem.promptMn || problem.raw || 'Дутуу тоог сонгоорой.'}
        </div>
        <ChoiceGrid choices={choices} phase={phase} wrongPick={wrongPick} answer={answer} onPick={pick} />
      </div>
    )
  }

  const { leftBlank, blankSide, known } = parsed
  const blankTokens =
    blankSide.pos === 'alone'
      ? [slot]
      : blankSide.pos === 'left'
        ? [slot, <span key="bo" className="eqb-op">{SYM[blankSide.op]}</span>, <span key="bn" className="eqb-num">{blankSide.num}</span>]
        : [<span key="bn" className="eqb-num">{blankSide.num}</span>, <span key="bo" className="eqb-op">{SYM[blankSide.op]}</span>, slot]

  const knownTokens = known.tokens.map((t, i) => (
    <span key={`k${i}`} className={typeof t === 'number' ? 'eqb-num' : 'eqb-op'}>{t}</span>
  ))
  const eqSign = <span key="eq" className="eqb-eq">=</span>
  const equation = leftBlank
    ? [...blankTokens, eqSign, ...knownTokens]
    : [...knownTokens, eqSign, ...blankTokens]

  return (
    <div className="eqb-root">
      <div className="vm-word-prompt">
        {problem.promptMn || 'Тэнцэл гарахаар дутуу тоог сонгоорой.'}
      </div>

      <div className="eqb-equation" aria-label="Тэнцэтгэл">{equation}</div>

      {/* Заавар: битүү талыг эхэлж бодуулна */}
      <div className="eqb-hint">
        Битүү талыг эхэлж бод: {known.tokens.join(' ')} = <b>{known.value}</b>
        <br />
        Хоёр тал <b>тэнцүү</b> байхаар дутуу тоог сонго.
      </div>

      {phase === 'correct' ? (
        <div className="seq-success">
          Тэнцэл гарлаа!
          <CelebrationBurst />
        </div>
      ) : (
        <ChoiceGrid choices={choices} phase={phase} wrongPick={wrongPick} answer={answer} onPick={pick} />
      )}
    </div>
  )
}

function ChoiceGrid({ choices, wrongPick, onPick }) {
  return (
    <div className="vm-choice-grid eqb-choice-grid">
      {choices.map((n) => (
        <button
          key={n}
          type="button"
          className={`vm-choice-btn eqb-choice-btn${wrongPick === n ? ' vm-choice-wrong' : ''}`}
          onClick={() => onPick(n)}
        >
          <span className="eqb-choice-num">{n}</span>
        </button>
      ))}
    </div>
  )
}
