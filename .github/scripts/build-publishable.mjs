import { execFileSync } from "node:child_process";

function parsePackagesJson(raw) {
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("PACKAGES_JSON must be a JSON array");
  }

  return parsed
    .map((entry) => entry?.name)
    .filter((name) => typeof name === "string");
}

const packageNames = [...new Set(parsePackagesJson(process.env.PACKAGES_JSON))];

if (packageNames.length === 0) {
  process.stdout.write("No publishable packages detected; skipping build.\n");
  process.exit(0);
}

const args = [
  "turbo",
  "run",
  "build",
  ...packageNames.flatMap((name) => [`--filter=${name}`]),
];

process.stdout.write(
  `Building publishable packages: ${packageNames.join(", ")}\n`,
);
execFileSync("pnpm", args, { stdio: "inherit" });
