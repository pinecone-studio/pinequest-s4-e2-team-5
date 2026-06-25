import { useCallback, useEffect, useRef, useState } from 'react'
import { MascotScene } from '../KidMascotScene.jsx'
import { useTutor } from './useTutor.js'
import { NumberVisual } from '../lesson/NumberVisual.jsx'
import '../lesson/lesson.css'
import '../lesson/big-add-lesson.css'

const TILE_COLORS = {
  1:'#f2a36b', 2:'#f6cf69', 3:'#80b7c7', 4:'#6abf8e',
  5:'#f48fb1', 6:'#ce93d8', 7:'#ff8a65', 8:'#4db6ac',
  9:'#7986cb', 10:'#a5d6a7', 11:'#ef9a9a', 12:'#80cbc4',
  13:'#ffcc80', 14:'#bcaaa4', 15:'#b0bec5',
}
function tileColor(n) { return TILE_COLORS[n] ?? '#65d99d' }

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
  for (const d of [-3,-2,-1,1,2,3,4,-4]) {
    const v = answer + d
    if (v > 0 && v <= 15) set.add(v)
    if (set.size >= 4) break
  }
  return shuffle([...set].slice(0, 4))
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

/* ── Custom draggable number tile ── */
function NumberTile({ value }) {
  const color = tileColor(value)
  return (
    <div
      className="nt-tile"
      style={{ '--tile-clr': color }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(value))
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      {value}
    </div>
  )
}

/* ── Answer drop zone ── */
function AnswerDropZone({ answer, onCorrect, onWrong }) {
  const ref = useRef()
  const [state, setState] = useState('empty')

  useEffect(() => { setState('empty') }, [answer])

  const handleDragOver = (e) => {
    e.preventDefault()
    if (state === 'empty') ref.current?.classList.add('adz-hover')
  }
  const handleDragLeave = (e) => {
    if (!ref.current?.contains(e.relatedTarget))
      ref.current?.classList.remove('adz-hover')
  }
  const handleDrop = (e) => {
    e.preventDefault()
    ref.current?.classList.remove('adz-hover')
    const num = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (isNaN(num) || state !== 'empty') return
    if (num === answer) {
      setState('correct')
      onCorrect?.()
    } else {
      setState('wrong')
      setTimeout(() => setState('empty'), 900)
      onWrong?.()
    }
  }

  return (
    <div
      ref={ref}
      className={`adz adz-${state}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {state === 'correct' && (
        <>
          <span className="adz-num">{answer}</span>
          <div className="adz-burst">
            {['⭐','✨','🎉','💫','🌟','✨'].map((s, i) => (
              <span key={i} className="adz-burst-item" style={{ '--angle': `${i * 60}deg` }}>{s}</span>
            ))}
          </div>
        </>
      )}
      {state === 'wrong' && <span className="adz-wrong-x">✗</span>}
      {state === 'empty' && <span className="adz-q">?</span>}
    </div>
  )
}

/* ── Visual Math: clean number cards + tiles ── */
function VisualMath({ problem, choices, droppedCorrect, onCorrect, onWrong }) {
  const { a, b, op } = problem
  const answer = op === '+' ? a + b : a - b

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
        <AnswerDropZone answer={answer} onCorrect={onCorrect} onWrong={onWrong} />
      </div>

      {choices.length > 0 && !droppedCorrect && (
        <div className="vm-tiles">
          <p className="vm-tiles-label">Зөв хариугаа чирж оруул 👇</p>
          <div className="vm-tiles-row">
            {choices.map((n) => (
              <NumberTile key={n} value={n} />
            ))}
          </div>
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
  const [choices, setChoices] = useState([])
  const [droppedCorrect, setDroppedCorrect] = useState(false)

  const problem = parseMath(homeworkContext)

  useEffect(() => {
    if (greetedRef.current || !nickname) return
    greetedRef.current = true
    greet().then(() => startAlwaysListen())
    return () => stopAlwaysListen()
  }, [nickname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (homeworkContext && !prevHomeworkRef.current) {
      prevHomeworkRef.current = homeworkContext
      setDroppedCorrect(false)
      announceHomework()
    }
  }, [homeworkContext, announceHomework])

  useEffect(() => {
    if (!problem) { setChoices([]); return }
    const ans = problem.op === '+' ? problem.a + problem.b : problem.a - problem.b
    setChoices(makeChoices(ans))
    setDroppedCorrect(false)
  }, [homeworkContext]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCorrect = useCallback(() => {
    setDroppedCorrect(true)
    chat('зөв хариулт')
  }, [chat])

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

      {!problem ? (
        /* No homework: big robot centered */
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
        /* Has homework: small robot top-left + big interactive right */
        <>
          <div className="ta-left">
            <div className="tutor-spline-wrap">
              <MascotScene avatar={avatar} className="tutor-mascot" mood={mascotMood} />
            </div>
            <SpeechBubble text={lastText} isThinking={isThinking} />
            <div className="ta-status-row">
              {isListening && <span className="tutor-listen-dot" />}
              <span className={`tutor-status${statusCls ? ` ${statusCls}` : ''}`}>{statusText}</span>
            </div>
            {error && <p className="tutor-error">{error}</p>}
          </div>

          <div className="ta-right">
            <VisualMath
              problem={problem}
              choices={choices}
              droppedCorrect={droppedCorrect}
              onCorrect={handleCorrect}
              onWrong={handleWrong}
            />
          </div>
        </>
      )}
    </div>
  )
}
