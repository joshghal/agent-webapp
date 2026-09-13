import { create } from "zustand";
import type { ProjectDirectory } from "@/lib/shared/ws-protocol";

type SidebarState = {
  directories: ProjectDirectory[];
  searchQuery: string;
  expandedDirs: Set<string>;
  setDirectories: (dirs: ProjectDirectory[]) => void;
  setSearchQuery: (q: string) => void;
  toggleExpanded: (projectPath: string) => void;
  expand: (projectPath: string) => void;
};

export const useSidebarStore = create<SidebarState>((set) => ({
  directories: [],
  searchQuery: "",
  expandedDirs: new Set(),
  setDirectories: (directories) => set({ directories }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleExpanded: (projectPath) =>
    set((s) => {
      const next = new Set(s.expandedDirs);
      if (next.has(projectPath)) next.delete(projectPath);
      else next.add(projectPath);
      return { expandedDirs: next };
    }),
  expand: (projectPath) =>
    set((s) => {
      if (s.expandedDirs.has(projectPath)) return s;
      const next = new Set(s.expandedDirs);
      next.add(projectPath);
      return { expandedDirs: next };
    }),
}));
