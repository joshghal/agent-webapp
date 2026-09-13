"use client";
import { Dropdown } from "./Dropdown";
import { useSettingsStore } from "@/store/settingsStore";
import { applySettingsLive } from "@/lib/client/applySettingsLive";
import { MODEL_OPTIONS, EFFORT_OPTIONS, PERMISSION_MODE_OPTIONS, MCP_PRESET_OPTIONS } from "@/lib/shared/constants";

// The three inline pills that live directly in the input bar — visible and
// immediately effective, not hidden in a settings sheet, per an explicit request
// that changing them should be easy to find and should actually take effect.
export function InlineSettingsDropdowns() {
  const { model, effort, permissionMode, setModel, setEffort, setPermissionMode } = useSettingsStore();
  return (
    <>
      <Dropdown
        value={model}
        options={MODEL_OPTIONS}
        compact
        openUpward
        onChange={(v) => {
          setModel(v);
          applySettingsLive();
        }}
      />
      <Dropdown
        value={effort}
        options={EFFORT_OPTIONS}
        compact
        openUpward
        onChange={(v) => {
          setEffort(v);
          applySettingsLive();
        }}
      />
      <Dropdown
        value={permissionMode}
        options={PERMISSION_MODE_OPTIONS}
        compact
        openUpward
        onChange={(v) => {
          setPermissionMode(v);
          applySettingsLive();
        }}
      />
    </>
  );
}

// MCP preset lives in the Configuration sheet — it's a startup-time choice you
// change far less often than model/effort/permission.
export function McpPresetDropdown() {
  const { mcpPreset, setMcpPreset } = useSettingsStore();
  return (
    <Dropdown
      value={mcpPreset}
      options={MCP_PRESET_OPTIONS}
      onChange={(v) => {
        setMcpPreset(v);
        applySettingsLive();
      }}
    />
  );
}
