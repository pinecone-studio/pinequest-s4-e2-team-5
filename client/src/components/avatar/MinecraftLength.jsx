// 3-р бодлого: Нэртэй тоо (урт).  5 дм = ? см   ба   35 см = ? дм ? см
// 1 дм = 10 см гэдгийг блокон шугамаар үзүүлнэ.
//   A: 5 дм-ийг 10-аар нь тоолж 50 см.
//   B: 35 см-ийг 10-ын багцад хувааж 3 дм 5 см.
import { useMemo, useState } from 'react'
import { CelebrationBurst } from './CelebrationBurst.jsx'
import { MinecraftBg } from './mcShared.jsx'
import { makeChoices } from './mcUtils.js'
import './minecraft-first-problem.css'

/* Блокон шугам: cm ширхэг нэгж, 10 тутамд дм бүлэг болгож өнгөөр ялгана */
function BlockRuler({ cm, groupBy = 10 }) {
  return (
    <div className="mcl-ruler" aria-label={`${cm} см`}>
      {[...Array(cm)].map((_, i) => {
        const group = Math.floor(i / groupBy)
        const isFullGroup = (group + 1) * groupBy <= cm
        return (
          <span
            key={i}
            className={`mcl-cm${isFullGroup ? ' mcl-cm-dm' : ' mcl-cm-loose'}`}
            style={{ '--g': group, '--i': i, animationDelay: `${i * 0.02}s` }}
          />
        )
      })}
    </div>
  )
}

export function MinecraftLength({ onDone }) {
  // A үе: 5 дм = ? см;  B үе: 35 см = ? дм ? см (эхлээд дм, дараа см)
  const [phase, setPhase] = useState('A') // 'A' | 'B-dm' | 'B-cm' | 'done'
  const [wrong, setWrong] = useState(null)

  const aChoices = useMemo(() => makeChoices(50, [10, -10, 5, -5, 40, -40, 45]), [])
  const bDmChoices = useMemo(() => makeChoices(3, [1, -1, 2, -2, 30, 5]), [])
  const bCmChoices = useMemo(() => makeChoices(5, [1, -1, 2, -2, 3, -3, 10]), [])

  const pick = (value, answer, next) => {
    if (value === answer) {
      setWrong(null)
      setPhase(next)
      if (next === 'done') onDone?.()
    } else {
      setWrong(value)
      setTimeout(() => setWrong(null), 700)
    }
  }

  const choices = (list, answer, next) => (
    <div className="mfp-choices">
      {list.map((n) => (
        <button
          key={n}
          type="button"
          className={`mfp-choice${wrong === n ? ' mfp-choice-wrong' : ''}`}
          onClick={() => pick(n, answer, next)}
        >
          {n}
        </button>
      ))}
    </div>
  )

  return (
    <div className="mfp-root">
      <MinecraftBg />
      <h2 className="mfp-title">Блокоор хэмжье 📏</h2>

      <div className="mfp-prompt mcl-rule">
        <b>Дүрэм:</b> 1 дм = 10 см (нэг өнгөт багц = 1 дм)
      </div>

      {(phase === 'A') && (
        <div className="mfp-step">
          <div className="mfp-equation">
            <span className="mfp-num">5</span><span className="mfp-op">дм</span>
            <span className="mfp-op">=</span>
            <span className="mfp-ans">?</span><span className="mfp-op">см</span>
          </div>
          <BlockRuler cm={50} />
          <p className="mfp-prompt">5 багц бий. Багц бүр 10 см. Нийт хэдэн см вэ? (10-аар тоол)</p>
          {choices(aChoices, 50, 'B-dm')}
        </div>
      )}

      {(phase === 'B-dm' || phase === 'B-cm') && (
        <div className="mfp-step">
          <div className="mfp-equation">
            <span className="mfp-num">35</span><span className="mfp-op">см</span>
            <span className="mfp-op">=</span>
            <span className={`mfp-ans${phase === 'B-cm' ? ' mcl-filled' : ''}`}>{phase === 'B-cm' ? 3 : '?'}</span>
            <span className="mfp-op">дм</span>
            <span className="mfp-ans">?</span><span className="mfp-op">см</span>
          </div>
          <BlockRuler cm={35} />
          {phase === 'B-dm' ? (
            <>
              <p className="mfp-prompt">35 см-д бүтэн 10-ын багц хэд байна вэ? (= хэдэн дм)</p>
              {choices(bDmChoices, 3, 'B-cm')}
            </>
          ) : (
            <>
              <p className="mfp-prompt">3 дм авсны дараа үлдсэн сул блок хэд вэ? (= хэдэн см)</p>
              {choices(bCmChoices, 5, 'done')}
            </>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="mfp-done">
          <p className="mfp-success">
            🎉 Гоё! <b>5 дм = 50 см</b>, &nbsp;<b>35 см = 3 дм 5 см</b>.
          </p>
          <CelebrationBurst />
        </div>
      )}
    </div>
  )
}

export default MinecraftLength
