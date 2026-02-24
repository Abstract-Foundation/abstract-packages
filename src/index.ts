#!/usr/bin/env node

import fs from "node:fs";
import { Command } from "commander";
import { runBootstrapFlow } from "./auth/bootstrap.js";
import { buildMcpConfigSnippet } from "./config/mcp-config.js";
import { resolveNetworkConfig } from "./config/index.js";
import { AgwMcpServer } from "./server/mcp-server.js";
import { SessionManager } from "./session/manager.js";
import { Logger } from "./utils/logger.js";

const logger = new Logger("agw-mcp");

function resolveCliVersion(): string {
  try {
    const packageJsonUrl = new URL("../package.json", import.meta.url);
    const packageJsonRaw = fs.readFileSync(packageJsonUrl, "utf8");
    const parsed = JSON.parse(packageJsonRaw) as { version?: unknown };
    if (typeof parsed.version === "string" && parsed.version.trim().length > 0) {
      return parsed.version.trim();
    }
  } catch {
    // Fall back to the static value if package.json is unavailable.
  }
  return "0.1.0";
}

const program = new Command();
program.name("agw-mcp").description("Read-only MCP server for Abstract wallet + chain data").version(resolveCliVersion());

program
  .command("init")
  .description("Link a wallet for read-only local AGW MCP context")
  .option("--chain-id <chainId>", "EVM chain id (env: AGW_MCP_CHAIN_ID)")
  .option("--rpc-url <rpcUrl>", "RPC URL override (env: AGW_MCP_RPC_URL)")
  .option("--app-url <url>", "Hosted onboarding URL (defaults to https://mcp.abs.xyz; env: AGW_MCP_APP_URL)")
  .option("--storage-dir <dir>", "Session storage directory")
  .action(async options => {
    const networkConfig = resolveNetworkConfig({
      chainId: options.chainId,
      rpcUrl: options.rpcUrl,
    });

    logger.info(`Using network ${networkConfig.chain.name} (${networkConfig.chainId}) with RPC ${networkConfig.rpcUrl}`);
    const session = await runBootstrapFlow(logger, {
      chainId: networkConfig.chainId,
      rpcUrl: networkConfig.rpcUrl,
      appUrl: options.appUrl,
      storageDir: options.storageDir,
    });
    const manager = new SessionManager(logger, {
      chainId: networkConfig.chainId,
      rpcUrl: networkConfig.rpcUrl,
      storageDir: options.storageDir,
    });
    manager.setSession(session);
    logger.info("Wallet linked for read-only MCP usage. You can now run `agw-mcp serve`.");
  });

program
  .command("config")
  .description("Print a ready-to-paste local MCP config snippet")
  .option("--name <name>", "MCP server name override", "agw-mcp")
  .option("--npx", "Output npx-based config for published package")
  .option("--chain-id <chainId>", "Chain id to include in config args")
  .action(options => {
    const snippet = buildMcpConfigSnippet({
      serverName: options.name,
      npx: options.npx,
      chainId: options.chainId,
    });
    process.stdout.write(`${JSON.stringify(snippet, null, 2)}\n`);
  });

program
  .command("serve")
  .description("Run the local stdio read-only MCP server")
  .option("--chain-id <chainId>", "EVM chain id (env: AGW_MCP_CHAIN_ID)")
  .option("--rpc-url <rpcUrl>", "RPC URL override (env: AGW_MCP_RPC_URL)")
  .option("--storage-dir <dir>", "Session storage directory")
  .action(async options => {
    const networkConfig = resolveNetworkConfig({
      chainId: options.chainId,
      rpcUrl: options.rpcUrl,
    });

    logger.info(`Using network ${networkConfig.chain.name} (${networkConfig.chainId}) with RPC ${networkConfig.rpcUrl}`);
    const server = new AgwMcpServer({
      chainId: networkConfig.chainId,
      rpcUrl: networkConfig.rpcUrl,
      storageDir: options.storageDir,
    });
    await server.start();
  });

if (process.argv.length <= 2) {
  program.parse(["node", "agw-mcp", "serve"]);
} else {
  program.parse(process.argv);
}
