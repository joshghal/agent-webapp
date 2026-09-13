"use client";
import { useState } from "react";

export function ThinkingBlock({ text, done }: { text: string; done: boolean }) {
  // Auto-collapses the moment `done` flips true, matching the original — but once
  // the user manually toggles it, their explicit choice wins from then on.
  const [manualToggle, setManualToggle] = useState<boolean | null>(null);
  const collapsed = manualToggle !== null ? manualToggle : done;
  return (
    <div className="my-0.5 mb-4 pl-[38px]">
      <div
        className="inline-flex items-center gap-1.5 text-xs text-text-3 cursor-pointer"
        onClick={() => setManualToggle(!collapsed)}
      >
        {!done && (
          <span className="w-[9px] h-[9px] rounded-full border-[1.5px] border-white/15 border-t-text-3 animate-spin-slow" />
        )}
        <span>{done ? "Thought (tap to expand)" : "Thinking…"}</span>
      </div>
      {!collapsed && (
        <div className="text-xs text-text-3 italic whitespace-pre-wrap mt-2 pl-2.5 border-l-2 border-panel-border">
          {text}
        </div>
      )}
    </div>
  );
}
