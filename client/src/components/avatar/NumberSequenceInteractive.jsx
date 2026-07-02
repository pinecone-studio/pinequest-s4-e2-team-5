import { useMemo, useState } from 'react'
import { CelebrationBurst } from './CelebrationBurst.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Нэг хоосон нүдэнд 3 сонголт (зөв + ойролцоо тоо), бичихгүй зөвхөн сонгоно.
function makeChoices(answer) {
  const set = new Set([answer])
  for (const d of [1, -1, 2, -2, 3, -3, 4, -4]) {
    const v = answer + d
    if (v >= 0) set.add(v)
    if (set.size >= 3) break
  }
  return shuffle([...set].slice(0, 3))
}

function asNumberArray(value) {
  if (Array.isArray(value)) return value.filter((item) => !isBlankToken(item)).map(Number).filter(Number.isFinite)
  if (typeof value === 'string') return value.match(/-?\d+/g)?.map(Number) ?? []
  if (Number.isFinite(Number(value))) return [Number(value)]
  return []
}

function isBlankToken(value) {
  if (value === null || value === undefined) return true
  if (typeof value !== 'string') return false
  return /^(\s*|\.{2,}|…|_{1,}|□|▢|\?)$/.test(value)
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
    return problem.sequenceSlots.map((value) => {
      if (isBlankToken(value)) return null
      const n = Number(value)
      return Number.isFinite(n) ? n : null
    })
  }
  const fromRaw = slotsFromRaw(problem.raw)
  if (fromRaw?.slots.length) return fromRaw.slots

  const shown = (problem.operands ?? []).map(Number).filter(Number.isFinite)
  return [...shown, ...answers.map(() => null)]
}

export function NumberSequenceInteractive({ problem, onCorrect, onWrong }) {
  const answers = useMemo(() => inferNextValues(problem), [problem])
  const slots = useMemo(() => buildSlots(problem, answers), [problem, answers])

  // Одоо хэддэх хоосон нүдийг бөглөж байгаа, өмнөх нүдэнд юу сонгосон
  const [filledCount, setFilledCount] = useState(0)
  const [wrongPick, setWrongPick] = useState(null)
  const done = answers.length > 0 && filledCount >= answers.length

  const currentAnswer = answers[filledCount]
  const choices = useMemo(
    () => (currentAnswer == null ? [] : makeChoices(currentAnswer)),
    [currentAnswer],
  )

  const pick = (n) => {
    if (done) return
    if (n === currentAnswer) {
      setWrongPick(null)
      const next = filledCount + 1
      setFilledCount(next)
      if (next >= answers.length) onCorrect?.()
    } else {
      setWrongPick(n)
      onWrong?.()
      setTimeout(() => setWrongPick(null), 700)
    }
  }

  // Слот индекс → хэддэх хоосон нүд болохыг урьдчилан тооцно (render дотор мутацгүй)
  const blankIndexBySlot = useMemo(() => {
    const map = {}
    let seen = 0
    slots.forEach((slot, i) => {
      if (slot === null) { map[i] = seen; seen += 1 }
    })
    return map
  }, [slots])

  return (
    <div className="seq-root">
      <div className="vm-word-prompt">
        {problem.promptMn || 'Дарааллын дутуу тоог сонгоорой.'}
      </div>

      <div className="seq-row" aria-label="Тоон дараалал">
        {slots.map((slot, slotIndex) => {
          if (slot !== null) {
            return <span key={`${slot}-${slotIndex}`} className="seq-chip">{slot}</span>
          }
          const blankIndex = blankIndexBySlot[slotIndex]
          const isFilled = blankIndex < filledCount
          const isCurrent = blankIndex === filledCount && !done
          return (
            <span
              key={`blank-${slotIndex}`}
              className={`seq-chip seq-chip-blank${isFilled ? ' seq-chip-filled' : ''}${isCurrent ? ' seq-chip-current' : ''}`}
            >
              {isFilled || done ? answers[blankIndex] : '?'}
            </span>
          )
        })}
      </div>

      {done ? (
        <div className="seq-success">
          Зөв дараалал!
          <CelebrationBurst />
        </div>
      ) : (
        <div className="vm-choice-grid seq-choice-grid">
          {choices.map((n) => (
            <button
              key={n}
              type="button"
              className={`vm-choice-btn seq-choice-btn${wrongPick === n ? ' vm-choice-wrong' : ''}`}
              onClick={() => pick(n)}
            >
              <span className="seq-choice-num">{n}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
