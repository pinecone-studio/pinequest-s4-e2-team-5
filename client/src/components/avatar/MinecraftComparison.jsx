// 2-р бодлого: Жиш ( <, >, = ).  77 ○ 57  ба  9 + 5 ○ 15
// Хоёр алтан цамхаг барьж, өндрөөр нь харьцуулна. Хүүхэд <, >, = тэмдгийг сонгоно.
import { useMemo, useState } from 'react'
import { CelebrationBurst } from './CelebrationBurst.jsx'
import { MinecraftBg } from './mcShared.jsx'
import './minecraft-first-problem.css'

// leftLabel: дэлгэцэнд харагдах зүүн талын бичиглэл; value: харьцуулах утга
const ROUNDS = [
  { leftLabel: '77', leftValue: 77, rightLabel: '57', rightValue: 57 },
  { leftLabel: '9 + 5', leftValue: 14, rightLabel: '15', rightValue: 15, note: '9 + 5 = 14' },
]

const SIGNS = ['<', '>', '=']
const correctSign = (a, b) => (a < b ? '<' : a > b ? '>' : '=')

/* Алтан блокоор өрсөн цамхаг — өндөр нь утгатай пропорциональ */
function Tower({ value, label, note, scale, win }) {
  const height = Math.round(value * scale)
  return (
    <div className="mcc-tower-col">
      <div className={`mcc-tower${win ? ' mcc-tower-win' : ''}`} style={{ height }}>
        <span className="mcc-tower-cap">👑</span>
      </div>
      <div className="mcc-tower-val">{label}</div>
      {note && <div className="mcc-tower-note">{note}</div>}
    </div>
  )
}

export function MinecraftComparison({ onDone }) {
  const [round, setRound] = useState(0)
  const [wrong, setWrong] = useState(null)
  const [solved, setSolved] = useState(false)

  const r = ROUNDS[round]
  const answer = correctSign(r.leftValue, r.rightValue)
  // Хоёр цамхгийн өндрийг тухайн раундын их утгаар нь тохируулна (max ~130px)
  const scale = useMemo(() => 130 / Math.max(r.leftValue, r.rightValue), [r])

  const pick = (sign) => {
    if (solved) return
    if (sign === answer) {
      setWrong(null)
      setSolved(true)
      setTimeout(() => {
        if (round + 1 < ROUNDS.length) {
          setRound(round + 1)
          setSolved(false)
        } else {
          onDone?.()
        }
      }, 1500)
    } else {
      setWrong(sign)
      setTimeout(() => setWrong(null), 700)
    }
  }

  const done = solved && round + 1 >= ROUNDS.length

  return (
    <div className="mfp-root">
      <MinecraftBg />
      <h2 className="mfp-title">Алтан цамхгийг жишье 👑</h2>

      <div className="mcc-stage">
        <Tower
          value={r.leftValue}
          label={r.leftLabel}
          note={r.note}
          scale={scale}
          win={solved && r.leftValue > r.rightValue}
        />

        <div className="mcc-sign-slot">
          {solved ? <span className="mcc-sign-big mcc-sign-on">{answer}</span> : <span className="mcc-sign-big">?</span>}
        </div>

        <Tower
          value={r.rightValue}
          label={r.rightLabel}
          scale={scale}
          win={solved && r.rightValue > r.leftValue}
        />
      </div>

      {done ? (
        <div className="mfp-done">
          <p className="mfp-success">🎉 Гоё! Хоёр цамхгийг зөв жишлээ.</p>
          <CelebrationBurst />
        </div>
      ) : (
        <>
          <p className="mfp-prompt">
            {solved
              ? r.leftValue === r.rightValue
                ? 'Хоёул тэнцүү өндөр! ='
                : 'Өндөр цамхаг нь ИХ тоо. Зөв!'
              : 'Аль цамхаг нь өндөр вэ? Дунд нь тохирох тэмдгийг сонго 👇'}
          </p>
          <div className="mcc-signs">
            {SIGNS.map((s) => (
              <button
                key={s}
                type="button"
                className={`mcc-sign-btn${wrong === s ? ' mfp-choice-wrong' : ''}`}
                onClick={() => pick(s)}
                disabled={solved}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mcc-legend">
            <span>‹ &nbsp;бага</span>
            <span>› &nbsp;их</span>
            <span>= &nbsp;тэнцүү</span>
          </div>
        </>
      )}
    </div>
  )
}

export default MinecraftComparison
