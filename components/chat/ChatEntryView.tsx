import type { ChatEntry } from "@/store/chatStore";
import { UserMessage, AssistantMessage } from "./MessageBubble";
import { ThinkingBlock } from "./ThinkingBlock";
import { WorkingIndicator, StallWarning } from "./WorkingIndicator";
import { ToolUseCard, ToolResultCard } from "./ToolUseCard";
import { ApprovalCard } from "./ApprovalCard";

export function ChatEntryView({ entry }: { entry: ChatEntry }) {
  switch (entry.kind) {
    case "user_message":
      return <UserMessage text={entry.text} />;
    case "assistant_text":
      return <AssistantMessage text={entry.text} />;
    case "thinking":
      return <ThinkingBlock text={entry.text} done={entry.done} />;
    case "tool_use":
      return <ToolUseCard name={entry.name} input={entry.input} />;
    case "tool_result":
      return <ToolResultCard content={entry.content} images={entry.images} isError={entry.isError} />;
    case "approval":
      return (
        <ApprovalCard
          requestId={entry.requestId}
          toolName={entry.toolName}
          input={entry.input}
          description={entry.description}
          resolved={entry.resolved}
        />
      );
    case "working_indicator":
      return <WorkingIndicator text={entry.text} />;
    case "stall_warning":
      return <StallWarning text={entry.text} />;
    default:
      return null;
  }
}
