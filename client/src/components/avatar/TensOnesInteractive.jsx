import { useMemo, useState } from 'react'
import { StaticTile, COLORS, TEN_COLORS } from '../lesson/NumberVisual.jsx'
import { CelebrationBurst } from './CelebrationBurst.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* нэг оронгийн цифрийн сонголтууд (0-9 хооронд, зөв + хөрш) */
function digitChoices(correct) {
  const set = new Set([correct])
  for (const d of [1, -1, 2, -2, 3, -3]) {
    const v = correct + d
    if (v >= 0 && v <= 9) set.add(v)
    if (set.size >= 4) break
  }
  return shuffle([...set].slice(0, 4))
}

function inferTarget(problem) {
  const fromOps = Number(problem.operands?.[0])
  if (Number.isFinite(fromOps)) return fromOps
  if (Array.isArray(problem.answer)) {
    const t = Number(problem.answer[0])
    const o = Number(problem.answer[1])
    if (Number.isFinite(t) && Number.isFinite(o)) return t * 10 + o
  }
  const raw = String(problem.raw ?? problem.promptMn ?? '').match(/\d+/)?.[0]
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

export function TensOnesInteractive({ problem, onCorrect, onWrong }) {
  const target = inferTarget(problem)
  const correctTens = Array.isArray(problem.answer)
    ? Number(problem.answer[0])
    : Math.floor(target / 10)
  const correctOnes = Array.isArray(problem.answer)
    ? Number(problem.answer[1])
    : target % 10

  const tensChoices = useMemo(() => digitChoices(correctTens), [correctTens])
  const onesChoices = useMemo(() => digitChoices(correctOnes), [correctOnes])

  const [sel, setSel] = useState({ tens: null, ones: null })
  const [phase, setPhase] = useState('choosing')
  const [wrongKey, setWrongKey] = useState(null)

  const pick = (key, value) => {
    if (phase === 'correct') return
    setSel((prev) => ({ ...prev, [key]: value }))
    if (wrongKey === key) setWrongKey(null)
  }

  const check = () => {
    if (sel.tens === correctTens && sel.ones === correctOnes) {
      setPhase('correct')
      setWrongKey(null)
      onCorrect?.()
      return
    }
    setPhase('wrong')
    setWrongKey(sel.tens !== correctTens ? 'tens' : 'ones')
    setTimeout(() => setPhase('choosing'), 850)
    onWrong?.()
  }

  const slotClass = (key) => {
    if (phase === 'correct') return 'to-slot to-slot-correct'
    if (wrongKey === key && phase === 'wrong') return 'to-slot to-slot-wrong'
    return sel[key] == null ? 'to-slot' : 'to-slot to-slot-filled'
  }

  const choiceClass = (key, value) =>
    `to-choice${sel[key] === value ? ' to-choice-selected' : ''}` +
    `${phase === 'correct' && value === (key === 'tens' ? correctTens : correctOnes) ? ' to-choice-correct' : ''}`

  // Сонгосон блокуудын урьдчилсан харагдац
  const showTens = sel.tens ?? 0
  const showOnes = sel.ones ?? 0

  return (
    <div className="to-root">
      <div className="vm-word-prompt">
        {problem.promptMn || `${target} тоо хэдэн аравт, хэдэн нэгжээс бүрдэх вэ?`}
      </div>

      <div className="to-number">{target}</div>

      {/* Угсарч буй блокууд */}
      <div className="to-build" aria-label="Аравт нэгж блокууд">
        <div className="to-build-col">
          <span className="to-build-label">Аравт</span>
          <div className="to-build-blocks">
            {showTens > 0
              ? [...Array(showTens)].map((_, i) => (
                  <StaticTile key={i} value={10} color={TEN_COLORS[i % TEN_COLORS.length]} small />
                ))
              : <span className="to-build-empty">?</span>}
          </div>
        </div>
        <span className="to-plus">+</span>
        <div className="to-build-col">
          <span className="to-build-label">Нэгж</span>
          <div className="to-build-blocks">
            {showOnes > 0
              ? <StaticTile value={showOnes} color={COLORS[showOnes] ?? '#80b7c7'} />
              : <span className="to-build-empty">?</span>}
          </div>
        </div>
      </div>

      {/* Сонгосон тоонууд */}
      <div className="to-answer-row">
        <div className={slotClass('tens')}>{sel.tens == null ? '?' : sel.tens}</div>
        <span className="to-answer-word">аравт</span>
        <div className={slotClass('ones')}>{sel.ones == null ? '?' : sel.ones}</div>
        <span className="to-answer-word">нэгж</span>
      </div>

      {phase === 'correct' ? (
        <div className="seq-success">
          Зөв! {target} = {correctTens} аравт {correctOnes} нэгж.
          <CelebrationBurst />
        </div>
      ) : (
        <>
          <div className="to-choice-panel">
            <div className="to-choice-group">
              <span className="to-choice-title">Хэдэн аравт?</span>
              <div className="to-choice-row">
                {tensChoices.map((v) => (
                  <button
                    key={`t-${v}`}
                    type="button"
                    className={choiceClass('tens', v)}
                    onClick={() => pick('tens', v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="to-choice-group">
              <span className="to-choice-title">Хэдэн нэгж?</span>
              <div className="to-choice-row">
                {onesChoices.map((v) => (
                  <button
                    key={`o-${v}`}
                    type="button"
                    className={choiceClass('ones', v)}
                    onClick={() => pick('ones', v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`seq-check-btn${phase === 'wrong' ? ' seq-check-wrong' : ''}`}
            onClick={check}
            disabled={sel.tens == null || sel.ones == null}
          >
            Шалгах
          </button>
        </>
      )}
    </div>
  )
}
