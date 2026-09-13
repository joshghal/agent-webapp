import { create } from "zustand";
import { persist } from "zustand/middleware";

// Deliberately transport-agnostic — this store does not know about WebSockets. A
// separate useApplySettingsLive() hook reacts to changes here and sends
// update_settings, keeping this testable without a live socket.
type SettingsState = {
  model: string;
  effort: string;
  permissionMode: string;
  mcpPreset: string;
  setModel: (v: string) => void;
  setEffort: (v: string) => void;
  setPermissionMode: (v: string) => void;
  setMcpPreset: (v: string) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      model: "sonnet",
      effort: "high",
      permissionMode: "auto",
      mcpPreset: "none",
      setModel: (model) => set({ model }),
      setEffort: (effort) => set({ effort }),
      setPermissionMode: (permissionMode) => set({ permissionMode }),
      setMcpPreset: (mcpPreset) => set({ mcpPreset }),
    }),
    { name: "agent-webapp:settings" }
  )
);
