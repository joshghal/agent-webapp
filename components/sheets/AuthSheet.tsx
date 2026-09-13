"use client";
import { useState } from "react";
import { Sheet } from "./Sheet";
import { useUiStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { send } from "@/hooks/useWebSocket";

export function AuthSheet() {
  const { activeSheet, closeSheet } = useUiStore();
  const { status, loginUrl, loginMessage } = useAuthStore();
  const [code, setCode] = useState("");

  function startLogin() {
    useAuthStore.getState().clearLoginFlow();
    send({ type: "login_start" });
  }

  function submitCode() {
    if (!code.trim()) return;
    send({ type: "login_code", code: code.trim() });
    useAuthStore.getState().setVerifying(true);
  }

  return (
    <Sheet open={activeSheet === "auth"} onClose={closeSheet} title="Account">
      {status?.state === "ready" ? (
        <div className="text-[13px] text-text-2 mb-3">
          {[
            ["Account", status.email || "unknown"],
            ["Organization", status.orgName || "—"],
            ["Plan", status.subscriptionType || "unknown"],
            ["Auth method", status.authMethod || "unknown"],
            [
              "Billing",
              status.apiProvider === "firstParty" ? "Subscription (not per-token API billing)" : status.apiProvider || "unknown",
            ],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 text-[12.5px] py-1.5 border-b border-panel-border-soft last:border-0">
              <span className="text-text-3 flex-none">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[13px] text-text-2 mb-3">
          {status?.state === "needs_reauth"
            ? "Your login has expired and needs to be renewed."
            : status
              ? "Claude Code hasn't been logged in yet on this machine."
              : "Checking…"}
        </div>
      )}

      {loginUrl && (
        <div className="mb-3">
          <a href={loginUrl} target="_blank" rel="noopener" className="block break-all text-accent-2 text-xs mb-3">
            {loginUrl}
          </a>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste the code here"
              className="flex-1 min-w-0 bg-black/22 border border-panel-border-soft rounded-lg py-2.5 px-2.5 text-[13px] text-text-1 outline-none focus:border-accent-soft-border"
            />
            <button onClick={submitCode} className="flex-none bg-success text-[#06281d] rounded-lg py-2.5 px-4 text-[13px] font-semibold">
              Submit
            </button>
          </div>
        </div>
      )}
      {loginMessage && <div className="text-[13px] text-danger mb-3">{loginMessage}</div>}

      {!loginUrl && (
        <button
          onClick={startLogin}
          className="bg-gradient-to-br from-accent-2 to-accent-strong border-none rounded-lg py-2.5 px-4 text-white text-[13px] font-semibold"
        >
          Start login
        </button>
      )}
    </Sheet>
  );
}
