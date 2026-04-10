import type { SupportedShellName } from "../config/types.js";
import type { HistoryStore } from "./history.js";

export interface PromptContext {
  platform: "darwin" | "linux";
  shell: SupportedShellName;
  cwd: string;
  recentCommands: string[];
  recentUserInputs: string[];
  directMode: boolean;
  printOnly: boolean;
}

export function buildPromptContext(input: {
  shell: SupportedShellName;
  cwd: string;
  history: HistoryStore;
  recentCommandLimit: number;
  recentUserInputs: string[];
  directMode: boolean;
  printOnly: boolean;
}): PromptContext {
  return {
    platform: process.platform as "darwin" | "linux",
    shell: input.shell,
    cwd: input.cwd,
    recentCommands: input.history.recentCommands(input.recentCommandLimit),
    recentUserInputs: input.recentUserInputs,
    directMode: input.directMode,
    printOnly: input.printOnly,
  };
}
