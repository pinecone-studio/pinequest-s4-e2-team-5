import { useEffect, useRef, useState } from 'react'
import './App.css'
import { getPageFromPath } from './navigation.js'

function App() {
  const [page, setPage] = useState(() => getPageFromPath(window.location.pathname))
  const [preview, setPreview] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    const handlePopState = () => setPage(getPageFromPath(window.location.pathname))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    setPage(getPageFromPath(path))
  }

  const chooseFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
  }

  if (page === 'learn') {
    return (
      <main className="learn-page">
        <nav className="topbar">
          <button className="back-button" onClick={() => navigate('/')} aria-label="Нүүр хуудас руу буцах">←</button>
          <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigate('/') }}>
            <span>Q</span> PineQuest
          </a>
          <div className="step">Алхам 1 / 3</div>
        </nav>

        <section className="learn-content">
          <div className="intro-copy">
            <p className="eyebrow">AI МАТЕМАТИКИЙН БАГШ</p>
            <h1>Бодлогын зургаа<br />оруулаарай</h1>
            <p>AI багш бодлогыг таньж, хариуг шууд хэлэхгүйгээр тоглоомоор ойлгуулна.</p>
          </div>

          <button className={`upload-box ${preview ? 'with-preview' : ''}`} onClick={() => fileRef.current?.click()}>
            {preview ? (
              <img src={preview} alt="Сонгосон бодлогын зураг" />
            ) : (
              <>
                <span className="upload-icon">↥</span>
                <strong>Зургаа энд оруулна уу</strong>
                <small>JPG, PNG · 10MB хүртэл</small>
              </>
            )}
          </button>

          <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={chooseFile} />
          <button className="choose-button" onClick={() => fileRef.current?.click()}>{preview ? 'Өөр зураг сонгох' : 'Зураг сонгох'}</button>
          <p className="privacy">Таны зураг хадгалагдахгүй · Зөвхөн бодлогыг танихад ашиглана</p>
        </section>
      </main>
    )
  }

  return (
    <main className="home-page">
      <nav className="home-nav">
        <a className="brand" href="/" onClick={(event) => event.preventDefault()}><span>Q</span> PineQuest</a>
        <p>Хүүхэд бүр бодож чадна.</p>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">МОНГОЛ AI БАГШ</p>
          <h1>Математикийг<br /><em>тоглож</em> ойлгоё.</h1>
          <p>Бодлогын зургаа оруулаарай. AI багш хүүхдэд хариуг нь хэлэхгүй, өөрөөр нь ойлгуулж бодуулна.</p>
          <button className="start-button" onClick={() => navigate('/learn')}>Get started <span>→</span></button>
        </div>

        <div className="number-art" aria-hidden="true">
          <span className="orb orb-one">1</span>
          <span className="orb orb-two">2</span>
          <span className="orb orb-three">3</span>
          <div className="smile">⌣</div>
        </div>
      </section>
    </main>
  )
}

export default App
