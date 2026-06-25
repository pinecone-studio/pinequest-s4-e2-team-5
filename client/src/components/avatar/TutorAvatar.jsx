import { useEffect, useRef } from 'react'
import { KidMascotScene } from '../KidMascotScene.jsx'
import { useTutor } from './useTutor.js'

export function TutorAvatar({ nickname, homeworkContext }) {
  const {
    isSpeaking,
    isListening,
    isThinking,
    error,
    greet,
    announceHomework,
    startAlwaysListen,
    stopAlwaysListen,
  } = useTutor({ nickname, homeworkContext })

  const prevHomeworkRef = useRef('')
  const greetedRef      = useRef(false)

  // Wait for nickname before greeting, then start always-listen
  useEffect(() => {
    if (greetedRef.current || !nickname) return
    greetedRef.current = true
    greet().then(() => startAlwaysListen())
    return () => stopAlwaysListen()
  }, [nickname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Announce when homework is first uploaded
  useEffect(() => {
    if (homeworkContext && !prevHomeworkRef.current) {
      prevHomeworkRef.current = homeworkContext
      announceHomework()
    }
  }, [homeworkContext, announceHomework])

  function statusLabel() {
    if (isSpeaking)  return { text: 'ЯРЬЖ БАЙНА…',  cls: 'status-speaking' }
    if (isListening) return { text: 'СОНСОЖ БАЙНА…', cls: 'status-listening' }
    if (isThinking)  return { text: 'БОДОЖ БАЙНА…',  cls: 'status-thinking' }
    return { text: 'БЭЛЭН', cls: '' }
  }

  const { text: statusText, cls: statusCls } = statusLabel()
  const mascotMood = isSpeaking
    ? 'speaking'
    : isListening
      ? 'listening'
      : isThinking
        ? 'thinking'
        : 'ready'

  return (
    <div className="tutor-avatar">
      {/* 3D kid-friendly tutor */}
      <div className="tutor-spline-wrap">
        <KidMascotScene className="tutor-mascot" mood={mascotMood} />
      </div>

      {/* Glow when speaking */}
      <div className={`tutor-glow${isSpeaking ? ' glow-active' : ''}`} />

      {/* Sound rings when speaking */}
      <div className="tutor-rings">
        <div className={`tutor-ring tutor-ring-1${isSpeaking ? ' ring-active' : ''}`} />
        <div className={`tutor-ring tutor-ring-2${isSpeaking ? ' ring-active' : ''}`} />
        <div className={`tutor-ring tutor-ring-3${isSpeaking ? ' ring-active' : ''}`} />
      </div>

      {/* Status */}
      <div className="tutor-controls">
        <div className="tutor-status-row">
          {isListening && <span className="tutor-listen-dot" />}
          <span className={`tutor-status${statusCls ? ` ${statusCls}` : ''}`}>
            {statusText}
          </span>
        </div>
        {error && <p className="tutor-error">{error}</p>}
      </div>
    </div>
  )
}
