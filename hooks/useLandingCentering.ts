"use client";
import { useLayoutEffect } from "react";

// When the conversation is empty, the input bar sits vertically centered in the
// chat area (via a computed translateY, NOT flexbox justify-content — that
// doesn't animate smoothly between centered and bottom-pinned, which is the
// whole reason this exists). The moment the first message lands, the transform
// clears and it eases down to the bottom.
//
// useLayoutEffect, not useEffect, is load-bearing here, not stylistic: a plain
// effect runs after paint, which would reintroduce the one-frame flash this
// reset-transition/measure/reapply sequence exists specifically to prevent — the
// vanilla version got that timing for free by being synchronous inline script;
// React does not give you that for free in a normal effect.
export function useLandingCentering(
  logRef: React.RefObject<HTMLDivElement | null>,
  inputRef: React.RefObject<HTMLDivElement | null>,
  isEmpty: boolean
) {
  useLayoutEffect(() => {
    const inputEl = inputRef.current;
    const logEl = logRef.current;
    if (!inputEl || !logEl) return;

    if (!isEmpty) {
      inputEl.style.transform = "";
      return;
    }

    // getBoundingClientRect() reflects the element's current *painted* position,
    // transform included — measuring while a previous centering transform is
    // still applied would compute a delta relative to the already-shifted
    // position instead of the true natural one. Reset to natural first
    // (transition disabled so it doesn't visibly flash), measure, then reapply.
    const prevTransition = inputEl.style.transition;
    inputEl.style.transition = "none";
    inputEl.style.transform = "";
    const logRect = logEl.getBoundingClientRect();
    const inputRect = inputEl.getBoundingClientRect();
    const targetCenterY = logRect.top + logRect.height / 2;
    const currentCenterY = inputRect.top + inputRect.height / 2;
    const delta = targetCenterY - currentCenterY;
    void inputEl.offsetHeight; // force the transition:none + reset to apply before re-enabling it
    inputEl.style.transition = prevTransition;
    inputEl.style.transform = `translateY(${delta}px)`;
  }, [isEmpty, logRef, inputRef]);
}
