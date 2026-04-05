import { execFileSync } from "node:child_process";
import { appendFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PACKAGES_DIR = "packages";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function getPublicPackages() {
  return readdirSync(PACKAGES_DIR)
    .map((entry) => join(PACKAGES_DIR, entry, "package.json"))
    .map((path) => ({ path, packageJson: readJson(path) }))
    .filter(({ packageJson }) => !packageJson.private)
    .map(({ path, packageJson }) => ({
      name: packageJson.name,
      version: packageJson.version,
      path,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getPublishedVersion(packageName) {
  try {
    const output = execFileSync(
      "npm",
      ["view", packageName, "version", "--json"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    ).trim();

    if (!output) {
      return "";
    }

    const parsed = JSON.parse(output);
    if (Array.isArray(parsed)) {
      return String(parsed.at(-1) ?? "");
    }

    return String(parsed);
  } catch (error) {
    const stderr =
      error instanceof Error && "stderr" in error
        ? String(error.stderr ?? "")
        : "";
    if (stderr.includes("E404")) {
      return "";
    }
    throw error;
  }
}

function toMultilineOutput(key, value) {
  return `${key}<<EOF\n${value}\nEOF\n`;
}

const packages = getPublicPackages();
const releases = packages.map((pkg) => {
  const publishedVersion = getPublishedVersion(pkg.name);
  const shouldPublish = publishedVersion !== pkg.version;

  return {
    ...pkg,
    publishedVersion,
    shouldPublish,
  };
});

const changedPackages = releases.filter((pkg) => pkg.shouldPublish);
const shouldPublish = changedPackages.length > 0;
const summaryLines = [
  "## Publish detection",
  "",
  "| Package | Local | Published | Publish |",
  "| --- | --- | --- | --- |",
  ...releases.map((pkg) => {
    const publishedVersion = pkg.publishedVersion || "unpublished";
    const publishState = pkg.shouldPublish ? "yes" : "no";
    return `| \`${pkg.name}\` | \`${pkg.version}\` | \`${publishedVersion}\` | ${publishState} |`;
  }),
];
const summaryMarkdown = summaryLines.join("\n");

if (process.env.GITHUB_OUTPUT) {
  process.stdout.write(`${summaryMarkdown}\n`);
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `should_publish=${shouldPublish}`,
      `packages_json=${JSON.stringify(changedPackages)}`,
      toMultilineOutput("summary_markdown", summaryMarkdown),
    ].join("\n"),
  );
} else {
  process.stdout.write(
    `${JSON.stringify(
      {
        should_publish: shouldPublish,
        packages_json: changedPackages,
        summary_markdown: summaryMarkdown,
      },
      null,
      2,
    )}\n`,
  );
}

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summaryMarkdown}\n`);
}
