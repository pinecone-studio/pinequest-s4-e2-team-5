import './mcqueen-scene.css'

/* /learn (session) дэлгэцийн McQueen дэвсгэр — тэнгэр, нар, үүл, хөвөгч
   95/цом, хурдны зам, гэрлэн дохио, Queen машин.
   Бодлогын интерактивийн АРД (z-index 0) дүүргэнэ.
   Зүүн-дээд буланг (split үед аватар очдог) чөлөөтэй үлдээнэ. */
const MCQS_FLOAT = [
  { src: '/95.png', top: '19%', left: '87%', s: 76, dur: '7s' }, // дугаар (баруун дээд)
  { src: '/tsom.png', top: '42%', left: '92%', s: 62, dur: '8.4s' }, // Piston Cup (баруун дунд)
  { src: '/95.png', top: '60%', left: '6%', s: 50, dur: '7.6s' }, // дугаар (зүүн доод)
]

// Газар (зам) дээр зогсох том чимэглэл
const MCQS_GROUND = [
  { src: '/gerlen dohio.png', style: { right: '6%', bottom: '12%', height: 'min(26vh, 240px)' } }, // гэрлэн дохио
  { src: '/mater.png', style: { left: '4%', bottom: '12%', height: 'min(15vh, 138px)' } }, // хажуугийн машин
]

export function McQueenBackground() {
  return (
    <div className="mcqs-bg" aria-hidden="true">
      <span className="mcqs-sun" />
      <span className="mcqs-cloud" style={{ top: '9%', left: '26%', width: 96, height: 26, animationDuration: '17s' }} />
      <span className="mcqs-cloud" style={{ top: '20%', left: '58%', width: 124, height: 30, animationDuration: '21s' }} />
      {MCQS_FLOAT.map((b, i) => (
        <img
          key={i}
          className="mcqs-deco"
          src={b.src}
          alt=""
          draggable="false"
          style={{ top: b.top, left: b.left, '--s': `${b.s}px`, animationDuration: b.dur }}
        />
      ))}
      <div className="mcqs-road">
        <span className="mcqs-lane" />
      </div>
      {MCQS_GROUND.map((g, i) => (
        <img key={i} className="mcqs-ground-item" src={g.src} alt="" draggable="false" style={g.style} />
      ))}
    </div>
  )
}
