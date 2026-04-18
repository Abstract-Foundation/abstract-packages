import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PACKAGE_COMMANDS = {
  "@abstract-foundation/mpp": [["build"]],
  "@abstract-foundation/agw-client": [["build"], ["test:build"]],
  "@abstract-foundation/agw-react": [["build"], ["test:build"]],
  "@abstract-foundation/agw-thirdweb": [["build"], ["test:build"]],
  "@abstract-foundation/agw-web": [["build"], ["test:build"]],
  "@abstract-foundation/web3-react-agw": [["build"], ["test:build"]],
  "@abstract-foundation/agw-cli": [["build"], ["pack"]],
};

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function buildPackage(packageName) {
  run("pnpm", ["turbo", "run", "build", `--filter=${packageName}`]);
}

function getRequestedPackages() {
  const packageFlagIndex = process.argv.indexOf("--package");
  if (packageFlagIndex === -1) {
    return Object.keys(PACKAGE_COMMANDS);
  }

  const packageName = process.argv[packageFlagIndex + 1];
  if (!packageName || !(packageName in PACKAGE_COMMANDS)) {
    const known = Object.keys(PACKAGE_COMMANDS).join(", ");
    throw new Error(
      `Unknown or missing package name. Expected one of: ${known}`,
    );
  }

  return [packageName];
}

for (const packageName of getRequestedPackages()) {
  for (const commandArgs of PACKAGE_COMMANDS[packageName]) {
    if (commandArgs[0] === "pack") {
      buildPackage(packageName);
      const packDir = mkdtempSync(join(tmpdir(), "release-surface-"));
      run("pnpm", [
        "--filter",
        packageName,
        "pack",
        "--pack-destination",
        packDir,
      ]);
      continue;
    }

    if (commandArgs[0] === "build") {
      buildPackage(packageName);
      continue;
    }

    run("pnpm", ["--filter", packageName, ...commandArgs]);
  }
}
