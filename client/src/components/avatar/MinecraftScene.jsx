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

      {/* Өвсний гадаргуу дээрх пиксел цэцэг + өвсний ишүүд */}
      <span className="mcs-flower" style={{ left: '16%', '--fc': '#e0554e', animationDelay: '0s' }} />
      <span className="mcs-sprout" style={{ left: '29%', animationDelay: '0.6s' }} />
      <span className="mcs-flower" style={{ left: '45%', '--fc': '#f4c430', animationDelay: '1.2s' }} />
      <span className="mcs-sprout" style={{ left: '67%', animationDelay: '0.3s' }} />
      <span className="mcs-flower" style={{ left: '83%', '--fc': '#e86ab0', animationDelay: '0.9s' }} />
    </div>
  )
}
