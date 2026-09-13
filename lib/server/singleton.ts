import type { ChildProcessWithoutNullStreams } from "node:child_process";
import type { McpListResponse } from "../shared/ws-protocol";

// A custom server (server.ts, run directly via tsx) and Next's compiled Route
// Handlers can end up as two different module graphs even though both import the
// same source file — server.ts is executed directly, while Route Handlers load
// from Next's own build output. If liveSessions/mcpCache/projectLocks were plain
// module-level `const`s, they could get instantiated twice, and /api/sessions'
// `.live` flag would silently always read false. Anchoring on globalThis (the same
// pattern Next's own docs recommend for a Prisma client, for exactly this reason)
// guarantees every consumer reads the same instance regardless of which module
// graph loaded it.

export type PendingApproval = {
  type: "approval_request";
  request_id: string;
  tool_name: string;
  input: unknown;
  description?: string;
};

export type LiveSessionEntry = {
  child: ChildProcessWithoutNullStreams;
  sessionId: string | null;
  subscribers: Set<(obj: unknown) => void>;
  pendingApprovals: Map<string, PendingApproval>;
  turnStartedAt: number | null;
  lastActivityAt: number;
  stallLevelNotified: number;
  // True once a turn finishes with nobody currently subscribed to see it live —
  // tracked here (not just derived client-side from "was this the active tab")
  // specifically so it survives a page refresh: the client's own notion of
  // "active tab at completion time" is gone the moment the page reloads, but
  // this flag lives on the server for as long as the process does.
  unread: boolean;
};

type GlobalState = {
  liveSessions: Map<string, LiveSessionEntry>;
  projectLocks: Map<string, Promise<unknown>>;
  mcpCache: { data: McpListResponse | null; at: number };
  // Every currently-connected socket's send function, independent of which
  // project (if any) it's attached to — tab_status broadcasts go to all of
  // these, since a tab for a project this connection isn't viewing still needs
  // to learn that project's idle/processing/permission state.
  allConnections: Set<(obj: unknown) => void>;
};

const g = globalThis as unknown as { __agentWebapp?: GlobalState };

g.__agentWebapp ??= {
  liveSessions: new Map(),
  projectLocks: new Map(),
  mcpCache: { data: null, at: 0 },
  allConnections: new Set(),
};

export const state = g.__agentWebapp;
