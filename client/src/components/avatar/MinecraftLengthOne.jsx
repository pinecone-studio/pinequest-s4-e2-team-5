// Нэг "нэртэй тоо" (урт) бодлого — Minecraft шоогоор.
//   • 1 дм = 10 см гэдгийг эхэнд хөөрхөн харуулна (10 шоо = 1 дм).
//   • "5 дм = ? см"  → 5 эгнээ × 10 шоо, 10-аар тоолж 50.
//   • "35 см = ? дм ? см" → 35 шоог 10-ын багцад хувааж 3 дм 5 см.
import { useMemo, useState } from 'react'
import { CelebrationBurst } from './CelebrationBurst.jsx'
import { MinecraftBg } from './mcShared.jsx'
import { makeChoices } from './mcUtils.js'
import { parseLength } from './problemNormalizer.js'
import './minecraft-first-problem.css'

const TILE = '/Minecraft1.png'

function Cube({ style, className = '' }) {
  return <img src={TILE} alt="" className={`mcl2-cube ${className}`} style={style} draggable={false} />
}

/* Дүрэм: 1 дм = 10 см (10 шоо = 1 дм) */
function RuleBanner() {
  return (
    <div className="mcl2-rule">
      <span className="mcl2-rule-dm">1 дм</span>
      <span className="mcl2-eq">=</span>
      <span className="mcl2-rule-cubes">
        {[...Array(10)].map((_, i) => <Cube key={i} style={{ animationDelay: `${i * 0.03}s` }} />)}
      </span>
      <span className="mcl2-eq">=</span>
      <span className="mcl2-rule-cm">10 см</span>
    </div>
  )
}

function Choices({ list, wrong, onPick }) {
  return (
    <div className="mfp-choices">
      {list.map((n) => (
        <button key={n} type="button"
          className={`mfp-choice${wrong === n ? ' mfp-choice-wrong' : ''}`}
          onClick={() => onPick(n)}>{n}</button>
      ))}
    </div>
  )
}

