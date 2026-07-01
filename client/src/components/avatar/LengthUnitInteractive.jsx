// Урт хэмжигдэхүүн (см/дм). 1 дм = 10 см.
//  • decompose: "26 = ... дм ... см" → хэдэн дм, хэдэн см
//  • convert:   "2 дм + 7 см = ... см" → нийт хэдэн см
// Бүх алхам блокоор харагдаж, СОНГОЛТООР бодогдоно (бичихгүй).
import { useMemo, useState } from 'react'
import { StaticTile, COLORS, TEN_COLORS } from '../lesson/NumberVisual.jsx'
import { CelebrationBurst } from './CelebrationBurst.jsx'
import { parseLength } from './problemNormalizer.js'

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
  for (const d of [1, -1, 2, -2, 3, -3, 10, -10, 5, -5]) {
    const v = answer + d
    if (v >= 0) set.add(v)
    if (set.size >= 3) break
  }
  return shuffle([...set].slice(0, 3))
}

function digitChoices(correct) {
  const set = new Set([correct])
  for (const d of [1, -1, 2, -2, 3, -3]) {
    const v = correct + d
    if (v >= 0 && v <= 9) set.add(v)
    if (set.size >= 4) break
  }
  return shuffle([...set].slice(0, 4))
}

/* дм-г 10 см-ийн саваа, см-г бие даасан шоо болгон харуулна */
function LengthBlocks({ dm, cm }) {
  return (
    <div className="lu-blocks">
      {dm > 0 && (
        <div className="lu-group">
          <div className="lu-group-tiles">
            {[...Array(dm)].map((_, i) => (
              <StaticTile key={i} value={10} color={TEN_COLORS[i % TEN_COLORS.length]} small />
            ))}
          </div>
          <span className="lu-group-cap">{dm} дм = {dm * 10} см</span>
        </div>
      )}
      {cm > 0 && (
        <div className="lu-group">
          <div className="lu-group-tiles">
            <StaticTile value={cm} color={COLORS[cm] ?? '#80b7c7'} />
          </div>
          <span className="lu-group-cap">{cm} см</span>
        </div>
      )}
    </div>
  )
}

