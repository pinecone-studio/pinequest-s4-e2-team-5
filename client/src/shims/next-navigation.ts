// Vite shim for Next.js `next/navigation`.
// The landing components were written for Next.js App Router. In this Vite app
// we back the same API with the browser History API so the existing
// window.history-based navigation in App.jsx keeps working.
import { useEffect, useState } from 'react';

export function usePathname(): string {
  const [pathname, setPathname] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const onChange = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onChange);
    window.addEventListener('pushstate-internal', onChange);
    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener('pushstate-internal', onChange);
    };
  }, []);

  return pathname;
}

export interface AppRouterInstance {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (href: string) => void;
}

function emitChange() {
  window.dispatchEvent(new Event('pushstate-internal'));
  // Also notify App.jsx, which listens on popstate.
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useRouter(): AppRouterInstance {
  return {
    push: (href: string) => {
      window.history.pushState({}, '', href);
      emitChange();
    },
    replace: (href: string) => {
      window.history.replaceState({}, '', href);
      emitChange();
    },
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => {},
    prefetch: () => {},
  };
}
