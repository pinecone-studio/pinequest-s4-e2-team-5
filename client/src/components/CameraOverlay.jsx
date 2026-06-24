import { useEffect, useRef, useState, useCallback } from 'react'

export function CameraOverlay() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const wsRef = useRef(null)
  const intervalRef = useRef(null)

  const [cameraOn, setCameraOn] = useState(false)
  const [wsStatus, setWsStatus] = useState('idle') // idle | connected | error

  // WebSocket холболт
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/ws')
    wsRef.current = ws
    ws.onopen = () => setWsStatus('connected')
    ws.onclose = () => setWsStatus('idle')
    ws.onerror = () => setWsStatus('error')
    return () => ws.close()
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      })
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraOn(true)

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      intervalRef.current = setInterval(() => {
        const ws = wsRef.current
        if (!ws || ws.readyState !== WebSocket.OPEN) return
        canvas.width = 320
        canvas.height = 240
        ctx.drawImage(videoRef.current, 0, 0, 320, 240)
        ws.send(JSON.stringify({ type: 'frame', data: canvas.toDataURL('image/jpeg', 0.6) }))
      }, 100)
    } catch {
      setWsStatus('error')
    }
  }, [])

  const stopCamera = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop())
      videoRef.current.srcObject = null
    }
    setCameraOn(false)
  }, [])

  const dotColor = wsStatus === 'connected' ? '#65d99d' : wsStatus === 'error' ? '#ef4444' : '#9ca3af'

  return (
    <div className="cam-overlay">
      {/* Video */}
      <video
        ref={videoRef}
        muted
        playsInline
        className="cam-video"
        style={{ display: cameraOn ? 'block' : 'none' }}
      />

      {/* Placeholder */}
      {!cameraOn && (
        <div className="cam-placeholder">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        </div>
      )}

      {/* Живой индикатор */}
      {cameraOn && wsStatus === 'connected' && (
        <div className="cam-live-badge">
          <span className="cam-live-dot" />
          LIVE
        </div>
      )}

      {/* WS статус цэг */}
      <div className="cam-ws-dot" style={{ background: dotColor, boxShadow: `0 0 5px ${dotColor}` }} />

      {/* Toggle товч */}
      <button
        className="cam-toggle"
        onClick={cameraOn ? stopCamera : startCamera}
        title={cameraOn ? 'Камер зогсоох' : 'Камер эхлүүлэх'}
      >
        {cameraOn ? (
          // Stop icon
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        ) : (
          // Camera icon
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        )}
      </button>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
