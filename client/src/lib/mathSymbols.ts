// Mathematical symbols rendered as the decorative "flowers" scattered across
// the hero and footer. Basic operators are weighted first, with a few fancier
// symbols mixed in for variety.
export const MATH_SYMBOLS = [
  "+",
  "−",
  "×",
  "÷",
  "%",
  "=",
  "√",
  "π",
  "∑",
  "∞",
  "±",
  "≈",
  "≠",
  "≤",
  "≥",
  "Δ",
  "∫",
  "θ",
] as const;

export type MathSymbol = (typeof MATH_SYMBOLS)[number];
