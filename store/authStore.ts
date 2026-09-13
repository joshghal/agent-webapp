import { create } from "zustand";
import type { AuthStatus } from "@/lib/shared/ws-protocol";

type AuthState = {
  status: AuthStatus | null;
  loginUrl: string | null;
  loginMessage: string | null;
  verifying: boolean;
  refresh: () => Promise<void>;
  setStatus: (status: AuthStatus) => void;
  setLoginUrl: (url: string) => void;
  setLoginResult: (success: boolean, status: AuthStatus, message?: string | null) => void;
  setVerifying: (v: boolean) => void;
  clearLoginFlow: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: null,
  loginUrl: null,
  loginMessage: null,
  verifying: false,
  refresh: async () => {
    try {
      const res = await fetch("/api/auth-status");
      set({ status: await res.json() });
    } catch (e) {
      console.error("failed to check auth status:", e);
    }
  },
  setStatus: (status) => set({ status }),
  setLoginUrl: (loginUrl) => set({ loginUrl, loginMessage: null }),
  setLoginResult: (success, status, message) =>
    set({
      status,
      loginUrl: success ? null : null,
      loginMessage: success ? null : `Login failed: ${message || "unknown error"} — try again.`,
      verifying: false,
    }),
  setVerifying: (verifying) => set({ verifying }),
  clearLoginFlow: () => set({ loginUrl: null, loginMessage: null, verifying: false }),
}));
