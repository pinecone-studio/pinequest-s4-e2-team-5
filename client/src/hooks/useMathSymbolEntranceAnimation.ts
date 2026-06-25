import gsap from "gsap";
import { useEffect } from "react";

// Flower-style entrance for a math symbol: the symbol springs in with a scale
// pop + spin while the glyph itself fades up. Adapted from
// useFlowerEntranceAnimation so the new symbols keep the same playful feel.
export function useMathSymbolEntranceAnimation(
  wrapperRef: React.RefObject<HTMLDivElement | null>,
  symbolRef: React.RefObject<SVGTextElement | null>,
  delay: number,
) {
  useEffect(() => {
    if (!wrapperRef.current || !symbolRef.current) return;

    const random = (min: number, max: number) =>
      Math.random() * (max - min) + min;
    const randomSign = () => (Math.random() < 0.5 ? 1 : -1);

    // Initial hidden state
    gsap.set(wrapperRef.current, {
      scale: 0,
      rotate: randomSign() * random(40, 160),
      opacity: 0,
      transformOrigin: "center",
    });
    gsap.set(symbolRef.current, { opacity: 0, transformOrigin: "center" });

    const tl = gsap.timeline({
      delay,
      defaults: { ease: "power2.out" },
    });

    tl.to(wrapperRef.current, {
      scale: 1,
      rotate: 0,
      opacity: 1,
      duration: 1.2,
      ease: "back.out(3)",
    }).to(symbolRef.current, { opacity: 1, duration: 0.7 }, "<0.2");

    return () => {
      tl.kill();
    };
  }, [wrapperRef, symbolRef, delay]);
}
