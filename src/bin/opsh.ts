#!/usr/bin/env node

import { Command } from "commander";
import { initConfigInteractively, loadConfig } from "../config/load.js";
import { detectShell } from "../shell/detect.js";
import { loadAvailableCommands } from "../shell/commands.js";
import { PersistentShellSession } from "../shell/pty.js";
import { loadRecentShellHistory, HistoryStore, RequestHistoryStore } from "../shell/history.js";
import { runRepl } from "../cli/repl.js";
import { createRuntimeSession, runOneShot } from "../cli/oneshot.js";
import { assertSupportedPlatform } from "../utils/env.js";
import { error, info, muted } from "../utils/log.js";

async function main(): Promise<void> {
  assertSupportedPlatform();
  installSigintGuard();

  const program = new Command();
  program
    .name("opsh")
    .description("Natural-language shell adapter for macOS and Linux.")
    .argument("[prompt...]", "natural language request or direct shell command")
    .option("--init", "initialize or update ~/.opsh/config.json")
    .option("--print-only", "preview commands without executing them")
    .option("--shell <shell>", "override shell for this session (zsh or bash)")
    .showHelpAfterError();

  program.parse(process.argv);

  const options = program.opts<{
    init?: boolean;
    printOnly?: boolean;
    shell?: string;
  }>();
  const promptParts = program.args as string[];

  const loaded = await loadConfig();
  if (loaded.created) {
    info(`Created default config at ${loaded.path}`);
    if (process.stdin.isTTY && process.stdout.isTTY) {
      info("Bootstrapping provider config interactively.");
      loaded.config = await initConfigInteractively(loaded.config);
    }
  }

  if (options.init) {
    const next = await initConfigInteractively(loaded.config);
    info(`Saved config at ${loaded.path}`);
    muted(`Provider: ${next.provider.selected}`);
    return;
  }

  const preferredShell = options.shell === "zsh" || options.shell === "bash" ? options.shell : loaded.config.shell;
  const shell = await detectShell(preferredShell);
  const availableCommands = await loadAvailableCommands(shell.name);
  const history = new HistoryStore(loaded.config.historyLimit);
  const requestHistory = new RequestHistoryStore(loaded.config.historyLimit);
  history.seed(await loadRecentShellHistory(shell.name, loaded.config.historyLimit));

  const shellSession = new PersistentShellSession(shell, process.cwd());
  await shellSession.start();

  try {
    const printOnly = Boolean(options.printOnly) || loaded.config.printOnly;
    if (promptParts.length > 0) {
      const runtime = createRuntimeSession({
        config: loaded.config,
        shellSession,
        history,
        requestHistory,
        availableCommands,
        printOnly,
        directMode: false,
        warpMode: false,
      });
      const exitCode = await runOneShot(promptParts.join(" "), runtime);
      process.exitCode = exitCode;
      return;
    }

    await runRepl({
      config: loaded.config,
      configPath: loaded.path,
      shellSession,
      history,
      requestHistory,
      availableCommands,
      printOnly,
    });
  } finally {
    shellSession.dispose();
  }
}

main().catch((cause) => {
  error(cause instanceof Error ? cause.message : String(cause));
  process.exitCode = 1;
});

function installSigintGuard(): void {
  process.on("SIGINT", () => {
    return;
  });
}
