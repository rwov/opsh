import { inspectCommand } from "./inspect.js";

export type CommandRisk = "safe" | "caution" | "dangerous";

export interface CommandSafetyResult {
  risk: CommandRisk;
  reasons: string[];
  hardBlock: boolean;
}

export function classifyCommandSafety(command: string): CommandSafetyResult {
  const inspection = inspectCommand(command);
  const normalized = inspection.raw;
  const reasons = new Set<string>();

  if (isHardBlocked(normalized)) {
    reasons.add("catastrophic pattern detected");
    return {
      risk: "dangerous",
      reasons: [...reasons],
      hardBlock: true,
    };
  }

  if (inspection.matches.includes("network-pipe-to-shell")) {
    reasons.add("network output piped directly into a shell");
  }
  if (inspection.matches.includes("git-hard-reset")) {
    reasons.add("git hard reset can discard local work");
  }
  if (/\brm\s+-[^\n]*r/.test(normalized)) {
    reasons.add("recursive removal");
  }
  if (/\bchmod\b/.test(normalized)) {
    reasons.add("permission changes");
  }
  if (/\bchown\b/.test(normalized)) {
    reasons.add("ownership changes");
  }
  if (/\bsudo\b/.test(normalized)) {
    reasons.add("privileged execution");
  }
  if (/\bmv\b/.test(normalized)) {
    reasons.add("moves or renames files");
  }
  if (/\b(?:brew|apt|apt-get|yum|dnf|pacman|apk)\s+install\b/.test(normalized)) {
    reasons.add("installs or changes system packages");
  }
  if (inspection.hasPipe) {
    reasons.add("contains a pipe");
  }
  if (inspection.hasRedirect) {
    reasons.add("contains output redirection");
  }
  if (inspection.hasConditional) {
    reasons.add("contains command chaining");
  }
  if (inspection.hasSubshell) {
    reasons.add("contains subshell behavior");
  }

  const dangerous =
    reasons.has("network output piped directly into a shell") ||
    reasons.has("git hard reset can discard local work") ||
    /\brm\b/.test(normalized) ||
    /\bchmod\s+-R\b/.test(normalized) ||
    /\bchown\s+-R\b/.test(normalized);

  if (dangerous) {
    return {
      risk: "dangerous",
      reasons: [...reasons],
      hardBlock: false,
    };
  }

  if (reasons.size > 0) {
    return {
      risk: "caution",
      reasons: [...reasons],
      hardBlock: false,
    };
  }

  return {
    risk: "safe",
    reasons: [],
    hardBlock: false,
  };
}

function isHardBlocked(command: string): boolean {
  return [
    /\brm\s+-rf\s+\/($|\s)/,
    /\brm\s+-rf\s+--no-preserve-root\s+\/?/,
    /:\(\)\s*\{\s*:\|:\s*&\s*\};:/,
    /\bmkfs\./,
    /\bdd\s+.*\bof=\/dev\/(?:sd[a-z]\w*|disk\d+)/,
  ].some((pattern) => pattern.test(command));
}
