import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="bg-blur-backdrop" />
      {/* The glass effect lives on this decorative sibling layer, not on the flex
          container that actually wraps Sidebar/main — `backdrop-filter` (like
          `filter`/`transform`) creates a new containing block for any
          `position: fixed` descendant, which broke the mobile sidebar drawer and
          any modal rendered underneath this tree (they positioned relative to
          this panel instead of the real viewport). Keeping the filter on a
          sibling with no fixed-position descendants of its own avoids that
          entirely, with an identical visual result. */}
      <div className="relative z-[1] flex-1 flex min-w-0 min-h-0 rounded-xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-panel backdrop-blur-3xl backdrop-saturate-150 border border-panel-border rounded-xl pointer-events-none" />
        <Sidebar />
        <main className="relative flex-1 min-w-0 flex flex-col">{children}</main>
      </div>
    </>
  );
}
