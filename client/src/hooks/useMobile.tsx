import * as React from "react";

const MOBILE_BREAKPOINT = 768;

// Initialize synchronously from window when available so the first render
// already picks the right layout — avoids a desktop-flash on mobile devices.
function readIsMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(readIsMobile);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener("change", onChange);
    // sync once on mount in case the SSR/initial value drifted
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
