import { useEffect, useState } from "react";

const QUERY = "(orientation: portrait)";

const getInitial = (): boolean => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia(QUERY).matches;
};

export const useIsPortrait = (): boolean => {
  const [isPortrait, setIsPortrait] = useState<boolean>(getInitial);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    setIsPortrait(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isPortrait;
};
