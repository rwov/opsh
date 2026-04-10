import os from "node:os";

export function getHomeDir(): string {
  return os.homedir();
}

export function isSupportedPlatform(platform: NodeJS.Platform = process.platform): platform is "darwin" | "linux" {
  return platform === "darwin" || platform === "linux";
}

export function assertSupportedPlatform(platform: NodeJS.Platform = process.platform): void {
  if (!isSupportedPlatform(platform)) {
    throw new Error("opsh supports macOS and Linux only.");
  }
}

export function getEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}
