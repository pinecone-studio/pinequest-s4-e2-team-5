import { CreeperFace, McQueenCar } from './AvatarPicker.tsx'
import { SplineScene } from './SplineScene.jsx'
import { SplineSceneBarbie } from './SplineSceneBarbie.jsx'

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
  if (avatar === 'astronaut') {
    return <SplineScene className={className} />
  }

  if (avatar === 'robot') {
    // Роби — 3D SplineScene робот.
    return <SplineScene className={className} />
  }

  if (avatar === 'barbie') {
    return <SplineSceneBarbie className={className} />
  }

  if (avatar === 'minecraft') {
    return (
      <div
        className={className}
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        role="img"
        aria-label="Майнкрафт креепер"
      >
        <div style={{ width: 'min(60%, 320px)', aspectRatio: '1 / 1', filter: 'drop-shadow(0 14px 22px rgba(40,80,30,0.3))' }}>
          <CreeperFace />
        </div>
      </div>
    )
  }

  if (avatar === 'mcqueen') {
    return (
      <div
        className={className}
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        role="img"
        aria-label="Маккуин машин"
      >
        <div style={{ width: 'min(72%, 400px)', aspectRatio: '1 / 1', filter: 'drop-shadow(0 14px 22px rgba(120,30,20,0.3))' }}>
          <McQueenCar />
        </div>
      </div>
    )
  }

  return <KidMascotScene className={className} mood={mood} />
}
