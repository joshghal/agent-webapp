"use client";
import { Sheet, FieldLabel } from "./Sheet";
import { McpPresetDropdown } from "@/components/settings/SettingsDropdowns";
import { useUiStore } from "@/store/uiStore";

export function ConfigSheet() {
  const { activeSheet, closeSheet } = useUiStore();
  return (
    <Sheet open={activeSheet === "config"} onClose={closeSheet} title="Configuration">
      <FieldLabel>MCP servers</FieldLabel>
      <McpPresetDropdown />
      <div className="text-[11px] text-text-3 mt-1.5 leading-relaxed">
        &quot;None&quot; starts fastest and is the default for new sessions. &quot;Playwright&quot; adds browser/screenshot tools
        while staying quick. &quot;Full&quot; loads every configured MCP server — much slower to start.
      </div>
    </Sheet>
  );
}
