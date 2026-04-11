import { createInterface } from "node:readline/promises";
import os from "node:os";
import path from "node:path";
import pc from "picocolors";
import { formatConfigSummary, formatHistory, formatRuntimeStatus, getHelpText, parseMetaCommand } from "./commands.js";
import { handOffToShell, runInstalledUninstaller } from "./uninstall.js";
import type { OpshConfig } from "../config/types.js";
import { editConfigInteractively, saveConfig } from "../config/load.js";
import type { AvailableCommandRegistry } from "../shell/commands.js";
import type { HistoryStore, RequestHistoryStore } from "../shell/history.js";
import type { PersistentShellSession } from "../shell/pty.js";
import { processPrompt, createRuntimeSession } from "./oneshot.js";
import { muted } from "../utils/log.js";

export async function runRepl(input: {
  config: OpshConfig;
  configPath: string;
  shellSession: PersistentShellSession;
  history: HistoryStore;
  requestHistory: RequestHistoryStore;
  availableCommands: AvailableCommandRegistry;
  printOnly: boolean;
}): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    historySize: input.config.historyLimit,
  });

  let activeQuestionController: AbortController | null = null;
  let interrupted = false;

  rl.on("SIGINT", () => {
    interrupted = true;
    activeQuestionController?.abort();
    process.stdout.write("\r\x1b[2K");
  });

  let directMode = false;
  let warpMode = input.config.warpMode;
  let printOnly = input.printOnly;

  try {
    while (true) {
      const prompt = buildPrompt(input.shellSession.cwd, directMode, printOnly);
      const controller = new AbortController();
      activeQuestionController = controller;

      let line = "";
      try {
        line = (await rl.question(prompt, {
          signal: controller.signal,
        })).trim();
      } catch (error) {
        activeQuestionController = null;
        if (interrupted) {
          interrupted = false;
          continue;
        }

        throw error;
      }

      activeQuestionController = null;

      if (!line) {
        continue;
      }

      const meta = parseMetaCommand(line);
      if (meta) {
        if (meta.type === "exit") {
          break;
        }
        if (meta.type === "help") {
          process.stdout.write(`${getHelpText()}\n`);
          continue;
        }
        if (meta.type === "status") {
          process.stdout.write(`${formatRuntimeStatus({
            config: input.config,
            directMode,
            warpMode,
            printOnly,
            cwd: input.shellSession.cwd,
          })}\n`);
          continue;
        }
        if (meta.type === "config") {
          process.stdout.write(`${formatConfigSummary(input.config, input.configPath)}\n`);
          rl.pause();
          try {
            const updated = await editConfigInteractively(input.config);
            Object.assign(input.config, updated);
            warpMode = updated.warpMode;
            printOnly = updated.printOnly;
            process.stdout.write(`${formatConfigSummary(input.config, input.configPath)}\n`);
          } finally {
            rl.resume();
          }
          continue;
        }
        if (meta.type === "history") {
          process.stdout.write(`${formatHistory(input.history)}\n`);
          continue;
        }
        if (meta.type === "clear") {
          process.stdout.write("\x1Bc");
          continue;
        }
        if (meta.type === "cmd") {
          directMode = !directMode;
          muted(`Command mode ${directMode ? "enabled" : "disabled"}.`);
          continue;
        }
        if (meta.type === "warp") {
          warpMode = !warpMode;
          input.config.warpMode = warpMode;
          await saveConfig(input.config);
          muted(`Warp mode ${warpMode ? "enabled" : "disabled"}.`);
          continue;
        }
        if (meta.type === "uninstall") {
          rl.pause();
          try {
            const exitCode = await runInstalledUninstaller();
            if (exitCode === 0) {
              await handOffToShell(input.shellSession.shellPath, input.shellSession.cwd);
              return;
            }
          } finally {
            rl.resume();
          }
          continue;
        }
        if (meta.type === "print") {
          printOnly = meta.enabled;
          muted(`Print-only mode ${printOnly ? "enabled" : "disabled"}.`);
          continue;
        }
      }

      const runtime = createRuntimeSession({
        config: input.config,
        shellSession: input.shellSession,
        history: input.history,
        requestHistory: input.requestHistory,
        availableCommands: input.availableCommands,
        printOnly,
        directMode,
        warpMode,
      });

      await processPrompt(line, runtime, rl);
      input.requestHistory.add(line);
    }
  } finally {
    rl.close();
  }
}

function buildPrompt(cwd: string, directMode: boolean, printOnly: boolean): string {
  const display = cwd === os.homedir() ? "~" : path.basename(cwd) || cwd;
  return `${pc.green(display)} > `;
}
