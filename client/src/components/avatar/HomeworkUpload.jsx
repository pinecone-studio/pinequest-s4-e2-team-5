import { useState, useRef } from 'react'
import { API_BASE } from '../../lib/config.js'
import { normalizeHomeworkProblems } from './problemNormalizer.js'
import { parseManualProblems } from './manualProblems.js'

const MANUAL_PLACEHOLDER = `Мөр бүрт нэг бодлого бич. Жишээ:
40 - 5 x 7 =
77 ? 57
9 + 5 ? 15
5 дм = ? см
35 см = ? дм ? см
Сумьяа 5 ном, Амгалан 6-аар олон уншив | 11`

// "Дасгал даалгавар" хуудасны 4 бодлого — квот дуусах үед / нэг товшилтоор ачаална.
const SAMPLE_SHEET = `40 - 5 x 7 =
77 ? 57
9 + 5 ? 15
5 дм = ? см
35 см = ? дм ? см
Сумьяа 5 ном, Амгалан 6-аар олон уншив | 11`

function isQuotaError(message) {
  return /quota|429|exceeded|billing|insufficient/i.test(String(message ?? ''))
}

// Vision API нь зөвхөн JPEG/PNG/WEBP дэмждэг (HEIC ❌). Утасны зураг ч хэт хүнд.
// Тиймээс илгээхээс өмнө canvas дээр зурж, багасгаад JPEG болгож хувиргана.
const MAX_DIM = 1600

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () =>
      reject(new Error('Энэ зургийн форматыг уншиж чадсангүй. JPEG эсвэл PNG оруулна уу.'))
    img.src = src
  })
}

