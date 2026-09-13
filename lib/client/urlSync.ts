// URL reflects the current project/session, with real browser back/forward
// support — ported from the original's updateUrlForCurrent/popstate handling.
let suppressHistoryPush = false;

export function updateUrlForCurrent(project: string | null, sessionId: string | null): void {
  if (suppressHistoryPush || typeof window === "undefined") return;
  const params = new URLSearchParams();
  if (project) params.set("project", project);
  if (sessionId) params.set("session", sessionId);
  const newUrl = location.pathname + (params.toString() ? "?" + params.toString() : "");
  if (newUrl !== location.pathname + location.search) {
    history.pushState({ project, sessionId }, "", newUrl);
  }
}

export function readUrlParams(): { project: string | null; session: string | null } {
  if (typeof window === "undefined") return { project: null, session: null };
  const params = new URLSearchParams(location.search);
  return { project: params.get("project"), session: params.get("session") };
}

export function setSuppressHistoryPush(v: boolean): void {
  suppressHistoryPush = v;
}
