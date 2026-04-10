import type { ShellPlan } from "../ai/schema.js";
import type { HistoryStore } from "./history.js";
import type { PersistentShellSession, PtyExecutionResult } from "./pty.js";

export async function executePlan(
  session: PersistentShellSession,
  plan: ShellPlan,
  history: HistoryStore,
  options: {
    stream?: boolean;
  } = {},
): Promise<PtyExecutionResult> {
  const result = await session.execute(plan.command, {
    mode: options.stream ? "stream" : "capture",
  });
  history.add({
    command: plan.command,
    cwd: result.cwd,
    exitCode: result.exitCode,
    timestamp: new Date().toISOString(),
    source: "session",
  });
  return result;
}
