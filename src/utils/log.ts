import pc from "picocolors";
import type { ShellPlan } from "../ai/schema.js";
import type { CommandSafetyResult } from "../safety/classify.js";

export function info(message: string): void {
  process.stdout.write(`${pc.cyan("info")} ${message}\n`);
}

export function warn(message: string): void {
  process.stdout.write(`${pc.yellow("warn")} ${message}\n`);
}

export function error(message: string): void {
  process.stderr.write(`${pc.red("error")} ${message}\n`);
}

export function muted(message: string): void {
  process.stdout.write(`${pc.dim(message)}\n`);
}

export function printPlan(
  plan: ShellPlan,
  safety: CommandSafetyResult,
  options: {
    showConfirmationHint: boolean;
  },
): void {
  const suffix = options.showConfirmationHint
    ? ` ${pc.white("[Enter/y]")}`
    : "";
  process.stdout.write(
    `${pc.yellow("→")} ${pc.yellow(plan.command || "(empty)")} ${suffix}\n`,
  );
}

export function formatRisk(risk: CommandSafetyResult["risk"]): string {
  if (risk === "dangerous") {
    return pc.red(`(${risk})`);
  }
  if (risk === "caution") {
    return pc.yellow(`(${risk})`);
  }
  return pc.green(`(${risk})`);
}
