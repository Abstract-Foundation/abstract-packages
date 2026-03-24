#!/usr/bin/env node

import { Command } from "commander";
import {
  AgwCliError,
  buildSchemaGetResult,
  buildSchemaListResult,
  commandRegistry,
  normalizeAgwError,
  toErrorEnvelope,
  type AgwCommandDefinition,
} from "../../agw-core/src/index.js";
import { buildMcpConfigSnippet } from "./config/mcp-config.js";
import { serveGeneratedMcp } from "./mcp-server.js";
import { executeCommand, formatCommandOutput, parseJsonInput } from "./runtime.js";

function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function writeError(error: unknown): void {
  const normalized = normalizeAgwError(error);
  const envelope = toErrorEnvelope(normalized);
  process.stderr.write(`${JSON.stringify(envelope, null, 2)}\n`);

  if (normalized instanceof AgwCliError) {
    process.exitCode = normalized.exitCode;
  } else {
    process.exitCode = 1;
  }
}

function registerCommands(parent: Command, definitions: AgwCommandDefinition[]): void {
  for (const definition of definitions) {
    if (definition.id === "schema") {
      continue;
    }

    const segment = definition.path[definition.path.length - 1];
    const command = parent.command(segment).description(definition.description);

    if (definition.children?.length) {
      registerCommands(command, definition.children);
      continue;
    }

    if (definition.id === "mcp.serve") {
      command
        .option("--json <payload>", "Inline JSON payload or @path-to-json-file", "{}")
        .option("--sanitize <profile>", "Sanitize MCP responses: off or strict")
        .option("--home <dir>", "AGW home directory override")
        .option("--chain-id <chainId>", "Chain id override for runtime configuration")
        .option("--rpc-url <url>", "RPC URL override for runtime configuration")
        .option("--app-url <url>", "Companion app URL override for runtime configuration")
        .action(async (options: {
          json: string;
          sanitize?: "off" | "strict";
          home?: string;
          chainId?: string;
          rpcUrl?: string;
          appUrl?: string;
        }) => {
          const input = parseJsonInput(options.json, { cwd: process.cwd() });
          const services =
            Array.isArray(input.services) && input.services.every((entry: unknown) => typeof entry === "string")
              ? input.services
              : undefined;
          await serveGeneratedMcp({
            services,
            runtime: {
              appUrl: options.appUrl,
              chainId: options.chainId ? Number.parseInt(options.chainId, 10) : undefined,
              homeDir: options.home,
              rpcUrl: options.rpcUrl,
              sanitizeProfile: options.sanitize,
              source: "mcp",
            },
          });
        });
      continue;
    }

    command.option("--json <payload>", "Inline JSON payload or @path-to-json-file", "{}");
    if (definition.cli?.supportedFlags.some(flag => flag.name === "--output")) {
      command.option("--output <mode>", "Output mode override: json or ndjson");
    }
    if (definition.cli?.supportedFlags.some(flag => flag.name === "--dry-run")) {
      command.option("--dry-run", "Validate and preview without executing mutations");
    }
    if (definition.cli?.supportedFlags.some(flag => flag.name === "--execute")) {
      command.option("--execute", "Execute a mutating command");
    }
    if (definition.cli?.supportedFlags.some(flag => flag.name === "--sanitize")) {
      command.option("--sanitize <profile>", "Sanitize agent-facing response content: off or strict");
    }
    if (definition.cli?.supportedFlags.some(flag => flag.name === "--page-all")) {
      command.option("--page-all", "Fetch all pages for pagination-aware commands");
    }
    if (definition.cli?.supportedFlags.some(flag => flag.name === "--home")) {
      command.option("--home <dir>", "AGW home directory override");
    }
    if (definition.cli?.supportedFlags.some(flag => flag.name === "--chain-id")) {
      command.option("--chain-id <chainId>", "Chain id override for runtime configuration");
    }
    if (definition.cli?.supportedFlags.some(flag => flag.name === "--rpc-url")) {
      command.option("--rpc-url <url>", "RPC URL override for runtime configuration");
    }
    if (definition.cli?.supportedFlags.some(flag => flag.name === "--app-url")) {
      command.option("--app-url <url>", "Companion app URL override for runtime configuration");
    }

    command.action(async (options: {
      json: string;
      output?: "json" | "ndjson";
      dryRun?: boolean;
      execute?: boolean;
      sanitize?: "off" | "strict";
      pageAll?: boolean;
      home?: string;
      chainId?: string;
      rpcUrl?: string;
      appUrl?: string;
    }) => {
        const input = parseJsonInput(options.json, { cwd: process.cwd() });
        const { result, outputMode } = await executeCommand(definition.id, input, {
          appUrl: options.appUrl,
          chainId: options.chainId ? Number.parseInt(options.chainId, 10) : undefined,
          dryRun: options.dryRun,
          execute: options.execute,
          homeDir: options.home,
          outputMode: options.output,
          pageAll: options.pageAll,
          rpcUrl: options.rpcUrl,
          sanitizeProfile: options.sanitize,
          source: "cli",
          stdoutIsTTY: process.stdout.isTTY,
        });
        process.stdout.write(formatCommandOutput(result, outputMode));
      });
  }
}

async function main(): Promise<void> {
  const program = new Command();
  program
    .name("agw-cli")
    .description("Agent-first CLI for Abstract Global Wallet workflows.")
    .version("0.1.5")
    .showHelpAfterError();

  program
    .command("mcp-config")
    .description("Print a ready-to-paste MCP config snippet for the agw-cli binary.")
    .option("--name <name>", "MCP server name override", "agw-cli")
    .option("--npx", "Output npx-based config for the published package")
    .option("--chain-id <chainId>", "Chain id to include in generated args")
    .action((options: { name: string; npx?: boolean; chainId?: string }) => {
      writeJson(
        buildMcpConfigSnippet({
          serverName: options.name,
          npx: options.npx,
          chainId: options.chainId,
        }),
      );
    });

  program
    .command("schema [commandId]")
    .description("Print machine-readable command metadata from the shared AGW registry.")
    .action((commandId?: string) => {
      if (!commandId) {
        writeJson(buildSchemaListResult());
        return;
      }

      writeJson({
        command: buildSchemaGetResult(commandId),
      });
    });

  registerCommands(program, commandRegistry);

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    writeError(error);
    return;
  }
}

void main();
