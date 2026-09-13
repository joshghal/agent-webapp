import { create } from "zustand";
import type { McpServerEntry } from "@/lib/shared/ws-protocol";

type McpState = {
  servers: McpServerEntry[];
  warnings: string[];
  loading: boolean;
  refresh: (force?: boolean) => Promise<void>;
};

export const useMcpStore = create<McpState>((set) => ({
  servers: [],
  warnings: [],
  loading: false,
  refresh: async (force = false) => {
    set({ loading: true });
    try {
      const res = await fetch(force ? "/api/mcp/refresh" : "/api/mcp", { method: force ? "POST" : "GET" });
      const data = await res.json();
      set({ servers: data.servers, warnings: data.warnings, loading: false });
    } catch (e) {
      console.error("failed to load MCP servers:", e);
      set({ loading: false });
    }
  },
}));
