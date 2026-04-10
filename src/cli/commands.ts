import os from "node:os";
import pc from "picocolors";
import type { OpshConfig } from "../config/types.js";
import type { HistoryStore } from "../shell/history.js";

export type ReplMetaCommand =
  | { type: "help" }
  | { type: "config" }
  | { type: "history" }
  | { type: "clear" }
  | { type: "cmd" }
  | { type: "warp" }
  | { type: "uninstall" }
  | { type: "print"; enabled: boolean }
  | { type: "exit" };

export function parseMetaCommand(input: string): ReplMetaCommand | null {
  const trimmed = input.trim();

  if (trimmed === "!help") return { type: "help" };
  if (trimmed === "!config") return { type: "config" };
  if (trimmed === "!history") return { type: "history" };
  if (trimmed === "!clear") return { type: "clear" };
  if (trimmed === "!cmd") return { type: "cmd" };
  if (trimmed === "!warp") return { type: "warp" };
  if (trimmed === "!uninstall") return { type: "uninstall" };
  if (trimmed === "!exit") return { type: "exit" };
  if (trimmed === "!print on") return { type: "print", enabled: true };
  if (trimmed === "!print off") return { type: "print", enabled: false };

  return null;
}

export function buildDirectPlan(input: string) {
  return {
    mode: "command" as const,
    userIntent: input,
    command: input.trim(),
    explanation: "Direct shell command supplied by the user.",
    risk: "safe" as const,
    assumptions: [],
    needsConfirmation: true,
    shouldAutoExecute: false,
  };
}

export function getHelpText(): string {
  const commands = [
    ["!help", "Show this help"],
    ["!config", "Show config path and provider summary"],
    ["!history", "Show recent bounded history"],
    ["!clear", "Clear the terminal"],
    ["!cmd", "Toggle raw command mode"],
    ["!warp", "Toggle warp mode"],
    ["!uninstall", "Remove shell integration and installed binary"],
    ["!print on", "Preview plans without execution"],
    ["!print off", "Leave print-only mode"],
    ["!exit", "Exit opsh"],
  ] as const;

  const width = Math.max(...commands.map(([command]) => command.length));
  return [
    "Built-in commands:",
    ...commands.map(([command, description]) => {
      return `${pc.cyan(command.padEnd(width, " "))} - ${description}`;
    }),
  ].join("\n");
}

export function formatConfigSummary(config: OpshConfig, configPath: string): string {
  const provider = config.provider[config.provider.selected];
  const rows = [
    ["Path", configPath.replace(os.homedir(), "~")],
    ["Shell", config.shell ?? "auto-detect"],
    ["Warp", config.warpMode ? "On" : "Off"],
    ["Confirm", config.warpMode ? "Managed by warp mode" : config.confirmByDefault ? "On" : "Off"],
    ["Provider", config.provider.selected],
    ["Model", provider.model],
    ["Base URL", provider.baseUrl],
  ] as const;
  const width = Math.max(...rows.map(([label]) => label.length));

  return [
    "Config:",
    ...rows.map(([label, value]) => `${pc.cyan(label.padEnd(width, " "))} - ${value}`),
  ].join("\n");
}

export function formatHistory(history: HistoryStore): string {
  const entries = history.list().slice(-20);
  if (entries.length === 0) {
    return "No history entries yet.";
  }

  return entries
    .map((entry, index) => {
      const cwd = entry.cwd ? ` (${shortenPath(entry.cwd)})` : "";
      const status = typeof entry.exitCode === "number" ? ` [exit ${entry.exitCode}]` : "";
      return `${String(index + 1).padStart(2, " ")}. ${entry.command}${cwd}${status}`;
    })
    .join("\n");
}

function shortenPath(value: string): string {
  return value.replace(os.homedir(), "~");
}
