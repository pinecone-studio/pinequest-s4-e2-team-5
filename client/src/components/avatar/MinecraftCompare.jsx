// Нэг харьцуулах бодлого ( a ? b ) — аравт/нэгж Minecraft шоогоор.
// Хэрэв нэг тал нь илэрхийлэл (ж: "9 + 5 ? 15") бол хүүхэд ТҮРҮҮЛЖ өөрөө бодоод,
// дараа нь харьцуулна (шууд хариу өгөхгүй).
import { useMemo, useState } from 'react'
import { CelebrationBurst } from './CelebrationBurst.jsx'
import { MinecraftBg } from './mcShared.jsx'
import { makeChoices } from './mcUtils.js'
import './minecraft-first-problem.css'

const TILE = '/Minecraft1.png'
const TENBLOCK = '/block.png'
const SIGNS = ['<', '>', '=']
const signOf = (a, b) => (a < b ? '<' : a > b ? '>' : '=')

function normOp(o) {
  return o === '−' ? '-' : o === '×' || o === 'x' || o === 'х' ? '*' : o === '÷' ? '/' : o
}
function compute(a, op, b) {
  return op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : b !== 0 ? a / b : null
}

function Cube({ style }) {
  return <img src={TILE} alt="" className="mcc-cube" style={style} draggable={false} />
}

// "9 + 5" гэх мэт талыг задлана; дан тоо бол expr=false.
function parseSide(str) {
  const s = String(str ?? '').trim()
  const m = s.match(/^(-?\d+)\s*([+\-−*×/÷xх])\s*(-?\d+)$/)
  if (m) {
    const a = Number(m[1]); const op = normOp(m[2]); const b = Number(m[3])
    const value = compute(a, op, b)
    if (value != null) return { expr: true, a, op, b, value }
  }
  if (/^-?\d+$/.test(s)) return { expr: false, value: Number(s) }
  return null
}

// raw ("9 + 5 ? 15" эсвэл "77 ? 57")-аас заах илэрхийлэлтэй талыг олно.
function findTeach(raw) {
  const parts = String(raw ?? '').split(/[?<>=○◯]/).map((p) => p.trim()).filter(Boolean)
  if (parts.length === 2) {
    const l = parseSide(parts[0])
    const r = parseSide(parts[1])
    if (l?.expr) return { side: 'left', ...l }
    if (r?.expr) return { side: 'right', ...r }
  }
  return null
}

/* Аравтын блок: block.png дээр "10" тэмдэгтэй (1 блок = 10) */
function TenBlock({ style }) {
  return (
    <span className="mcc-ten" style={style}>
      <img src={TENBLOCK} alt="" className="mcc-ten-img" draggable={false} />
      <span className="mcc-ten-badge">10</span>
    </span>
  )
}

/* Тоог аравт (10-тай блок) + нэгж (сул шоо) болгож харуулна */
function PlaceValue({ value, decide }) {
  const tens = Math.floor(value / 10)
  const ones = value % 10
  return (
    <div className="mcc-pv">
      <div className="mcc-pv-num">{value}</div>
      <div className="mcc-pv-row">
        <div className={`mcc-zone${decide === 'tens' ? ' mcc-zone-hot' : ''}`}>
          <div className="mcc-tens-grid">
            {[...Array(tens)].map((_, i) => (
              <TenBlock key={i} style={{ animationDelay: `${i * 0.06}s` }} />
            ))}
          </div>
          <span className="mcc-zone-label">аравт: {tens}</span>
        </div>
        <div className={`mcc-zone mcc-zone-ones${decide === 'ones' ? ' mcc-zone-hot' : ''}`}>
          <div className="mcc-ones-grid">
            {[...Array(ones)].map((_, i) => (
              <Cube key={i} style={{ animationDelay: `${i * 0.05}s` }} />
            ))}
          </div>
          <span className="mcc-zone-label">нэгж: {ones}</span>
        </div>
      </div>
    </div>
  )
}

const OP_SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' }