function ConvertMode({ data, problem, onCorrect, onWrong }) {
  const choices = useMemo(() => makeChoices(data.answer), [data.answer])
  const [phase, setPhase] = useState('choosing')
  const [wrongPick, setWrongPick] = useState(null)

  const dm = data.parts.filter((p) => p.unit === 'дм').reduce((s, p) => s + p.n, 0)
  const cm = data.parts.filter((p) => p.unit === 'см').reduce((s, p) => s + p.n, 0)

  const pick = (n) => {
    if (phase === 'correct') return
    if (n === data.answer) { setWrongPick(null); setPhase('correct'); onCorrect?.() }
    else { setWrongPick(n); onWrong?.(); setTimeout(() => setWrongPick(null), 700) }
  }

  return (
    <div className="lu-root">
      <div className="vm-word-prompt">
        {problem.promptMn || `Нийт хэдэн ${data.unit} болохыг ол?`}
      </div>
      <div className="lu-hint">1 дм = 10 см 📏</div>

      <div className="lu-parts">
        {data.parts.map((p, i) => (
          <span key={i} className="lu-part">{p.n} {p.unit}</span>
        )).reduce((acc, el, i) => (i === 0 ? [el] : [...acc, <span key={`p${i}`} className="lu-plus">+</span>, el]), [])}
      </div>

      <LengthBlocks dm={dm} cm={cm} />

      <div className="lu-mini">
        <span className="lu-mini-num">{dm * 10}</span>
        <span className="lu-plus">+</span>
        <span className="lu-mini-num">{cm}</span>
        <span className="lu-plus">=</span>
        <span className="lu-q">?</span>
        <span className="lu-unit">{data.unit}</span>
      </div>

      {phase === 'correct' ? (
        <div className="seq-success">
          Зөв! Хариу нь {data.answer} {data.unit}.
          <CelebrationBurst />
        </div>
      ) : (
        <div className="vm-choice-grid lu-choice-grid">
          {choices.map((n) => (
            <button
              key={n}
              type="button"
              className={`vm-choice-btn lu-choice-btn${wrongPick === n ? ' vm-choice-wrong' : ''}`}
              onClick={() => pick(n)}
            >
              <span className="lu-choice-num">{n} {data.unit}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DecomposeMode({ data, problem, onCorrect, onWrong }) {
  const dmChoices = useMemo(() => digitChoices(data.dm), [data.dm])
  const cmChoices = useMemo(() => digitChoices(data.cm), [data.cm])
  const [sel, setSel] = useState({ dm: null, cm: null })
  const [phase, setPhase] = useState('choosing')
  const [wrongKey, setWrongKey] = useState(null)

  const pickChoice = (key, value) => {
    if (phase === 'correct') return
    setSel((prev) => ({ ...prev, [key]: value }))
    if (wrongKey === key) setWrongKey(null)
  }

  const check = () => {
    if (sel.dm === data.dm && sel.cm === data.cm) {
      setPhase('correct'); setWrongKey(null); onCorrect?.(); return
    }
    setPhase('wrong')
    setWrongKey(sel.dm !== data.dm ? 'dm' : 'cm')
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
    `${phase === 'correct' && value === data[key] ? ' to-choice-correct' : ''}`

  return (
    <div className="to-root">
      <div className="vm-word-prompt">
        {problem.promptMn || `${data.totalCm} см хэдэн дм, хэдэн см болох вэ?`}
      </div>
      <div className="lu-hint">1 дм = 10 см 📏</div>

      <div className="to-number">{data.totalCm} см</div>

      <LengthBlocks dm={sel.dm ?? 0} cm={sel.cm ?? 0} />

      <div className="to-answer-row">
        <div className={slotClass('dm')}>{sel.dm == null ? '?' : sel.dm}</div>
        <span className="to-answer-word">дм</span>
        <div className={slotClass('cm')}>{sel.cm == null ? '?' : sel.cm}</div>
        <span className="to-answer-word">см</span>
      </div>

      {phase === 'correct' ? (
        <div className="seq-success">
          Зөв! {data.totalCm} см = {data.dm} дм {data.cm} см.
          <CelebrationBurst />
        </div>
      ) : (
        <>
          <div className="to-choice-panel">
            <div className="to-choice-group">
              <span className="to-choice-title">Хэдэн дм? (10 см)</span>
              <div className="to-choice-row">
                {dmChoices.map((v) => (
                  <button key={`d-${v}`} type="button" className={choiceClass('dm', v)} onClick={() => pickChoice('dm', v)}>{v}</button>
                ))}
              </div>
            </div>
            <div className="to-choice-group">
              <span className="to-choice-title">Хэдэн см?</span>
              <div className="to-choice-row">
                {cmChoices.map((v) => (
                  <button key={`c-${v}`} type="button" className={choiceClass('cm', v)} onClick={() => pickChoice('cm', v)}>{v}</button>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            className={`seq-check-btn${phase === 'wrong' ? ' seq-check-wrong' : ''}`}
            onClick={check}
            disabled={sel.dm == null || sel.cm == null}
          >
            Шалгах
          </button>
        </>
      )}
    </div>
  )
}

export function LengthUnitInteractive({ problem, onCorrect, onWrong }) {
  const data = useMemo(() => parseLength(problem.raw), [problem.raw])
  if (!data) {
    return (
      <div className="lu-root">
        <div className="vm-word-prompt">{problem.promptMn || problem.raw}</div>
      </div>
    )
  }
  return data.mode === 'decompose'
    ? <DecomposeMode data={data} problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
    : <ConvertMode data={data} problem={problem} onCorrect={onCorrect} onWrong={onWrong} />
}
