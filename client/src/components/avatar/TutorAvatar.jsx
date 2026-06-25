import { useCallback, useEffect, useRef, useState } from 'react'
import { MascotScene } from '../KidMascotScene.jsx'
import { useTutor } from './useTutor.js'
import { NumberVisual } from '../lesson/NumberVisual.jsx'
import { api } from '../../lib/api.js'
import '../lesson/lesson.css'
import '../lesson/big-add-lesson.css'

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
    if (v > 0) set.add(v)
    if (set.size >= 3) break
  }
  return shuffle([...set].slice(0, 3))
}

function parseMath(ctx) {
  if (!ctx) return null
  let m = ctx.match(/(\d+)\s*[+]\s*(\d+)/)
  if (!m) m = ctx.match(/(\d+)\s*нэмэх\s*(\d+)/i)
  if (m) return { a: parseInt(m[1]), b: parseInt(m[2]), op: '+' }
  let s = ctx.match(/(\d+)\s*[-−]\s*(\d+)/)
  if (!s) s = ctx.match(/(\d+)\s*хасах\s*(\d+)/i)
  if (s) return { a: parseInt(s[1]), b: parseInt(s[2]), op: '-' }
  return null
}

function inferSkillDifficulty({ a, b, op }) {
  const skill = op === '+' ? 'addition' : 'subtraction'
  const answer = op === '+' ? a + b : a - b
  const difficulty = answer <= 10 ? 'easy' : answer <= 30 ? 'medium' : 'hard'
  return { skill, difficulty }
}

