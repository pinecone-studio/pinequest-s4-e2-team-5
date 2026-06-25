import { SplineScene } from './SplineScene.jsx'

export function KidMascotScene({ className = '', mood = 'ready' }) {
  return (
    <div
      className={`kid-mascot-scene kid-mascot-scene--${mood}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label="Инээмсэглэсэн 3D Нархан"
    >
      <div className="kid-mascot-orbit kid-mascot-orbit--one">
        <span>1</span>
      </div>
      <div className="kid-mascot-orbit kid-mascot-orbit--two">
        <span>2</span>
      </div>
      <div className="kid-mascot-orbit kid-mascot-orbit--three">
        <span>+</span>
      </div>

      <div className="kid-mascot-stage">
        <div className="kid-mascot-shadow" />
        <div className="kid-mascot-body">
          <div className="kid-mascot-rays" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="kid-mascot-face">
            <span className="kid-mascot-cheek kid-mascot-cheek--left" />
            <span className="kid-mascot-cheek kid-mascot-cheek--right" />
            <span className="kid-mascot-eye kid-mascot-eye--left" />
            <span className="kid-mascot-eye kid-mascot-eye--right" />
            <span className="kid-mascot-mouth" />
          </div>
          <div className="kid-mascot-hands" aria-hidden="true">
            <span className="kid-mascot-hand kid-mascot-hand--left" />
            <span className="kid-mascot-hand kid-mascot-hand--right" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function MascotScene({ avatar = 'sun-buddy', className = '', mood = 'ready' }) {
  if (avatar === 'robot') {
    return <SplineScene className={className} />
  }

  return <KidMascotScene className={className} mood={mood} />
}
