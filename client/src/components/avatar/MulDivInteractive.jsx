// Үржих ба хуваах — бүлэглэсэн зурагтай, тайлбартай, СОНГОЛТООР (бичихгүй).
//  • Үржих a × b : "a бүлэг, тус бүр b ширхэг" → нийт. Дахин нэмэхээр бас харуулна.
//  • Хуваах a ÷ b: "a ширхэгийг b бүлэгт тэнцүү хуваа" → нэг бүлэгт хэд.
import { useMemo, useState } from 'react'
import { COLORS } from '../lesson/NumberVisual.jsx'
import { CelebrationBurst } from './CelebrationBurst.jsx'

const numColor = (n) => COLORS[n] ?? COLORS[((Math.abs(n) - 1) % 10) + 1] ?? '#7e8bff'

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
  for (const d of [1, -1, 2, -2, 3, -3, answer, -answer]) {
    const v = answer + d
    if (v >= 0 && v !== answer) set.add(v)
    if (set.size >= 3) break
  }
  let guard = 1
  while (set.size < 3) set.add(answer + guard++)
  return shuffle([...set].slice(0, 3))
}

function Cubes({ count, color }) {
  return (
    <div className="md-cubes">
      {[...Array(Math.max(0, count))].map((_, i) => (
        <span key={i} className="md-cube" style={{ '--c': color }} />
      ))}
    </div>
  )
}

export function MulDivInteractive({ problem, op, onCorrect, onWrong }) {
  const [a, b] = useMemo(() => (problem.operands ?? []).map(Number), [problem])
  const isMul = op === '*'
  const answer = isMul ? a * b : (b !== 0 ? a / b : 0)
  const choices = useMemo(() => makeChoices(answer), [answer])

  const [phase, setPhase] = useState('choosing')
  const [wrongPick, setWrongPick] = useState(null)

  const pick = (n) => {
    if (phase === 'correct') return
    if (n === answer) { setWrongPick(null); setPhase('correct'); onCorrect?.() }
    else { setWrongPick(n); onWrong?.(); setTimeout(() => setWrongPick(null), 700) }
  }

  // Үржих: a бүлэг, тус бүр b ширхэг. Хуваах: b бүлэг, зөв бол тус бүр a/b.
  const groupCount = isMul ? a : b
  const perGroup = isMul ? b : (phase === 'correct' ? answer : 0)

  return (
    <div className="md-root">
      <div className="vm-word-prompt">
        {problem.promptMn ||
          (isMul
            ? `${a} бүлэг, тус бүрт нь ${b} ширхэг — нийт хэдэн ширхэг вэ?`
            : `${a} ширхэгийг ${b} бүлэгт тэнцүү хуваа — нэг бүлэгт хэд ногдох вэ?`)}
      </div>

      <div className="md-equation">
        <span className="md-eq-num">{a}</span>
        <span className="md-eq-op">{isMul ? '×' : '÷'}</span>
        <span className="md-eq-num">{b}</span>
        <span className="md-eq-op">=</span>
        <span className={`md-eq-ans${phase === 'correct' ? ' md-eq-ans-on' : ''}`}>
          {phase === 'correct' ? answer : '?'}
        </span>
      </div>

      <div className="md-groups" aria-label={isMul ? 'Бүлгүүд' : 'Хуваах бүлгүүд'}>
        {[...Array(Math.max(0, groupCount))].map((_, g) => (
          <div key={g} className={`md-group${!isMul && phase !== 'correct' ? ' md-group-empty' : ''}`}>
            <Cubes count={perGroup} color={numColor(isMul ? b : (g % 9) + 1)} />
          </div>
        ))}
      </div>

      {/* Тайлбар: үржих → дахин нэмэх; хуваах → тэнцүү хуваарилах */}
      <div className="md-hint">
        {isMul
          ? `${Array(Math.max(0, Math.min(a, 12))).fill(b).join(' + ')} = ?`
          : `${a} ÷ ${b} — ${b} бүлэгт адилхан хуваана`}
      </div>

      {phase === 'correct' ? (
        <div className="seq-success">
          Зөв! {a} {isMul ? '×' : '÷'} {b} = {answer}.
          <CelebrationBurst />
        </div>
      ) : (
        <div className="vm-choice-grid md-choice-grid">
          {choices.map((n) => (
            <button
              key={n}
              type="button"
              className={`vm-choice-btn md-choice-btn${wrongPick === n ? ' vm-choice-wrong' : ''}`}
              onClick={() => pick(n)}
            >
              <span className="md-choice-num">{n}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
