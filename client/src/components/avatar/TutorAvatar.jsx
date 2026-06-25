import { useEffect, useRef, useState, useCallback } from 'react'
import { SplineScene } from '../SplineScene.jsx'
import { useTutor } from './useTutor.js'
import { DraggableTile } from '../lesson/DraggableTile.jsx'

const TILE_COLORS = {
  1:'#f2a36b',2:'#f6cf69',3:'#80b7c7',4:'#6abf8e',
  5:'#f48fb1',6:'#ce93d8',7:'#ff8a65',8:'#4db6ac',
  9:'#7986cb',10:'#a5d6a7',11:'#ef9a9a',12:'#80cbc4',
  13:'#ffcc80',14:'#bcaaa4',15:'#b0bec5',
}
function tileColor(n) {
  return TILE_COLORS[n] ?? '#65d99d'
}

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

const THEMES = [
  { emoji: '🌲', color: '#4ade80' },
  { emoji: '⭐', color: '#fbbf24' },
  { emoji: '🍎', color: '#f87171' },
  { emoji: '🌸', color: '#f9a8d4' },
  { emoji: '🦋', color: '#a78bfa' },
  { emoji: '🐣', color: '#fcd34d' },
  { emoji: '🍊', color: '#fb923c' },
  { emoji: '💎', color: '#67e8f9' },
]

function pickTheme(seed) {
  return THEMES[seed % THEMES.length]
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

function EmojiGrid({ count, theme, offsetDelay = 0 }) {
  const capped = Math.min(count, 10)
  return (
    <div className="eg-wrap">
      {[...Array(capped)].map((_, i) => (
        <span
          key={i}
          className="eg-item"
          style={{
            animationDelay: `${(offsetDelay + i) * 0.08}s`,
            '--glow': theme.color,
          }}
        >
          {theme.emoji}
        </span>
      ))}
    </div>
  )
}

function AnswerDropZone({ answer, onCorrect, onWrong }) {
  const ref = useRef()
  const [state, setState] = useState('empty') // empty | correct | wrong

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
    <div ref={ref}
      className={`adz adz-${state}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {state === 'correct' && (
        <>
          <span className="adz-num">{answer}</span>
          <div className="vm-burst">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="vm-burst-item"
                style={{ '--angle': `${i * 60}deg` }}>
                {THEMES[i % THEMES.length].emoji}
              </span>
            ))}
          </div>
        </>
      )}
      {state === 'wrong' && <span className="adz-wrong-x">✗</span>}
      {state === 'empty' && <span className="adz-q">?</span>}
    </div>
  )
}

function VisualMath({ problem, onCorrect, onWrong }) {
  const { a, b, op } = problem
  const themeA = pickTheme(a)
  const themeB = pickTheme(b + 4)
  const answer = op === '+' ? a + b : a - b

  return (
    <div className="vm-root">
      <div className="vm-card">
        <div className="vm-number" style={{ color: themeA.color }}>{a}</div>
        <EmojiGrid count={a} theme={themeA} offsetDelay={0} />
      </div>

      <div className="vm-op-wrap">
        <span className="vm-op">{op}</span>
      </div>

      <div className="vm-card">
        <div className="vm-number" style={{ color: themeB.color }}>{b}</div>
        <EmojiGrid count={b} theme={themeB} offsetDelay={a} />
      </div>

      <div className="vm-op-wrap">
        <span className="vm-op">=</span>
      </div>

      <AnswerDropZone answer={answer} onCorrect={onCorrect} onWrong={onWrong} />
    </div>
  )
}

// Short version of text: max 60 chars
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
          <span className="sb-dots">
            <span /><span /><span />
          </span>
        ) : (
          <p className="sb-text">{displayed}</p>
        )}
      </div>
    </div>
  )
}

export function TutorAvatar({ nickname, homeworkContext }) {
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

  // Бодлого өөрчлөгдөх бүрт шинэ сонголтууд үүсгэнэ
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

  return (
    <div className="ta-root">
      {/* Animated blobs */}
      <div className="ta-blob ta-blob-1" />
      <div className="ta-blob ta-blob-2" />
      <div className="ta-blob ta-blob-3" />

      {/* LEFT COLUMN: robot + bubble */}
      <div className="ta-left">
        <div className="ta-robot-wrap">
          <div className={`ta-robot-inner ${isSpeaking ? 'robot-bounce' : ''}`}>
            <SplineScene className="robot-spline" />
          </div>
          <div className="ta-rings">
            <div className={`ta-ring ta-ring-1 ${isSpeaking ? 'ring-active' : ''}`} />
            <div className={`ta-ring ta-ring-2 ${isSpeaking ? 'ring-active' : ''}`} />
          </div>
        </div>

        <SpeechBubble text={lastText} isThinking={isThinking} />

        {/* Drag tiles below bubble */}
        {choices.length > 0 && !droppedCorrect && (
          <div className="ta-tile-tray">
            {choices.map((n) => (
              <DraggableTile key={n} value={n} color={tileColor(n)} />
            ))}
          </div>
        )}

        <div className="ta-status-row">
          {isListening && <span className="tutor-listen-dot" />}
          <span className={`tutor-status${statusCls ? ` ${statusCls}` : ''}`}>{statusText}</span>
        </div>
        {error && <p className="tutor-error">{error}</p>}
      </div>

      {/* RIGHT COLUMN: interactive board */}
      <div className="ta-right">
        {problem ? (
          <VisualMath problem={problem} onCorrect={handleCorrect} onWrong={handleWrong} />
        ) : (
          <div className="ta-idle">
            {homeworkContext
              ? <p className="ta-hw-txt">{homeworkContext.slice(0, 120)}</p>
              : <p className="ta-idle-msg">Даалгаврын зургаа оруул 📄</p>
            }
          </div>
        )}
      </div>
    </div>
  )
}
