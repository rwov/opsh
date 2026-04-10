import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { SupportedShellName } from "../config/types.js";
import { fileExists } from "../utils/fs.js";

export interface HistoryEntry {
  command: string;
  cwd?: string;
  timestamp: string;
  exitCode?: number;
  source: "session" | "shell-file";
}

export class HistoryStore {
  private readonly maxEntries: number;
  private entries: HistoryEntry[];

  public constructor(maxEntries: number) {
    this.maxEntries = maxEntries;
    this.entries = [];
  }

  public seed(entries: HistoryEntry[]): void {
    this.entries = entries.slice(-this.maxEntries);
  }

  public add(entry: HistoryEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  public clear(): void {
    this.entries = [];
  }

  public list(): HistoryEntry[] {
    return [...this.entries];
  }

  public recentCommands(limit: number): string[] {
    return this.entries
      .slice(-limit)
      .map((entry) => entry.command)
      .filter((command) => command.length > 0);
  }
}

export class RequestHistoryStore {
  private readonly maxEntries: number;
  private entries: string[];

  public constructor(maxEntries: number) {
    this.maxEntries = maxEntries;
    this.entries = [];
  }

  public add(input: string): void {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    this.entries.push(trimmed);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  public recent(limit: number): string[] {
    return this.entries.slice(-limit);
  }
}

export async function loadRecentShellHistory(
  shellName: SupportedShellName,
  limit: number,
): Promise<HistoryEntry[]> {
  const filePath = shellName === "zsh" ? path.join(os.homedir(), ".zsh_history") : path.join(os.homedir(), ".bash_history");

  if (!(await fileExists(filePath))) {
    return [];
  }

  const raw = await readFile(filePath, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-limit * 3);

  const parsed = lines
    .map((line) => parseHistoryLine(line, shellName))
    .filter((entry): entry is HistoryEntry => entry !== null)
    .slice(-limit);

  return parsed;
}

function parseHistoryLine(line: string, shellName: SupportedShellName): HistoryEntry | null {
  if (shellName === "zsh") {
    const match = line.match(/^: \d+:\d+;(.*)$/);
    const command = match?.[1]?.trim();
    if (!command) {
      return null;
    }

    return {
      command,
      timestamp: new Date().toISOString(),
      source: "shell-file",
    };
  }

  if (!line) {
    return null;
  }

  return {
    command: line,
    timestamp: new Date().toISOString(),
    source: "shell-file",
  };
}
