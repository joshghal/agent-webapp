import { useSessionStore } from "@/store/sessionStore";

const LABEL = { idle: "Idle", processing: "Processing", permission: "Needs permission" };

// Deliberately NOT pill-shaped like the Configure button — a squared-off tag with
// no border, so it reads as a passive status label rather than another button.
export function TurnStateBadge() {
  const turnState = useSessionStore((s) => s.turnState);
  const colorClass =
    turnState === "processing"
      ? "text-accent-2 bg-accent-soft"
      : turnState === "permission"
        ? "text-warn bg-warn-soft"
        : "text-text-2 bg-black/22";
  const dotClass = turnState === "idle" ? "bg-text-3" : turnState === "processing" ? "bg-accent-2 animate-turn-pulse" : "bg-warn animate-turn-pulse";

  return (
    <span className={`inline-flex items-center gap-1.5 flex-none text-[11px] font-medium py-1.5 px-2.5 rounded-md ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-none ${dotClass}`} />
      {LABEL[turnState]}
    </span>
  );
}
