// 4-р бодлого (үгэн): Сумьяа өвлийн амралтаараа 5 ном уншив.
// Амгалан Сумьяагаас 6-аар олон ном уншив. Амгалан нийт хэдэн ном уншсан бэ?
//   → 5 + 6 = 11.  Хоёр номын тавиур дээр номнуудыг нэмэн харуулна.
import { useMemo, useState } from 'react'
import { CelebrationBurst } from './CelebrationBurst.jsx'
import { MinecraftBg } from './mcShared.jsx'
import { makeChoices } from './mcUtils.js'
import './minecraft-first-problem.css'

const SUMYAA = 5
const MORE = 6
const AMGALAN = SUMYAA + MORE // 11

function Shelf({ base, extra, showExtra, name, emoji }) {
  return (
    <div className="mcw-shelf-col">
      <div className="mcw-person">{emoji} {name}</div>
      <div className="mcw-shelf">
        {[...Array(base)].map((_, i) => (
          <span key={`b${i}`} className="mcw-book mcw-book-base" style={{ animationDelay: `${i * 0.08}s` }}>📗</span>
        ))}
        {showExtra &&
          [...Array(extra)].map((_, i) => (
            <span key={`e${i}`} className="mcw-book mcw-book-extra" style={{ animationDelay: `${(base + i) * 0.08}s` }}>📕</span>
          ))}
      </div>
      <div className="mcw-count">{base + (showExtra ? extra : 0)} ном</div>
    </div>
  )
}

export function MinecraftWord({ onDone }) {
  const [phase, setPhase] = useState('read') // 'read' | 'solved'
  const [wrong, setWrong] = useState(null)
  const choices = useMemo(() => makeChoices(AMGALAN, [1, -1, 2, -2, 6, -6, 5, -5]), [])

  const pick = (n) => {
    if (phase === 'solved') return
    if (n === AMGALAN) {
      setWrong(null)
      setPhase('solved')
      onDone?.()
    } else {
      setWrong(n)
      setTimeout(() => setWrong(null), 700)
    }
  }

  return (
    <div className="mfp-root">
      <MinecraftBg />
      <h2 className="mfp-title">Хэн олон ном уншсан бэ? 📚</h2>

      <div className="mfp-prompt mcw-story">
        Сумьяа өвлийн амралтаараа <b>5</b> ном уншив. Амгалан Сумьяагаас <b>6-аар олон</b> ном уншив.
        Амгалан нийт хэдэн ном уншсан бэ?
      </div>

      <div className="mcw-shelves">
        <Shelf base={SUMYAA} extra={0} showExtra={false} name="Сумьяа" emoji="👧" />
        <div className="mcw-plus">
          <span className="mcw-plus-eq">{SUMYAA} + {MORE}</span>
          <span className="mcw-plus-hint">(адилхан 5 + 6 олон)</span>
        </div>
        <Shelf base={SUMYAA} extra={MORE} showExtra name="Амгалан" emoji="👦" />
      </div>

      {phase === 'solved' ? (
        <div className="mfp-done">
          <p className="mfp-success">
            🎉 Зөв! Амгалан <b>5 + 6 = {AMGALAN}</b> ном уншсан.
          </p>
          <CelebrationBurst />
        </div>
      ) : (
        <>
          <p className="mfp-prompt mcw-ask">
            Амгаланд Сумьяатай адил <b>5</b>, дээр нь <b>6</b> нэмэгдэнэ. Хариу нь хэд вэ?
          </p>
          <div className="mfp-choices">
            {choices.map((n) => (
              <button
                key={n}
                type="button"
                className={`mfp-choice${wrong === n ? ' mfp-choice-wrong' : ''}`}
                onClick={() => pick(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default MinecraftWord
