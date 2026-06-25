export {};

declare global {
  interface Window {
    // Set by <PageTransition />; used by handleButtonClick to play the
    // route-change overlay before navigating.
    pageTransition?: (to: string) => void;
  }
}
