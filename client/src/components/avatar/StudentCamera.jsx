import { useEffect, useRef, useState, useCallback } from 'react'

export function StudentCamera() {
  const videoRef    = useRef(null)
  const [on, setOn] = useState(false)
  const [err, setErr] = useState(false)

  const start = useCallback(async () => {
    setErr(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      })
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setOn(true)
    } catch {
      setErr(true)
    }
  }, [])

  const stop = useCallback(() => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop())
      videoRef.current.srcObject = null
    }
    setOn(false)
  }, [])

  useEffect(() => () => stop(), [stop])

  return (
    <div className="student-cam">
      <p className="student-cam-label">ХҮҮХДИЙН КАМЕР</p>

      <div className="student-cam-wrap">
        <video
          ref={videoRef}
          muted
          playsInline
          className="student-cam-video"
          style={{ display: on ? 'block' : 'none' }}
        />
        {!on && (
          <div className="student-cam-placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            {err && <span style={{ fontSize: 10, color: '#ef4444' }}>Камер нээгдсэнгүй</span>}
          </div>
        )}
      </div>

      <button
        type="button"
        className="student-cam-btn"
        onClick={on ? stop : start}
      >
        {on ? '■ Зогсоох' : '▶ Камер асаах'}
      </button>
    </div>
  )
}
