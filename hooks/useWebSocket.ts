"use client";
import { useEffect } from "react";
import { useConnectionStore, type InitIntent } from "@/store/connectionStore";
import { useSessionStore } from "@/store/sessionStore";
import { useChatStore } from "@/store/chatStore";
import { useTabsStore, tabKey } from "@/store/tabsStore";
import { useTabStatusStore } from "@/store/tabStatusStore";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { refreshSessions } from "@/lib/client/fetchSessions";
import { updateUrlForCurrent } from "@/lib/client/urlSync";
import type { ClientMessage, ServerMessage } from "@/lib/shared/ws-protocol";

// React 18 Strict Mode double-invokes mount effects in dev, which would spin up
// two competing sockets if the connection were created inside a component's
// useEffect — reintroducing the exact reconnect race this project already found
// and fixed once. Owning the connection at module scope, outside any component's
// lifecycle, makes it a true singleton regardless of how many times a mounting
// effect runs or how many components call useWebSocket().
let socket: WebSocket | null = null;

export function send(msg: ClientMessage): void {
  if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg));
}

export function sendInit(intent: { project: string; sessionId?: string; forceNew?: boolean }): void {
  const settings = useSettingsStore.getState();
  const full: InitIntent = {
    type: "init",
    project: intent.project,
    sessionId: intent.sessionId,
    forceNew: intent.forceNew,
    model: settings.model || undefined,
    effort: settings.effort || undefined,
    permissionMode: settings.permissionMode || undefined,
    mcpPreset: settings.mcpPreset,
  };
  useConnectionStore.getState().setLastInit(full);
  send(full);
}

function handleServerEvent(evt: ServerMessage): void {
  const chat = useChatStore.getState();
  const session = useSessionStore.getState();
  const connection = useConnectionStore.getState();
  const tabs = useTabsStore.getState();
  const auth = useAuthStore.getState();

  switch (evt.type) {
    case "session_init":
      connection.setStatus("connected", `Connected${evt.reattached ? " · reattached to live session" : ""}`);
      session.setSession(evt.project, evt.session_id, !!evt.reattached);
      session.setTurnState("idle");
      connection.setLastInit(null);
      tabs.upsertTab(evt.project, evt.session_id);
      updateUrlForCurrent(evt.project, evt.session_id);
      refreshSessions();
      break;
    case "history":
      chat.loadHistory(evt.items);
      break;
    case "error":
      chat.hideWorkingIndicator();
      connection.setStatus("error", evt.message);
      break;
    case "message_delivered":
      chat.showWorkingIndicator("Delivered — waiting for Claude to start…");
      session.setTurnState("processing");
      break;
    case "settings_applied":
      chat.onTurnComplete();
      session.setTurnState("idle");
      break;
    case "assistant_text_delta":
      chat.appendAssistantDelta(evt.text);
      break;
    case "thinking_start":
      chat.appendThinkingDelta("");
      break;
    case "thinking_delta":
      chat.appendThinkingDelta(evt.text);
      break;
    case "content_block_stop":
      // Deterministic block-boundary signal — finalize whatever's mid-stream
      // (thinking or assistant text) rather than inferring it from the next
      // event's type, which is what the original implicitly relied on.
      chat.finalizeThinking();
      chat.finalizeStreamingText();
      break;
    case "working":
      chat.showWorkingIndicator("Claude is working…");
      session.setTurnState("processing");
      break;
    case "stall_warning":
      chat.showStallWarning(evt.message);
      break;
    case "tool_use":
      chat.addToolUse(evt.id, evt.name, evt.input);
      break;
    case "tool_result":
      chat.addToolResult(evt.tool_use_id, evt.content, evt.images, evt.is_error);
      break;
    case "approval_request":
      chat.addApprovalRequest(evt.request_id, evt.tool_name, evt.input, evt.description);
      session.setTurnState("permission");
      break;
    case "turn_complete":
      chat.onTurnComplete();
      session.setTurnState("idle");
      break;
    case "process_exit":
      chat.onTurnComplete();
      connection.setStatus("error", `Agent process exited (code ${evt.code}) — reconnecting…`);
      session.setTurnState("idle");
      if (session.currentProject) {
        setTimeout(() => sendInit({ project: session.currentProject!, sessionId: session.currentSessionId || undefined }), 500);
      }
      break;
    case "auth_required":
      connection.setStatus("error", "Authentication required — open Account to log in");
      auth.setStatus(evt.authStatus);
      break;
    case "login_url":
      auth.setLoginUrl(evt.url);
      break;
    case "login_result":
      auth.setLoginResult(evt.success, evt.authStatus, evt.message);
      break;
    case "tab_status": {
      // `unread` is authoritative from the server (was anyone subscribed to see
      // this land live?) — surviving a page refresh is the whole point, so this
      // deliberately does NOT re-derive it from "is this the active tab" here.
      const display = evt.status === "idle" && evt.unread ? "unread" : evt.status;
      useTabStatusStore.getState().setStatus(tabKey(evt.project, evt.sessionId), display);
      break;
    }
  }
}

function connect(): void {
  if (socket) return; // idempotent — see the module-level singleton comment above
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${proto}//${location.host}`);
  socket = ws;

  ws.onopen = () => {
    useConnectionStore.getState().setStatus("connected", "Connected");
    const lastInit = useConnectionStore.getState().lastInit;
    if (lastInit) {
      send(lastInit);
    } else {
      const { currentProject, currentSessionId } = useSessionStore.getState();
      if (currentProject) sendInit({ project: currentProject, sessionId: currentSessionId || undefined });
    }
  };
  ws.onclose = () => {
    if (socket === ws) socket = null;
    useConnectionStore.getState().setStatus("reconnecting", "Disconnected — reconnecting…");
    setTimeout(connect, 2000);
  };
  ws.onerror = () => useConnectionStore.getState().setStatus("error", "Connection error");
  ws.onmessage = (ev) => handleServerEvent(JSON.parse(ev.data));
}

export function useWebSocket() {
  useEffect(() => {
    connect();
  }, []);
  return { send, sendInit };
}
