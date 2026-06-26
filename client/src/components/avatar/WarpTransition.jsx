import { useEffect, useMemo } from "react";
import "./warp-transition.css";

// App-ийн theme-ийн 3 өнгө (зураг шиг солонго биш — зөвхөн эдгээр).
const COLORS = ["#1f7a5c", "#ffbd4a", "#3ad0c0"];

// SCSS-ийн shadowSet()-ийн дүйцэл: олон санамсаргүй од (box-shadow) үүсгэнэ.
// Байрлалыг vw/vh-ээр өгснөөр 1px цэгийг бүх дэлгэц даяар тараана.
function buildStarShadow(count) {
  const parts = ["0 0 0 0 " + COLORS[0]];
  for (let i = 0; i < count; i++) {
    const x = (Math.random() * 100).toFixed(2);
    const y = (Math.random() * 100).toFixed(2);
    const blur = Math.floor(Math.random() * 5);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    parts.push(`${x}vw ${y}vh 0 ${blur}px ${color}`);
  }
  return parts.join(", ");
}

const ITEMS = [
  "item-right",
  "item-left",
  "item-top",
  "item-bottom",
  "item-middle",
];

// /start (нэр авах) → /learn (бодох) хооронд 2-3 секундын hyperspace шилжилт.
export function WarpTransition({ onDone, duration = 2500 }) {
  // Од бүрийг render бүрт дахин үүсгэхгүйн тулд нэг л удаа тооцно.
  const starShadow = useMemo(() => buildStarShadow(500), []);

  useEffect(() => {
    const t = setTimeout(() => onDone?.(), duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return (
    <div className="warp">
      <div className="warp-container">
        {[0, 1].map((g) => (
          <div className="warp-group" key={g}>
            {ITEMS.map((cls) => (
              <div
                className={`warp-item ${cls}`}
                key={cls}
                style={{ "--star-shadow": starShadow }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
