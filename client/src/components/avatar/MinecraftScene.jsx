import './minecraft-scene.css'

/* /learn (session) дэлгэцийн Майнкрафт дэвсгэр — тэнгэр, нар, үүл, хөвөгч блок, өвсний газар.
   Бодлогын интерактивийн АРД (z-index 0) дүүргэнэ. */
// Зүүн-дээд буланг (split үед аватар очдог) чөлөөтэй үлдээж, блокуудыг доош/хажуу тийш.
const MCS_BLOCKS = [
  { src: '/block.png', top: '38%', left: '6%', s: 56, dur: '7s' }, // грасс блок (зүүн дунд)
  { src: '/mavis.png', top: '60%', left: '4%', s: 48, dur: '8.2s' }, // зуух (зүүн доод)
  { src: '/borblock.png', top: '16%', left: '90%', s: 52, dur: '8.5s' }, // мод блок (баруун дээд)
  { src: '/lerobrine.png', top: '40%', left: '93%', s: 46, dur: '7.8s' }, // алмаз (баруун дунд)
  { src: '/gal.png', top: '9%', left: '45%', s: 40, dur: '6.5s' }, // дэнлүү (голд, үүлний хавьд)
  { src: '/sukh.png', top: '80%', left: '8%', s: 48, dur: '9s' }, // pickaxe (зүүн доод буланд)
]

// Газар дээр зогсох чимэглэл (зөвхөн морь — gal-аас зайтай, голд)
const MCS_GROUND = [
  { src: '/hours.png', style: { right: '7%', bottom: '13%', height: 'min(20vh, 175px)' } },
]

export function MinecraftBackground() {
  return (
    <div className="mcs-bg" aria-hidden="true">
      <span className="mcs-sun" />
      <span className="mcs-cloud" style={{ top: '9%', left: '28%', width: 96, height: 26, animationDuration: '17s' }} />
      <span className="mcs-cloud" style={{ top: '20%', left: '64%', width: 124, height: 30, animationDuration: '21s' }} />
      {MCS_BLOCKS.map((b, i) => (
        <img
          key={i}
          className="mcs-block"
          src={b.src}
          alt=""
          draggable="false"
          style={{ top: b.top, left: b.left, '--s': `${b.s}px`, animationDuration: b.dur }}
        />
      ))}
      <div className="mcs-ground" />
      {MCS_GROUND.map((g, i) => (
        <img key={i} className="mcs-ground-item" src={g.src} alt="" draggable="false" style={g.style} />
      ))}
    </div>
  )
}
