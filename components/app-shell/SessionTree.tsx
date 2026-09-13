"use client";
import { FolderIcon, ChevronRightIcon, ChatIcon, PlusIcon } from "@/components/icons/icons";
import { Highlighted } from "./Highlighted";
import { useSidebarStore } from "@/store/sidebarStore";
import { useSessionStore } from "@/store/sessionStore";
import { switchProject } from "@/lib/client/switchProject";
import { timeAgo } from "@/lib/client/timeAgo";
import { splitSearchWords, matchesAllWords } from "@/lib/client/searchHighlight";

function LiveDot() {
  return <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_0_2px_var(--color-success-soft)] flex-none" />;
}

export function SessionTree() {
  const { directories, searchQuery, expandedDirs, toggleExpanded } = useSidebarStore();
  const { currentProject, currentSessionId } = useSessionStore();
  const words = splitSearchWords(searchQuery);

  return (
    <div>
      {directories.map((dir) => {
        const folderName = dir.projectPath.split("/").pop() || dir.projectPath;
        const folderMatches = matchesAllWords(folderName, words);
        const visibleSessions = dir.sessions.filter((s) => words.length === 0 || matchesAllWords(s.title, words));
        const groupVisible = words.length === 0 || folderMatches || visibleSessions.length > 0;
        if (!groupVisible) return null;
        const expanded = words.length > 0 || expandedDirs.has(dir.projectPath);

        return (
          <div key={dir.projectPath} className="mb-0.5">
            <div
              onClick={() => toggleExpanded(dir.projectPath)}
              className="flex items-center gap-2 py-2 px-1.5 rounded-lg cursor-pointer text-text-2 hover:bg-hover hover:text-text-1 transition-colors group"
            >
              <span className={`flex flex-none text-text-3 transition-transform ${expanded ? "rotate-90" : ""}`}>
                <ChevronRightIcon className="w-[11px] h-[11px]" />
              </span>
              <FolderIcon className="w-[15px] h-[15px] flex-none text-text-3" />
              {dir.live && <LiveDot />}
              <span className="flex-1 text-[13px] font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                <Highlighted text={folderName} words={words} />
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  switchProject(dir.projectPath, { forceNew: true });
                }}
                title="New session here"
                className="w-[22px] h-[22px] rounded-md flex-none flex items-center justify-center text-text-3 opacity-0 group-hover:opacity-100 hover:bg-active hover:text-text-1 transition-colors"
              >
                <PlusIcon className="w-[13px] h-[13px]" />
              </button>
            </div>
            {expanded && (
              <div className="pl-[21px] mt-px">
                {visibleSessions.length === 0 && (
                  <div className="text-[10.5px] text-text-3 py-1.5 px-2.5">No sessions yet</div>
                )}
                {visibleSessions.map((s) => {
                  const active = dir.projectPath === currentProject && s.sessionId === currentSessionId;
                  return (
                    <div
                      key={s.sessionId}
                      onClick={() => switchProject(dir.projectPath, { sessionId: s.sessionId, title: s.title })}
                      className={`flex items-start gap-2 py-1.5 px-2 rounded-lg cursor-pointer mb-px transition-colors ${
                        active ? "bg-accent-soft" : "hover:bg-hover"
                      }`}
                    >
                      <ChatIcon className={`w-[13px] h-[13px] mt-0.5 flex-none ${active ? "text-accent-2" : "text-text-3"}`} />
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-[12.5px] overflow-hidden text-ellipsis whitespace-nowrap ${
                            active ? "text-text-1" : "text-text-2"
                          }`}
                        >
                          <Highlighted text={s.title} words={words} />
                        </div>
                        <div className="text-[10.5px] text-text-3 mt-0.5 flex items-center gap-1.5">
                          {s.live && <LiveDot />}
                          {timeAgo(s.modified)} · {s.messageCount} msgs
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
