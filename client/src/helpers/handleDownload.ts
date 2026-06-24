// closing CTA action — scroll back to the top (hero)
export const handleStartCta = () => {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};
