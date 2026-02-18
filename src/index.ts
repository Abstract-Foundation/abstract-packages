#!/usr/bin/env node

import { Command } from "commander";
import { runBootstrapFlow } from "./auth/bootstrap.js";
import { AgwMcpServer } from "./server/mcp-server.js";
import { SessionManager } from "./session/manager.js";
import { Logger } from "./utils/logger.js";

const logger = new Logger("agw-mcp");

const program = new Command();
program.name("agw-mcp").description("Local MCP server for AGW session-key workflows").version("0.1.0");

program
  .command("init")
  .description("Bootstrap local AGW MCP session storage")
  .option("--chain-id <chainId>", "EVM chain id", "11124")
  .option("--storage-dir <dir>", "Session storage directory")
  .action(async options => {
    const chainId = Number.parseInt(options.chainId, 10);
    if (!Number.isFinite(chainId) || chainId <= 0) {
      throw new Error("Invalid --chain-id");
    }

    const session = await runBootstrapFlow(logger, { chainId });
    const manager = new SessionManager(logger, { chainId, storageDir: options.storageDir });
    manager.setSession(session);
    logger.info("Session saved. You can now run `agw-mcp serve`.");
  });

program
  .command("serve")
  .description("Run the local stdio MCP server")
  .option("--chain-id <chainId>", "EVM chain id", "11124")
  .option("--storage-dir <dir>", "Session storage directory")
  .action(async options => {
    const chainId = Number.parseInt(options.chainId, 10);
    if (!Number.isFinite(chainId) || chainId <= 0) {
      throw new Error("Invalid --chain-id");
    }

    const server = new AgwMcpServer({ chainId, storageDir: options.storageDir });
    await server.start();
  });

if (process.argv.length <= 2) {
  program.parse(["node", "agw-mcp", "serve"]);
} else {
  program.parse(process.argv);
}
