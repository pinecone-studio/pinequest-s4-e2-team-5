
import React from "react";
 
export const getTexts = (
  textLeftRef: React.RefObject<HTMLHeadingElement | null>,
  textRightRef: React.RefObject<HTMLHeadingElement | null>,

) => [
  { ref: textLeftRef, text: "Хамтдаа тоглоё", top: "min-[320px]:top-50 md:top-15" },
  {
    ref: textRightRef,
    text: "Хамтдаа суралцъя",
    top: "min-[320px]:top-12 sm:top-20 md:top-35",
  },
];
 
 