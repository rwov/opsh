import os from "node:os";
import pc from "picocolors";
import type { OpshConfig } from "../config/types.js";
import type { AvailableCommandRegistry } from "../shell/commands.js";
import type { HistoryStore } from "../shell/history.js";

export type ReplMetaCommand =
  | { type: "help" }
  | { type: "status" }
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
  if (trimmed === "!status") return { type: "status" };
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

export function looksLikeDirectShellCommand(
  input: string,
  availableCommands: AvailableCommandRegistry,
): boolean {
  const trimmed = input.trim();
  if (!trimmed || trimmed.startsWith("!")) {
    return false;
  }

  const firstToken = trimmed.match(/^[^\s|&;<>()[\]{}]+/)?.[0];
  if (!firstToken) {
    return false;
  }

  const rest = trimmed.slice(firstToken.length).trimStart();
  if (rest && looksLikeNaturalLanguageRemainder(rest)) {
    return false;
  }

  if (
    firstToken.startsWith("./") ||
    firstToken.startsWith("../") ||
    firstToken.startsWith("/") ||
    firstToken.startsWith("~/")
  ) {
    return true;
  }

  return availableCommands.has(firstToken);
}

function looksLikeNaturalLanguageRemainder(value: string): boolean {
  const normalized = value.toLowerCase();
  const naturalLanguageStarters = [
    "which ",
    "what ",
    "where ",
    "why ",
    "how ",
    "who ",
    "when ",
    "my ",
    "the ",
    "a ",
    "an ",
    "this ",
    "that ",
    "these ",
    "those ",
    "folder ",
    "file ",
    "project ",
  ];

  if (naturalLanguageStarters.some((prefix) => normalized.startsWith(prefix))) {
    return true;
  }

  const naturalLanguageMarkers = [
    " in the ",
    " in my ",
    " from the ",
    " from my ",
    " with my ",
    " has my ",
    " for my ",
  ];

  return naturalLanguageMarkers.some((marker) => normalized.includes(marker));
}

export function getHelpText(): string {
  const commands = [
    ["!help", "Show this help"],
    ["!status", "Show current runtime mode status"],
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

export function formatRuntimeStatus(input: {
  config: OpshConfig;
  directMode: boolean;
  warpMode: boolean;
  printOnly: boolean;
  cwd: string;
}): string {
  const provider = input.config.provider[input.config.provider.selected];
  const rows = [
    ["Path", shortenPath(input.cwd)],
    ["Shell", input.config.shell ?? "auto-detect"],
    ["Warp", input.warpMode ? "On" : "Off"],
    ["Cmd", input.directMode ? "On" : "Off"],
    ["Print", input.printOnly ? "On" : "Off"],
    ["Confirm", input.warpMode ? "Managed by warp mode" : input.config.confirmByDefault ? "On" : "Off"],
    ["Provider", input.config.provider.selected],
    ["Model", provider.model],
  ] as const;
  const width = Math.max(...rows.map(([label]) => label.length));

  return [
    "Status:",
    ...rows.map(([label, value]) => `${pc.cyan(label.padEnd(width, " "))} - ${value}`),
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
