import { useState, useCallback, useRef, useEffect } from 'react'

const API = 'http://localhost:3000'

// RMS-based Voice Activity Detector
class VAD {
  constructor(stream, { threshold = 0.015, silenceMs = 1200, onSpeechStart, onSpeechEnd }) {
    this.ctx = new AudioContext()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 512
    const src = this.ctx.createMediaStreamSource(stream)
    src.connect(this.analyser)
    this.data      = new Float32Array(this.analyser.fftSize)
    this.threshold = threshold
    this.silenceMs = silenceMs
    this.onSpeechStart = onSpeechStart
    this.onSpeechEnd   = onSpeechEnd
    this.speaking      = false
    this.silenceTimer  = null
    this.stopped       = false
    this._tick()
  }

  _rms() {
    this.analyser.getFloatTimeDomainData(this.data)
    let s = 0
    for (let i = 0; i < this.data.length; i++) s += this.data[i] ** 2
    return Math.sqrt(s / this.data.length)
  }

  _tick() {
    if (this.stopped) return
    const level = this._rms()
    if (level > this.threshold) {
      if (!this.speaking) {
        this.speaking = true
        this.onSpeechStart?.()
      }
      clearTimeout(this.silenceTimer)
      this.silenceTimer = setTimeout(() => {
        if (this.speaking && !this.stopped) {
          this.speaking = false
          this.onSpeechEnd?.()
        }
      }, this.silenceMs)
    }
    requestAnimationFrame(() => this._tick())
  }

  destroy() {
    this.stopped = true
    clearTimeout(this.silenceTimer)
    this.ctx.close().catch(() => {})
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
  })
}

export function useTutor({ nickname, homeworkContext }) {
  const [isSpeaking,  setIsSpeaking]  = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isThinking,  setIsThinking]  = useState(false)
  const [error,       setError]       = useState(null)

  const messagesRef  = useRef([])
  const nicknameRef  = useRef(nickname)
  const homeworkRef  = useRef(homeworkContext)
  const isBusyRef    = useRef(false) // true while speaking or thinking

  const streamRef    = useRef(null)
  const vadRef       = useRef(null)
  const recorderRef  = useRef(null)
  const chunksRef    = useRef([])
  const mimeTypeRef  = useRef('audio/webm')

  useEffect(() => { nicknameRef.current  = nickname },       [nickname])
  useEffect(() => { homeworkRef.current  = homeworkContext }, [homeworkContext])

  // ── speak ───────────────────────────────────────────────
  const speak = useCallback(async (text) => {
    if (!text) return
    isBusyRef.current = true
    setIsSpeaking(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/tts`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('TTS алдаа')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      await new Promise((resolve, reject) => {
        const audio = new Audio(url)
        audio.onended = resolve
        audio.onerror = reject
        audio.play().catch(reject)
      })
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      setError('Дуу тоглуулахад алдаа гарлаа.')
    } finally {
      setIsSpeaking(false)
      isBusyRef.current = false
    }
  }, [])

  // ── chat ────────────────────────────────────────────────
  const chat = useCallback(async (userText) => {
    if (userText?.trim()) {
      messagesRef.current = [...messagesRef.current, { role: 'user', content: userText.trim() }]
    }
    isBusyRef.current = true
    setIsThinking(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          nickname:        nicknameRef.current,
          homeworkContext: homeworkRef.current,
          messages:        messagesRef.current,
        }),
      })
      if (!res.ok) throw new Error('Chat алдаа')
      const { text } = await res.json()
      messagesRef.current = [...messagesRef.current, { role: 'assistant', content: text }]
      setIsThinking(false)
      await speak(text)
    } catch (e) {
      console.error(e)
      setIsThinking(false)
      isBusyRef.current = false
      setError('Серверт холбогдоход алдаа гарлаа.')
    }
  }, [speak])

  // ── process recorded audio (STT → chat) ─────────────────
  const processAudio = useCallback(async (chunks, mimeType) => {
    if (!chunks.length) return
    const blob   = new Blob(chunks, { type: mimeType })
    const base64 = await blobToBase64(blob)
    isBusyRef.current = true
    setIsThinking(true)
    try {
      const res = await fetch(`${API}/api/stt`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ audio: base64, mimeType }),
      })
      if (!res.ok) throw new Error('STT алдаа')
      const { text } = await res.json()
      setIsThinking(false)
      if (text?.trim()) await chat(text)
      else isBusyRef.current = false
    } catch (e) {
      console.error(e)
      setIsThinking(false)
      isBusyRef.current = false
      setError('Дуу таних алдаа гарлаа.')
    }
  }, [chat])

  // ── always-listen (VAD) ──────────────────────────────────
  const startAlwaysListen = useCallback(async () => {
    if (streamRef.current) return

    let mimeType = 'audio/webm;codecs=opus'
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
    }
    mimeTypeRef.current = mimeType

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      streamRef.current = stream

      vadRef.current = new VAD(stream, {
        threshold: 0.015,
        silenceMs: 1200,
        onSpeechStart: () => {
          if (isBusyRef.current) return   // avatar ярьж/бодож байна
          if (recorderRef.current) return // аль хэдийн бичиж байна

          chunksRef.current = []
          try {
            const recorder = new MediaRecorder(stream, { mimeType })
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
            recorder.start()
            recorderRef.current = recorder
            setIsListening(true)
          } catch (e) {
            console.error('Recorder start error:', e)
          }
        },
        onSpeechEnd: () => {
          const recorder = recorderRef.current
          if (!recorder || recorder.state === 'inactive') {
            setIsListening(false)
            return
          }
          recorderRef.current = null
          setIsListening(false)
          const captured = [...chunksRef.current]
          const mime     = mimeTypeRef.current
          recorder.onstop = () => {
            if (captured.length && !isBusyRef.current) {
              processAudio(captured, mime)
            }
          }
          try { recorder.stop() } catch (e) { console.error(e) }
        },
      })
    } catch (e) {
      console.error(e)
      setError('Микрофон ашиглах зөвшөөрөл олдсонгүй.')
    }
  }, [processAudio])

  const stopAlwaysListen = useCallback(() => {
    vadRef.current?.destroy()
    vadRef.current = null
    if (recorderRef.current) {
      try { recorderRef.current.stop() } catch (_) {}
      recorderRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setIsListening(false)
  }, [])

  // ── greet (mount) ────────────────────────────────────────
  const greet = useCallback(async () => {
    messagesRef.current = []
    await speak(`Сайн уу ${nicknameRef.current}! Хоёулаа гэрийн даалгавраа хамтдаа хийцгээе.`)
    if (!homeworkRef.current) {
      await speak(`${nicknameRef.current}, эхлээд даалгаврынхаа зургийг зүүн талд оруулна уу.`)
    }
  }, [speak])

  // ── announce homework when first loaded ──────────────────
  const announceHomework = useCallback(async () => {
    messagesRef.current = []
    await chat(null)
  }, [chat])

  return {
    isSpeaking,
    isListening,
    isThinking,
    error,
    greet,
    announceHomework,
    chat,
    startAlwaysListen,
    stopAlwaysListen,
  }
}
