import { existsSync, statSync } from "node:fs";
import type WebSocket from "ws";
import { state } from "./singleton";
import { isAlive, spawnFor, killLive, withProjectLock, broadcastTabStatus, markRead } from "./liveSessions";
import { readHistory, listDirectories } from "./sessions";
import { createLoginSession } from "./login";
import { HOME, DEFAULT_PROJECT_DIR } from "./env";
import type { ClientMessage, ServerMessage } from "../shared/ws-protocol";

const { liveSessions } = state;

type AttachOptions = {
  sessionId?: string;
  forceNew?: boolean;
  model?: string;
  effort?: string;
  permissionMode?: string;
  mcpPreset?: string;
};

export function handleConnection(ws: WebSocket): void {
  let attachedProject: string | null = null;
  const login = createLoginSession(send);

  function send(obj: ServerMessage | unknown): void {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
  }

  // Tracked globally (not just in this project's subscribers) so tab_status
  // broadcasts can reach this connection for a project it isn't attached to.
  state.allConnections.add(send);

  function detach(): void {
    if (attachedProject) {
      const entry = liveSessions.get(attachedProject);
      if (entry) entry.subscribers.delete(send);
      attachedProject = null;
    }
  }

  async function attach(project: string, opts: AttachOptions = {}): Promise<void> {
    const { sessionId, forceNew, model, effort, permissionMode, mcpPreset } = opts;
    if (!existsSync(project) || !statSync(project).isDirectory()) {
      send({ type: "error", message: `Not a directory: ${project}` });
      return;
    }
    detach();
    attachedProject = project;

    // The read-decide-mutate sequence below (check what's live, maybe kill it, maybe
    // spawn a replacement) must run as one atomic step relative to any other pending
    // attach/update_settings for this SAME project — otherwise two calls arriving
    // close together (e.g. a reconnect racing a settings change) each read the
    // pre-mutation state and both spawn a replacement, leaving the first one orphaned.
    let entry: NonNullable<ReturnType<typeof liveSessions.get>>;
    await withProjectLock(project, async () => {
      const currentEntry = liveSessions.get(project);
      const wantsDifferentSession = forceNew || (sessionId && currentEntry && currentEntry.sessionId !== sessionId);
      const currentlyAlive = isAlive(project);

      if (currentlyAlive && !wantsDifferentSession) {
        // Already running the session we want — just attach for live updates.
        entry = currentEntry!;
        if (entry.sessionId) {
          const history = readHistory(project, entry.sessionId);
          if (history.length) send({ type: "history", items: history });
        }
        send({ type: "session_init", session_id: entry.sessionId, cwd: project, project, reattached: true });
      } else {
        if (currentlyAlive) await killLive(project); // switching to a different session in the same project — wait for it to actually die first
        let targetSessionId = sessionId || null;
        // Never auto-resume "latest" for the bare home directory — sessions there
        // are shared with every tool that runs `claude` outside a specific project
        // (VS Code, an ad-hoc terminal), so "most recent" can land you inside
        // someone else's still-live conversation. An explicit sessionId still
        // works normally.
        const isBareHome = project === HOME;
        if (!forceNew && !targetSessionId && !isBareHome) {
          const dirs = listDirectories();
          const match = dirs.find((d) => d.projectPath === project);
          targetSessionId = match?.sessions[0]?.sessionId || null;
        }
        if (targetSessionId) {
          const history = readHistory(project, targetSessionId);
          if (history.length) send({ type: "history", items: history });
        }
        entry = spawnFor(project, { resumeSessionId: targetSessionId, model, effort, permissionMode, mcpPreset });
      }
    });
    entry!.subscribers.add(send);
    for (const approvalEvt of entry!.pendingApprovals.values()) send(approvalEvt);
    markRead(project);
  }

  // Node's EventEmitter dispatches every buffered WS frame from one socket 'data'
  // event synchronously, one after another, regardless of whether the listener is
  // async — awaiting inside a listener does NOT make emit() wait for it. Confirmed
  // this is a real bug, not a hypothetical one: sending "init" immediately followed
  // by "user_message" (exactly what the client does on every fresh session) could
  // arrive as two frames in the same read, and the second one's handler would run
  // before the first's attach() — specifically its lock-deferred spawnFor() call,
  // which only runs on a later microtask — had actually registered the live entry.
  // attachedProject was already set (synchronous), but liveSessions had nothing
  // yet, so the message was silently dropped with a "No active session" error.
  // Fix: process messages for this connection strictly one at a time, chained
  // through a promise queue, so message N+1 never starts until message N (including
  // everything it awaits) has fully finished.
  let messageQueue: Promise<void> = Promise.resolve();
  ws.on("message", (raw: Buffer) => {
    messageQueue = messageQueue.then(() => processMessage(raw)).catch((e) => console.error("ws message handler error:", e));
  });

  async function processMessage(raw: Buffer): Promise<void> {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "init") {
      await attach(msg.project || DEFAULT_PROJECT_DIR, {
        sessionId: msg.sessionId,
        forceNew: msg.forceNew,
        model: msg.model,
        effort: msg.effort,
        permissionMode: msg.permissionMode,
        mcpPreset: msg.mcpPreset,
      });
    } else if (msg.type === "user_message") {
      const entry = attachedProject && liveSessions.get(attachedProject);
      if (entry && !entry.child.stdin.destroyed) {
        entry.child.stdin.write(
          JSON.stringify({
            type: "user",
            message: { role: "user", content: [{ type: "text", text: msg.text }] },
          }) + "\n"
        );
        // A turn is now genuinely in flight — this is what stall detection tracks.
        // "message_delivered" is the honest signal that it actually reached a live
        // process, distinct from "the browser attempted to send" or "Claude
        // confirmed it started working."
        entry.turnStartedAt = Date.now();
        entry.lastActivityAt = Date.now();
        entry.stallLevelNotified = 0;
        send({ type: "message_delivered" });
        broadcastTabStatus(attachedProject!);
      } else {
        send({ type: "error", message: "No active session to send to — reconnect or start a new session." });
      }
    } else if (msg.type === "approval_response") {
      const entry = attachedProject && liveSessions.get(attachedProject);
      if (entry) entry.pendingApprovals.delete(msg.request_id);
      if (entry && !entry.child.stdin.destroyed) {
        entry.child.stdin.write(
          JSON.stringify({
            type: "control_response",
            response: {
              request_id: msg.request_id,
              subtype: "success",
              response: msg.allow
                ? { behavior: "allow", updatedInput: msg.input }
                : { behavior: "deny", message: msg.reason || "Denied by user" },
            },
          }) + "\n"
        );
        entry.turnStartedAt = Date.now();
        entry.lastActivityAt = Date.now();
        entry.stallLevelNotified = 0;
      }
      if (attachedProject) broadcastTabStatus(attachedProject);
    } else if (msg.type === "update_settings") {
      // model/effort/permission-mode/mcp-preset are all CLI flags baked in at
      // process spawn time — there is no live "switch model" signal for an
      // already-running headless process. The only honest way to make a change
      // "take effect" is to actually restart the process against the same session
      // id, so the conversation continues but the next turn runs with the new settings.
      if (!attachedProject) return;
      const project = attachedProject;
      let entry: NonNullable<ReturnType<typeof liveSessions.get>>;
      await withProjectLock(project, async () => {
        const currentEntry = liveSessions.get(project);
        const resumeSessionId = currentEntry ? currentEntry.sessionId : null;
        if (isAlive(project)) await killLive(project);
        entry = spawnFor(project, {
          resumeSessionId,
          model: msg.model,
          effort: msg.effort,
          permissionMode: msg.permissionMode,
          mcpPreset: msg.mcpPreset,
        });
      });
      entry!.subscribers.add(send);
      send({ type: "settings_applied" });
      broadcastTabStatus(project);
    } else if (msg.type === "kill_session") {
      // Closing a tab in the UI stops the underlying process rather than just
      // hiding it from the tab strip — deliberately not scoped to attachedProject,
      // since the tab being closed may not be the one this connection is
      // currently viewing.
      if (msg.project) {
        await withProjectLock(msg.project, async () => {
          if (isAlive(msg.project)) await killLive(msg.project);
        });
        broadcastTabStatus(msg.project);
      }
    } else if (msg.type === "login_start") {
      login.start();
    } else if (msg.type === "login_code") {
      login.submitCode(msg.code);
    }
  }

  ws.on("close", () => {
    // Deliberately NOT killing the underlying claude process — it (and anything it
    // started, like a dev server) keeps running server-side until explicitly switched away from.
    detach();
    login.cleanup();
    state.allConnections.delete(send);
  });
}
