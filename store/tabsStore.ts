import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tab = { project: string; sessionId: string | null; label: string };

export function tabKey(project: string, sessionId: string | null): string {
  return `${project}|${sessionId || ""}`;
}

const TAB_LABEL_MAX = 25;

function truncateLabel(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > TAB_LABEL_MAX ? trimmed.slice(0, TAB_LABEL_MAX).trimEnd() + "…" : trimmed;
}

type TabsState = {
  tabs: Tab[];
  upsertTab: (project: string, sessionId: string | null, title?: string) => void;
  refreshLabel: (project: string, sessionId: string | null, title: string) => void;
  closeTab: (key: string) => Tab | null;
};

export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
      tabs: [],

      // A tab opened via "new session" is first added with sessionId still
      // unknown — once session_init confirms the real id, fold that placeholder
      // into this entry instead of leaving two tabs for the same conversation.
      // `title`, when given, is the session's actual title (from the sidebar's
      // session list, or derived from the first message just sent) — capped to
      // TAB_LABEL_MAX. Without one (e.g. session_init's own reattach-confirming
      // call), an EXISTING tab keeps whatever label it already has instead of
      // regressing to the bare folder name; only a brand-new tab falls back to it.
      upsertTab: (project, sessionId, title) => {
        const folderLabel = project.split("/").pop() || project;
        const newLabel = title ? truncateLabel(title) : undefined;
        set((s) => {
          const exactIdx = s.tabs.findIndex((t) => t.project === project && t.sessionId === sessionId);
          if (exactIdx >= 0) {
            const tabs = [...s.tabs];
            tabs[exactIdx] = { ...tabs[exactIdx], label: newLabel ?? tabs[exactIdx].label };
            return { tabs };
          }
          const placeholderIdx = s.tabs.findIndex((t) => t.project === project && !t.sessionId);
          if (placeholderIdx >= 0) {
            const tabs = [...s.tabs];
            tabs[placeholderIdx] = { ...tabs[placeholderIdx], sessionId, label: newLabel ?? tabs[placeholderIdx].label };
            return { tabs };
          }
          return { tabs: [...s.tabs, { project, sessionId, label: newLabel ?? folderLabel }] };
        });
      },

      // Updates an EXISTING tab's label only — never creates one. A tab attached
      // to (via a direct URL, or restored from a page refresh) rather than
      // opened by clicking a titled session in the sidebar never learns a real
      // title through upsertTab's own reattach call, and is stuck showing the
      // bare project folder name forever. refreshSessions() calls this for every
      // open tab whenever /api/sessions resolves, self-healing that gap without
      // upsertTab's create-or-preserve rules needing to special-case it.
      refreshLabel: (project, sessionId, title) => {
        set((s) => {
          const idx = s.tabs.findIndex((t) => t.project === project && t.sessionId === sessionId);
          if (idx < 0) return s;
          const label = truncateLabel(title);
          if (s.tabs[idx].label === label) return s;
          const tabs = [...s.tabs];
          tabs[idx] = { ...tabs[idx], label };
          return { tabs };
        });
      },

      // Closing a tab only removes it from this list — the underlying session
      // (and anything it's running) is stopped separately via kill_session, not
      // implied by this. Returns the tab that should become active next, if any.
      closeTab: (key) => {
        const idx = get().tabs.findIndex((t) => tabKey(t.project, t.sessionId) === key);
        if (idx < 0) return null;
        const tabs = [...get().tabs];
        tabs.splice(idx, 1);
        set({ tabs });
        return tabs[Math.max(0, idx - 1)] || null;
      },
    }),
    { name: "agent-webapp:tabs" }
  )
);
