export interface CommandInspection {
  raw: string;
  hasPipe: boolean;
  hasRedirect: boolean;
  hasConditional: boolean;
  hasSubshell: boolean;
  hasCommandSubstitution: boolean;
  matches: string[];
}

export function inspectCommand(command: string): CommandInspection {
  const normalized = command.trim();
  const matches: string[] = [];

  const hasPipe = /(^|[^|])\|([^|]|$)/.test(normalized);
  const hasRedirect = /(^|[^0-9])(>>?|<<?)/.test(normalized);
  const hasConditional = /&&|\|\|/.test(normalized);
  const hasCommandSubstitution = /\$\(|`[^`]*`/.test(normalized);
  const hasSubshell = /(^|[;&])\s*\(/.test(normalized) || hasCommandSubstitution;

  if (/\brm\b/.test(normalized)) {
    matches.push("rm");
  }
  if (/\bmv\b/.test(normalized)) {
    matches.push("mv");
  }
  if (/\bchmod\b/.test(normalized)) {
    matches.push("chmod");
  }
  if (/\bchown\b/.test(normalized)) {
    matches.push("chown");
  }
  if (/\bsudo\b/.test(normalized)) {
    matches.push("sudo");
  }
  if (/\bgit\s+reset\s+--hard\b/.test(normalized)) {
    matches.push("git-hard-reset");
  }
  if (/\b(?:brew|apt|apt-get|yum|dnf|pacman|apk)\s+install\b/.test(normalized)) {
    matches.push("install");
  }
  if (/\b(?:curl|wget)\b[^|\n]*\|\s*(?:sh|bash|zsh)\b/.test(normalized)) {
    matches.push("network-pipe-to-shell");
  }
  if (hasPipe) {
    matches.push("pipe");
  }
  if (hasRedirect) {
    matches.push("redirect");
  }
  if (hasConditional) {
    matches.push("conditional");
  }
  if (hasSubshell) {
    matches.push("subshell");
  }
  if (hasCommandSubstitution) {
    matches.push("command-substitution");
  }

  return {
    raw: normalized,
    hasPipe,
    hasRedirect,
    hasConditional,
    hasSubshell,
    hasCommandSubstitution,
    matches,
  };
}
