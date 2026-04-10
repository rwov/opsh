import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileExists } from "../utils/fs.js";

export async function runInstalledUninstaller(): Promise<number> {
  const scriptPath = await findUninstallScript();
  if (!scriptPath) {
    throw new Error("Could not find the opsh uninstall script.");
  }

  return await new Promise<number>((resolve, reject) => {
    const child = spawn("bash", [scriptPath, "--yes"], {
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      resolve(code ?? 1);
    });
  });
}

export async function handOffToShell(shellPath: string, cwd: string): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const child = spawn(shellPath, ["-i"], {
      cwd,
      stdio: "inherit",
      env: {
        ...process.env,
        OPSH_DISABLE_AUTO: "1",
      },
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      resolve(code ?? 0);
    });
  });
}

async function findUninstallScript(): Promise<string | null> {
  const candidates = [
    path.join(os.homedir(), ".opsh", "uninstall.sh"),
    path.join(process.cwd(), "scripts", "uninstall.sh"),
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}
