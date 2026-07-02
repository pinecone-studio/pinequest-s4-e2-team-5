// 1-р бодлого: 40 − 5 × 7 = ?  — багшийн заадаг арга, Minecraft блокоор.
// 1) ҮРЖИХ: 5 сагс × 7 блок. Хүүхэд 5×7-г мэдэхгүй тул 7+7+7+7+7 гэж
//    задалж, гүйх нийлбэрээр (7,14,21,28,35) тоолж заана.
// 2) ХАСАХ: 40 − 35 нь том тоо тул БАГАНАН бичлэгээр, ЗЭЭЛЭХ аргаар:
//    0 − 5 болохгүй → аравтаас 1 зээлнэ (4→3, 0→10) → 10 − 5 = 5, 3 − 3 = 0.
// 3) Хүүхэд 5-г дарангуут алга таших 👏 + баяр + урам.
import { useMemo, useState } from 'react'
import { CelebrationBurst } from './CelebrationBurst.jsx'
import { MinecraftBg } from './mcShared.jsx'
import { makeChoices } from './mcUtils.js'
import './minecraft-first-problem.css'

const TOTAL = 40
const GROUPS = 5
const PER = 7
const STOLEN = GROUPS * PER // 35
const LEFT = TOTAL - STOLEN // 5

const TILE = '/Minecraft1.png'
const HERO = '/block.png'
// Гүйх нийлбэр: 7, 14, 21, 28, 35 (7-оор тоолно)
const RUNNING = Array.from({ length: GROUPS }, (_, i) => PER * (i + 1))
// Блок хагарахад бутрах 7 алмазны чиглэл (тойрог хэлбэрээр)
const SPARKS = Array.from({ length: PER }, (_, j) => {
  const ang = (j / PER) * Math.PI * 2 - Math.PI / 2
  return { dx: Math.round(Math.cos(ang) * 36), dy: Math.round(Math.sin(ang) * 30) }
})

function Block({ style }) {
  return <img src={TILE} alt="" className="mfb-block" style={style} draggable={false} />
}

