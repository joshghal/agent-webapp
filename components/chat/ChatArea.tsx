"use client";
import { useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { useLandingCentering } from "@/hooks/useLandingCentering";
import { ChatEntryView } from "./ChatEntryView";
import { InputBar } from "./InputBar";

export function ChatArea() {
  const entries = useChatStore((s) => s.entries);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useAutoScroll(logRef, [entries]);
  useLandingCentering(logRef, inputRef, entries.length === 0);

  return (
    <>
      <div ref={logRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 pt-2 pb-5">
        <div className="max-w-[740px] mx-auto">
          {entries.map((entry) => (
            <ChatEntryView key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
      <InputBar ref={inputRef} />
    </>
  );
}