export function MinecraftCompare({ problem, onCorrect, onWrong }) {
  const [a, b] = (problem.operands ?? [0, 0]).map(Number)
  const answer = problem.answer != null ? (problem.answer === -1 ? '<' : problem.answer === 1 ? '>' : problem.answer === 0 ? '=' : signOf(a, b)) : signOf(a, b)
  const teach = useMemo(() => findTeach(problem.raw), [problem.raw])

  const [added, setAdded] = useState(false) // илэрхийлэлтэй талыг бодсон эсэх
  const [solved, setSolved] = useState(false)
  const [wrong, setWrong] = useState(null)

  const addChoices = useMemo(() => (teach ? makeChoices(teach.value, [1, -1, 2, -2]) : []), [teach])
  const needAdd = teach && !added

  const decide = Math.floor(a / 10) !== Math.floor(b / 10) ? 'tens' : 'ones'

  const pickAdd = (n) => {
    if (n === teach.value) { setWrong(null); setAdded(true) }
    else { setWrong(n); onWrong?.(); setTimeout(() => setWrong(null), 700) }
  }
  const pickSign = (s) => {
    if (solved) return
    if (s === answer) { setWrong(null); setSolved(true); onCorrect?.() }
    else { setWrong(s); onWrong?.(); setTimeout(() => setWrong(null), 700) }
  }

  if (needAdd) {
    return (
      <div className="mfp-root mcc-single">
        <MinecraftBg />
        <div className="mcc-body">
        <h2 className="mfp-title">Эхлээд бодъё! ➕</h2>
        <p className="mfp-prompt">
          Жишихээсээ өмнө <b>{teach.a} {OP_SYM[teach.op]} {teach.b}</b>-г ӨӨРӨӨ бод. (Шууд хариу битгий хараарай 😊)
        </p>
        <div className="mcc-add">
          <div className="mcc-add-grp">
            {[...Array(Math.max(0, teach.a))].map((_, i) => <Cube key={i} style={{ animationDelay: `${i * 0.04}s` }} />)}
            <span className="mcc-add-lbl">{teach.a}</span>
          </div>
          <span className="mcc-add-plus">{OP_SYM[teach.op]}</span>
          <div className="mcc-add-grp mcc-add-grp2">
            {[...Array(Math.max(0, teach.b))].map((_, i) => <Cube key={i} style={{ animationDelay: `${i * 0.04}s` }} />)}
            <span className="mcc-add-lbl">{teach.b}</span>
          </div>
        </div>
        {teach.op === '+' && teach.a >= 5 && teach.b >= 5 && (
          <p className="mfp-prompt mcc-tip">
            💡 Санаа: <b>{teach.a} дээр {10 - teach.a}</b> нэмбэл 10. Нөгөөгөөс {10 - teach.a} аваад 10 бол — үлдсэнийг нэм.
          </p>
        )}
        <div className="mfp-mini">
          <span className="mfp-num-sm">{teach.a}</span><span className="mfp-op">{OP_SYM[teach.op]}</span>
          <span className="mfp-num-sm">{teach.b}</span><span className="mfp-op">=</span>
          <span className="mfp-q">?</span>
        </div>
        <div className="mfp-choices">
          {addChoices.map((n) => (
            <button key={n} type="button"
              className={`mfp-choice${wrong === n ? ' mfp-choice-wrong' : ''}`}
              onClick={() => pickAdd(n)}>{n}</button>
          ))}
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mfp-root mcc-single">
      <MinecraftBg />
      <div className="mcc-body">
      <h2 className="mfp-title">Аль нь их вэ? ⛏️</h2>

      {teach && (
        <p className="mfp-prompt mcc-solved-add">
          ✓ Чи бодлоо: <b>{teach.a} {OP_SYM[teach.op]} {teach.b} = {teach.value}</b>. Одоо жишье!
        </p>
      )}

      <div className="mcc-compare">
        <PlaceValue value={a} decide={decide} />
        <span className={`mcc-sign-big${solved ? ' mcc-sign-on' : ''}`}>{solved ? answer : '?'}</span>
        <PlaceValue value={b} decide={decide} />
      </div>

      {solved ? (
        <div className="mfp-done">
          <p className="mfp-success">🎉 Зөв! {a} {answer} {b}.</p>
          <CelebrationBurst />
        </div>
      ) : (
        <>
          <p className="mfp-prompt mcc-hint-line">
            {decide === 'tens'
              ? '👉 Эхлээд АРАВТ-ыг жиш: аль олон аравттай вэ?'
              : '👉 Аравт тэнцүү байна — НЭГЖ-ийг жиш!'}
          </p>
          <div className="mcc-signs">
            {SIGNS.map((s) => (
              <button key={s} type="button"
                className={`mcc-sign-btn${wrong === s ? ' mfp-choice-wrong' : ''}`}
                onClick={() => pickSign(s)} disabled={solved}>{s}</button>
            ))}
          </div>
          <div className="mcc-legend"><span>‹ бага</span><span>› их</span><span>= тэнцүү</span></div>
        </>
      )}
      </div>
    </div>
  )
}

export default MinecraftCompare
