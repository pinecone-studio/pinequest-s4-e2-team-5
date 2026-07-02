// Minecraft бодлогуудын нийтлэг дэвсгэр (тэнгэр, нар, үүл, өвс).
// Туслах функцүүд mcUtils.js дотор.
export function MinecraftBg() {
  return (
    <div className="mfp-bg" aria-hidden="true">
      <img src="/sukh.png" alt="" className="mfp-axe" draggable={false} />
      <span className="mfp-cloud" style={{ top: '8%', left: '18%' }} />
      <span className="mfp-cloud" style={{ top: '16%', left: '62%', animationDuration: '23s' }} />
      <div className="mfp-ground" />
    </div>
  )
}