/* ── Visual Math: domino tiles + 3-choice click ── */
function VisualMath({ problem, choices, onCorrect, onWrong }) {
  const { a, b, op } = problem
  const answer = op === '+' ? a + b : a - b
  const [selected, setSelected] = useState(null)
  const [phase, setPhase] = useState('choosing')

  useEffect(() => {
    setSelected(null)
    setPhase('choosing')
  }, [answer])

  const handleChoice = (n) => {
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

  const choiceState = (n) => {
    if (phase === 'choosing') return 'idle'
    if (n === answer)         return 'correct'
    if (n === selected)       return 'wrong'
    return 'idle'
  }

  return (
    <div className="vm-root">
      <div className="vm-equation">
        <div className="vm-durs-wrap">
          <NumberVisual value={a} />
        </div>
        <span className="vm-op">{op}</span>
        <div className="vm-durs-wrap">
          <NumberVisual value={b} />
        </div>
        <span className="vm-op">=</span>

        <div className={`vm-ans-slot${phase === 'correct' ? ' vm-ans-correct' : ''}`}>
          {phase === 'correct' ? (
            <>
              <div className="vm-durs-wrap vm-ans-durs">
                <NumberVisual value={answer} />
              </div>
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
      </div>

      {phase !== 'correct' && (
        <div className="vm-choice-grid">
          {choices.map(n => (
            <button
              key={n}
              className={`vm-choice-btn vm-choice-${choiceState(n)}`}
              onClick={() => handleChoice(n)}
              disabled={phase !== 'choosing'}
            >
              <div className="vm-durs-wrap">
                <NumberVisual value={n} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Speech bubble ── */
function trimBubble(text) {
  if (!text) return ''
  const first = text.split(/[.!?]/)[0] ?? text
  return first.length > 60 ? first.slice(0, 57) + '…' : first
}

function SpeechBubble({ text, isThinking }) {
  const [displayed, setDisplayed] = useState('')
  const shortText = trimBubble(text)
  const idxRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!shortText) return
    setDisplayed('')
    idxRef.current = 0
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      idxRef.current++
      setDisplayed(shortText.slice(0, idxRef.current))
      if (idxRef.current >= shortText.length) clearInterval(timerRef.current)
    }, 25)
    return () => clearInterval(timerRef.current)
  }, [shortText])

  if (!text && !isThinking) return null

  return (
    <div className="sb-wrap">
      <div className="sb-tail" />
      <div className="sb-box">
        {isThinking && !shortText ? (
          <span className="sb-dots"><span /><span /><span /></span>
        ) : (
          <p className="sb-text">{displayed}</p>
        )}
      </div>
    </div>
  )
}

/* ── Main TutorAvatar ── */
export function TutorAvatar({ nickname, homeworkContext, avatar = 'robot' }) {
  const {
    isSpeaking, isListening, isThinking, error,
    lastText, greet, announceHomework, chat,
    startAlwaysListen, stopAlwaysListen,
  } = useTutor({ nickname, homeworkContext })

  const prevHomeworkRef = useRef('')
  const greetedRef      = useRef(false)
  const [choices, setChoices]           = useState([])
  const [activeContext, setActiveContext] = useState(homeworkContext)
  const [isLoadingNext, setIsLoadingNext] = useState(false)

  // Sync prop → local context when homework changes externally
  useEffect(() => { setActiveContext(homeworkContext) }, [homeworkContext])

  const problem = parseMath(activeContext)

  useEffect(() => {
    if (greetedRef.current || !nickname) return
    greetedRef.current = true
    greet().then(() => startAlwaysListen())
    return () => stopAlwaysListen()
  }, [nickname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (homeworkContext && !prevHomeworkRef.current) {
      prevHomeworkRef.current = homeworkContext
      announceHomework()
    }
  }, [homeworkContext, announceHomework])

  // Regenerate choices whenever active problem changes
  useEffect(() => {
    if (!problem) { setChoices([]); return }
    const ans = problem.op === '+' ? problem.a + problem.b : problem.a - problem.b
    setChoices(makeChoices(ans))
  }, [activeContext]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCorrect = useCallback(() => {
    chat('зөв хариулт')
    if (!problem) return
    const { skill, difficulty } = inferSkillDifficulty(problem)
    setIsLoadingNext(true)
    setTimeout(() => {
      api.getPractice(skill, difficulty, 1)
        .then(({ problems }) => {
          if (problems?.length) setActiveContext(problems[0].problem)
        })
        .catch(() => {})
        .finally(() => setIsLoadingNext(false))
    }, 2500)
  }, [chat, problem])

  const handleWrong = useCallback(() => {
    chat('буруу хариулт өглөө')
  }, [chat])

  function statusLabel() {
    if (isSpeaking)  return { text: 'ЯРЬЖ БАЙНА…',  cls: 'status-speaking' }
    if (isListening) return { text: 'СОНСОЖ БАЙНА…', cls: 'status-listening' }
    if (isThinking)  return { text: 'БОДОЖ БАЙНА…',  cls: 'status-thinking' }
    return { text: 'БЭЛЭН', cls: '' }
  }
  const { text: statusText, cls: statusCls } = statusLabel()
  const mascotMood = isSpeaking ? 'speaking' : isListening ? 'listening' : isThinking ? 'thinking' : 'ready'

  return (
    <div className="ta-root">
      <div className="ta-blob ta-blob-1" />
      <div className="ta-blob ta-blob-2" />
      <div className="ta-blob ta-blob-3" />

      {!problem && !isLoadingNext ? (
        <div className="ta-center">
          <div className="tutor-spline-wrap tutor-spline-big">
            <MascotScene avatar={avatar} className="tutor-mascot" mood={mascotMood} />
          </div>
          <SpeechBubble text={lastText} isThinking={isThinking} />
          <div className="ta-status-row">
            {isListening && <span className="tutor-listen-dot" />}
            <span className={`tutor-status${statusCls ? ` ${statusCls}` : ''}`}>{statusText}</span>
          </div>
          {error && <p className="tutor-error">{error}</p>}
        </div>
      ) : (
        <>
          {/* Layer 1 — robot: large, centered, behind everything */}
          <div className="ta-robot-bg">
            <div className="tutor-spline-wrap tutor-spline-big">
              <MascotScene avatar={avatar} className="tutor-mascot" mood={mascotMood} />
            </div>
          </div>

          {/* Layer 2 — speech bubble + status: top-left overlay */}
          <div className="ta-hud">
            <SpeechBubble text={lastText} isThinking={isThinking} />
            <div className="ta-status-row">
              {isListening && <span className="tutor-listen-dot" />}
              <span className={`tutor-status${statusCls ? ` ${statusCls}` : ''}`}>{statusText}</span>
            </div>
            {error && <p className="tutor-error">{error}</p>}
          </div>

          {/* Layer 3 — interactive math: centered, in front */}
          <div className="ta-interactive">
            {isLoadingNext ? (
              <div className="vm-loading">Дараагийн бодлого бэлтгэж байна…</div>
            ) : problem ? (
              <VisualMath
                problem={problem}
                choices={choices}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
