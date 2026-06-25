
import React from "react";
 
export const getTexts = (
  textLeftRef: React.RefObject<HTMLHeadingElement | null>,
  textRightRef: React.RefObject<HTMLHeadingElement | null>,

) => [
  { ref: textLeftRef, text: "Хамтдаа тоглоё", top: "top-[40%]" },
  {
    ref: textRightRef,
    text: "Хамтдаа суралцъя",
    top: "top-[54%]",
  },
];
 
 