// Зөв хариултын баяр ёслол: тэнгэрт салют буудаж дэлбэрэх мэт анимэйшн.
// Emoji биш — зураастай оч (div) ашиглана. phase==='correct' үед mount хийгдэж
// нэг удаа тоглоно (шинээр mount болоход CSS анимэйшн дахин ажиллана).

const SPARK_COLORS = ['#ffd54a', '#65d99d', '#ff8fb1', '#7cc4ff', '#fff1a8', '#ffae45']
const SPARK_COUNT = 22
const SPARKS = Array.from({ length: SPARK_COUNT }, (_, i) => i)

export function CelebrationBurst() {
  return (
    <div className="cb-root" aria-hidden="true">
      {/* доороос центр рүү харвах оч */}
      <span className="cb-launch" />

      {/* центрт дэлбэрэх цацраг оч */}
      <div className="cb-burst">
        {SPARKS.map((i) => {
          const angle = (360 / SPARK_COUNT) * i + (i % 2 ? 7 : -7)
          const dist = 64 + (i % 5) * 16
          const color = SPARK_COLORS[i % SPARK_COLORS.length]
          return (
            <span
              key={i}
              className="cb-spark"
              style={{
                '--angle': `${angle}deg`,
                '--dist': `${dist}px`,
                '--color': color,
              }}
            />
          )
        })}
        <span className="cb-flash" />
      </div>
    </div>
  )
}
