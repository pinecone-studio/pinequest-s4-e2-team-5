import { useState, useCallback, useRef, useEffect } from 'react'

const API = 'http://localhost:3000'

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
  })
}

export function useTutor({ nickname, homeworkContext }) {
  const [isSpeaking, setIsSpeaking]   = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isThinking, setIsThinking]   = useState(false)
  const [error, setError]             = useState(null)

  const messagesRef       = useRef([])
  const stopRecordRef     = useRef(null)
  const nicknameRef       = useRef(nickname)
  const homeworkRef       = useRef(homeworkContext)

  useEffect(() => { nicknameRef.current = nickname }, [nickname])
  useEffect(() => { homeworkRef.current = homeworkContext }, [homeworkContext])

  const speak = useCallback(async (text) => {
    if (!text) return
    setIsSpeaking(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
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
    }
  }, [])

  const chat = useCallback(async (userText) => {
    if (userText?.trim()) {
      messagesRef.current = [
        ...messagesRef.current,
        { role: 'user', content: userText.trim() },
      ]
    }
    setIsThinking(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nicknameRef.current,
          homeworkContext: homeworkRef.current,
          messages: messagesRef.current,
        }),
      })
      if (!res.ok) throw new Error('Chat алдаа')
      const { text } = await res.json()
      messagesRef.current = [
        ...messagesRef.current,
        { role: 'assistant', content: text },
      ]
      setIsThinking(false)
      await speak(text)
    } catch (e) {
      console.error(e)
      setIsThinking(false)
      setError('Серверт холбогдоход алдаа гарлаа.')
    }
  }, [speak])

  // Called once on mount — initial greeting
  const greet = useCallback(async () => {
    messagesRef.current = []
    const greeting = `Сайн уу ${nicknameRef.current}! Хоёулаа гэрийн даалгавраа хамтдаа хийцгээе.`
    await speak(greeting)
    if (!homeworkRef.current) {
      await speak(`${nicknameRef.current}, эхлээд даалгаврынхаа зургийг зүүн талд оруулна уу.`)
    }
  }, [speak])

  // Called when homework is first loaded
  const announceHomework = useCallback(async () => {
    messagesRef.current = []
    await chat(null)
  }, [chat])

  const startListening = useCallback(async () => {
    if (isListening || isSpeaking || isThinking) return
    setError(null)

    let mimeType = 'audio/webm;codecs=opus'
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
    }

    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      const chunks   = []
      const recorder = new MediaRecorder(stream, { mimeType })

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setIsListening(false)
        if (!chunks.length) return

        const blob    = new Blob(chunks, { type: mimeType })
        const base64  = await blobToBase64(blob)

        setIsThinking(true)
        try {
          const res = await fetch(`${API}/api/stt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64, mimeType }),
          })
          if (!res.ok) throw new Error('STT алдаа')
          const { text } = await res.json()
          setIsThinking(false)
          if (text?.trim()) await chat(text)
        } catch (e) {
          console.error(e)
          setIsThinking(false)
          setError('Дуу таних алдаа гарлаа.')
        }
      }

      recorder.start()
      setIsListening(true)
      stopRecordRef.current = () => recorder.stop()
    } catch (e) {
      console.error(e)
      setError('Микрофон ашиглах зөвшөөрөл олдсонгүй.')
    }
  }, [isListening, isSpeaking, isThinking, chat])

  const stopListening = useCallback(() => {
    if (stopRecordRef.current) {
      stopRecordRef.current()
      stopRecordRef.current = null
    }
  }, [])

  return {
    isSpeaking,
    isListening,
    isThinking,
    error,
    greet,
    announceHomework,
    chat,
    startListening,
    stopListening,
  }
}
