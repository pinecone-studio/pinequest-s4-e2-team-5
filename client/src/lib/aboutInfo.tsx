// content for the "how it works" section heading
import React from "react";
 
export const getTexts = (
  textLeftRef: React.RefObject<HTMLHeadingElement | null>,
  textRightRef: React.RefObject<HTMLHeadingElement | null>,
) => [
  { ref: textLeftRef, text: "how it", top: "min-[320px]:top-5 md:top-15" },
  {
    ref: textRightRef,
    text: "works",
    top: "min-[320px]:top-12 sm:top-20 md:top-35",
  },
];
 
 