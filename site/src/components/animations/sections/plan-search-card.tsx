"use client";

import { TerminalWindow } from "@/components/animations/sections/terminal-browser-preview";
import {
  ConnectionStatusIndicator,
  type ConnectionStatus,
} from "./connection-status-indicator";

type PlanSearchCardProps = {
  rootRef?: React.RefObject<HTMLDivElement | null> | null;
  status: ConnectionStatus;
  showDialog: boolean;
  showTyping: boolean;
  popoverPosition?: "top" | "bottom";
};

const PROMPT_STATE = {
  command: "find every PDF modified this week and zip them into reports.zip",
  output: ["Ready to generate a shell command from your request."],
} as const;

const REVIEW_STATE = {
  command: "find every PDF modified this week and zip them into reports.zip",
  output: [
    "→ find . -type f -name '*.pdf' -mtime -7 -print0 | xargs -0 zip reports.zip",
    "Review the command, edit it if needed, then run it in your real shell.",
  ],
} as const;

const RESULT_STATE = {
  command: "which branch changed the auth middleware most recently?",
  output: [
    "→ git log --all --decorate --stat -- src/auth/middleware.ts | head -n 20",
    "The latest update came from `feature/sso-session-refresh` 2 hours ago.",
    "It added session refresh handling before redirecting expired users.",
  ],
} as const;

export function PlanSearchCard({
  rootRef,
  status,
  showDialog,
  showTyping,
}: PlanSearchCardProps) {
  const terminalState = showTyping
    ? RESULT_STATE
    : showDialog
      ? REVIEW_STATE
      : PROMPT_STATE;

  return (
    <div
      ref={rootRef || undefined}
      className="relative mx-auto w-full max-w-4xl min-h-72"
    >
      <ConnectionStatusIndicator status={status} />
      <TerminalWindow
        opsh
        command={terminalState.command}
        output={[...terminalState.output]}
        className="w-full max-w-none shadow-2xl shadow-primary/10"
        bodyClassName="min-h-[220px] md:min-h-[260px] md:text-[13px]"
      />
    </div>
  );
}
