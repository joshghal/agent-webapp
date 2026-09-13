import { useSidebarStore } from "@/store/sidebarStore";
import { useTabStatusStore } from "@/store/tabStatusStore";
import { useTabsStore, tabKey } from "@/store/tabsStore";
import type { SessionsResponse } from "@/lib/shared/ws-protocol";

export async function refreshSessions(): Promise<SessionsResponse | null> {
  try {
    const res = await fetch("/api/sessions");
    const data: SessionsResponse = await res.json();
    useSidebarStore.getState().setDirectories(data.directories);
    // Live updates arrive via the "tab_status" WS event from here on, but a tab
    // open before this fetch resolves (e.g. right after a page load) needs its
    // CURRENT status too, not just future changes.
    const { setStatus } = useTabStatusStore.getState();
    const { refreshLabel } = useTabsStore.getState();
    for (const dir of data.directories) {
      for (const s of dir.sessions) {
        if (s.live && s.status) {
          const display = s.status === "idle" && s.unread ? "unread" : s.status;
          setStatus(tabKey(dir.projectPath, s.sessionId), display);
        }
        // Self-heals any open tab that never learned its real title (attached
        // to directly rather than opened by clicking it in the sidebar).
        if (s.title) refreshLabel(dir.projectPath, s.sessionId, s.title);
      }
    }
    return data;
  } catch (e) {
    console.error("failed to load sessions:", e);
    return null;
  }
}
