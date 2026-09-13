import { AlertIcon } from "@/components/icons/icons";

export function WorkingIndicator({ text }: { text: string }) {
  return (
    <div className="text-[12.5px] text-text-3 py-0.5 pb-4 pl-[38px] flex items-center gap-2">
      <span className="w-[9px] h-[9px] rounded-full border-[1.5px] border-white/15 border-t-text-2 animate-spin-slow" />
      {text}
    </div>
  );
}

export function StallWarning({ text }: { text: string }) {
  return (
    <div className="text-[12.5px] text-warn bg-warn-soft border border-warn/30 rounded-xl py-2.5 px-3.5 my-1 mb-4 ml-[38px] flex items-center gap-2">
      <AlertIcon className="w-3.5 h-3.5 flex-none" />
      <span>{text}</span>
    </div>
  );
}
