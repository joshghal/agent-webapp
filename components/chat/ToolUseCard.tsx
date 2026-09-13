"use client";
import { useState } from "react";
import { WrenchIcon, CheckIcon, XCircleIcon } from "@/components/icons/icons";
import type { ImagePart } from "@/lib/shared/ws-protocol";

export function ToolUseCard({ name, input }: { name: string; input: unknown }) {
  return (
    <div className="bg-panel-strong border border-panel-border-soft rounded-xl py-2.5 px-3.5 my-1 mb-4 ml-[38px] text-[12.5px]">
      <span className="flex items-center gap-1.5 text-text-2 font-medium">
        <WrenchIcon className="w-3.5 h-3.5 flex-none" />
        {name}
      </span>
      <pre className="mt-2 whitespace-pre-wrap break-words text-text-3 text-[10.5px] bg-black/22 py-2 px-2.5 rounded-lg overflow-x-auto">
        {JSON.stringify(input, null, 2)}
      </pre>
    </div>
  );
}

export function ToolResultCard({
  content,
  images,
  isError,
}: {
  content: string;
  images: ImagePart[];
  isError: boolean;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const text = (content || "").slice(0, 2000);
  return (
    <div className="bg-panel-strong border border-panel-border-soft rounded-xl py-2.5 px-3.5 my-1 mb-4 ml-[38px] text-[12.5px] opacity-92">
      <span className="flex items-center gap-1.5 text-text-2 font-medium">
        {isError ? (
          <XCircleIcon className="w-3.5 h-3.5 flex-none text-danger" />
        ) : (
          <CheckIcon className="w-3.5 h-3.5 flex-none text-success" />
        )}
        {isError ? "Error" : "Result"}
      </span>
      {text && (
        <pre className="mt-2 whitespace-pre-wrap break-words text-text-3 text-[10.5px] bg-black/22 py-2 px-2.5 rounded-lg overflow-x-auto">
          {text}
        </pre>
      )}
      {images.map((img, i) => (
        <img
          key={i}
          src={`data:${img.mediaType};base64,${img.data}`}
          alt="screenshot"
          onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
          className={`block rounded-lg mt-2 ${expandedIdx === i ? "max-w-none w-full cursor-zoom-out" : "max-w-full cursor-zoom-in"}`}
        />
      ))}
    </div>
  );
}
