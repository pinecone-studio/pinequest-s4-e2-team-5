import { useMemo, useState } from 'react'
import { NumberVisual } from '../lesson/NumberVisual.jsx'
import { CelebrationBurst } from './CelebrationBurst.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeChoices(answer, target) {
  const set = new Set([answer])
  for (const d of [-2, -1, 1, 2, -3, 3, 4, -4]) {
    const value = answer + d
    if (value >= 0 && value !== target) set.add(value)
    if (set.size >= 4) break
  }
  return shuffle([...set].slice(0, 4))
}

function parseAnswer(problem, target) {
  if (Array.isArray(problem.answer)) {
    return {
      previous: Number(problem.answer[0]),
      next: Number(problem.answer[1]),
    }
  }
  return {
    previous: target - 1,
    next: target + 1,
  }
}

function inferTarget(problem) {
  const explicit = Number(problem.neighborTarget ?? problem.operands?.[0])
  if (Number.isFinite(explicit)) return explicit

  if (Array.isArray(problem.answer)) {
    const previous = Number(problem.answer[0])
    const next = Number(problem.answer[1])
    if (Number.isFinite(previous) && Number.isFinite(next)) {
      return (previous + next) / 2
    }
  }

  const rawNumber = String(problem.raw ?? problem.promptMn ?? '').match(/-?\d+/)?.[0]
  const fromRaw = Number(rawNumber)
  return Number.isFinite(fromRaw) ? fromRaw : 0
}

export function NeighborNumberInteractive({ problem, onCorrect, onWrong }) {
  const target = inferTarget(problem)
  const answers = useMemo(() => parseAnswer(problem, target), [problem, target])
  const choices = useMemo(
    () => ({
      previous: makeChoices(answers.previous, target),
      next: makeChoices(answers.next, target),
    }),
    [answers.previous, answers.next, target],
  )
  const [selected, setSelected] = useState({ previous: null, next: null })
  const [wrongKey, setWrongKey] = useState(null)
  const [phase, setPhase] = useState('choosing')

  const pick = (key, value) => {
    if (phase === 'correct') return
    setSelected((prev) => ({ ...prev, [key]: value }))
    if (wrongKey === key) setWrongKey(null)
  }

  const check = () => {
    const isCorrect =
      selected.previous === answers.previous &&
      selected.next === answers.next

    if (isCorrect) {
      setPhase('correct')
      setWrongKey(null)
      onCorrect?.()
      return
    }

    setPhase('wrong')
    setWrongKey(
      selected.previous !== answers.previous ? 'previous' : 'next',
    )
    setTimeout(() => setPhase('choosing'), 850)
    onWrong?.()
  }

  const slotClass = (key) => {
    if (phase === 'correct') return 'nn-slot nn-slot-correct'
    if (wrongKey === key && phase === 'wrong') return 'nn-slot nn-slot-wrong'
    return selected[key] == null ? 'nn-slot' : 'nn-slot nn-slot-filled'
  }

  const choiceClass = (key, value) => {
    const isSelected = selected[key] === value
    const isCorrect = phase === 'correct' && value === answers[key]
    return `nn-choice${isSelected ? ' nn-choice-selected' : ''}${isCorrect ? ' nn-choice-correct' : ''}`
  }

  return (
    <div className="nn-root">
      <div className="vm-word-prompt">
        {problem.promptMn || `${target} тооны хөрш тоонуудыг олоорой.`}
      </div>

      <div className="nn-board" aria-label="Хөрш тооны самбар">
        <div className="nn-column">
          <span className="nn-label">Өмнөх</span>
          <div className={slotClass('previous')}>
            {selected.previous == null ? '?' : selected.previous}
          </div>
        </div>

        <div className="nn-center" aria-label={`Гол тоо ${target}`}>
          <div className="nn-center-ring">
            <NumberVisual value={target} row={target <= 10} />
          </div>
        </div>

        <div className="nn-column">
          <span className="nn-label">Дараах</span>
          <div className={slotClass('next')}>
            {selected.next == null ? '?' : selected.next}
          </div>
        </div>
      </div>

      {phase === 'correct' ? (
        <div className="seq-success">
          Хөрш тоо зөв!
          <CelebrationBurst />
        </div>
      ) : (
        <>
          <div className="nn-choice-panel">
            <div className="nn-choice-group">
              <span className="nn-choice-title">Өмнөх тоо</span>
              <div className="nn-choice-row">
                {choices.previous.map((value) => (
                  <button
                    key={`prev-${value}`}
                    type="button"
                    className={choiceClass('previous', value)}
                    onClick={() => pick('previous', value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="nn-choice-group">
              <span className="nn-choice-title">Дараах тоо</span>
              <div className="nn-choice-row">
                {choices.next.map((value) => (
                  <button
                    key={`next-${value}`}
                    type="button"
                    className={choiceClass('next', value)}
                    onClick={() => pick('next', value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`seq-check-btn${phase === 'wrong' ? ' seq-check-wrong' : ''}`}
            onClick={check}
            disabled={selected.previous == null || selected.next == null}
          >
            Шалгах
          </button>
        </>
      )}
    </div>
  )
}
