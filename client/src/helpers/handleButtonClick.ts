// clicks on AnimatedButton
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const scrollTo = (y: number) => {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: y, behavior: "smooth" });
  }
};

export const handleButtonClick = (text: string, router: AppRouterInstance) => {
  if (text === "←") {
    // back to home (used on project detail pages)
    const animate = window.pageTransition;
    if (animate) animate("/");
    else router.push("/");
  } else if (text === "Survey") {
    // research / problem section (2nd viewport)
    scrollTo(window.innerHeight);
  } else if (text === "Top") {
    scrollTo(0);
  }
};
