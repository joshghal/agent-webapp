// Shared WS protocol contract — imported by both server.ts/lib/server/* and the
// client. Keeping this in one module lets TypeScript enforce exhaustive handling
// on both ends of the socket, which is the direct fix for "state is not handled
// well": a new event type added on one side without a matching case on the other
// now fails to compile instead of silently falling through.

export type ImagePart = { mediaType: string; data: string };

export type TurnStatus = "idle" | "processing" | "permission";

export type AuthStatus =
  | {
      state: "ready";
      email?: string;
      subscriptionType?: string;
      authMethod?: string;
      apiProvider?: string;
      orgName?: string;
      orgId?: string;
    }
  | { state: "needs_reauth" | "not_configured" };

export type HistoryItem =
  | { type: "user_message"; text: string | null }
  | { type: "assistant_text"; text: string; standalone: true }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string; images: ImagePart[]; is_error: boolean };

// ---- Client -> Server ----
export type ClientMessage =
  | {
      type: "init";
      project?: string;
      sessionId?: string;
      forceNew?: boolean;
      model?: string;
      effort?: string;
      permissionMode?: string;
      mcpPreset?: string;
    }
  | { type: "user_message"; text: string }
  | { type: "approval_response"; request_id: string; allow: boolean; input?: unknown; reason?: string }
  | { type: "update_settings"; model?: string; effort?: string; permissionMode?: string; mcpPreset?: string }
  | { type: "kill_session"; project: string }
  | { type: "login_start" }
  | { type: "login_code"; code: string };

// ---- Server -> Client ----
export type ServerMessage =
  | { type: "session_init"; session_id: string | null; cwd: string; project: string; reattached?: boolean }
  | { type: "history"; items: HistoryItem[] }
  | { type: "error"; message: string }
  | { type: "message_delivered" }
  | { type: "settings_applied" }
  | { type: "assistant_text_delta"; text: string }
  | { type: "thinking_start" }
  | { type: "thinking_delta"; text: string }
  | { type: "content_block_stop" }
  | { type: "working"; status: string }
  | { type: "stall_warning"; elapsedMs: number; message: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string; images: ImagePart[]; is_error: boolean }
  | { type: "approval_request"; request_id: string; tool_name: string; input: unknown; description?: string }
  | { type: "turn_complete"; result?: string; is_error?: boolean; cost_usd?: number }
  | { type: "process_exit"; code: number | null }
  | { type: "auth_required"; authStatus: AuthStatus }
  | { type: "login_url"; url: string }
  | { type: "login_result"; success: boolean; authStatus: AuthStatus; message?: string | null }
  // Sent to every connected socket, not just subscribers of `project` — a tab for
  // a project this connection isn't currently attached to still needs to know
  // whether that session is idle/processing/waiting on a permission decision.
  | { type: "tab_status"; project: string; sessionId: string | null; status: TurnStatus; unread: boolean };

export type SessionSummary = {
  sessionId: string;
  title: string;
  modified: string;
  messageCount: number;
  live?: boolean;
  status?: TurnStatus;
  unread?: boolean;
};

export type ProjectDirectory = {
  projectPath: string;
  sessions: SessionSummary[];
  live?: boolean;
};

export type SessionsResponse = { directories: ProjectDirectory[]; default: string };

export type McpServerStatus = "connected" | "needs_auth" | "failed";
export type McpServerEntry = { name: string; detail: string | null; status: McpServerStatus; statusText: string };
export type McpListResponse = { servers: McpServerEntry[]; warnings: string[] };
