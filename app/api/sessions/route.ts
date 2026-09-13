import { NextResponse } from "next/server";
import { listDirectories } from "@/lib/server/sessions";
import { isAlive, getTurnStatus } from "@/lib/server/liveSessions";
import { state } from "@/lib/server/singleton";
import { DEFAULT_PROJECT_DIR } from "@/lib/server/env";
import type { ProjectDirectory, SessionsResponse } from "@/lib/shared/ws-protocol";

export async function GET() {
  const dirs: ProjectDirectory[] = listDirectories();
  for (const dir of dirs) {
    const liveEntry = isAlive(dir.projectPath) ? state.liveSessions.get(dir.projectPath) : null;
    const liveSessionId = liveEntry ? liveEntry.sessionId : null;
    for (const s of dir.sessions) {
      s.live = s.sessionId === liveSessionId;
      if (s.live) {
        s.status = getTurnStatus(liveEntry ?? undefined);
        s.unread = liveEntry?.unread ?? false;
      }
    }
    dir.live = !!liveSessionId;
  }
  if (!dirs.some((d) => d.projectPath === DEFAULT_PROJECT_DIR)) {
    dirs.unshift({ projectPath: DEFAULT_PROJECT_DIR, sessions: [], live: isAlive(DEFAULT_PROJECT_DIR) });
  }
  const response: SessionsResponse = { directories: dirs, default: DEFAULT_PROJECT_DIR };
  return NextResponse.json(response);
}
