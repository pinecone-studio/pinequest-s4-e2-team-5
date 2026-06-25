"use client";
import { useRef } from "react";
import { useRandomFlowerColors } from "@/hooks/useRandomFlowerColors";
import { useRandomMathSymbol } from "@/hooks/useRandomMathSymbol";
import { useMathSymbolEntranceAnimation } from "@/hooks/useMathSymbolEntranceAnimation";
import { useFlowerHoverScale } from "@/hooks/useFlowerHoverScale";
import { useDraggable } from "@/hooks/useDraggable";

// Kept for backwards compatibility with callers (HeroSection / Footer) that
// still pass a `variant`. The visual is now a math symbol rather than a flower.
export type FlowerVariant = "one" | "two" | "three" | "four" | "five";

interface FlowerProps {
  variant?: FlowerVariant;
  size?: number;
  delay?: number;
  draggable?: boolean;
  opacity?: boolean;
}

export default function Flower({
  size = 100,
  delay = 0,
  draggable = true,
  opacity = false,
}: FlowerProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const symbolRef = useRef<SVGTextElement | null>(null);

  const colors = useRandomFlowerColors();
  const symbol = useRandomMathSymbol();

  useMathSymbolEntranceAnimation(wrapperRef, symbolRef, delay);
  useFlowerHoverScale(wrapperRef);
  useDraggable(wrapperRef, draggable);

  return (
    <div
      ref={wrapperRef}
      className={draggable ? "grabme" : ""}
      style={{ display: "inline-block" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={opacity ? "opacity-50" : ""}
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          ref={symbolRef}
          x="50"
          y="54"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="68"
          fontWeight={900}
          fontFamily="'Manrope', system-ui, sans-serif"
          fill={colors?.petalColor ?? "transparent"}
          stroke="#000000"
          strokeWidth={3}
          strokeLinejoin="round"
          paintOrder="stroke"
          style={{ userSelect: "none" }}
        >
          {symbol ?? ""}
        </text>
      </svg>
    </div>
  );
}
