// 1-2-р ангийн хүүхдэд зориулсан Minecraft загварын интерактив бодлого:
//   40 − 5 × 7 = ?
// Түүх: Стив-д 40 очир алмаз бий. 5 Крийпер ирээд тус бүр 7 алмаз хулгайлна.
//   1) Эхлээд ҮРЖИХ: 5 крийпер × 7 = хэдэн алмаз хулгайлав? (35)
//   2) Дараа нь ХАСАХ: 40 − 35 = хэдэн алмаз үлдэв? (5)
// Блок, крийпер, нисдэг алмаз бүгд хөдөлгөөнтэй (CSS animation).
import { useMemo, useState } from 'react'
import { CelebrationBurst } from './CelebrationBurst.jsx'
import { MinecraftBg } from './mcShared.jsx'
import { makeChoices } from './mcUtils.js'
import './minecraft-first-problem.css'

const TOTAL = 40
const CREEPERS = 5
const PER = 7
const STOLEN = CREEPERS * PER // 35
const LEFT = TOTAL - STOLEN // 5

/* Minecraft крийперын нүүр — цэвэр CSS пиксел арт */
function Creeper({ munching }) {
  return (
    <span className={`mfp-creeper${munching ? ' mfp-creeper-munch' : ''}`} aria-label="крийпер">
      <span className="mfp-creeper-face">
        <span className="mfp-eye mfp-eye-l" />
        <span className="mfp-eye mfp-eye-r" />
        <span className="mfp-mouth" />
      </span>
    </span>
  )
}

/* Алмазан овоо — count ширхэг очир алмаз */
function DiamondPile({ count, flying }) {
  return (
    <div className="mfp-pile" aria-label={`${count} очир алмаз`}>
      {[...Array(Math.max(0, count))].map((_, i) => (
        <span
          key={i}
          className={`mfp-diamond${flying ? ' mfp-diamond-fly' : ''}`}
          style={{ '--i': i, '--d': `${(i % 8) * 0.05}s` }}
        >
          💎
        </span>
      ))}
    </div>
  )
}

export function MinecraftFirstProblem({ onCorrect, onWrong, onDone }) {
  // phase: 'mul' (5×7) → 'steal' (анимэйшн) → 'sub' (40−35) → 'done'
  const [phase, setPhase] = useState('mul')
  const [wrong, setWrong] = useState(null)

  const mulChoices = useMemo(() => makeChoices(STOLEN, [5, -5, 2, -2, 7, -7, 10, -10]), [])
  const subChoices = useMemo(() => makeChoices(LEFT, [5, -5, 2, -2, 3, -3, 10, -10]), [])

  const pick = (value, answer, nextPhase) => {
    if (value === answer) {
      setWrong(null)
      onCorrect?.()
      if (nextPhase === 'steal') {
        setPhase('steal')
        // алмаз нисэх анимэйшн дуустал хүлээгээд дараагийн алхам руу
        setTimeout(() => setPhase('sub'), 1400)
      } else {
        setPhase('done')
        onDone?.()
      }
    } else {
      setWrong(value)
      onWrong?.()
      setTimeout(() => setWrong(null), 700)
    }
  }

  const stealing = phase === 'steal'
  const remaining = phase === 'done' ? LEFT : TOTAL

  return (
    <div className="mfp-root">
      <MinecraftBg />

      <h2 className="mfp-title">Стивийн очир алмаз 💎</h2>

      {/* Гол тэгшитгэл — идэвхтэй хэсэг нь гэрэлтэнэ */}
      <div className="mfp-equation">
        <span className="mfp-num">{TOTAL}</span>
        <span className="mfp-op">−</span>
        <span className={`mfp-group${phase === 'mul' ? ' mfp-hot' : ''}`}>
          <span className="mfp-num mfp-num-sm">{CREEPERS}</span>
          <span className="mfp-op">×</span>
          <span className="mfp-num mfp-num-sm">{PER}</span>
        </span>
        <span className="mfp-op">=</span>
        <span className="mfp-ans">{phase === 'done' ? LEFT : '?'}</span>
      </div>

      {/* Тайзан дээрх дүр зураг */}
      <div className="mfp-stage">
        <div className="mfp-steve-col">
          <span className="mfp-steve" aria-label="Стив">🧑‍🌾</span>
          <DiamondPile count={remaining} flying={stealing} />
          <div className="mfp-steve-label">Стив: {remaining} алмаз</div>
        </div>

        {phase !== 'mul' && (
          <div className="mfp-creepers">
            {[...Array(CREEPERS)].map((_, i) => (
              <div key={i} className="mfp-creeper-slot" style={{ '--i': i }}>
                <Creeper munching={stealing} />
                <span className="mfp-creeper-take">×{PER}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Алхам 1: Үржих */}
      {phase === 'mul' && (
        <div className="mfp-step">
          <p className="mfp-prompt">
            <b>1-р алхам — эхлээд ҮРЖИХ.</b> {CREEPERS} крийпер ирлээ. Тус бүр нь{' '}
            <b>{PER}</b> алмаз хулгайлна. Крийперүүд нийт хэдэн алмаз хулгайлах вэ?
          </p>
          <div className="mfp-mini">
            <span className="mfp-num-sm">{CREEPERS}</span>
            <span className="mfp-op">×</span>
            <span className="mfp-num-sm">{PER}</span>
            <span className="mfp-op">=</span>
            <span className="mfp-q">?</span>
          </div>
          <div className="mfp-choices">
            {mulChoices.map((n) => (
              <button
                key={n}
                type="button"
                className={`mfp-choice${wrong === n ? ' mfp-choice-wrong' : ''}`}
                onClick={() => pick(n, STOLEN, 'steal')}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Завсрын анимэйшн */}
      {phase === 'steal' && (
        <div className="mfp-step">
          <p className="mfp-prompt mfp-prompt-flash">
            Крийперүүд <b>{STOLEN}</b> алмаз хулгайлж яваа… 💨
          </p>
        </div>
      )}

      {/* Алхам 2: Хасах */}
      {phase === 'sub' && (
        <div className="mfp-step">
          <p className="mfp-prompt">
            <b>2-р алхам — одоо ХАСАХ.</b> Стивд <b>{TOTAL}</b> алмаз байсан. Крийперүүд{' '}
            <b>{STOLEN}</b> алмаз аваад явлаа. Стивд хэдэн алмаз үлдэв?
          </p>
          <div className="mfp-mini">
            <span className="mfp-num-sm">{TOTAL}</span>
            <span className="mfp-op">−</span>
            <span className="mfp-num-sm">{STOLEN}</span>
            <span className="mfp-op">=</span>
            <span className="mfp-q">?</span>
          </div>
          <div className="mfp-choices">
            {subChoices.map((n) => (
              <button
                key={n}
                type="button"
                className={`mfp-choice${wrong === n ? ' mfp-choice-wrong' : ''}`}
                onClick={() => pick(n, LEFT, 'done')}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Дуусгавар */}
      {phase === 'done' && (
        <div className="mfp-done">
          <p className="mfp-success">
            🎉 Гоё! <b>40 − 5 × 7 = {LEFT}</b>. Эхлээд үржиж, дараа нь хассан — зөв дараалал!
          </p>
          <CelebrationBurst />
        </div>
      )}
    </div>
  )
}

export default MinecraftFirstProblem