export function MinecraftFirstProblem({ onCorrect, onWrong, onDone, review = false }) {
  // review=true үед бодогдсон бодлогыг дахин үзэж байгаа тул шууд дууссан (хариутай) төлөв.
  const [phase, setPhase] = useState(review ? 'done' : 'mul') // 'mul' | 'sub' | 'done'
  const [subStep, setSubStep] = useState(0) // 0 танилцуулга · 1 зээлсэн · 2 нэгж асуух
  const [wrong, setWrong] = useState(null)

  const mulChoices = useMemo(() => makeChoices(STOLEN, [5, -5, 2, -2, 7, -7, 10, -10]), [])
  const onesChoices = useMemo(() => makeChoices(LEFT, [1, -1, 2, -2, 3, -3]), []) // ~4,5,6

  const pickMul = (n) => {
    if (n === STOLEN) { setWrong(null); onCorrect?.(); setPhase('sub'); setSubStep(0) }
    else { setWrong(n); onWrong?.(); setTimeout(() => setWrong(null), 700) }
  }
  const pickOnes = (n) => {
    if (n === LEFT) { setWrong(null); onCorrect?.(); setPhase('done'); onDone?.() }
    else { setWrong(n); onWrong?.(); setTimeout(() => setWrong(null), 700) }
  }

  // Баганан бичлэгийн төлөв
  const borrowed = phase === 'done' || subStep >= 1
  const onesTop = borrowed ? '10' : '0'

  return (
    <div className="mfp-root mfb-root">
      <MinecraftBg />

      <div className="mfb-title-row">
        <img src={HERO} alt="" className="mfb-hero" draggable={false} />
        <h2 className="mfp-title">Стивийн блокууд</h2>
        <img src={HERO} alt="" className="mfb-hero mfb-hero-2" draggable={false} />
      </div>

      <div className="mfp-equation">
        <span className="mfp-num">{TOTAL}</span>
        <span className="mfp-op">−</span>
        <span className={`mfp-group${phase === 'mul' ? ' mfp-hot' : ''}`}>
          <span className="mfp-num mfp-num-sm">{GROUPS}</span>
          <span className="mfp-op">×</span>
          <span className="mfp-num mfp-num-sm">{PER}</span>
        </span>
        <span className="mfp-op">=</span>
        <span className="mfp-ans">{phase === 'done' ? LEFT : '?'}</span>
      </div>

      {/* ── Алхам 1: ҮРЖИХ — сүхээр алмаз олборлоно ── */}
      {phase === 'mul' && (
        <div className="mfp-step">
          <div className="mine-scene">
            <img src="/gal.png" alt="" className="mine-lantern" draggable={false} />
            <img src="/sukh.png" alt="" className="mine-pick" draggable={false} />
            <div className="mine-row">
              {RUNNING.map((sum, i) => (
                <div className="mine-ore" key={i} style={{ '--i': i }}>
                  <img src="/lerobrine.png" alt="" className="mine-ore-img" draggable={false} />
                  {SPARKS.map((s, j) => (
                    <img
                      key={j}
                      src="/lerobrine.png"
                      alt=""
                      className="mine-spark"
                      style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, '--j': j }}
                      draggable={false}
                    />
                  ))}
                  <span className="mine-count">{sum}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mfp-mini mine-eq">
            <span className="mfp-num-sm">{GROUPS}</span>
            <span className="mfp-op">×</span>
            <span className="mfp-num-sm">{PER}</span>
            <span className="mfp-op">=</span>
            <span className="mfp-q">?</span>
          </div>

          <div className="mfp-choices">
            {mulChoices.map((n) => (
              <button key={n} type="button"
                className={`mfp-choice${wrong === n ? ' mfp-choice-wrong' : ''}`}
                onClick={() => pickMul(n)}>{n}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── Алхам 2: ХАСАХ = баганан бичлэг + зээлэх ── */}
      {phase === 'sub' && (
        <div className="mfp-step">
          {/* Баганан бичлэг */}
          <div className="mfb-col">
            <div className="mfb-col-head"><span>аравт</span><span>нэгж</span></div>
            <div className={`mfb-col-row${subStep === 0 ? ' mfb-col-hot' : ''}`}>
              <span className="mfb-cell">
                {borrowed && <span className="mfb-borrow-new">3</span>}
                <span className={borrowed ? 'mfb-borrow-old' : ''}>4</span>
              </span>
              <span className="mfb-cell mfb-cell-ones">
                {borrowed && <span className="mfb-borrow-new mfb-borrow-fly">1</span>}
                <span className={borrowed ? 'mfb-ten-grow' : ''}>{onesTop}</span>
              </span>
            </div>
            <div className="mfb-col-row">
              <span className="mfb-cell"><span className="mfb-minus">−</span>3</span>
              <span className="mfb-cell mfb-cell-ones">5</span>
            </div>
            <div className="mfb-col-line" />
            <div className="mfb-col-row mfb-col-result">
              <span className="mfb-cell">{phase === 'done' ? '0' : ''}</span>
              <span className="mfb-cell mfb-cell-ones">{phase === 'done' ? LEFT : ''}</span>
            </div>
          </div>

          {subStep === 0 && (
            <button className="mfb-next-btn" onClick={() => setSubStep(1)}>Зээлэх 👉</button>
          )}

          {subStep === 1 && (
            <button className="mfb-next-btn" onClick={() => setSubStep(2)}>Хасъя 👉</button>
          )}

          {subStep === 2 && (
            <>
              <div className="mfp-mini">
                <span className="mfp-num-sm">10</span>
                <span className="mfp-op">−</span>
                <span className="mfp-num-sm">5</span>
                <span className="mfp-op">=</span>
                <span className="mfp-q">?</span>
              </div>
              <div className="mfp-choices">
                {onesChoices.map((n) => (
                  <button key={n} type="button"
                    className={`mfp-choice${wrong === n ? ' mfp-choice-wrong' : ''}`}
                    onClick={() => pickOnes(n)}>{n}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Дуусгавар: алга таших + баяр ── */}
      {phase === 'done' && (
        <div className="mfp-step">
          <div className="mfb-grid mfb-grid-final">
            {[...Array(LEFT)].map((_, i) => (
              <Block key={i} style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          <div className="mfb-clap" aria-hidden="true">
            <span>👏</span><span>🎉</span><span>👏</span>
          </div>
          <div className="mfp-done">
            <p className="mfp-success">
              🌟 Чи чадлаа! <b>40 − 5 × 7 = {LEFT}</b>. Эхлээд үржиж, дараа нь зээлж хассан — маш зөв!
            </p>
            <CelebrationBurst />
          </div>
        </div>
      )}
    </div>
  )
}

export default MinecraftFirstProblem
