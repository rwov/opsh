import { spawn, type IPty } from "node-pty";
import { chmod, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import type { DetectedShell } from "./detect.js";

export interface PtyExecutionResult {
  command: string;
  output: string;
  exitCode: number;
  cwd: string;
}

export class PersistentShellSession {
  private readonly shell: DetectedShell;
  private readonly env: NodeJS.ProcessEnv;
  private currentCwd: string;

  public constructor(shell: DetectedShell, cwd: string, extraEnv: NodeJS.ProcessEnv = {}) {
    this.shell = shell;
    this.currentCwd = cwd;
    this.env = {
      ...process.env,
      ...extraEnv,
      TERM: process.env.TERM || "xterm-256color",
      OPSH: "1",
    };
  }

  public get cwd(): string {
    return this.currentCwd;
  }

  public get shellName(): DetectedShell["name"] {
    return this.shell.name;
  }

  public get shellPath(): string {
    return this.shell.path;
  }

  public async start(): Promise<void> {
    await ensureNodePtyHelperExecutable();
  }

  public async execute(
    command: string,
    options: {
      mode?: "capture" | "stream";
      timeoutMs?: number;
    } = {},
  ): Promise<PtyExecutionResult> {
    const mode = options.mode ?? "capture";
    const timeoutMs = options.timeoutMs ?? 60_000;
    const endToken = `__OPSH_DONE_${Date.now()}_${Math.random().toString(36).slice(2)}__`;

    return await new Promise<PtyExecutionResult>((resolve, reject) => {
      const wrappedCommand = buildCommandWrapper(this.currentCwd, command, endToken);
      const pty = spawn(this.shell.path, getExecutionArgs(this.shell.name, wrappedCommand), {
        name: process.env.TERM || "xterm-256color",
        cols: process.stdout.columns || 120,
        rows: process.stdout.rows || 30,
        cwd: this.currentCwd,
        env: this.env,
      });

      let output = "";
      let rawBuffer = "";
      let finished = false;

      const timeout = setTimeout(() => {
        cleanup();
        pty.kill();
        reject(new Error(`Timed out while waiting for shell command to finish: ${command}`));
      }, timeoutMs);

      const inputCleanup = mode === "stream" ? attachInteractiveInput(pty) : () => {};
      const resizeCleanup = mode === "stream" ? attachResizeHandler(pty) : () => {};

      const cleanup = () => {
        if (finished) {
          return;
        }
        finished = true;
        clearTimeout(timeout);
        inputCleanup();
        resizeCleanup();
      };

      pty.onData((chunk) => {
        rawBuffer += chunk;
        const markerIndex = rawBuffer.indexOf(endToken);

        if (markerIndex === -1) {
          if (mode === "stream") {
            const tail = Math.max(endToken.length + 64, 256);
            const flushLength = Math.max(0, rawBuffer.length - tail);
            if (flushLength > 0) {
              const content = rawBuffer.slice(0, flushLength);
              rawBuffer = rawBuffer.slice(flushLength);
              output += content;
              process.stdout.write(content);
            }
          }
          return;
        }

        const beforeMarker = rawBuffer.slice(0, markerIndex);
        output += beforeMarker;
        if (mode === "stream" && beforeMarker.length > 0) {
          process.stdout.write(beforeMarker);
        }

        const trailing = rawBuffer.slice(markerIndex);
        const match = trailing.match(new RegExp(`${escapeRegExp(endToken)}:(-?\\d+):([^\\r\\n]+)`));
        if (!match) {
          return;
        }

        const exitCode = Number(match[1] ?? 1);
        const cwd = match[2] ?? this.currentCwd;
        this.currentCwd = cwd;

        cleanup();
        pty.kill();

        resolve({
          command,
          output: mode === "capture" ? cleanCapturedOutput(output) : output,
          exitCode,
          cwd,
        });
      });

      pty.onExit(({ exitCode }) => {
        if (finished) {
          return;
        }

        cleanup();
        reject(new Error(`Shell exited unexpectedly with code ${exitCode}.`));
      });
    });
  }

  public dispose(): void {}
}

function buildCommandWrapper(cwd: string, command: string, endToken: string): string {
  return `builtin cd -- ${quoteForSingleShellWord(cwd)} || exit 1\n${command}\n__opsh_status=$?\nprintf '${endToken}:%s:%s\\n' "$__opsh_status" "$PWD"\n`;
}

function getExecutionArgs(shellName: DetectedShell["name"], wrappedCommand: string): string[] {
  if (shellName === "zsh") {
    return ["-f", "-c", wrappedCommand];
  }

  return ["--noprofile", "--norc", "-c", wrappedCommand];
}

function cleanCapturedOutput(output: string): string {
  return stripAnsi(output.replaceAll("\r", "")).trim();
}

function stripAnsi(value: string): string {
  return value.replace(/\u001B\[[0-9;?]*[ -/]*[@-~]/g, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function quoteForSingleShellWord(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function attachInteractiveInput(pty: IPty): () => void {
  if (!process.stdin.isTTY) {
    return () => {};
  }

  const stdin = process.stdin;
  const previousRawMode = stdin.isRaw;
  const onData = (chunk: Buffer) => {
    pty.write(chunk.toString("utf8"));
  };

  stdin.setRawMode?.(true);
  stdin.resume();
  stdin.on("data", onData);

  return () => {
    stdin.off("data", onData);
    stdin.setRawMode?.(previousRawMode ?? false);
  };
}

function attachResizeHandler(pty: IPty): () => void {
  if (!process.stdout.isTTY) {
    return () => {};
  }

  const onResize = () => {
    pty.resize(process.stdout.columns || 120, process.stdout.rows || 30);
  };

  process.stdout.on("resize", onResize);
  onResize();

  return () => {
    process.stdout.off("resize", onResize);
  };
}

async function ensureNodePtyHelperExecutable(): Promise<void> {
  if (process.platform !== "darwin") {
    return;
  }

  const nodePtyPackageJsonPath = resolveNodePtyPackagePath();
  const nodePtyRoot = path.dirname(nodePtyPackageJsonPath);
  const helperCandidates = [
    path.join(nodePtyRoot, "build", "Release", "spawn-helper"),
    path.join(nodePtyRoot, "prebuilds", `${process.platform}-${process.arch}`, "spawn-helper"),
  ];

  for (const helperPath of helperCandidates) {
    try {
      const helperStat = await stat(helperPath);
      const hasAnyExecuteBit = (helperStat.mode & 0o111) !== 0;
      if (!hasAnyExecuteBit) {
        await chmod(helperPath, 0o755);
      }
      return;
    } catch {
      continue;
    }
  }
}

function resolveNodePtyPackagePath(): string {
  const requireBases = [
    path.join(path.dirname(process.execPath), "__opsh_require__.cjs"),
    path.join(process.cwd(), "__opsh_require__.cjs"),
  ];

  for (const base of requireBases) {
    try {
      const require = createRequire(base);
      return require.resolve("node-pty/package.json");
    } catch {
      continue;
    }
  }

  throw new Error("Could not resolve node-pty from either the binary directory or the current working directory.");
}
