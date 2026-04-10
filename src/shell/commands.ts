import { readdir } from "node:fs/promises";
import path from "node:path";
import type { SupportedShellName } from "../config/types.js";

export interface AvailableCommandRegistry {
  commands: Set<string>;
  has(name: string): boolean;
}

export async function loadAvailableCommands(shellName: SupportedShellName): Promise<AvailableCommandRegistry> {
  const commands = new Set<string>();

  for (const command of await loadCommandsFromPath()) {
    commands.add(command);
  }

  for (const builtin of await loadShellBuiltins(shellName)) {
    commands.add(builtin);
  }

  for (const builtin of ["cd", "echo", "pwd", "test", "[", "true", "false", "export"]) {
    commands.add(builtin);
  }

  return {
    commands,
    has(name: string) {
      return commands.has(name);
    },
  };
}

async function loadCommandsFromPath(): Promise<string[]> {
  const pathValue = process.env.PATH ?? "";
  const dirs = pathValue.split(path.delimiter).filter(Boolean);
  const names = new Set<string>();

  for (const dir of dirs) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() || entry.isSymbolicLink()) {
          names.add(entry.name);
        }
      }
    } catch {
      continue;
    }
  }

  return [...names];
}

async function loadShellBuiltins(shellName: SupportedShellName): Promise<string[]> {
  if (shellName === "bash") {
    return [
      "alias",
      "bg",
      "bind",
      "break",
      "builtin",
      "caller",
      "cd",
      "command",
      "compgen",
      "complete",
      "continue",
      "declare",
      "dirs",
      "disown",
      "echo",
      "enable",
      "eval",
      "exec",
      "exit",
      "export",
      "fc",
      "fg",
      "getopts",
      "hash",
      "help",
      "history",
      "jobs",
      "kill",
      "let",
      "local",
      "logout",
      "popd",
      "printf",
      "pushd",
      "pwd",
      "read",
      "readonly",
      "return",
      "set",
      "shift",
      "shopt",
      "source",
      "suspend",
      "test",
      "times",
      "trap",
      "type",
      "typeset",
      "ulimit",
      "umask",
      "unalias",
      "unset",
      "wait",
    ];
  }

  return [
    ".",
    ":",
    "[",
    "alias",
    "autoload",
    "bg",
    "bindkey",
    "break",
    "builtin",
    "bye",
    "cd",
    "command",
    "dirs",
    "disable",
    "disown",
    "echo",
    "emulate",
    "enable",
    "eval",
    "exec",
    "exit",
    "export",
    "false",
    "fc",
    "fg",
    "functions",
    "getln",
    "hash",
    "history",
    "jobs",
    "kill",
    "let",
    "local",
    "log",
    "logout",
    "popd",
    "print",
    "printf",
    "pushd",
    "pwd",
    "read",
    "readonly",
    "rehash",
    "return",
    "set",
    "setopt",
    "shift",
    "source",
    "suspend",
    "test",
    "times",
    "trap",
    "true",
    "type",
    "typeset",
    "ulimit",
    "umask",
    "unalias",
    "unfunction",
    "unhash",
    "unset",
    "unsetopt",
    "wait",
    "whence",
    "where",
    "which",
  ];
}
