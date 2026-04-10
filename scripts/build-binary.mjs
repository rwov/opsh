import { build } from "esbuild";
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "build", "bin", `${process.platform}-${process.arch}`);
const workDir = resolve(root, "build", ".sea");
const bundlePath = resolve(workDir, "opsh-bundle.cjs");
const seaConfigPath = resolve(workDir, "sea-config.json");
const seaBlobPath = resolve(workDir, "opsh.blob");
const binaryPath = resolve(outDir, process.platform === "win32" ? "opsh.exe" : "opsh");
const sourceEntry = resolve(root, "src", "bin", "opsh.ts");
const nodePtyDir = resolve(root, "node_modules", "node-pty");
const seaResource = getSeaResourceConfig(process.versions.node);

rmSync(workDir, { recursive: true, force: true });
rmSync(outDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [sourceEntry],
  outfile: bundlePath,
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  external: ["node-pty"],
  banner: {
    js: "const { createRequire } = require('node:module'); require = createRequire(__filename);",
  },
});

writeFileSync(
  seaConfigPath,
  JSON.stringify(
    {
      main: bundlePath,
      output: seaBlobPath,
      disableExperimentalSEAWarning: true,
    },
    null,
    2,
  ),
);

execFileSync(process.execPath, ["--experimental-sea-config", seaConfigPath], {
  cwd: root,
  stdio: "inherit",
});

if (process.platform === "darwin" && isUniversalMachO(process.execPath)) {
  execFileSync("lipo", ["-thin", process.arch, process.execPath, "-output", binaryPath], {
    stdio: "inherit",
  });
} else {
  copyFileSync(process.execPath, binaryPath);
}

if (process.platform === "darwin") {
  execFileSync("codesign", ["--remove-signature", binaryPath], { stdio: "ignore" });
}

const postjectCliPath = resolve(root, "node_modules", "postject", "dist", "cli.js");
const postjectArgs = [
  postjectCliPath,
  binaryPath,
  seaResource.resourceName,
  seaBlobPath,
  "--sentinel-fuse",
  seaResource.sentinelFuse,
];

if (process.platform === "darwin") {
  postjectArgs.push("--macho-segment-name", seaResource.segmentName);
}

execFileSync(process.execPath, postjectArgs, {
  cwd: root,
  stdio: "inherit",
});

if (process.platform === "darwin") {
  execFileSync("codesign", ["--sign", "-", binaryPath], { stdio: "inherit" });
}

if (!existsSync(nodePtyDir)) {
  throw new Error("node-pty is not installed. Run `bun install` first.");
}

cpSync(nodePtyDir, join(outDir, "node_modules", "node-pty"), {
  recursive: true,
});

writeFileSync(
  join(outDir, "README.txt"),
  [
    "opsh binary bundle",
    "",
    "Run the binary from this directory so it can resolve node-pty.",
    "",
    "Examples:",
    "  ./opsh --print-only \"list hidden files\"",
    "  ./opsh --init",
  ].join("\n"),
);

console.log(`Built binary bundle at ${outDir}`);

function getSeaResourceConfig(nodeVersion) {
  const [major, minor] = nodeVersion.split(".").map((value) => Number.parseInt(value, 10));
  const useModernSea = major > 20 || (major === 20 && minor >= 5);

  return useModernSea
    ? {
        resourceName: "NODE_SEA_BLOB",
        sentinelFuse: "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
        segmentName: "NODE_SEA",
      }
    : {
        resourceName: "NODE_JS_CODE",
        sentinelFuse: "NODE_JS_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
        segmentName: "NODE_JS",
      };
}

function isUniversalMachO(binaryPath) {
  if (process.platform !== "darwin") {
    return false;
  }

  try {
    const output = execFileSync("file", [binaryPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.includes("universal binary");
  } catch {
    return false;
  }
}
