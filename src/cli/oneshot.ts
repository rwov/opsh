import { createInterface } from "node:readline/promises";
import type { ShellPlan } from "../ai/schema.js";
import { generateShellPlan } from "../ai/generate.js";
import { createProvider, type LlmProvider } from "../ai/provider.js";
import { buildDirectPlan, looksLikeDirectShellCommand } from "./commands.js";
import type { OpshConfig } from "../config/types.js";
import type { AvailableCommandRegistry } from "../shell/commands.js";
import { executePlan } from "../shell/execute.js";
import { buildPromptContext } from "../shell/context.js";
import type { HistoryStore, RequestHistoryStore } from "../shell/history.js";
import type { PersistentShellSession } from "../shell/pty.js";
import { classifyCommandSafety } from "../safety/classify.js";
import { info, muted, printPlan, warn } from "../utils/log.js";

export interface RuntimeSession {
  config: OpshConfig;
  shellSession: PersistentShellSession;
  history: HistoryStore;
  requestHistory: RequestHistoryStore;
  availableCommands: AvailableCommandRegistry;
  provider: LlmProvider;
  printOnly: boolean;
  directMode: boolean;
  warpMode: boolean;
}

export async function runOneShot(input: string, runtime: RuntimeSession): Promise<number> {
  const prompt = input.trim();
  if (!prompt) {
    warn("No prompt provided.");
    return 1;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const result = await processPrompt(prompt, runtime, rl);
    return result.exitCode;
  } finally {
    rl.close();
  }
}

export async function processPrompt(
  input: string,
  runtime: RuntimeSession,
  rl: Pick<ReturnType<typeof createInterface>, "question" | "pause" | "resume">,
): Promise<{ exitCode: number }> {
  if (runtime.directMode) {
    return await executeImmediateCommand(input, {
      ...runtime,
      warpMode: false,
    }, rl);
  }

  if (
    !runtime.printOnly &&
    looksLikeDirectShellCommand(input, runtime.availableCommands) &&
    classifyCommandSafety(input).risk === "safe"
  ) {
    return await executeImmediateCommand(input, {
      ...runtime,
      warpMode: false,
    }, rl);
  }

  let feedback: string | undefined;
  let plan = await resolvePlan(input, runtime, feedback);

  while (true) {
    if (plan.mode !== "command") {
      info(plan.explanation);
      return { exitCode: 0 };
    }

    const safety = classifyCommandSafety(plan.command);
    const resolvedPlan: ShellPlan = {
      ...plan,
      risk: safety.risk,
      needsConfirmation: plan.needsConfirmation || safety.risk !== "safe",
      shouldAutoExecute: false,
    };

    const shouldConfirm = runtime.warpMode
      ? false
      : runtime.config.confirmByDefault || resolvedPlan.needsConfirmation || safety.risk !== "safe";

    printPlan(resolvedPlan, safety, {
      showConfirmationHint: shouldConfirm,
    });

    if (safety.hardBlock) {
      warn("Execution blocked because the command matches a catastrophic pattern.");
      return { exitCode: 1 };
    }

    if (runtime.warpMode && safety.risk === "dangerous") {
      warn("Warp mode will not auto-run dangerous commands.");
      return { exitCode: 1 };
    }

    if (runtime.printOnly) {
      muted("Print-only mode is enabled; command was not executed.");
      return { exitCode: 0 };
    }

    if (!shouldConfirm) {
      return await executeResolvedPlan(resolvedPlan, runtime, rl);
    }

    const answer = await readConfirmationChoice(rl);

    if (answer === "" || answer === "y") {
      return await executeResolvedPlan(resolvedPlan, runtime, rl);
    }

    if (answer === "n") {
      muted("Cancelled.");
      return { exitCode: 0 };
    }

    if (answer === "e") {
      const editedCommand = (await rl.question("Edit command > ")).trim();
      if (!editedCommand) {
        warn("Edited command was empty; keeping the previous plan.");
        continue;
      }

      plan = {
        ...resolvedPlan,
        command: editedCommand,
        explanation: "Manually edited command.",
        assumptions: [...resolvedPlan.assumptions, "The command was manually edited before execution."],
        shouldAutoExecute: false,
      };
      continue;
    }

    if (answer === "r") {
      feedback = "Regenerate the command with a safer or simpler interpretation. Keep it to exactly one command.";
      plan = await resolvePlan(input, runtime, feedback);
      continue;
    }

    warn("Unrecognized choice. Use Enter/y, n, e, or r.");
  }
}

