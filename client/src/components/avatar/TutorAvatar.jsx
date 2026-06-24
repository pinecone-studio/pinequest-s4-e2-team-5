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
    chat,
    startAlwaysListen,
    stopAlwaysListen,
  } = useTutor({ nickname, homeworkContext })

  const [textInput, setTextInput] = useState('')
  const prevHomeworkRef           = useRef('')
  const greetedRef                = useRef(false)

  // Initial greeting + start always-listen
  useEffect(() => {
    if (greetedRef.current) return
    greetedRef.current = true
    greet().then(() => startAlwaysListen())
    return () => stopAlwaysListen()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Announce when homework is first uploaded
  useEffect(() => {
    if (homeworkContext && !prevHomeworkRef.current) {
      prevHomeworkRef.current = homeworkContext
      announceHomework()
    }
  }, [homeworkContext, announceHomework])

  const isBusy = isSpeaking || isThinking

  function statusLabel() {
    if (isSpeaking)  return { text: 'ЯРЬЖ БАЙНА…',   cls: 'status-speaking' }
    if (isListening) return { text: 'СОНСОЖ БАЙНА…',  cls: 'status-listening' }
    if (isThinking)  return { text: 'БОДОЖ БАЙНА…',   cls: 'status-thinking' }
    return { text: 'БЭЛЭН', cls: '' }
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
      {/* 3D robot */}
      <div className="tutor-spline-wrap">
        <SplineScene className="robot-spline" />
      </div>

      {/* Glow when speaking */}
      <div className={`tutor-glow${isSpeaking ? ' glow-active' : ''}`} />

      {/* Sound rings when speaking */}
      <div className="tutor-rings">
        <div className={`tutor-ring tutor-ring-1${isSpeaking ? ' ring-active' : ''}`} />
        <div className={`tutor-ring tutor-ring-2${isSpeaking ? ' ring-active' : ''}`} />
        <div className={`tutor-ring tutor-ring-3${isSpeaking ? ' ring-active' : ''}`} />
      </div>

      {/* Controls */}
      <div className="tutor-controls">
        {/* Status + listen indicator */}
        <div className="tutor-status-row">
          {isListening && <span className="tutor-listen-dot" />}
          <span className={`tutor-status${statusCls ? ` ${statusCls}` : ''}`}>
            {statusText}
          </span>
        </div>

        {/* Text fallback */}
        <div className="tutor-text-row">
          <input
            className="tutor-text-input"
            type="text"
            placeholder="Бичиж асуух…"
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
