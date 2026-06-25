"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCircleTextAnimation } from "@/hooks/useCircleTextAnimation";
import { useWrapperParallax } from "@/hooks/useWrapperParallax";
import { getTexts } from "@/lib/aboutInfo";

export interface HighlighterRef {
  start: () => void;
  reset: () => void;
}

export default function AboutSection() {
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const textLeftRef = useRef<HTMLHeadingElement>(null);
  const textRightRef = useRef<HTMLHeadingElement>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  
  const [triggerEl, setTriggerEl] = useState<HTMLElement | null>(null);

  
  useEffect(() => {
    if (aboutSectionRef.current) {
      setTriggerEl(aboutSectionRef.current);
    }
  }, [aboutSectionRef]);

 
  useCircleTextAnimation(circleRef, textLeftRef, textRightRef, triggerEl);
  useWrapperParallax(wrapperRef, triggerEl);


  const texts = getTexts(textLeftRef, textRightRef, );

  return (
    <div
      ref={aboutSectionRef}
      className="h-screen max-h-screen overflow-hidden"
    >
      <div
        ref={wrapperRef}
        className="wrapper will-change-transform relative h-screen max-h-screen flex min-[320px]:flex-col md:flex-row items-center min-[320px]:justify-center md:justify-around overflow-hidden gap-10 bg-neutral-900 text-white"
      >
        {/* Expanding Circle */}
        <div
          ref={circleRef}
          className="circle bg-neutral-100 rounded-full absolute left-1/2 top-[5%] -translate-x-1/2 z-0"
          style={{ width: 40, height: 40 }}
        />

        {/* Text */}
        {texts.map(({ ref, text, top }, i) => (
          <h1
            key={i}
            ref={ref}
            className={`absolute  ${top} z-10 text-center w-full px-4 text-neutral-100  min-[320px]:text-3xl sm:text-5xl md:text-7xl font-bold uppercase tracking-widest font-holtwood mix-blend-difference`}
          >
            {text}
          </h1>
        ))}
      </div>
    </div>
  );
}
