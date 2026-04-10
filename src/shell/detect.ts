import { access } from "node:fs/promises";
import path from "node:path";
import type { SupportedShellName } from "../config/types.js";
import { assertSupportedPlatform } from "../utils/env.js";

export interface DetectedShell {
  name: SupportedShellName;
  path: string;
  source: "config" | "env" | "fallback";
}

export async function detectShell(preferred?: SupportedShellName): Promise<DetectedShell> {
  assertSupportedPlatform();

  const fromConfig = preferred ? await resolveShell(preferred, "config") : null;
  if (fromConfig) {
    return fromConfig;
  }

  const envShell = process.env.SHELL ? path.basename(process.env.SHELL) : undefined;
  if (envShell === "zsh" || envShell === "bash") {
    const fromEnv = await resolveShell(envShell, "env");
    if (fromEnv) {
      return fromEnv;
    }
  }

  const fallback = (await resolveShell("zsh", "fallback")) ?? (await resolveShell("bash", "fallback"));
  if (fallback) {
    return fallback;
  }

  throw new Error("Could not locate a supported shell. opsh v1 supports zsh and bash only.");
}

async function resolveShell(
  shellName: SupportedShellName,
  source: DetectedShell["source"],
): Promise<DetectedShell | null> {
  const candidates = shellName === "zsh" ? ["/bin/zsh", "/usr/bin/zsh"] : ["/bin/bash", "/usr/bin/bash"];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return {
        name: shellName,
        path: candidate,
        source,
      };
    } catch {
      continue;
    }
  }

  return null;
}
