# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Local MCP server for Abstract Global Wallet (AGW) session-key workflows. Enables agent-accessible wallet actions via scoped session keys without custodial signing. Uses `@modelcontextprotocol/sdk` for the MCP protocol and `@abstract-foundation/agw-client` for the AGW SDK.

**Current state**: All tools (read, sign, send, write, swap, deploy, revoke) are implemented with policy-enforced execution via AGW session client.

**Package**: Published as `@abstract-foundation/agw-mcp` on npm. Uses pnpm and tsdown (rolldown-based bundler).

## Commands

```bash
pnpm build             # tsdown -> dist/
pnpm dev               # tsx src/index.ts (dev mode)
pnpm test              # jest (all tests in test/)
pnpm check-types       # tsc --noEmit
pnpm lint              # eslint src companion test --ext .ts
pnpm prettier          # prettier --write "src/**/*.ts"
```

Run a single test:

```bash
pnpm jest test/policy-validate.test.ts
```

Bootstrap + serve:

```bash
node dist/index.mjs init --chain-id 11124
node dist/index.mjs serve --chain-id 11124
```

## Reference Docs

Design and planning docs in `meta/`:

- `meta/product.md` — product overview
- `meta/prd.md` — product requirements
- `meta/decisions.md` — architectural decision log
- `meta/test-strategy.md` — testing approach
- `meta/agw-protocol-reference.md` — AGW protocol reference
- `meta/agw-session-key-best-practices.md` — session key best practices
- `meta/user-flows.md` — user flow diagrams

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