export function MinecraftLengthOne({ problem, onCorrect, onWrong, review = false }) {
  const info = useMemo(() => parseLength(problem.raw), [problem.raw])
  // review=true үед бодогдсон бодлогыг дахин үзэж байгаа тул шууд дууссан (хариутай) төлөв.
  const [phase, setPhase] = useState(review ? 'done' : 'q1') // q1 → (q2) → done
  const [wrong, setWrong] = useState(null)

  // Тоонуудыг найдвартай авах
  const totalCm = info?.totalCm ?? 0
  const isDecompose = info?.mode === 'decompose'
  const toCm = info?.mode === 'convert' && info?.unit === 'см' // дм → см
  const dmCount = Math.floor(totalCm / 10)
  const cmRem = totalCm % 10

  const convertAns = info?.answer ?? (toCm ? totalCm : dmCount)
  const c1 = useMemo(() => makeChoices(isDecompose ? dmCount : convertAns, isDecompose ? [1, -1, 2, -2] : [10, -10, 5, -5]), [isDecompose, dmCount, convertAns])
  const c2 = useMemo(() => makeChoices(cmRem, [1, -1, 2, -2, 3, -3]), [cmRem])

  if (!info) {
    return (
      <div className="mfp-root mcc-single"><MinecraftBg />
        <div className="mcc-body"><p className="mfp-prompt">{problem.raw}</p></div>
      </div>
    )
  }

  const wrongFlash = (n) => { setWrong(n); onWrong?.(); setTimeout(() => setWrong(null), 700) }

  const pickConvert = (n) => {
    if (n === convertAns) { setWrong(null); setPhase('done'); onCorrect?.() }
    else wrongFlash(n)
  }
  const pickDm = (n) => {
    if (n === dmCount) { setWrong(null); setPhase('q2') }
    else wrongFlash(n)
  }
  const pickCm = (n) => {
    if (n === cmRem) { setWrong(null); setPhase('done'); onCorrect?.() }
    else wrongFlash(n)
  }

  return (
    <div className="mfp-root mcc-single">
      <MinecraftBg />
      <div className="mcc-body">
        <h2 className="mfp-title">Блокоор хэмжье 📏</h2>
        <RuleBanner />

        {/* ── ДҮ → СМ (5 дм = ? см) ── */}
        {!isDecompose && toCm && (
          <>
            <div className="mfp-equation">
              <span className="mfp-num">{dmCount}</span><span className="mfp-op">дм</span>
              <span className="mfp-op">=</span>
              <span className="mfp-ans">{phase === 'done' ? convertAns : '?'}</span><span className="mfp-op">см</span>
            </div>
            <div className="mcl2-rows">
              {[...Array(dmCount)].map((_, r) => (
                <div className="mcl2-rod" key={r}>
                  {[...Array(10)].map((_, i) => <Cube key={i} style={{ animationDelay: `${(r * 10 + i) * 0.015}s` }} />)}
                  <span className="mcl2-rod-lbl">{(r + 1) * 10}</span>
                </div>
              ))}
            </div>
            {phase === 'done' ? (
              <div className="mfp-done">
                <p className="mfp-success">🎉 Зөв! <b>{dmCount} дм = {convertAns} см</b>. Дм бүр 10 см!</p>
                <CelebrationBurst />
              </div>
            ) : (
              <>
                <p className="mfp-prompt mcl2-hint">{dmCount} эгнээ бий, тус бүр 10 см. 10-аар тоол: нийт хэдэн см вэ?</p>
                <Choices list={c1} wrong={wrong} onPick={pickConvert} />
              </>
            )}
          </>
        )}

        {/* ── СМ → ДМ энгийн хөрвүүлэлт (ж: 50 см = ? дм) ── */}
        {!isDecompose && !toCm && (
          <>
            <div className="mfp-equation">
              <span className="mfp-num">{totalCm}</span><span className="mfp-op">см</span>
              <span className="mfp-op">=</span>
              <span className="mfp-ans">{phase === 'done' ? convertAns : '?'}</span><span className="mfp-op">дм</span>
            </div>
            <div className="mcl2-groups">
              {[...Array(dmCount)].map((_, g) => (
                <div className="mcl2-box" key={g}>
                  {[...Array(10)].map((_, i) => <Cube key={i} />)}
                  <span className="mcl2-box-lbl">1 дм</span>
                </div>
              ))}
            </div>
            {phase === 'done' ? (
              <div className="mfp-done">
                <p className="mfp-success">🎉 Зөв! <b>{totalCm} см = {convertAns} дм</b>.</p>
                <CelebrationBurst />
              </div>
            ) : (
              <>
                <p className="mfp-prompt mcl2-hint">10-ын багц хэд байна вэ? (= хэдэн дм)</p>
                <Choices list={c1} wrong={wrong} onPick={pickConvert} />
              </>
            )}
          </>
        )}

        {/* ── Задлах (35 см = ? дм ? см) ── */}
        {isDecompose && (
          <>
            <div className="mfp-equation">
              <span className="mfp-num">{totalCm}</span><span className="mfp-op">см</span>
              <span className="mfp-op">=</span>
              <span className={`mfp-ans${phase !== 'q1' ? ' mcl2-filled' : ''}`}>{phase !== 'q1' ? dmCount : '?'}</span>
              <span className="mfp-op">дм</span>
              <span className={`mfp-ans${phase === 'done' ? ' mcl2-filled' : ''}`}>{phase === 'done' ? cmRem : '?'}</span>
              <span className="mfp-op">см</span>
            </div>
            <div className="mcl2-groups">
              {[...Array(dmCount)].map((_, g) => (
                <div className={`mcl2-box${phase === 'q1' ? ' mcl2-hot' : ''}`} key={g}>
                  {[...Array(10)].map((_, i) => <Cube key={i} />)}
                  <span className="mcl2-box-lbl">1 дм</span>
                </div>
              ))}
              {cmRem > 0 && (
                <div className={`mcl2-loose${phase === 'q2' ? ' mcl2-hot' : ''}`}>
                  {[...Array(cmRem)].map((_, i) => <Cube key={i} />)}
                  <span className="mcl2-box-lbl">сул см</span>
                </div>
              )}
            </div>
            {phase === 'q1' && (
              <>
                <p className="mfp-prompt mcl2-hint">Бүтэн <b>10-ын багц</b> хэд байна вэ? (= хэдэн дм)</p>
                <Choices list={c1} wrong={wrong} onPick={pickDm} />
              </>
            )}
            {phase === 'q2' && (
              <>
                <p className="mfp-prompt mcl2-hint"><b>{dmCount} дм</b> авсны дараа үлдсэн сул шоо хэд вэ? (= хэдэн см)</p>
                <Choices list={c2} wrong={wrong} onPick={pickCm} />
              </>
            )}
            {phase === 'done' && (
              <div className="mfp-done">
                <p className="mfp-success">🎉 Зөв! <b>{totalCm} см = {dmCount} дм {cmRem} см</b>.</p>
                <CelebrationBurst />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default MinecraftLengthOne
