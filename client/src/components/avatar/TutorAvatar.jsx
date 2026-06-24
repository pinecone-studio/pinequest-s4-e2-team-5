import { useEffect, useRef, useState, useCallback } from 'react'
import { SplineScene } from '../SplineScene.jsx'
import { useTutor } from './useTutor.js'

export function TutorAvatar({ nickname, homeworkContext }) {
  const {
    isSpeaking,
    isListening,
    isThinking,
    error,
    greet,
    announceHomework,
    startListening,
    stopListening,
    chat,
  } = useTutor({ nickname, homeworkContext })

  const [textInput, setTextInput]           = useState('')
  const prevHomeworkRef                     = useRef('')
  const greetedRef                          = useRef(false)

  // Initial greeting once on mount
  useEffect(() => {
    if (greetedRef.current) return
    greetedRef.current = true
    greet()
  }, [greet])

  // Announce when homework is first loaded
  useEffect(() => {
    if (homeworkContext && !prevHomeworkRef.current) {
      prevHomeworkRef.current = homeworkContext
      announceHomework()
    }
  }, [homeworkContext, announceHomework])

  const isBusy = isSpeaking || isThinking

  function statusLabel() {
    if (isSpeaking)  return { text: 'ЯРЬЖ БАЙНА…',  cls: 'status-speaking' }
    if (isListening) return { text: 'СОНСОЖ БАЙНА…', cls: 'status-listening' }
    if (isThinking)  return { text: 'БОДОЖ БАЙНА…',  cls: 'status-thinking' }
    return { text: '',  cls: '' }
  }

  const { text: statusText, cls: statusCls } = statusLabel()

  const handleTextSend = useCallback(async () => {
    const msg = textInput.trim()
    if (!msg || isBusy) return
    setTextInput('')
    await chat(msg)
  }, [textInput, isBusy, chat])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextSend()
    }
  }

  return (
    <div className="tutor-avatar">
      {/* 3D robot — full background */}
      <div className="tutor-spline-wrap">
        <SplineScene className="robot-spline" />
      </div>

      {/* Ambient glow when speaking */}
      <div className={`tutor-glow${isSpeaking ? ' glow-active' : ''}`} />

      {/* Sound rings when speaking */}
      <div className="tutor-rings">
        <div className={`tutor-ring tutor-ring-1${isSpeaking ? ' ring-active' : ''}`} />
        <div className={`tutor-ring tutor-ring-2${isSpeaking ? ' ring-active' : ''}`} />
        <div className={`tutor-ring tutor-ring-3${isSpeaking ? ' ring-active' : ''}`} />
      </div>

      {/* Controls */}
      <div className="tutor-controls">
        {/* Status */}
        <span className={`tutor-status${statusCls ? ` ${statusCls}` : ''}`}>
          {statusText}
        </span>

        {/* Mic button — push to talk */}
        <button
          type="button"
          className={`tutor-mic${isListening ? ' mic-listening' : ''}`}
          disabled={isBusy}
          onMouseDown={startListening}
          onMouseUp={stopListening}
          onTouchStart={startListening}
          onTouchEnd={stopListening}
          aria-label={isListening ? 'Зогсоох' : 'Ярих'}
        >
          {isListening ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="3" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0014 0" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="9" y1="22" x2="15" y2="22" />
            </svg>
          )}
        </button>

        {/* Text fallback */}
        <div className="tutor-text-row">
          <input
            className="tutor-text-input"
            type="text"
            placeholder="Бичиж ярилцах…"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
          <button
            type="button"
            className="tutor-text-send"
            onClick={handleTextSend}
            disabled={isBusy || !textInput.trim()}
          >
            →
          </button>
        </div>

        {error && <p className="tutor-error">{error}</p>}
      </div>
    </div>
  )
}