// dataUrl → багасгасан JPEG base64 (mimeType үргэлж image/jpeg).
async function normalizeImage(dataUrl) {
  const img = await loadImage(dataUrl)
  const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(img, 0, 0, width, height)

  const jpegUrl = canvas.toDataURL('image/jpeg', 0.85)
  return jpegUrl.split(',')[1]
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function buildContext(problems, fallback = '') {
  if (!problems.length) return fallback
  return problems
    .map((problem) => `${problem.index}. ${problem.raw ?? problem.promptMn ?? ''}`)
    .join('\n')
}

// Render free tier унтсан байвал эхний хүсэлт сэрээх зуур алдаа өгдөг тул дахин оролдоно.
async function analyzeWithRetry(base64, attempts = 3) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${API_BASE}/api/analyze-homework`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg' }),
      })
      if (res.ok) return res.json()
      // 404/502/503 — сервер сэрж байна. Хүлээгээд дахин оролдоно.
      if ((res.status === 404 || res.status >= 500) && i < attempts - 1) {
        lastErr = new Error(`сервер сэрж байна (${res.status})`)
        await sleep(4000)
        continue
      }
      // Бусад алдаа (400 гэх мэт) — серверийн бодит мессежийг гаргана.
      let detail = `${res.status}`
      try { const j = await res.json(); if (j?.error) detail = j.error } catch { /* JSON биш */ }
      throw new Error(detail)
    } catch (e) {
      lastErr = e
      if (i < attempts - 1) await sleep(4000)
    }
  }
  throw lastErr
}

export function HomeworkUpload({ onHomeworkLoaded, onAnalyzingChange }) {
  const [preview, setPreview]     = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState(null)
  const [manualMode, setManualMode] = useState(false)
  const [manualText, setManualText] = useState('')
  const inputRef                  = useRef(null)

  function loadManual(text, noteOnEmpty = 'Нэг ч бодлого таньсангүй. Жишээ хэлбэрийн дагуу бичнэ үү.') {
    const { problems, skipped } = parseManualProblems(text)
    if (!problems.length) {
      setError(noteOnEmpty)
      return false
    }
    setError(skipped.length ? `Танигдаагүй мөр: ${skipped.join(' / ')}` : null)
    onHomeworkLoaded(buildContext(problems), problems)
    setDone(true)
    return true
  }

  function handleManualSubmit() {
    loadManual(manualText)
  }

  function loadSample() {
    setManualText(SAMPLE_SHEET)
    loadManual(SAMPLE_SHEET)
  }

  function setAnalyzingState(v) {
    setAnalyzing(v)
    onAnalyzingChange?.(v)
  }

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setError(null)
    setDone(false)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target.result
      setPreview(dataUrl)
      setAnalyzingState(true)

      try {
        // HEIC/том зургийг дэмжигдэх JPEG болгож багасгана.
        const base64 = await normalizeImage(dataUrl)
        const { context, problems = [] } = await analyzeWithRetry(base64)
        const normalizedProblems = normalizeHomeworkProblems(problems)
        onHomeworkLoaded(buildContext(normalizedProblems, context), normalizedProblems)
        setDone(true)
      } catch (err) {
        if (isQuotaError(err.message)) {
          // OpenAI квот дууссан — зураг унших боломжгүй. Гараар оруулах горимд шилжиж,
          // энэ хуудасны бодлогуудыг бэлэн ачаалж, хэрэглэгч засах боломжтой болгоно.
          setManualMode(true)
          setManualText(SAMPLE_SHEET)
          loadManual(SAMPLE_SHEET)
          setError('OpenAI квот дууссан тул зургийг уншиж чадсангүй. Доорх бодлогуудыг ачаалав — засаад дахин оруулж болно.')
        } else {
          // Серверийн жинхэнэ алдааг харуулна (зүгээр л "алдаа" биш).
          setError(`Зургийг уншихад алдаа гарлаа: ${err.message}`)
          onHomeworkLoaded('', [])
        }
      } finally {
        setAnalyzingState(false)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e) { e.preventDefault() }

  function handleChange(e) {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  function handleReset() {
    setPreview(null)
    setDone(false)
    setError(null)
    setAnalyzingState(false)
    onHomeworkLoaded('', [])
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="hw-upload">
      <div className="hw-title-row">
        <p className="hw-title">ДААЛГАВАР</p>
        <button
          type="button"
          className="hw-mode-toggle"
          onClick={() => { setManualMode((v) => !v); setError(null); setDone(false) }}
        >
          {manualMode ? '📷 Зургаар' : '✍️ Гараар бичих'}
        </button>
      </div>

      {manualMode ? (
        <div className="hw-manual">
          <textarea
            className="hw-manual-input"
            rows={7}
            value={manualText}
            placeholder={MANUAL_PLACEHOLDER}
            onChange={(e) => setManualText(e.target.value)}
          />
          <div className="hw-manual-actions">
            <button
              type="button"
              className="hw-drop-btn hw-manual-btn"
              onClick={handleManualSubmit}
            >
              Бодлого оруулах
            </button>
            <button
              type="button"
              className="hw-mode-toggle"
              onClick={loadSample}
            >
              📋 Жишээ хуудас
            </button>
          </div>
          {done && <span className="hw-done">✓ Даалгавар оруулаа</span>}
          {error && <span style={{ fontSize: 11, color: '#ef4444' }}>{error}</span>}
        </div>
      ) : (
      <>
      <div
        className="hw-drop-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !preview && inputRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt="Даалгавар" className="hw-image-preview" />
            <button
              type="button"
              className="hw-remove-btn"
              onClick={(e) => { e.stopPropagation(); handleReset() }}
              aria-label="Зургийг хасах"
            >
              ✕
            </button>
          </>
        ) : (
          <>
            <span className="hw-drop-icon">📄</span>
            <span className="hw-drop-label">Зургаа энд чирж тавь<br />эсвэл товшоод сонго</span>
            <button
              type="button"
              className="hw-drop-btn"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
            >
              Зураг сонгох
            </button>
          </>
        )}
      </div>

      {(analyzing || done || error) && (
        <div className="hw-status-row">
          {analyzing && <span className="hw-analyzing">⏳ Уншиж байна…</span>}
          {done && !analyzing && <span className="hw-done">✓ Даалгавар уншлаа</span>}
          {error && !analyzing && <span style={{ fontSize: 11, color: '#ef4444' }}>{error}</span>}
          {preview && !analyzing && (
            <button type="button" className="hw-retry-btn" onClick={handleReset}>
              Солих
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      </>
      )}
    </div>
  )
}
