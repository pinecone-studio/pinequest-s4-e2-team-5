"use client";

import { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import { useCursorPhysics } from "@/hooks/useCursorPhysics";
import { useCursorHoverText } from "@/hooks/useCursorHoverText";
import { useCursorColor } from "@/hooks/useCursorColor";
import { getCursorColors } from "@/lib/cursorColors";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useCursorPhysics(cursorRef);
  useCursorHoverText(isMobile ? null : labelRef);
  useCursorColor(pathRef, circleRef);

  if (isMobile) return null;

  const colors = getCursorColors(pathname);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 z-9999 select-none"
      style={{ width: 58, height: 60 }}
    >
      <style>{`
        @keyframes cursorSpin {
          from { transform: scale(0.6) rotate(0deg); }
          to { transform: scale(0.6) rotate(360deg); }
        }
      `}</style>
      <svg
        width="97"
        height="100"
        viewBox="0 0 97 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: "100%",
          height: "100%",
          transformOrigin: "center",
          animation: "cursorSpin 7s linear infinite",
        }}
      >
        {/* Math "+" operator cursor */}
        <path
          ref={pathRef}
          d="M35.5 12 H61.5 V37 H86.5 V63 H61.5 V88 H35.5 V63 H10.5 V37 H35.5 Z"
          fill={colors.main}
          stroke="black"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <circle
          ref={circleRef}
          cx="48.5"
          cy="50"
          r="9"
          fill={colors.circle}
          stroke="black"
          strokeWidth="3"
        />
      </svg>{" "}
      <div
        ref={labelRef}
        className="absolute top-0 text-md text-black bg-white/80 px-2 py-1 rounded-md border border-black/10 pointer-events-none opacity-0"
        style={{
          transform: "translate(-50%, -100%)",
          whiteSpace: "nowrap",
        }}
      >
        grab me
      </div>
    </div>
  );
}
