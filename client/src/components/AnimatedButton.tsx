"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { useButtonHover } from "@/hooks/useButtonHover";
import { handleButtonClick } from "@/helpers/handleButtonClick";

const AnimatedButton = ({
  text,
  onClick,
}: {
  text: string;
  onClick?: () => void;
}) => {
  const bgRef = useRef<HTMLDivElement>(null);
  const topTextRef = useRef<HTMLSpanElement>(null);
  const bottomTextRef = useRef<HTMLSpanElement>(null);
  const router = useRouter();

  const { handleMouseEnter, handleMouseLeave } = useButtonHover({
    topTextRef,
    bottomTextRef,
    bgRef,
  });

  const textLayers = [
    { ref: topTextRef, z: "z-10 text-neutral-900 relative" },
    { ref: bottomTextRef, z: "z-9 text-neutral-100 absolute left-0 top-0" },
  ];

  return (
    <button
      className={`
        relative overflow-hidden 
        min-[320px]:border-3 sm:border-3 border-neutral-900 
        rounded-full font-bold 
        min-[320px]:text-lg md:text-xl 
        cursor-pointer w-fit
        ${text !== "←" ? "px-10 py-4" : "px-2 py-4"}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => (onClick ? onClick() : handleButtonClick(text, router))}
    >
      
      <div
        ref={bgRef}
        className="absolute inset-0 bg-purple-200 translate-y-[101%] z-0"
      />

   
      <div className="relative overflow-hidden">
        {textLayers.map(({ ref, z }, i) => (
          <span
            key={i}
            ref={ref}
            className={`block uppercase font-rubik leading-none tracking-wider ${z}`}
          >
            {text}
          </span>
        ))}
      </div>
    </button>
  );
};

export default AnimatedButton;
