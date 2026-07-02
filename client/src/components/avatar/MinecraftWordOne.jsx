// Нэг үгэн бодлого — Minecraft номын сангийн түүхээр.
//   "Сумьяа 5 ном, Амгалан 6-аар олон уншив" → «олон» = НЭМЭХ → 5 + 6 = 11.
//   raw-аас 2 тоог олоод, хариу нь нийлбэр бол НЭМЭХ, зөрүү бол ХАСАХ гэж заана.
import { useMemo, useState } from 'react'
import { CelebrationBurst } from './CelebrationBurst.jsx'
import { MinecraftBg } from './mcShared.jsx'
import { makeChoices, extractStory } from './mcUtils.js'
import './minecraft-first-problem.css'

export function MinecraftWordOne({ problem, onCorrect, onWrong, review = false }) {
  const story = useMemo(() => extractStory(problem), [problem])
  // review=true үед бодогдсон бодлогыг дахин үзэж байгаа тул шууд дууссан (хариутай) төлөв.
  const [phase, setPhase] = useState(review ? 'done' : 'q') // 'q' | 'done'
  const [wrong, setWrong] = useState(null)

  const total = story?.total ?? (Number(problem?.answer) || 0)
  const choices = useMemo(() => makeChoices(total, [1, -1, 2, -2, 3, -3]), [total])

  const pick = (n) => {
    if (n === total) { setWrong(null); setPhase('done'); onCorrect?.() }
    else { setWrong(n); onWrong?.(); setTimeout(() => setWrong(null), 700) }
  }

  if (!story) {
    // Хоёр тоо олдоогүй бол зөвхөн хариуг сонгуулна (энгийн fallback)
    return (
      <div className="mfp-root mcc-single">
        <MinecraftBg />
        <div className="mcc-body">
          <h2 className="mfp-title">Бодлого 📚</h2>
          <p className="mfp-prompt mcw2-story">{problem?.promptMn || problem?.raw}</p>
          <div className="mfp-choices">
            {choices.map((n) => (
              <button key={n} type="button"
                className={`mfp-choice${wrong === n ? ' mfp-choice-wrong' : ''}`}
                onClick={() => pick(n)}>{n}</button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const { op, a, b } = story
  const isAdd = op === 'add'
  // Хасах үед: a номноос b-г авна. Нэмэх үед: a дээр b олон нэмнэ.
  const baseCount = a
  const showBooks = isAdd ? a + b : a // хасахад a-г бүрэн харуулаад b-г арилгана

  return (
    <div className="mfp-root mcc-single">
      <MinecraftBg />
      <div className="mcc-body">
        <h2 className="mfp-title">Номын сан 📚</h2>

        <p className="mfp-prompt mcw2-story">{problem?.promptMn || problem?.raw}</p>

        {/* Номын тавиур */}
        <div className="mcw2-shelf">
          {[...Array(Math.max(0, showBooks))].map((_, i) => {
            const isExtra = isAdd && i >= baseCount // нэмэгдсэн номнууд
            const isGone = !isAdd && i >= a - b // хасагдах номнууд
            return (
              <span
                key={i}
                className={`mcw2-book${isExtra ? ' mcw2-book-extra' : ''}${(phase === 'done' && isGone) ? ' mcw2-book-gone' : ''}`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {isExtra ? '📕' : '📗'}
              </span>
            )
          })}
          {isAdd && (
            <span className="mcw2-badge">+{b} олон</span>
          )}
        </div>

        <div className="mfp-mini">
          <span className="mfp-num-sm">{a}</span>
          <span className="mfp-op">{isAdd ? '+' : '−'}</span>
          <span className="mfp-num-sm">{b}</span>
          <span className="mfp-op">=</span>
          <span className="mfp-q">?</span>
        </div>

        {phase === 'done' ? (
          <div className="mfp-done">
            <p className="mfp-success">
              🎉 Зөв! <b>{a} {isAdd ? '+' : '−'} {b} = {total}</b> ном.
            </p>
            <CelebrationBurst />
          </div>
        ) : (
          <div className="mfp-choices">
            {choices.map((n) => (
              <button key={n} type="button"
                className={`mfp-choice${wrong === n ? ' mfp-choice-wrong' : ''}`}
                onClick={() => pick(n)}>{n}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MinecraftWordOne
