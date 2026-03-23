# AGW Extensions

This directory contains packaging assets for agent hosts that can load AGW as a native capability.

## Included Targets

- `claude-code/`: Claude Code MCP config scaffold
- `gemini/`: Gemini extension guidance

Both surfaces assume the `agw-cli` binary is installed and available on `PATH`.

## Contract

- AGW remains JSON-first. Use `agw-cli schema <commandId>` when the request shape is unclear.
- Runtime config comes from `AGW_*` env vars or CLI flags, not from JSON payload fields.
- Output precedence is `--output`, then payload `output`, then `AGW_OUTPUT`, then command defaults.
- Mutating commands support `--dry-run` and `--execute`.
- Pagination-aware reads support `--page-all` and NDJSON page envelopes.
- Sanitization profiles are `off` and `strict`. Extension and MCP surfaces default to `strict`.

## Recommended Setup

Generate a config snippet from the CLI when possible:

```bash
agw-cli mcp-config
agw-cli mcp-config --npx
```

Keep the extension host focused on the MCP surface:

```bash
agw-cli mcp serve --sanitize strict
```

## Agent-Friendly Onboarding

Ship setup instructions that an LLM can follow directly:

- `../../docs/guide/installation.md`: canonical install, MCP wiring, AGW auth bootstrap, and verification flow for AI agents
