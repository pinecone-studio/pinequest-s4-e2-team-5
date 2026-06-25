// Нөхөх бодлого: хоосон нүдтэй тэгшитгэл (ж: 5 + ? = 8, эсвэл ? - 3 = 4).
// Хүүхэд сонголтоос дутуу тоог олж нөхнө.
//   missingPosition: 0 = эхний тоо, 1 = хоёр дахь тоо, 2 = хариу
//   operands        = мэдэгдэж буй тоонууд (зүүнээс баруун)
//   knownResult     = "=" дараах мэдэгдэж буй тоо
//   answer          = хайж буй (хоосон) утга
import { useMemo, useState } from 'react'
import { NumberVisual } from '../lesson/NumberVisual.jsx'

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
  for (const d of [-3, -2, -1, 1, 2, 3, 4, -4]) {
    const v = answer + d
    if (v >= 0) set.add(v)
    if (set.size >= 3) break
  }
  return shuffle([...set].slice(0, 3))
}

export function MissingAddendInteractive({ problem, onCorrect, onWrong }) {
  const op = problem.operator ?? '+'
  const known = (problem.operands ?? []).map(Number)
  const mp = problem.missingPosition ?? 1
  const answer = Number(problem.answer)
  const result = problem.knownResult

  // Гурван нүдийг (зүүн / баруун / хариу) угсарна; хоосныг null болгоно.
  let left, right, res
  if (mp === 0) { left = null; right = known[0]; res = result }
  else if (mp === 2) { left = known[0]; right = known[1]; res = null }
  else { left = known[0]; right = null; res = result }

  // Бодлого солигдоход эцэг компонент `key`-ээр энэ виджетийг дахин mount хийдэг
  // тул төлвийг цэвэрлэх reset effect шаардлагагүй.
  const choices = useMemo(() => makeChoices(answer), [answer])
  const [selected, setSelected] = useState(null)
  const [phase, setPhase] = useState('choosing')

  const handle = (n) => {
    if (phase !== 'choosing') return
    setSelected(n)
    if (n === answer) {
      setPhase('correct')
      onCorrect?.()
    } else {
      setPhase('wrong')
      setTimeout(() => setPhase('choosing'), 900)
      onWrong?.()
    }
  }

  const state = (n) => {
    if (phase === 'choosing') return 'idle'
    if (n === answer) return 'correct'
    if (n === selected) return 'wrong'
    return 'idle'
  }

  // Нүдийг (хоосон/дүүрэн) JSX болгон буцаах туслах функц — компонент биш тул
  // рендер бүрт төлөв шинээр үүсэхгүй.
  const renderSlot = (value, isBlank) => {
    if (isBlank) {
      return (
        <div className={`vm-ans-slot${phase === 'correct' ? ' vm-ans-correct' : ''}`}>
          {phase === 'correct' ? (
            <>
              <div className="vm-durs-wrap vm-ans-durs"><NumberVisual value={answer} /></div>
              <div className="adz-burst">
                {['⭐','✨','🎉','💫','🌟','✨'].map((s, i) => (
                  <span key={i} className="adz-burst-item" style={{ '--angle': `${i * 60}deg` }}>{s}</span>
                ))}
              </div>
            </>
          ) : (
            <span className="adz-q">?</span>
          )}
        </div>
      )
    }
    return <div className="vm-durs-wrap"><NumberVisual value={value ?? 0} /></div>
  }

  return (
    <div className="vm-root">
      <div className="vm-equation">
        {renderSlot(left, mp === 0)}
        <span className="vm-op">{op}</span>
        {renderSlot(right, mp === 1)}
        <span className="vm-op">=</span>
        {renderSlot(res, mp === 2)}
      </div>

      {phase !== 'correct' && (
        <div className="vm-choice-grid">
          {choices.map((n) => (
            <button
              key={n}
              className={`vm-choice-btn vm-choice-${state(n)}`}
              onClick={() => handle(n)}
              disabled={phase !== 'choosing'}
            >
              <div className="vm-durs-wrap"><NumberVisual value={n} /></div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
