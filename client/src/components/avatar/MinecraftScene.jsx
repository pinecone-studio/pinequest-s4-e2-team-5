import './minecraft-scene.css'

/* /learn (session) дэлгэцийн Майнкрафт дэвсгэр — тэнгэр, нар, үүл, өвсний газар.
   Бодлогын интерактивийн АРД (z-index 0) дүүргэнэ.
   Стив дээр төвлөрүүлэхийн тулд эргэн тойрны хөвөгч блок/морийг авч,
   зөвхөн цэвэрхэн тэнгэр + газрыг үлдээв. */
export function MinecraftBackground() {
  return (
    <div className="mcs-bg" aria-hidden="true">
      <span className="mcs-sun" />
      <span className="mcs-cloud" style={{ top: '9%', left: '28%', width: 96, height: 26, animationDuration: '17s' }} />
      <span className="mcs-cloud" style={{ top: '20%', left: '64%', width: 124, height: 30, animationDuration: '21s' }} />
      <div className="mcs-ground" />
    </div>
  )
}