async function resolvePlan(input: string, runtime: RuntimeSession, feedback?: string): Promise<ShellPlan> {
  return await generateShellPlan({
    provider: runtime.provider,
    prompt: input,
    context: buildPromptContext({
      shell: runtime.shellSession.shellName,
      cwd: runtime.shellSession.cwd,
      history: runtime.history,
      recentCommandLimit: runtime.config.recentContextLimit,
      recentUserInputs: runtime.requestHistory.recent(runtime.config.recentContextLimit),
      directMode: runtime.directMode,
      printOnly: runtime.printOnly,
    }),
    feedback,
  });
}

async function executeResolvedPlan(
  plan: ShellPlan,
  runtime: RuntimeSession,
  rl: Pick<ReturnType<typeof createInterface>, "pause" | "resume">,
): Promise<{ exitCode: number }> {
  const stream = process.stdin.isTTY && process.stdout.isTTY && !runtime.printOnly && !runtime.warpMode;
  rl.pause();
  const result = await executePlan(runtime.shellSession, plan, runtime.history, {
    stream,
  });
  rl.resume();

  if (!stream && !runtime.warpMode && result.output) {
    process.stdout.write(`${result.output}\n`);
  }
  if (runtime.warpMode) {
    const interpretation = await runtime.provider.interpretResult({
      prompt: plan.userIntent,
      command: plan.command,
      output: result.output,
      exitCode: result.exitCode,
      cwd: result.cwd,
    });
    if (interpretation.trim()) {
      process.stdout.write(`${interpretation.trim()}\n`);
    }
  }
  return { exitCode: result.exitCode };
}

async function executeImmediateCommand(
  input: string,
  runtime: RuntimeSession,
  rl: Pick<ReturnType<typeof createInterface>, "pause" | "resume">,
): Promise<{ exitCode: number }> {
  const plan = buildDirectPlan(input);
  const stream = process.stdin.isTTY && process.stdout.isTTY;

  rl.pause();
  const result = await executePlan(runtime.shellSession, plan, runtime.history, {
    stream,
  });
  rl.resume();

  if (!stream && result.output) {
    process.stdout.write(`${result.output}\n`);
  }

  return { exitCode: result.exitCode };
}

export function createRuntimeSession(input: {
  config: OpshConfig;
  shellSession: PersistentShellSession;
  history: HistoryStore;
  requestHistory: RequestHistoryStore;
  availableCommands: AvailableCommandRegistry;
  printOnly: boolean;
  directMode: boolean;
  warpMode: boolean;
}): RuntimeSession {
  return {
    ...input,
    provider: createProvider(input.config.provider),
  };
}

async function readConfirmationChoice(
  rl: Pick<ReturnType<typeof createInterface>, "question">,
): Promise<"" | "y" | "n" | "e" | "r"> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    const answer = (await rl.question("")).trim().toLowerCase();
    return normalizeConfirmationChoice(answer) ?? "";
  }

  return await new Promise<"" | "y" | "n" | "e" | "r">((resolve) => {
    const stdin = process.stdin;
    const previousRawMode = stdin.isRaw;

    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode?.(previousRawMode ?? false);
    };

    const onData = (buffer: Buffer) => {
      const key = buffer.toString("utf8");

      if (key === "\u0003") {
        cleanup();
        resolve("n");
        return;
      }

      if (key === "\r" || key === "\n") {
        cleanup();
        resolve("");
        return;
      }

      const normalized = normalizeConfirmationChoice(key.trim().toLowerCase());
      if (normalized !== null) {
        cleanup();
        resolve(normalized);
      }
    };

    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

function normalizeConfirmationChoice(value: string): "" | "y" | "n" | "e" | "r" | null {
  if (value === "" || value === "y" || value === "n" || value === "e" || value === "r") {
    return value;
  }

  return null;
}
