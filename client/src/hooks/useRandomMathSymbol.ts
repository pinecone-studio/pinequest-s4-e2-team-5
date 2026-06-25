import { MATH_SYMBOLS, MathSymbol } from "@/lib/mathSymbols";
import { useEffect, useState } from "react";

// Picks one random math symbol per mounted instance and keeps it stable across
// re-renders (mirrors how useRandomFlowerColors assigns colors once).
export function useRandomMathSymbol() {
  const [symbol, setSymbol] = useState<MathSymbol | null>(null);

  useEffect(() => {
    setSymbol(MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)]);
  }, []);

  return symbol;
}
