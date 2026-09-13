"use client";
import { useEffect, useRef } from "react";

// A plain ref + native scroll listener, deliberately NOT Zustand state — putting
// "are we near the bottom" in a store would re-render on every scroll tick, a
// real performance regression the original (a plain `let autoScroll`) never had.
export function useAutoScroll(logRef: React.RefObject<HTMLDivElement | null>, deps: unknown[]) {
  const autoScrollRef = useRef(true);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const onScroll = () => {
      autoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [logRef]);

  useEffect(() => {
    const el = logRef.current;
    if (el && autoScrollRef.current) el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const forceScrollDown = () => {
    autoScrollRef.current = true;
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  return { forceScrollDown };
}
