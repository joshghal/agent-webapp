import { create } from "zustand";
import type { TurnStatus } from "@/lib/shared/ws-protocol";

// "unread" doesn't exist on the wire — the server only ever reports idle/
// processing/permission (it has no notion of which tab you're currently
// looking at). It's a client-side overlay: an "idle" broadcast that arrives
// for a tab other than the active one means a turn just finished somewhere
// you weren't looking, so display that as "finished, not yet visited" until
// you actually click that tab.
export type TabDisplayStatus = TurnStatus | "unread";

// Keyed the same way as tabsStore's tabKey — kept as a separate store rather
// than folded into tabsStore since this is live, ephemeral, per-connection
// state (never persisted), while tabsStore itself is persisted to localStorage.
type TabStatusState = {
  byKey: Record<string, TabDisplayStatus>;
  setStatus: (key: string, status: TabDisplayStatus) => void;
};

export const useTabStatusStore = create<TabStatusState>((set) => ({
  byKey: {},
  setStatus: (key, status) => set((s) => ({ byKey: { ...s.byKey, [key]: status } })),
}));
