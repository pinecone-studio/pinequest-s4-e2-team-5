import { useEffect, useMemo, useState } from 'react'
import { CelebrationBurst } from './CelebrationBurst.jsx'

function asNumberArray(value) {
  if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite)
  if (typeof value === 'string') return value.match(/-?\d+/g)?.map(Number) ?? []
  if (Number.isFinite(Number(value))) return [Number(value)]
  return []
}

function completeArithmeticSlots(slots) {
  const known = slots
    .map((value, index) => ({ value, index }))
    .filter((item) => Number.isFinite(item.value))
  if (known.length < 2 || !slots.some((value) => value === null)) return null

  let step = null
  for (let i = 1; i < known.length; i++) {
    const gap = known[i].index - known[i - 1].index
    const diff = known[i].value - known[i - 1].value
    if (gap > 0 && diff % gap === 0) {
      step = diff / gap
      break
    }
  }
  if (step === null) return null

  const first = known[0].value - step * known[0].index
  const complete = slots.map((_, i) => first + step * i)
  const isConsistent = known.every(({ value, index }) => complete[index] === value)
  if (!isConsistent) return null

  const missingPositions = slots
    .map((value, index) => (value === null ? index : -1))
    .filter((index) => index >= 0)
  return {
    slots,
    answers: missingPositions.map((index) => complete[index]),
  }
}

function slotsFromRaw(raw) {
  if (!raw) return null
  const tokens = String(raw).match(/-?\d+|\.{2,}|…|_{1,}|□|▢|\?/g) ?? []
  if (!tokens.some((t) => /\.{2,}|…|_{1,}|□|▢|\?/.test(t))) return null
  const slots = tokens.map((t) => (/^-?\d+$/.test(t) ? Number(t) : null))
  return completeArithmeticSlots(slots)
}

function inferNextValues(problem) {
  const fromRaw = slotsFromRaw(problem.raw)
  if (fromRaw?.answers.length) return fromRaw.answers

  const shown = (problem.operands ?? []).map(Number).filter(Number.isFinite)
  const direct = asNumberArray(problem.answer)
  if (direct.length > 0) return direct

  if (shown.length >= 2) {
    const step = shown[shown.length - 1] - shown[shown.length - 2]
    const isArithmetic = shown.length < 3 || shown.every((n, i) => i === 0 || n - shown[i - 1] === step)
    if (isArithmetic) return [1, 2, 3].map((i) => shown[shown.length - 1] + step * i)

    const ratio = shown[shown.length - 2] !== 0 ? shown[shown.length - 1] / shown[shown.length - 2] : null
    const isGeometric =
      ratio !== null &&
      Number.isFinite(ratio) &&
      shown.every((n, i) => i === 0 || shown[i - 1] !== 0 && n / shown[i - 1] === ratio)
    if (isGeometric) return [1, 2, 3].map((i) => shown[shown.length - 1] * ratio ** i)
  }

  return []
}

function buildSlots(problem, answers) {
  if (Array.isArray(problem.sequenceSlots) && problem.sequenceSlots.length) {
    return problem.sequenceSlots.map((value) => (Number.isFinite(Number(value)) ? Number(value) : null))
  }
  const fromRaw = slotsFromRaw(problem.raw)
  if (fromRaw?.slots.length) return fromRaw.slots

  const shown = (problem.operands ?? []).map(Number).filter(Number.isFinite)
  return [...shown, ...answers.map(() => null)]
}

export function NumberSequenceInteractive({ problem, onCorrect, onWrong }) {
  const answers = useMemo(() => inferNextValues(problem), [problem])
  const slots = useMemo(() => buildSlots(problem, answers), [problem, answers])
  const [values, setValues] = useState(() => answers.map(() => ''))
  const [phase, setPhase] = useState('typing')

  useEffect(() => {
    setValues(answers.map(() => ''))
    setPhase('typing')
  }, [answers])

  const updateValue = (i, value) => {
    setValues((prev) => prev.map((v, idx) => (idx === i ? value : v)))
    if (phase === 'wrong') setPhase('typing')
  }

  const check = (e) => {
    e.preventDefault()
    const given = values.map((v) => Number(v))
    const isComplete = values.every((v) => v.trim() !== '') && given.every(Number.isFinite)
    const isCorrect = isComplete && answers.length > 0 && given.every((n, i) => n === answers[i])

    if (isCorrect) {
      setPhase('correct')
      onCorrect?.()
    } else {
      setPhase('wrong')
      onWrong?.()
    }
  }

  return (
    <form className="seq-root" onSubmit={check}>
      <div className="vm-word-prompt">
        {problem.promptMn || 'Дарааллын дараагийн 3 тоог олоорой.'}
      </div>

      <div className="seq-row" aria-label="Тоон дараалал">
        {slots.map((slot, slotIndex) => {
          if (slot !== null) {
            return <span key={`${slot}-${slotIndex}`} className="seq-chip">{slot}</span>
          }
          const inputIndex = slots.slice(0, slotIndex + 1).filter((value) => value === null).length - 1
          return (
            <input
              key={`blank-${slotIndex}`}
              className={`seq-input${phase === 'wrong' ? ' seq-input-wrong' : ''}${phase === 'correct' ? ' seq-input-correct' : ''}`}
              value={phase === 'correct' ? answers[inputIndex] : values[inputIndex] ?? ''}
              onChange={(e) => updateValue(inputIndex, e.target.value)}
              inputMode="numeric"
              pattern="-?[0-9]*"
              placeholder="?"
              aria-label={`Хоосон ${inputIndex + 1} тоо`}
              disabled={phase === 'correct'}
            />
          )
        })}
      </div>

      {phase === 'correct' ? (
        <div className="seq-success">
          Зөв дараалал!
          <CelebrationBurst />
        </div>
      ) : (
        <button type="submit" className={`seq-check-btn${phase === 'wrong' ? ' seq-check-wrong' : ''}`}>
          Шалгах
        </button>
      )}
    </form>
  )
}
