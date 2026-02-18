# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Local MCP server for Abstract Global Wallet (AGW) session-key workflows. Enables agent-accessible wallet actions via scoped session keys without custodial signing. Uses `@modelcontextprotocol/sdk` for the MCP protocol and `@abstract-foundation/agw-client` for the AGW SDK.

**Current state**: Read/status tools are wired. Write tools (sign, send, write-contract) are scaffolded with policy gates but not yet connected to AGW SDK execution.

## Commands

```bash
npm run build          # tsup -> dist/
npm run dev            # tsx src/index.ts (dev mode)
npm test               # jest (all tests in test/)
npm run check-types    # tsc --noEmit
npm run lint           # eslint src --ext .ts
npm run prettier       # prettier --write "src/**/*.ts"

npm run loop:dry       # dry-run one autonomous loop iteration
npm run loop:once      # execute one autonomous loop iteration
npm run loop           # run multi-iteration autonomous loop
npm run eval:nightly   # run nightly quality/eval harness
```

Run a single test:

```bash
npx jest test/policy-validate.test.ts
```

Bootstrap + serve:

```bash
node dist/index.js init --chain-id 11124
node dist/index.js serve --chain-id 11124
```

## Workflow Control Plane

Use markdown memory as source-of-truth:

- `meta/product.md`
- `meta/prd.md`
- `meta/decisions.md`
- `meta/tasks.md`
- `meta/progress.md`
- `meta/risks.md`
- `meta/test-strategy.md`
- `meta/loop-config.yaml`

Prompt templates for loop agents:

- `meta/prompts/planner.md`
- `meta/prompts/builder.md`
- `meta/prompts/reviewer.md`

## Architecture

### Request Flow

CLI (`src/index.ts`) -> `AgwMcpServer` (`src/server/mcp-server.ts`) -> stdio transport -> tool dispatch via registry (`src/tools/index.ts`) -> individual tool handler

Each tool handler receives a `ToolContext` containing `SessionManager` and a child `Logger`. Write tools validate against policies before execution.

### Module Boundaries

- **`src/server/`** — MCP server setup and request routing. Single class `AgwMcpServer` wires `ListTools` and `CallTool` handlers.
- **`src/tools/`** — Tool registry and handlers. Each tool is a `ToolHandler` object (name, description, inputSchema, handler function). Registry is a flat array with `getTool()` lookup.
- **`src/session/`** — Session lifecycle. `SessionManager` holds in-memory session + delegates persistence to `SessionStorage`. Storage is file-based at `~/.agw-mcp/session.json` with `0o600` permissions.
- **`src/policies/`** — Default-deny policy validation. `canCallAddress`, `canCallTargetWithData`, `canTransferNativeValue` parse session config policies and enforce call targets, function selectors, and transfer caps.
- **`src/auth/`** — Bootstrap flow for interactive session initialization.
- **`src/utils/`** — Stderr-only structured logger with child context support.

### Session Status Lifecycle

`missing` -> (init) -> `active` -> `expired` (time-based) or `revoked` (explicit)

### Security Invariants

- Default-deny: write tools fail if no matching policy exists
- Addresses are normalized to lowercase before policy comparison
- Function selectors are extracted as first 4 bytes of calldata
- Session file permissions: directory `0o700`, file `0o600`
- All logging goes to stderr only (stdout reserved for MCP stdio transport)

## Conventions

- **Files**: kebab-case. **Types/Classes**: PascalCase. **Functions/vars**: camelCase. **Constants**: SCREAMING_SNAKE_CASE.
- Double quotes, trailing commas, 100 char print width (see `.prettierrc.cjs`).
- Tools are added by creating a `ToolHandler` object in `src/tools/` and registering it in the `tools` array in `src/tools/index.ts`.
- Logger children are created via `logger.child("context")` — prefix chains like `agw-mcp:session:tools`.
- Tests live in `test/` as `*.test.ts`. Jest with ts-jest preset.
