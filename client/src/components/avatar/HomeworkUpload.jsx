import { useState, useRef } from 'react'

const API = 'http://localhost:3000'

export function HomeworkUpload({ onHomeworkLoaded }) {
  const [preview, setPreview]     = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState(null)
  const inputRef                  = useRef(null)

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setError(null)
    setDone(false)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target.result
      setPreview(dataUrl)
      setAnalyzing(true)

      try {
        const base64    = dataUrl.split(',')[1]
        const mimeType  = file.type

        const res = await fetch(`${API}/api/analyze-homework`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        })
        if (!res.ok) throw new Error('analyze failed')
        const { context } = await res.json()
        onHomeworkLoaded(context)
        setDone(true)
      } catch {
        setError('Зурагыг шинжлэхэд алдаа гарлаа.')
        onHomeworkLoaded('')
      } finally {
        setAnalyzing(false)
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
    onHomeworkLoaded('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="hw-upload">
      <p className="hw-title">ДААЛГАВАР</p>

      <div
        className="hw-drop-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !preview && inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Даалгавар" className="hw-image-preview" />
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
          {analyzing && <span className="hw-analyzing">⏳ Шинжилж байна…</span>}
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
    </div>
  )
}
