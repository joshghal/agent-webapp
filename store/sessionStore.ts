import { create } from "zustand";

export type TurnState = "idle" | "processing" | "permission";

type SessionState = {
  currentProject: string | null;
  currentSessionId: string | null;
  turnState: TurnState;
  reattached: boolean;
  setSession: (project: string, sessionId: string | null, reattached?: boolean) => void;
  setTurnState: (state: TurnState) => void;
  clearSession: () => void;
};

function initial<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(key) as T) || null;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentProject: initial("agent-webapp:lastProject"),
  currentSessionId: initial("agent-webapp:lastSessionId"),
  turnState: "idle",
  reattached: false,
  setSession: (currentProject, currentSessionId, reattached = false) => {
    localStorage.setItem("agent-webapp:lastProject", currentProject);
    if (currentSessionId) localStorage.setItem("agent-webapp:lastSessionId", currentSessionId);
    else localStorage.removeItem("agent-webapp:lastSessionId");
    set({ currentProject, currentSessionId, reattached });
  },
  setTurnState: (turnState) => set({ turnState }),
  clearSession: () => {
    localStorage.removeItem("agent-webapp:lastProject");
    localStorage.removeItem("agent-webapp:lastSessionId");
    set({ currentProject: null, currentSessionId: null, reattached: false });
  },
}));
