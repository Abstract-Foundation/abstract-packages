# Loop Progress Log

## 2026-02-18T00:00:00Z - Bootstrap
- Initialized autonomous workflow system with markdown memory and task table.
- Added orchestrator scripts and nightly evaluation harness.
- Next target task: `AGW-001`.

## 2026-02-18T09:43:45.802Z - Task start AGW-001
- Wire AGW session client factory

## 2026-02-18T09:43:45.803Z - Task dry-run AGW-001
- Dry run mode, skipping Codex and quality gates.

## 2026-02-18T09:48:11.375Z - Task start AGW-001
- Wire AGW session client factory

## 2026-02-18T09:48:11.376Z - Task dry-run AGW-001
- Dry run mode, skipping Codex and quality gates.

## 2026-02-18T10:00:00Z - Product scope lock
- Locked v1 primary user as AGW end users.
- Locked core wallet patterns and tool surface (read/sign/send/transfer/swap/write/revoke).
- Locked swap provider to 0x.
- Locked transaction semantics: `sign_transaction` signs only; `send_transaction` broadcasts.

## 2026-02-18T10:25:00Z - Product owner planning pass
- Documented final autonomy and architecture decisions (including never-stop and direct-to-main policies).
- Added reliability SLO specification (`meta/slo.md`).
- Added user-flow source-of-truth (`meta/user-flows.md`).
- Added canonical machine state index (`meta/state.json`) for markdown+json memory model.
- Rewrote backlog as prioritized product-owner roadmap with 24 tasks across M0-M5.

## 2026-02-18T10:16:42.133Z - Task start AGW-001
- [P0][M1] Wire AGW session client factory

## 2026-02-18T10:16:42.134Z - Task dry-run AGW-001
- Dry run mode, skipping Codex and quality gates.

## 2026-02-18T10:18:50.193Z - Task start AGW-001
- [P0][M1] Wire AGW session client factory

## 2026-02-18T10:18:50.194Z - Task dry-run AGW-001
- Dry run mode, skipping Codex and quality gates.

## 2026-02-18T10:21:53.327Z - Task start AGW-001
- [P0][M1] Wire AGW session client factory

## 2026-02-18T10:21:53.327Z - Task dry-run AGW-001
- Dry run mode, skipping Codex and quality gates.

## 2026-02-18T10:24:27.694Z - Task start AGW-001
- [P0][M1] Wire AGW session client factory

## 2026-02-18T10:24:27.751Z - Task codex failed AGW-001
- Command: codex exec --model "gpt-5.3-high" --sandbox danger-full-access --cd "/home/jarrod/agw-mcp" --prompt-file "/tmp/agw-mcp-loop/AGW-001-1771410267695.md"
- Error: Command failed: codex exec --model "gpt-5.3-high" --sandbox danger-full-access --cd "/home/jarrod/agw-mcp" --prompt-file "/tmp/agw-mcp-loop/AGW-001-1771410267695.md"

## 2026-02-18T10:26:54.812Z - Task start AGW-002
- [P0][M1] Add network config layer (testnet default, mainnet configurable)

## 2026-02-18T10:26:54.812Z - Task dry-run AGW-002
- Dry run mode, skipping Codex and quality gates.

## 2026-02-18T10:35:45.260Z - Task start AGW-002
- [P0][M1] Add network config layer (testnet default, mainnet configurable)

## 2026-02-18T10:35:45.784Z - Task codex failed AGW-002
- Command: codex exec --model "gpt-5.3-high" --sandbox danger-full-access --cd "/home/jarrod/agw-mcp" 'You are the implementation agent for AGW MCP working in autonomous loop mode.

You must:
1. Read context from `meta/product.md`, `meta/prd.md`, `meta/decisions.md`, `meta/tasks.md`, `meta/test-strategy.md`, and relevant source files.
2. Execute exactly one assigned task.
3. Follow TDD: define or update tests for acceptance criteria before implementation changes where feasible.
4. Keep changes minimal and scoped to task acceptance criteria.
5. Run required quality gate command and report command outputs.
6. Update docs if behavior changes.

Do not:
- Expand scope beyond task objective.
- Skip policy or security checks on state-changing features.
- Leave temporary TODOs without recording them in `meta/progress.md`.


## Assigned Task
- task_id: AGW-002
- objective: [P0][M1] Add network config layer (testnet default, mainnet configurable)
- scope_in: chain config resolution and env support
- scope_out: auto mainnet rollout
- files: `src/config/*`, `src/index.ts`
- tests_required: config unit tests
- acceptance: chain+rpc selection works without code edits

## Required Memory Files
- meta/product.md
- meta/prd.md
- meta/decisions.md
- meta/tasks.md
- meta/test-strategy.md
- meta/risks.md
- meta/progress.md'
- Error: Command failed: codex exec --model "gpt-5.3-high" --sandbox danger-full-access --cd "/home/jarrod/agw-mcp" 'You are the implementation agent for AGW MCP working in autonomous loop mode.

You must:
1. Read context from `meta/product.md`, `meta/prd.md`, `meta/decisions.md`, `meta/tasks.md`, `meta/test-strategy.md`, and relevant source files.
2. Execute exactly one assigned task.
3. Follow TDD: define or update tests for acceptance criteria before implementation changes where feasible.
4. Keep changes minimal and scoped to task acceptance criteria.
5. Run required quality gate command and report command outputs.
6. Update docs if behavior changes.

Do not:
- Expand scope beyond task objective.
- Skip policy or security checks on state-changing features.
- Leave temporary TODOs without recording them in `meta/progress.md`.


## Assigned Task
- task_id: AGW-002
- objective: [P0][M1] Add network config layer (testnet default, mainnet configurable)
- scope_in: chain config resolution and env support
- scope_out: auto mainnet rollout
- files: `src/config/*`, `src/index.ts`
- tests_required: config unit tests
- acceptance: chain+rpc selection works without code edits

## Required Memory Files
- meta/product.md
- meta/prd.md
- meta/decisions.md
- meta/tasks.md
- meta/test-strategy.md
- meta/risks.md
- meta/progress.md'

## 2026-02-18T10:43:41.348Z - Task start AGW-015
- [P0][M5] Harden secret redaction and logging

## 2026-02-18T10:47:24Z - Task done AGW-015
- Implemented secret redaction in `src/utils/logger.ts` for structured JSON fragments, key/value pairs, and 64-byte hex key patterns.
- Hardened persistence in `src/session/storage.ts` to redact `sessionSignerRef.value` before save and on load normalization.
- Added TDD coverage in `test/logger.test.ts` and `test/storage.test.ts`, including grep-style artifact leak guards for signer sentinel values.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.

## 2026-02-18T10:48:16.397Z - Task done AGW-015
- Codex execution completed and quality gates passed.

## 2026-02-18T10:48:46.260Z - Task start AGW-018
- [P1][M0] Add canonical JSON task/state sync in loop script

## 2026-02-18T10:53:20Z - Task done AGW-018
- Added canonical loop sync in `scripts/agent-loop.ts` to derive `meta/state.json` counters and `next_task` from the parsed markdown tasks table.
- Added loop sync regression coverage in `test/agent-loop-sync.test.ts` using temporary fixture repos and `--dry-run --once` loop execution.
- Updated `README.md` to document automatic state synchronization.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.

## 2026-02-18T10:54:22.750Z - Task done AGW-018
- Codex execution completed and quality gates passed.

## 2026-02-18T22:43:00Z - AGW protocol reference documented
- Added `meta/agw-protocol-reference.md` with verified AGW addresses, selectors, rights constants, and ABI file inventory.
- Included upstream source links for `agw-contracts` and `agw-sdk` constants/ABI paths.
- Linked protocol reference from `README.md` key files section.

## 2026-02-18T12:03:13.931Z - Task start AGW-001
- [P0][M1] Wire AGW session client factory

## 2026-02-18T12:08:03Z - Task done AGW-001
- Added AGW session client adapter in `src/agw/client.ts` that wraps `createSessionClient` with signer reference resolution (`raw` and `keyfile`), session config validation, and chain/rpc config input.
- Added typed persisted-session wrapper in `src/session/client.ts` and `SessionManager.createSessionClient()` in `src/session/manager.ts`.
- Added unit coverage in `test/agw-client.test.ts` for direct adapter creation, persisted-session creation with keyfile signer ref, and redacted signer rejection.
- Updated `README.md` status note to reflect session-client factory availability while write-tool execution remains scaffolded.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build` (6/6 test suites passing, lint/typecheck/build successful).

## 2026-02-18T12:09:10.437Z - Task done AGW-001
- Codex execution completed and quality gates passed.
- Commit: 33e3188

## 2026-02-18T12:09:18.959Z - Task start AGW-002
- [P0][M1] Add network config layer (testnet default, mainnet configurable)

## 2026-02-18T12:13:05Z - Task done AGW-002
- Added network config layer in `src/config/network.ts` with Abstract testnet default (`11124`), mainnet support (`2741`), and env overrides for chain/RPC (`AGW_MCP_CHAIN_ID`, `AGW_MCP_RPC_URL`; legacy aliases `AGW_CHAIN_ID`, `AGW_RPC_URL`).
- Wired CLI commands in `src/index.ts` to resolve network config without code edits and accept `--chain-id` / `--rpc-url` overrides with deterministic precedence over env.
- Added config unit coverage in `test/config.test.ts` for default resolution, mainnet/env selection, precedence rules, and invalid chain handling.
- Updated `README.md` usage examples for env-driven network selection.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.

## 2026-02-18T12:14:15.499Z - Task done AGW-002
- Codex execution completed and quality gates passed.
- Commit: ebccc42

## 2026-02-18T12:14:18.504Z - Task start AGW-003
- [P0][M1] Replace placeholder init with real session provisioning flow

## 2026-02-18T12:19:42Z - Task done AGW-003
- Replaced placeholder `init` prompts with callback/session-bundle provisioning flow in `src/auth/bootstrap.ts` using validated callback payload parsing from `src/auth/callback.ts`.
- Added secure session materialization in `src/auth/provision.ts` to persist raw signer secrets as local keyfile references (`session-signer.key`) and store reusable session bundle metadata.
- Updated persistence and client hydration paths (`src/session/storage.ts`, `src/session/client.ts`) so persisted keyfile refs remain usable and JSON `sessionConfig.expiresAt` is revived to `bigint` at runtime.
- Added/updated tests: `test/bootstrap.test.ts`, `test/storage.test.ts`, `test/agw-client.test.ts` for callback parsing, provisioning materialization, persistence usability, and rehydration behavior.
- Updated `README.md` init docs for callback payload import flow.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.

## 2026-02-18T12:21:49.654Z - Task done AGW-003
- Codex execution completed and quality gates passed.
- Commit: 1b3d85c

## 2026-02-18T12:21:53.658Z - Task start AGW-025
- [P0][M1] Create companion app scaffold for AGW session bootstrap

## 2026-02-18T23:20:00Z - Task done AGW-025
- Added local companion app scaffold (`companion/`) with server entrypoint, static shell, and `/auth/start` redirect route.
- Added companion auth URL helper for AGW login bootstrap params (`redirect_uri`, `chain_id`, `state`, `source`).
- Added scaffold smoke coverage in `test/companion-scaffold.test.ts`.
- Updated `README.md` and `package.json` with companion run instructions (`npm run companion:dev`).
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.

## 2026-02-18T23:35:00Z - Task done AGW-041
- Hardened loop runtime in `scripts/agent-loop.ts`:
  - stale lock recovery + active lock wait
  - codex retry/backoff
  - quality-gate retry/backoff
  - non-exiting idle behavior for unattended runs
- Added lock recovery coverage in `test/agent-loop-locking.test.ts`.
- Updated loop tuning in `meta/loop-config.yaml` for unattended operation.

## 2026-02-18T23:36:00Z - Task done AGW-042
- Expanded lint gate coverage in `package.json` to include `src`, `companion`, `scripts`, and `test`.
- Added resilient overnight wrapper script: `scripts/run-overnight.sh` (+ `npm run loop:overnight`).
- Updated `README.md`, `meta/decisions.md`, `meta/risks.md`, and session-key best-practices reference.
- Expanded backlog with AGW session-key/action parity tasks (`AGW-029` to `AGW-040`) for overnight execution depth.

## 2026-02-18T12:27:24.158Z - Task done AGW-025
- Codex execution completed and quality gates passed.
- Commit: d25c77e

## 2026-02-18T12:35:10.102Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T12:35:10.103Z - Task dry-run AGW-026
- Dry run mode, skipping Codex and quality gates.

## 2026-02-18T12:44:22.904Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T12:46:53.423Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T12:52:59Z - Task done AGW-026
- Added companion session policy preset module in `companion/src/policies/*` with safe preset templates (`read_and_sign`, `limited_spend`), custom mode parsing, and strict validation for expiry, addresses, selectors, and numeric limits.
- Wired companion server policy routes in `companion/src/server.ts`:
  - `GET /policy/presets` returns preset metadata and default custom template.
  - `GET /policy/preview` returns computed policy payload or validation errors.
  - `/auth/start` now validates selected preset/custom payload before redirect.
- Updated companion UI (`companion/public/index.html`, `companion/public/app.js`, `companion/public/styles.css`) so users can pick a preset/custom mode and preview the exact policy payload before approval.
- Added preset-focused unit coverage in `test/companion-policy-presets.test.ts` and extended companion scaffold smoke checks in `test/companion-scaffold.test.ts`.
- Updated setup flow documentation in `meta/user-flows.md` to include policy preset selection and preview-before-approval.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.

## 2026-02-18T12:54:39.660Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build

## 2026-02-18T22:51:11Z - Task done AGW-026
- Verified companion session policy preset implementation in `companion/src/policies/*` and companion routes/UI (`/policy/presets`, `/policy/preview`, `/auth/start`) supports safe preset selection, custom mode validation, and preview-before-approval flow.
- Preset unit tests passed: `npm test -- --runInBand test/companion-policy-presets.test.ts` (42/42 passing).
- Companion preset flow tests passed: `npm test -- --runInBand test/companion-scaffold.test.ts` (8/8 passing).
- Mandatory quality gate passed: `npm run check-types && npm test && npm run lint && npm run build` (23 suites, 136 tests passing; lint/typecheck/build successful).

## 2026-02-18T14:26:37Z - Task done AGW-026
- Added semantic validation coverage for custom policy parsing in `test/companion-policy-presets.test.ts` (`rejects semantically invalid custom policy input during parsing`).
- Updated `parseCustomPolicyTemplate` in `companion/src/policies/index.ts` to validate parsed custom templates and reject unsafe/invalid values immediately with actionable errors.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build` (23/23 suites, 97/97 tests, lint and build successful).

## 2026-02-18T12:54:42.666Z - Task start AGW-029
- [P0][M1] Implement session policy lint engine (least-privilege defaults)

## 2026-02-18T13:00:56.932Z - Task completion failed AGW-029
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T13:00:59.937Z - Task start AGW-004
- [P0][M1] Implement on-chain session status mapping

## 2026-02-18T13:05:48Z - Task done AGW-004
- Added on-chain session status mapping in `src/session/manager.ts` via `mapOnchainSessionStatus` and `getOnchainSessionStatus()` for canonical AGW status codes (`NotInitialized`/`Active`/`Closed`/`Expired`).
- Updated `src/tools/get-session-status.ts` to return on-chain status enum + code with metadata (`source`, `localStatus`, `checkedAt`, `expiresInSeconds`).
- Added status mapping coverage in `test/session-status-mapping.test.ts` (enum mapping cases, invalid code guard, no-session fallback metadata, and tool response shape).
- Updated `README.md` to document canonical on-chain status enum output for `get_session_status`.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.

## 2026-02-18T13:06:49.607Z - Task completion failed AGW-004
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T13:06:52.611Z - Task start AGW-005
- [P0][M2] Implement `get_balances` tool

## 2026-02-18T13:12:08Z - Task done AGW-005
- Implemented `get_balances` in `src/tools/get-balances.ts` with native + optional ERC-20 read flow, deterministic normalization (`raw` + `formatted`), and chain-aware explorer references.
- Added TDD coverage in `test/get-balances.test.ts` including tool unit cases (validation, disconnected response, normalized output) and mocked integration with `SessionManager` + injected balance reader.
- Wired tool registration in `src/tools/index.ts` and documented behavior in `README.md`.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build` (14/14 suites, 57/57 tests).

## 2026-02-18T13:14:20.840Z - Task completion failed AGW-005
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T13:14:23.845Z - Task start AGW-006
- [P0][M2] Implement `get_token_list` tool

## 2026-02-18T13:18:14Z - Task done AGW-006
- Added `get_token_list` implementation in `src/tools/get-token-list.ts` using a wallet token-holdings read path (`zks_getAllAccountBalances`) with ERC-20 metadata reads (`symbol`, `decimals`) and normalized `value` output (`raw`, `formatted`).
- Wired `get_token_list` registration in `src/tools/index.ts`.
- Added TDD coverage in `test/get-token-list.test.ts` for registration, disconnected behavior, session-account validation, normalized holdings response shape, and SessionManager chain-routing behavior.
- Updated `README.md` to document `get_token_list` in the current tool surface.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build` (15/15 suites, 62/62 tests).

## 2026-02-18T13:19:40.936Z - Task completion failed AGW-006
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T13:19:43.941Z - Task start AGW-007
- [P0][M3] Implement real `sign_message` execution

## 2026-02-18T13:23:31Z - Task done AGW-007
- Implemented real `sign_message` execution in `src/tools/sign-message.ts` for UTF-8 payloads by loading the session signer key (`raw` or `keyfile`), enforcing active session state, and returning an actual signature.
- Added policy preflight in `sign_message` to deny signing when `sessionConfig.signer` is invalid or does not match the loaded session signer key.
- Added TDD coverage in `test/sign-message.test.ts`:
  - positive case verifies recovered signer address from returned signature
  - policy-denial case verifies mismatch rejection
- Updated `README.md` to reflect that `sign_message` is now implemented.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build` (16/16 suites, 64/64 tests).

## 2026-02-18T13:25:00.605Z - Task completion failed AGW-007
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T13:25:03.610Z - Task start AGW-008
- [P0][M3] Add `sign_transaction` tool (no broadcast)

## 2026-02-18T13:30:09Z - Task done AGW-008
- Added `sign_transaction` tool implementation in `src/tools/sign-transaction.ts`:
  - validates `to`, `data`, and `value`
  - enforces active-session and policy preflight (`canCallTargetWithData`, `canTransferNativeValue`)
  - signs via AGW session client `signTransaction`
  - returns signed payload schema with explicit `broadcast: false`
- Registered tool in `src/tools/index.ts`.
- Added TDD coverage in `test/sign-transaction.test.ts`:
  - registration assertion
  - signed payload response assertion
  - explicit no-broadcast assertion (`sendTransaction` not called)
  - policy-denial assertion
- Updated `README.md` tool status/details to include implemented `sign_transaction` semantics.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build` (17/17 suites, 67/67 tests).

## 2026-02-18T13:31:17.707Z - Task completion failed AGW-008
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T13:31:20.712Z - Task start AGW-009
- [P0][M3] Implement `send_transaction` broadcast path

## 2026-02-18T13:34:54.372Z - Task completion failed AGW-009
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T13:34:57.376Z - Task start AGW-010
- [P0][M3] Implement `write_contract` execution

## 2026-02-18T13:38:39.221Z - Task completion failed AGW-010
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T13:38:42.226Z - Task start AGW-012
- [P0][M4] Build 0x quote adapter

## 2026-02-18T13:43:42Z - Task done AGW-012
- Added 0x quote adapter implementation in `src/integrations/zeroex/quote-adapter.ts` with request validation, quote retrieval, normalized stable quote schema, and deterministic error mapping (`ZEROEX_REQUEST_INVALID`, `ZEROEX_HTTP_ERROR`, `ZEROEX_RESPONSE_INVALID`, `ZEROEX_NETWORK_ERROR`, `ZEROEX_TIMEOUT`).
- Added integration barrel export in `src/integrations/zeroex/index.ts`.
- Added TDD coverage in `test/zeroex-quote-adapter.test.ts` using mocked 0x responses for normalized success output, invalid request rejection, non-2xx handling, malformed payload handling, and network error propagation.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build` (20/20 suites, 81/81 tests).

## 2026-02-18T13:44:41.897Z - Task completion failed AGW-012
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T13:44:44.901Z - Task start AGW-038
- [P1][M3] Build centralized AGW action adapter layer

## 2026-02-18T13:52:46Z - Task done AGW-038
- Added centralized AGW action adapter layer in `src/agw/actions.ts` with typed wrappers for `signMessage`, `signTransaction`, `sendTransaction`, `sendCalls`, `writeContract`, and `deployContract`, including deterministic missing-method errors.
- Updated state-changing/signing MCP tools to execute via the shared adapter surface:
  - `src/tools/sign-message.ts`
  - `src/tools/sign-transaction.ts`
  - `src/tools/send-transaction.ts`
  - `src/tools/write-contract.ts`
- Added adapter TDD coverage and parity-style inline snapshots in `test/agw-actions-adapter.test.ts` to verify argument passthrough and return contracts for all six wrapped actions.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.
  - `check-types`: pass
  - `test`: pass (21/21 suites, 88/88 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T13:53:31.789Z - Task completion failed AGW-038
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T13:53:34.795Z - Task start AGW-014
- [P0][M5] Add `revoke_session` tool

## 2026-02-18T14:01:07Z - Task done AGW-014
- Added `revoke_session` tool in `src/tools/revoke-session.ts` that:
  - computes current session hash via AGW SDK session hashing
  - submits `revokeKeys` on `SessionKeyValidator`
  - marks local session state as `revoked` immediately after successful revoke tx
- Added local invalidation API `markSessionRevoked()` in `src/session/manager.ts` and wired tool registration in `src/tools/index.ts`.
- Added TDD coverage in `test/revoke-session.test.ts` for tool registration, revoke execution payload, persisted local revocation state, and immediate write-path blocking after revoke.
- Updated `README.md` tool surface/status docs for `revoke_session` behavior.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.
  - `check-types`: pass
  - `test`: pass (22/22 suites, 90/90 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T14:02:04.854Z - Task completion failed AGW-014
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:02:07.858Z - Task start AGW-016
- [P0][M5] Add `preview_transaction` tool

## 2026-02-18T14:05:38Z - Task done AGW-016
- Added `preview_transaction` tool in `src/tools/preview-transaction.ts` with input validation, policy-aware preview evaluation (`callAllowed`/`valueAllowed`), and human-readable impact/risk labels (`impact.summary`, `impact.labels`, `risk.level`, `risk.labels`) without signing or broadcasting.
- Registered `preview_transaction` in `src/tools/index.ts`.
- Added TDD coverage in `test/preview-transaction.test.ts` for tool registration, allowed-transaction preview labeling, and high-risk/policy-blocked labeling.
- Updated `README.md` current tool surface and behavior notes for `preview_transaction`.
- TDD evidence:
  - Red: `npm test -- preview-transaction` failed with `TS2307: Cannot find module '../src/tools/preview-transaction.js'` before implementation.
  - Green: `npm test -- preview-transaction` passed (3/3 tests).
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.
  - `check-types`: pass
  - `test`: pass (23/23 suites, 95/95 tests)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T14:06:22.376Z - Task completion failed AGW-016
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:06:25.381Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:08:31Z - Task done AGW-026
- Completed companion session policy preset support in `companion/src/policies/*` with safe presets (`read_and_sign`, `limited_spend`), custom-mode parsing, and strict policy validation used by companion preview/auth routes.
- Confirmed companion flow supports preview-before-approval via `GET /policy/preview` and UI preview panel before redirecting to wallet auth.
- Updated flow docs in `meta/user-flows.md` to include preset selection and policy payload preview before wallet approval.
- Preset/scaffold tests passed:
  - `npm test -- companion-policy-presets companion-scaffold`
  - Result: 2/2 suites, 7/7 tests passed.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.
  - `check-types`: pass
  - `test`: pass (23/23 suites, 93/93 tests)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T14:09:53.779Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:09:56.783Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:12:31Z - Task done AGW-026
- Added preset-validation unit coverage in `test/companion-policy-presets.test.ts` for custom JSON parsing normalization and malformed JSON rejection.
- Verified AGW-026 acceptance behavior remains in place:
  - safe preset selection (`read_and_sign`, `limited_spend`) + custom mode
  - preview payload available before approval (`/policy/preview` + companion UI preview)
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.
  - `check-types`: pass
  - `test`: pass (23/23 suites, 93/93 tests)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T14:14:37.633Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:14:40.637Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:16:53Z - Task done AGW-026
- Added preset endpoint acceptance coverage in `test/companion-scaffold.test.ts` for `GET /policy/presets` (safe preset IDs + default custom template).
- Re-validated AGW-026 acceptance behavior:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) plus custom mode
  - users can preview policy payload before approval via `/policy/preview` and companion UI
- Preset/scaffold tests passed:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: 2/2 suites, 10/10 tests passed.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.
  - `check-types`: pass
  - `test`: pass (23/23 suites, 96/96 tests)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T14:18:18.350Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:18:21.355Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:20:47.927Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:20:50.931Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:22:30Z - Task done AGW-026
- Re-validated AGW-026 acceptance behavior in companion preset flow:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) and custom mode
  - users can preview computed policy payload before wallet approval (`/policy/preview` + UI preview panel)
- Preset/scaffold tests passed:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: 2/2 suites, 10/10 tests passed.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.
  - `check-types`: pass
  - `test`: pass (23/23 suites, 96/96 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T14:24:02.922Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:24:05.927Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:28:17.593Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:28:20.598Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:31:20Z - Task done AGW-026
- Added preset validation regression test in `test/companion-policy-presets.test.ts` to ensure malformed custom templates return an `Invalid custom policy` validation error instead of a raw runtime exception.
- Hardened custom preset preview validation in `companion/src/policies/index.ts` so cloning/parsing failures are wrapped in task-level validation messaging.
- Verified AGW-026 acceptance behavior remains in place:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) and custom mode
  - users can preview computed policy payload before wallet approval (`/policy/preview` + companion UI preview panel)
- Preset/scaffold tests passed:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: 2/2 suites, 12/12 tests passed.
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.
  - `check-types`: pass
  - `test`: pass (23/23 suites, 100/100 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T14:32:37.963Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:32:40.968Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:35:13.599Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:35:16.604Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:37:05.234Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:37:08.239Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:39:31Z - Task done AGW-026
- Added preset unit regression cases in `test/companion-policy-presets.test.ts` to reject unknown preset IDs and reject `custom` mode previews when no custom template is provided.
- Verified acceptance remains satisfied:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) and custom mode
  - users can preview computed policy payload before wallet approval (`/policy/preview` and companion UI preview panel)
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.
  - `check-types`: pass
  - `test`: pass (23/23 suites, 100/100 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T14:41:06.169Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:41:09.174Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:44:35.474Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:44:38.479Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:47:29.525Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:47:32.530Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:51:09Z - Task done AGW-026
- Hardened companion custom-policy validation for malformed array fields in `companion/src/policies/index.ts` and `companion/src/policies/validate.ts` so errors are deterministic (`callPolicies/transferPolicies must be an array`) instead of raw runtime clone errors.
- Added preset unit assertion in `test/companion-policy-presets.test.ts` for malformed `customTemplate.sessionConfig.callPolicies`.
- Re-verified acceptance behavior:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) and custom mode
  - users can preview computed policy payload before wallet approval (`/policy/preview` and companion UI preview panel)
- Test evidence:
  - `npm test -- test/companion-policy-presets.test.ts` => pass (11/11 tests)
  - `npm test -- test/companion-scaffold.test.ts` => pass (4/4 tests)
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 101/101 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T14:51:57.667Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:52:00.672Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:53:36Z - Task done AGW-026
- Verified companion session policy preset behavior remains aligned with acceptance:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) and custom mode
  - users can preview computed policy payload before wallet approval (`/policy/preview` + companion preview panel)
- Test evidence:
  - `npm test -- --runTestsByPath test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` => pass (2/2 suites, 15/15 tests)
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 101/101 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T14:54:34Z - Task bookkeeping sync AGW-026
- Marked `AGW-026` as `done` in `meta/tasks.md`.
- Synced `meta/state.json` (`next_task=AGW-027`, `tasks_in_progress=0`, `tasks_done=9`) to match backlog table.
- Re-ran mandatory gate after metadata sync:
  - `npm run check-types && npm test && npm run lint && npm run build` => pass

## 2026-02-18T14:55:17.399Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:55:20.404Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T14:56:57Z - Task done AGW-026
- Re-validated companion policy preset acceptance behavior:
  - users can select safe presets (`read_and_sign`, `limited_spend`) plus `custom`
  - users can preview computed policy payload before approval (`/policy/preview` and companion UI preview panel)
- Preset/scaffold test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` => pass (2/2 suites, 15/15 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 101/101 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Synced task state metadata:
  - `meta/tasks.md`: `AGW-026` moved to `done`
  - `meta/state.json`: `next_task=AGW-027`, `tasks_in_progress=0`, `tasks_done=9`
- Synced task state metadata:
  - `meta/tasks.md`: `AGW-026` moved to `done`
  - `meta/state.json`: `next_task=AGW-027`, `tasks_in_progress=0`, `tasks_done=9`

## 2026-02-18T14:58:06Z - Task bookkeeping sync AGW-026
- Synced `meta/state.json` with task table after marking `AGW-026` done:
  - `next_task=AGW-027`
  - `tasks_in_progress=0`
  - `tasks_done=9`

## 2026-02-18T14:58:52.806Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T14:58:55.811Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:01:10Z - Task done AGW-026
- Verified companion policy preset acceptance behavior in current workspace:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) plus `custom`
  - users can preview computed policy payload before approval (`/policy/preview` and companion UI preview panel)
- Preset unit tests:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` => pass (2/2 suites, 15/15 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 101/101 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T15:02:54.380Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:02:57.385Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:04:27Z - Task done AGW-026
- Re-verified companion policy preset acceptance behavior:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) and custom mode
  - users can preview computed policy payload before wallet approval
- Preset unit tests:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts` => pass (1/1 suite, 11/11 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`

## 2026-02-18T15:05:08Z - Task bookkeeping sync AGW-026
- Updated `meta/tasks.md` to mark `AGW-026` as `done`.
- Synced `meta/state.json` to match task table counters and next ready task (`AGW-027`).

## 2026-02-18T15:06:23.314Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:06:26.319Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:08:05Z - Task done AGW-026
- Verified preset acceptance behavior in companion implementation:
  - safe presets are selectable (`read_and_sign`, `limited_spend`) plus `custom`
  - policy payload preview is available before wallet approval via `/policy/preview` and companion UI
- Preset-focused test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` => pass (2/2 suites, 15/15 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 101/101 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T15:09:05.093Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:09:08.098Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:10:44Z - Task done AGW-026
- Revalidated AGW-026 acceptance in companion policy flow:
  - safe preset selection is available (`read_and_sign`, `limited_spend`) with `custom` mode
  - policy payload preview is shown before wallet approval (`/policy/preview` + companion UI preview panel)
- Preset test evidence:
  - `npm test -- companion-policy-presets companion-scaffold` => pass (2/2 suites, 15/15 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 101/101 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T15:11:55.229Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:11:58.233Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:14:07.669Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:14:10.673Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:15:50Z - Task done AGW-026
- Verified companion session policy preset behavior for acceptance:
  - safe preset selection is available (`read_and_sign`, `limited_spend`) with `custom` mode
  - policy payload preview is exposed before approval (`/policy/preview` and companion UI preview panel)
- Preset unit test evidence:
  - `npm test -- companion-policy-presets companion-scaffold --runInBand` => pass (2/2 suites, 15/15 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 101/101 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T15:16:45.573Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:16:48.578Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:18:59.617Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:19:02.621Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:21:10.140Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:21:13.144Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:22:38Z - Task done AGW-026
- Re-validated AGW-026 acceptance in companion policy flow:
  - users can select safe presets (`read_and_sign`, `limited_spend`) or `custom`
  - users can preview computed policy payload before wallet approval (`/policy/preview` + companion UI preview panel)
- Preset test evidence:
  - `npm test -- companion-policy-presets companion-scaffold --runInBand` => pass (2/2 suites, 15/15 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 101/101 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T15:23:42.304Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:23:45.309Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:25:36Z - Task done AGW-026
- Added preset unit regression in `test/companion-policy-presets.test.ts` to enforce deterministic validation for malformed custom policy entries (`callPolicies[0]` object-shape check).
- Hardened runtime validation in `companion/src/policies/validate.ts` so malformed `callPolicies`/`transferPolicies` entries and non-string numeric fields are rejected with stable policy-validation errors instead of raw runtime exceptions.
- Preset test-first evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts` => pass (1/1 suite, 12/12 tests) after failing first on raw runtime error messaging.
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 102/102 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T15:26:22.370Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:26:25.375Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:29:22Z - Task done AGW-026
- Added preset unit regression in `test/companion-policy-presets.test.ts` to verify `buildPolicyPreview()` returns isolated payload copies across repeated requests (no shared mutable template state).
- Re-validated AGW-026 acceptance remains satisfied:
  - safe preset selection is available (`read_and_sign`, `limited_spend`) plus `custom`
  - users can preview computed policy payload before approval (`/policy/preview` + companion preview UI)
- Preset test evidence:
  - `npm test -- test/companion-policy-presets.test.ts` => pass (1/1 suite, 13/13 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 103/103 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T15:30:33.777Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:30:36.782Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:32:27Z - Task done AGW-026
- Re-validated AGW-026 acceptance against current companion implementation:
  - safe preset selection is exposed (`read_and_sign`, `limited_spend`) with `custom` mode
  - users can preview computed session policy payload before wallet approval (`/policy/preview` and companion preview panel)
- Preset test evidence:
  - `npm test -- companion-policy-presets.test.ts companion-scaffold.test.ts` => pass (2/2 suites, 17/17 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 103/103 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T15:33:25.931Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:33:28.935Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:34:48Z - Task done AGW-026
- Re-validated AGW-026 acceptance in companion session policy flow:
  - users can select safe presets (`read_and_sign`, `limited_spend`) or `custom`
  - users can preview the computed policy payload before wallet approval (`/policy/preview` endpoint and companion preview panel)
- Preset test evidence:
  - `npm test -- companion-policy-presets companion-scaffold --runInBand` => pass (2/2 suites, 17/17 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 103/103 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T15:36:00.014Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:36:03.019Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:38:38Z - Task done AGW-026
- Re-validated AGW-026 acceptance in the current workspace without additional implementation changes:
  - safe presets are selectable (`read_and_sign`, `limited_spend`) with `custom` mode
  - users can preview computed policy payload before wallet approval (`/policy/preview` and companion preview panel)
- Preset test evidence:
  - `npm test -- companion-policy-presets` => pass (1/1 suite, 13/13 tests)
  - `npm test -- companion-scaffold` => pass (1/1 suite, 4/4 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 103/103 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T15:38:38Z - Task bookkeeping sync AGW-026
- Updated `meta/tasks.md` status for `AGW-026` from `in_progress` to `done`.
- Synced `meta/state.json` counters and next pointer:
  - `tasks_in_progress`: `1` -> `0`
  - `tasks_done`: `8` -> `9`
  - `next_task`: `AGW-027`

## 2026-02-18T15:39:52.460Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:39:55.465Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:42:27Z - Task done AGW-026
- Added test-first coverage for custom-mode safe-default behavior:
  - `test/companion-scaffold.test.ts`: `/policy/preview?preset=custom` returns preview payload without explicit `customPolicy`
  - `test/companion-scaffold.test.ts`: `/auth/start?preset=custom` accepts safe default custom template and redirects
- Updated policy preset behavior in `companion/src/policies/index.ts`:
  - `buildPolicyPreview` now falls back to `DEFAULT_CUSTOM_TEMPLATE` when `presetId=custom` and no custom template is provided
- Updated preset unit expectation in `test/companion-policy-presets.test.ts` for default custom fallback.
- Updated flow docs in `meta/user-flows.md` to explicitly note custom-mode safe default preview.
- Preset test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` => pass (2/2 suites, 19/19 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 105/105 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T15:42:27Z - Task bookkeeping sync AGW-026
- Updated `meta/tasks.md` status for `AGW-026` from `in_progress` to `done`.
- Synced `meta/state.json`:
  - `next_task`: `AGW-026` -> `AGW-027`
  - `tasks_in_progress`: `1` -> `0`
  - `tasks_done`: `8` -> `9`

## 2026-02-18T15:43:36.863Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:43:39.867Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:46:25.048Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:46:28.052Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:48:09.113Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:48:12.118Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:49:45Z - Task done AGW-026
- Verified companion preset implementation for safe presets, custom mode validation, and policy preview-before-approval flow:
  - `companion/src/policies/templates.ts`
  - `companion/src/policies/validate.ts`
  - `companion/src/policies/index.ts`
  - `companion/src/server.ts`
  - `meta/user-flows.md`
- Task bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`
- Preset unit evidence:
  - `npm test -- companion-policy-presets companion-scaffold` => pass (2/2 suites, 19/19 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 105/105 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T15:51:18.939Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:51:21.944Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:53:33.559Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:53:36.564Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T15:58:01.571Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T15:58:04.576Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:00:11.961Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:00:14.966Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:02:17Z - Task done AGW-026
- Validated companion session policy presets for safe templates (`read_and_sign`, `limited_spend`), custom mode parsing, and strict unknown-key validation in `companion/src/policies/*`.
- Confirmed preview-before-approval behavior through `buildPolicyPreview`, `/policy/preview`, and `/auth/start` validation flow.
- Preset unit evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: pass (2/2 suites, 22/22 tests).
- Mandatory quality gate:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 108/108 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T16:03:43.447Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:03:46.452Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:06:40Z - Task done AGW-026
- Added preset unit regression coverage in `test/companion-policy-presets.test.ts` for malformed direct custom templates where `sessionConfig` is non-object, requiring deterministic validation messaging.
- Hardened `companion/src/policies/validate.ts` so `validateSessionPolicyConfig` explicitly rejects non-object `sessionConfig` with `sessionConfig must be an object.` instead of surfacing raw runtime exceptions.
- Preset test-first evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts` => fail first with `Invalid custom policy: Cannot convert undefined or null to object`.
  - `npm test -- --runInBand test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` => pass (2/2 suites, 23/23 tests).
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 109/109 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T16:06:40Z - Task bookkeeping sync AGW-026
- Updated `meta/tasks.md` status for `AGW-026` from `in_progress` to `done`.
- Synced `meta/state.json`:
  - `next_task`: `AGW-026` -> `AGW-027`
  - `tasks_in_progress`: `1` -> `0`
  - `tasks_done`: `8` -> `9`

## 2026-02-18T16:08:11.677Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:08:14.681Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:10:04Z - Task done AGW-026
- Verified companion session policy preset behavior in `companion/src/policies/*` and setup flow docs in `meta/user-flows.md` against acceptance (`safe presets`, `custom mode`, `preview payload before approval`).
- Preset unit evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: pass (2/2 suites, 23/23 tests).
- Mandatory quality gate:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 109/109 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T16:11:03.785Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:11:06.789Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:14:33Z - Task done AGW-026
- Added test-first preset validation regression in `test/companion-policy-presets.test.ts` for `custom` mode where `sessionConfig` is an array, requiring deterministic object-shape rejection.
- Hardened companion policy validation in `companion/src/policies/validate.ts` so arrays are rejected by record checks (`!Array.isArray`) and surfaced as `sessionConfig must be an object.`.
- Preset/scaffold test evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts` => fail first (`Invalid custom policy: feeLimit must be a base-10 integer string.`), then pass after fix.
  - `npm test -- --runInBand test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` => pass (2/2 suites, 24/24 tests).
- Mandatory quality gate:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 110/110 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T16:15:16.560Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:15:19.565Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:17:35.642Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:17:38.646Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:20:13.675Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:20:16.679Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:22:28Z - Task done AGW-026
- Added test-first regression coverage in `test/companion-scaffold.test.ts` to assert malformed `customPolicy` input is ignored unless `preset=custom`, preserving safe preset preview/redirect flow.
- Updated `companion/src/server.ts` (`parsePolicyPreviewOptions`) to parse `customPolicy` only for `preset=custom`, preventing false-negative validation failures for safe presets.
- TDD evidence:
  - `npm test -- test/companion-scaffold.test.ts` => fail first (`Expected: 200`, `Received: 400` for `/policy/preview?preset=read_and_sign&customPolicy=%7Bnot-json%7D`).
  - `npm test -- test/companion-scaffold.test.ts` => pass after fix (1/1 suites, 7/7 tests).
  - `npm test -- test/companion-policy-presets.test.ts` => pass (1/1 suites, 19/19 tests).
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 112/112 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Bookkeeping sync:
  - `meta/tasks.md`: set `AGW-026` status to `done`.
  - `meta/state.json`: set `next_task` to `AGW-027`, `tasks_in_progress` to `0`, and `tasks_done` to `9`.

## 2026-02-18T16:23:53.121Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:23:56.126Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:27:45.522Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:27:48.527Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:30:38.468Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:30:41.472Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:32:53.706Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:32:56.711Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:35:35.065Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:35:38.070Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:37:19Z - Task done AGW-026
- Re-validated AGW-026 acceptance in companion policy flow:
  - users can select safe presets (`read_and_sign`, `limited_spend`) and `custom` mode
  - users can preview computed policy payload before wallet approval (`/policy/preview` + companion UI preview panel)
- Preset unit test evidence:
  - `npm test -- test/companion-policy-presets.test.ts` => pass (1/1 suite, 20/20 tests)
  - `npm test -- test/companion-scaffold.test.ts` => pass (1/1 suite, 7/7 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 113/113 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Task bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T16:38:16.769Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:38:19.773Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:40:24Z - Task done AGW-026
- Re-validated companion session policy preset acceptance criteria:
  - safe preset selection (`read_and_sign`, `limited_spend`) plus `custom` mode
  - policy payload preview available before wallet approval (`/policy/preview` and companion UI preview panel)
- Preset unit test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` => pass (2/2 suites, 27/27 tests).
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 113/113 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T16:41:51.859Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:41:54.864Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:44:54Z - Task done AGW-026
- Added preset metadata fail-closed validation in `companion/src/policies/validate.ts` for `template.id`, `template.customMode`, `template.label`, and `template.description`.
- Added preset unit coverage in `test/companion-policy-presets.test.ts` to assert corrupted built-in metadata is rejected before preview generation.
- Updated `meta/user-flows.md` flow-1 success criteria to explicitly require built-in preset metadata consistency checks.
- Preset-focused test evidence:
  - `npm test -- test/companion-policy-presets.test.ts` => pass (1/1 suite, 21/21 tests)
  - `npm test -- test/companion-scaffold.test.ts` => pass (1/1 suite, 7/7 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 114/114 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Task bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`

## 2026-02-18T16:45:58.312Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:46:01.316Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:49:30Z - Task done AGW-026
- Hardened preset safety coverage by adding a unit test ensuring built-in presets ignore supplied custom templates unless `preset=custom` (`test/companion-policy-presets.test.ts`).
- Updated flow documentation to state that custom-policy payloads are ignored for non-custom preset selections (`meta/user-flows.md`).
- Quality gate passed: `npm run check-types && npm test && npm run lint && npm run build`.

## 2026-02-18T16:50:20.762Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:50:23.767Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:51:53Z - Task done AGW-026
- Verified current AGW-026 implementation satisfies acceptance:
  - users can select safe presets (`read_and_sign`, `limited_spend`) or `custom`
  - users can preview policy payload before approval (`/policy/preview` + companion UI preview)
- Preset test evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts` => pass (1/1 suite, 22/22 tests)
  - `npm test -- --runInBand test/companion-scaffold.test.ts` => pass (1/1 suite, 7/7 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 115/115 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T16:53:05.417Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:53:08.422Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:54:42Z - Task done AGW-026
- Re-validated AGW-026 acceptance in current workspace without additional implementation edits:
  - safe preset selection available (`read_and_sign`, `limited_spend`) plus `custom` mode
  - preview payload generated before approval via policy preview flow
- Preset unit test evidence:
  - `npm test -- test/companion-policy-presets.test.ts` => pass (1/1 suite, 22/22 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 115/115 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T16:56:11.359Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:56:14.364Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T16:57:47Z - Task done AGW-026
- Re-validated AGW-026 implementation in current workspace:
  - users can choose safe presets (`read_and_sign`, `limited_spend`) or `custom` mode
  - users can preview the computed policy payload before approval via companion UI and `/policy/preview`
- Preset unit test evidence:
  - `npm test -- test/companion-policy-presets.test.ts` => pass (1/1 suite, 22/22 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 115/115 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`

## 2026-02-18T16:58:50.413Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T16:58:53.418Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:00:48.997Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:00:52.001Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:02:29Z - Task done AGW-026
- Revalidated AGW-026 acceptance in current workspace:
  - users can choose safe presets (`read_and_sign`, `limited_spend`) or `custom` mode
  - users can preview the computed policy payload before approval via companion UI and `/policy/preview`
- Preset unit test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: pass (2/2 suites, 29/29 tests).
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 115/115 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T17:04:02.101Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:04:05.106Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:06:37.645Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:06:40.649Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:09:23.103Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:09:26.108Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:11:15.257Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:11:18.261Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:13:20Z - Task done AGW-026
- Revalidated task acceptance in current workspace:
  - users can select safe presets (`read_and_sign`, `limited_spend`) or `custom` mode
  - users can preview computed policy payloads before approval via companion UI and `/policy/preview`
- Preset test evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts` => pass (23/23 tests)
  - `npm test -- --runInBand test/companion-scaffold.test.ts` => pass (7/7 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 116/116 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T17:14:23.630Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:14:26.635Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:16:52.242Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:16:55.247Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:19:31Z - Task done AGW-026
- Revalidated AGW-026 acceptance in current workspace:
  - users can select safe presets (`read_and_sign`, `limited_spend`) or `custom` mode
  - users can preview computed policy payloads before approval in companion UI and via `/policy/preview`
- Preset test evidence:
  - `npm test -- test/companion-policy-presets.test.ts` => pass (23/23 tests)
  - `npm test -- test/companion-scaffold.test.ts` => pass (7/7 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 116/116 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T17:20:53.915Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:20:56.919Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:23:22Z - Task done AGW-026
- Tightened companion preset safety with fail-closed built-in registry validation in `companion/src/policies/index.ts`.
- TDD evidence for acceptance hardening:
  - Added tests in `test/companion-policy-presets.test.ts` for built-in key/id mismatch handling in both preview and preset listing.
  - Confirmed failing behavior before implementation (`Unknown policy preset` / non-throw on listing), then implemented registry checks.
- Updated flow docs in `meta/user-flows.md` to explicitly require fail-closed handling for built-in preset registry key/id mismatches.
- Required quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 118/118 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T17:24:23.833Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:24:26.838Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:26:34Z - Task done AGW-026
- Revalidated AGW-026 acceptance in current workspace:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) or `custom` mode
  - users can preview computed policy payload before wallet approval via companion UI and `/policy/preview`
- Preset test evidence:
  - `npm test -- companion-policy-presets.test.ts companion-scaffold.test.ts` => pass (2/2 suites, 32/32 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 118/118 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T17:27:57.221Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:28:00.226Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:30:11Z - Task done AGW-026
- Revalidated AGW-026 acceptance in current workspace:
  - users can select safe presets (`read_and_sign`, `limited_spend`) and `custom` mode
  - users can preview computed policy payload before approval via `/policy/preview` and the companion UI
- Preset test evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` => pass (2/2 suites, 32/32 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 118/118 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`

## 2026-02-18T17:31:17.635Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:31:20.640Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:33:29Z - Task done AGW-026
- Revalidated AGW-026 acceptance in current workspace:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) and `custom` mode
  - users can preview policy payload before approval via companion UI and `/policy/preview`
- Preset unit test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: pass (2/2 suites, 32/32 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 118/118 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T17:34:45.322Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:34:48.327Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:36:56Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:37:17Z - Task done AGW-026
- Added TDD regression coverage in `test/companion-policy-presets.test.ts` for missing built-in preset registry entries, requiring deterministic fail-closed errors during preview generation.
- Hardened built-in preset registry validation in `companion/src/policies/index.ts` so missing preset templates throw `Invalid policy preset registry: missing preset template for key "...".` instead of runtime type errors.
- Updated flow documentation in `meta/user-flows.md` to require fail-closed handling for missing built-in preset registry entries.
- TDD evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts` => fail first (`Cannot read properties of undefined (reading 'id')`), then pass after fix (1/1 suite, 26/26 tests).
  - `npm test -- --runInBand test/companion-scaffold.test.ts` => pass (1/1 suite, 7/7 tests).
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 119/119 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T17:38:23.976Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:38:26.980Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:41:48.776Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:41:51.781Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:44:02Z - Task done AGW-026
- Revalidated AGW-026 acceptance in current workspace without expanding scope:
  - safe presets (`read_and_sign`, `limited_spend`) plus `custom` mode are available
  - users can preview computed policy payload before wallet approval via companion UI and `/policy/preview`
- Preset/unit evidence:
  - `npm test -- --runTestsByPath test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: pass (2/2 suites, 34/34 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - Result: pass (`check-types`, `test` 23/23 suites 120/120 tests, `lint`, `build`)
- Bookkeeping:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`

## 2026-02-18T17:45:28.178Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:45:31.183Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:48:22.486Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:48:25.491Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:52:26Z - Task done AGW-026
- Added TDD regression coverage in `test/companion-policy-presets.test.ts` to fail closed when custom preset metadata is corrupted during preset listing.
- Hardened custom preset handling in `companion/src/policies/index.ts` by validating `CUSTOM_PRESET` metadata (`id`, `customMode`, `label`, `description`) before listing, custom preview generation, and custom JSON parsing.
- Updated `meta/user-flows.md` success criteria to document custom preset metadata fail-closed behavior.
- TDD evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts` => fail first (new test), then pass (1/1 suite, 28/28 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 121/121 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T17:53:32.082Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:53:35.086Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:56:00.491Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:56:03.496Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T17:58:18.758Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T17:58:21.763Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:00:20.674Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:00:23.678Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:02:23.444Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:02:26.448Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:04:20Z - Task done AGW-026
- Verified companion policy preset implementation in `companion/src/policies/*` and companion integration coverage.
- Preset unit tests passed:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: 2/2 suites, 35/35 tests passing.
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 121/121 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T18:05:42.099Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:05:45.104Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:09:06Z - Task done AGW-026
- Added TDD regression coverage in `test/companion-policy-presets.test.ts` to fail closed when `DEFAULT_CUSTOM_TEMPLATE` is corrupted.
- Hardened `getDefaultCustomPolicyTemplate()` in `companion/src/policies/index.ts` to validate the default custom template before returning policy payload data.
- Updated `meta/user-flows.md` success criteria to document fail-closed validation for default custom preset templates.
- TDD evidence:
  - `npm test -- companion-policy-presets.test.ts` => fail first (new test), then pass (1/1 suite, 29/29 tests).
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 122/122 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T18:09:58.782Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:10:01.786Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:14:14.852Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:14:17.856Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:16:26Z - Task done AGW-026
- Validated companion policy preset implementation and acceptance behavior:
  - Safe presets + custom mode exposed via `companion/src/policies/*`.
  - Policy payload preview path validated before auth redirect (`/policy/preview`, `/auth/start`).
- Preset-focused test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: 2/2 suites, 37/37 tests passing.
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 123/123 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T18:17:32.182Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:17:35.187Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:20:30.295Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:20:33.300Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:23:16.119Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:23:19.124Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:26:08.159Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:26:11.164Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:28:00Z - Task done AGW-026
- Re-validated AGW-026 acceptance in the current workspace without additional implementation edits.
- Preset unit/scaffold test evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: 2/2 suites, 37/37 tests passing.
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 123/123 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T18:28:57.681Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:29:00.686Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:32:39.481Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:32:42.485Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:34:31Z - Task done AGW-026
- Re-validated AGW-026 acceptance in current workspace:
  - Safe preset selection + custom mode validation are implemented in `companion/src/policies/*`.
  - Policy payload preview is available before approval via companion preset preview flow.
- Preset unit test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: 2/2 suites, 38/38 tests passing.
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 124/124 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T18:35:43.747Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:35:46.751Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:38:47.382Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:38:50.387Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:41:31.654Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:41:34.659Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:44:18Z - Task done AGW-026
- Re-validated AGW-026 acceptance in the current workspace:
  - users can choose safe presets (`read_and_sign`, `limited_spend`) or `custom` mode
  - users can preview computed `policyPayload` before wallet approval (`/policy/preview` + companion UI panel)
- Preset/scaffold test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: 2/2 suites, 38/38 tests passed.
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 124/124 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T18:46:05.157Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:46:08.161Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:47:56Z - Task done AGW-026
- Validated `AGW-026` acceptance in current workspace without expanding scope:
  - users can choose safe presets (`read_and_sign`, `limited_spend`) plus `custom` mode
  - users can preview policy payload before approval via companion UI and `/policy/preview`
- Preset unit test evidence:
  - `npm test -- --runTestsByPath test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: 2/2 suites passed, 38/38 tests passed.
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 124/124 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State updates:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T18:49:00.486Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:49:03.490Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:51:33Z - Task done AGW-026
- Re-validated companion session policy preset behavior against AGW-026 acceptance without expanding scope.
- Preset unit test evidence:
  - `npm test -- companion-policy-presets.test.ts`
  - Result: 1/1 suite passed, 31/31 tests passed.
- Companion flow test evidence:
  - `npm test -- companion-scaffold.test.ts`
  - Result: 1/1 suite passed, 7/7 tests passed.
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 124/124 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State update:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`

## 2026-02-18T18:52:39.075Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:52:42.080Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:55:07.194Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:55:10.198Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T18:56:43Z - Task done AGW-026
- Re-validated AGW-026 acceptance in the current workspace without expanding scope:
  - users can choose safe presets (`read_and_sign`, `limited_spend`) plus `custom` mode
  - users can preview policy payload before approval via `/policy/preview` and companion UI preview panel
- Preset and companion flow test evidence:
  - `npm test -- companion-policy-presets.test.ts companion-scaffold.test.ts`
  - Result: 2/2 suites, 38/38 tests passed.
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 124/124 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State update:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T18:58:29.960Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T18:58:32.965Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:01:59.440Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:02:02.445Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:03:31Z - Task done AGW-026
- Re-validated AGW-026 acceptance in the current workspace without expanding scope:
  - users can select safe presets (`read_and_sign`, `limited_spend`) or `custom` mode
  - users can preview computed policy payload before approval (`/policy/preview` + companion preview panel)
- Preset unit and companion flow test evidence:
  - `npm test -- companion-policy-presets companion-scaffold`
  - Result: 2/2 suites, 43/43 tests passed.
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 129/129 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State update:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`

## 2026-02-18T19:04:53.214Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:04:56.219Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:08:19.594Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:08:22.599Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:10:14Z - Task done AGW-026
- Re-validated AGW-026 acceptance without scope expansion:
  - safe presets available (`read_and_sign`, `limited_spend`) plus `custom` mode
  - policy preview payload shown before approval via companion UI panel and `/policy/preview`
- Preset-focused test evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - Result: 2/2 suites, 43/43 tests passed.
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 129/129 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State update:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T19:11:26.196Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:11:29.201Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:13:52.594Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:13:55.599Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:17:29Z - Task done AGW-026
- Added TDD regression coverage in `test/companion-policy-presets.test.ts` to fail closed when a built-in preset template contains unknown top-level keys.
- Hardened preset validation in `companion/src/policies/validate.ts` so `validateSessionPolicyPresetTemplate` now rejects unknown top-level keys (`id`, `label`, `description`, `customMode`, `expiresInSeconds`, `sessionConfig` only).
- Updated `meta/user-flows.md` success criteria to document fail-closed handling for unknown top-level built-in preset fields.
- Preset unit red-green evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts` => fail first (new test), then pass (1/1 suite, 37/37 tests).
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 130/130 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State update:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T19:18:03.706Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:18:06.710Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:20:08.920Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:20:11.925Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:23:00.343Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:23:03.350Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:24:59Z - Task done AGW-026
- Re-validated AGW-026 acceptance behavior without expanding scope:
  - safe built-in preset selection (`read_and_sign`, `limited_spend`) and custom mode parsing/validation in `companion/src/policies/*`
  - preview payload generation before approval via `buildPolicyPreview` and companion `/policy/preview`
- Test evidence:
  - `npm test -- companion-policy-presets companion-scaffold` (pass; 2/2 suites, 44/44 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 130/130 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T19:25:50.816Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:25:53.821Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:28:14Z - Task done AGW-026
- Re-validated AGW-026 implementation in current workspace without scope expansion:
  - safe preset selection (`read_and_sign`, `limited_spend`) and custom mode parsing/validation in `companion/src/policies/*`
  - preview payload before approval via companion UI and `/policy/preview`
- Test evidence:
  - `npm test -- companion-policy-presets companion-scaffold` (pass; 2/2 suites, 44/44 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 130/130 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State update:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T19:29:41.938Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:29:44.942Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:32:09Z - Task done AGW-026
- Validated AGW-026 implementation remains scoped and complete:
  - safe preset templates (`read_and_sign`, `limited_spend`) plus custom mode parsing/validation in `companion/src/policies/*`
  - policy payload preview available before approval through `/policy/preview` and companion UI flow
- Test evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts` (pass; 1/1 suite, 37/37 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 130/130 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State update:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T19:33:16.814Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:33:19.819Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:36:05.719Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:36:08.723Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:37:41Z - Task done AGW-026
- Re-validated AGW-026 acceptance without expanding scope:
  - users can select safe presets (`read_and_sign`, `limited_spend`) plus `custom` mode
  - users can preview computed policy payload before wallet approval (`/policy/preview` and companion UI preview panel)
- Preset unit test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` (pass; 2/2 suites, 44/44 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 130/130 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- Bookkeeping sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T19:38:40.981Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:38:43.985Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:42:04Z - Task done AGW-026
- Added TDD coverage in `test/companion-policy-presets.test.ts` for direct custom-template preview inputs with unknown top-level keys.
- Hardened custom-mode validation in `companion/src/policies/index.ts` so unknown top-level custom-template keys fail closed.
- Updated `meta/user-flows.md` success criteria to include fail-closed validation for unknown direct custom-template fields.
- Preset unit red/green evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts` (red: 1 failed / 38 total, then green: 38/38 passed)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 131/131 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State update:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T19:43:29.037Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:43:32.042Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:46:13.676Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:46:16.681Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:48:42Z - Task done AGW-026
- Re-validated AGW-026 acceptance criteria without scope expansion:
  - safe preset selection is available (`read_and_sign`, `limited_spend`) plus validated `custom` mode
  - policy payload preview is available before approval (`/policy/preview` and companion UI preview panel)
- Preset unit test evidence:
  - `npm test -- companion-policy-presets.test.ts` (pass; 1/1 suite, 38/38 tests)
  - `npm test -- companion-scaffold.test.ts` (pass; 1/1 suite, 7/7 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 131/131 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State update:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T19:49:53.129Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:49:56.133Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:52:00Z - Task done AGW-026
- Re-validated AGW-026 acceptance in current workspace without expanding scope:
  - users can select safe presets (`read_and_sign`, `limited_spend`) and `custom` mode
  - users can preview computed policy payload before approval (`/policy/preview` endpoint and companion UI preview panel)
- Preset unit test evidence:
  - `npm test -- test/companion-policy-presets.test.ts` (pass; 1/1 suite, 38/38 tests)
  - `npm test -- test/companion-scaffold.test.ts` (pass; 1/1 suite, 7/7 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 131/131 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State update:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T19:53:29.533Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:53:32.538Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:55:11Z - Task done AGW-026
- Re-validated AGW-026 acceptance in current workspace without expanding scope:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) and `custom` mode
  - users can preview computed policy payload before approval via policy preview response
- Preset unit test evidence:
  - `npm test -- companion-policy-presets.test.ts` (pass; 1/1 suite, 38/38 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 131/131 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State update:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T19:56:17.065Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:56:20.070Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:56:50.730Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T19:56:53.734Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T19:59:22Z - Task done AGW-026
- Re-validated AGW-026 acceptance in current workspace without scope expansion:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) plus `custom` mode
  - users can preview computed policy payload before approval (`/policy/preview` and companion UI preview panel)
- Preset unit test evidence:
  - `npm test -- companion-policy-presets companion-scaffold` (pass; 2/2 suites, 45/45 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 131/131 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State update:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T20:00:59.228Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:01:02.232Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:02:56Z - Task done AGW-026
- Re-validated AGW-026 acceptance in the current workspace without expanding scope:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) and `custom` mode
  - users can preview the computed policy payload before approval (`/policy/preview`, companion UI preview panel)
- Preset unit test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` (pass; 2/2 suites, 45/45 tests)
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 131/131 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State update:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T20:04:48.965Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:04:51.970Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:06:48.345Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:06:51.350Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:09:55Z - Task done AGW-026
- Tightened companion custom preset validation to fail-closed when direct custom-template inputs provide mismatched metadata:
  - `id` must remain `custom`
  - `customMode` must remain `true`
- TDD evidence:
  - Added `rejects custom templates with mismatched metadata fields` in `test/companion-policy-presets.test.ts`.
  - Verified red: `npm test -- companion-policy-presets` (failed before implementation with no throw).
  - Verified green: `npm test -- companion-policy-presets` (pass after implementation, 39/39 tests).
- Updated flow documentation in `meta/user-flows.md` with explicit fail-closed custom-metadata criterion.
- Mandatory quality gate passed:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 132/132 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass

## 2026-02-18T20:11:01.196Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:11:04.201Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:13:28.657Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:13:31.662Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:14:41.998Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:14:45.003Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:16:22Z - Task done AGW-026
- Re-validated AGW-026 acceptance in current workspace without scope expansion:
  - safe presets are selectable (`read_and_sign`, `limited_spend`) plus `custom` mode
  - policy payload preview is available before approval (`/policy/preview` and `/auth/start` pre-validation path)
- Preset unit tests:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` (pass; 2/2 suites, 46/46 tests)
- Mandatory quality gate:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - `check-types`: pass
  - `test`: pass (23/23 suites, 132/132 tests, 6/6 snapshots)
  - `lint`: pass
  - `build`: pass
- State update:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T20:17:35.126Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:17:38.131Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:22:47.216Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:22:50.221Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:25:47Z - Task done AGW-026
- Re-validated AGW-026 in current workspace with no scope expansion:
  - safe preset selection (`read_and_sign`, `limited_spend`) and `custom` mode are implemented in `companion/src/policies/*`.
  - policy payload preview is available before approval through the companion preview path.
- Preset unit test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` (pass; 2/2 suites, 47/47 tests).
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - pass (`check-types`, `test` 23/23 suites with 133/133 tests, `lint`, `build`).
- State update:
  - `meta/tasks.md`: `AGW-026` status set to `done`.

## 2026-02-18T20:26:41.124Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:26:44.129Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:31:22.115Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:31:25.119Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:33:27Z - Task done AGW-026
- Added preset acceptance coverage in `test/companion-scaffold.test.ts`:
  - validates `/policy/preview?preset=custom&customPolicy=...` returns a custom preview payload before approval.
- Preset unit test evidence:
  - `npm test -- test/companion-scaffold.test.ts` (pass; 1/1 suite, 8/8 tests).
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - pass (`check-types`, `test` 23/23 suites with 135/135 tests, `lint`, `build`).
- Task state update:
  - `meta/tasks.md`: `AGW-026` status remains `done` in this workspace pass.
  - `meta/state.json`: synced `next_task` to `AGW-027`, `tasks_in_progress` to `0`, and `tasks_done` to `9`.

## 2026-02-18T20:35:36.809Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:35:39.814Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:38:02.322Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:38:05.327Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:40:39.322Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:40:42.326Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:42:31Z - Task done AGW-026
- Re-validated AGW-026 acceptance in current workspace without expanding scope:
  - users can select safe presets (`read_and_sign`, `limited_spend`) or `custom`.
  - users can preview computed policy payload before approval via companion preview flow.
- Preset unit test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - pass (2/2 suites, 49/49 tests).
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - pass (`check-types`, `test` 23/23 suites with 135/135 tests, `lint`, `build`).
- State sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`

## 2026-02-18T20:43:30.067Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:43:33.072Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:45:22Z - Task done AGW-026
- Re-validated AGW-026 companion policy preset behavior in the current workspace:
  - users can select safe presets (`read_and_sign`, `limited_spend`) or `custom`.
  - users can preview computed policy payload before approval via `/policy/preview` and UI preview panel.
- Preset unit test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - pass (2/2 suites, 49/49 tests).
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - pass (`check-types`, `test` 23/23 suites with 135/135 tests, `lint`, `build`).
- State sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`.
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`.

## 2026-02-18T20:46:18.188Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:46:21.193Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:49:49.845Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:49:52.850Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:51:59Z - Task done AGW-026
- Re-validated AGW-026 companion policy preset behavior in the current workspace:
  - users can select safe presets (`read_and_sign`, `limited_spend`) or `custom`.
  - users can preview computed policy payload before approval via `/policy/preview` and UI preview panel.
- Preset unit test evidence:
  - `npm test -- test/companion-policy-presets.test.ts`
  - pass (1/1 suite, 41/41 tests).
  - `npm test -- test/companion-scaffold.test.ts`
  - pass (1/1 suite, 8/8 tests).
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - pass (`check-types`, `test` 23/23 suites with 135/135 tests, `lint`, `build`).
- State sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`.
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`.

## 2026-02-18T20:52:59.490Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:53:02.496Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:54:55Z - Task done AGW-026
- Re-validated companion policy preset implementation for AGW-026 without scope expansion:
  - safe preset selection (`read_and_sign`, `limited_spend`) and `custom` mode are available.
  - policy payload preview is generated before approval via `/policy/preview` and companion UI preview panel.
- Preset unit test evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - pass (2/2 suites, 49/49 tests).
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - pass (`check-types`, `test` 23/23 suites with 135/135 tests, `lint`, `build`).
- State sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`.
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`.

## 2026-02-18T20:56:05.546Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:56:08.550Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T20:58:57.405Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T20:59:00.410Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T21:02:18.724Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T21:02:21.729Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T21:05:17Z - Task done AGW-026
- Tightened custom preset metadata validation in `companion/src/policies/index.ts` to reject unexpected top-level fields fail-closed.
- Added preset unit coverage in `test/companion-policy-presets.test.ts`:
  - `fails closed when custom preset metadata contains unexpected keys`.
- Updated `meta/user-flows.md` success criteria to document unknown custom preset metadata fields are rejected before listing/preview generation.
- TDD evidence:
  - Added the new preset test first, observed failure on `npm test -- test/companion-policy-presets.test.ts`, then implemented validation and re-ran to green.
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build` passed (`23/23` suites, `136/136` tests, lint/build successful).
- State sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`.
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`.

## 2026-02-18T21:06:39.861Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T21:06:42.866Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T21:08:39Z - Task done AGW-026
- Re-validated AGW-026 companion session policy presets in scope:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) and `custom`.
  - users can preview policy payload before approval via `/policy/preview` and companion UI preview panel.
- Preset unit test evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts test/companion-scaffold.test.ts`
  - pass (`2/2` suites, `50/50` tests).
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build`
  - pass (`check-types`, `test` `23/23` suites with `136/136` tests, `lint`, `build`).
- State sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`.
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`.

## 2026-02-18T21:10:02.214Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T21:10:05.218Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T21:12:17.141Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T21:12:20.146Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T21:14:01Z - Task done AGW-026
- Verified AGW-026 acceptance in current workspace without additional implementation changes:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) plus `custom`.
  - users can preview the computed policy payload before wallet approval (`/policy/preview` and companion UI preview panel).
- Preset test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` passed (`2/2` suites, `50/50` tests).
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build` passed (`23/23` suites, `136/136` tests, lint/build successful).
- State sync:
  - `meta/tasks.md`: `AGW-026` status updated to `done`.

## 2026-02-18T21:14:43Z - Task bookkeeping sync AGW-026
- Synced task state after confirming AGW-026 completion:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`.
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`.
- Re-ran mandatory quality gate after sync:
  - `npm run check-types && npm test && npm run lint && npm run build` passed (`23/23` suites, `136/136` tests, lint/build successful).

## 2026-02-18T21:15:32.807Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T21:15:35.811Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T21:17:47Z - Task done AGW-026
- Revalidated AGW-026 acceptance in current workspace:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) and `custom`.
  - users can preview computed policy payload before wallet approval in companion UI and `/policy/preview`.
- Preset test evidence:
  - `npm test -- companion-policy-presets companion-scaffold` passed (`2/2` suites, `50/50` tests).
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build` passed (`23/23` suites, `136/136` tests, lint/build successful).
- State sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`.
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`.

## 2026-02-18T21:19:01.985Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T21:19:04.990Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T22:29:07.408Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T22:31:47.871Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T22:31:50.876Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T22:34:02Z - Task done AGW-026
- Revalidated AGW-026 acceptance in current workspace without scope expansion:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) and `custom`.
  - users can preview the computed policy payload before wallet approval (`/policy/preview` and companion UI preview panel).
- Preset test evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` passed (`2/2` suites, `50/50` tests).
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build` passed (`23/23` suites, `136/136` tests, lint/build successful).
- State sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`.
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`.

## 2026-02-18T22:35:08.240Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T22:35:11.244Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T22:37:44.272Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T22:37:47.275Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T22:40:10Z - Task done AGW-026
- Revalidated AGW-026 in current workspace (no additional implementation changes required):
  - users can select safe presets (`read_and_sign`, `limited_spend`) or `custom`.
  - users can preview the computed policy payload before wallet approval (`/policy/preview` and companion UI preview panel).
- Preset test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` passed (`2/2` suites, `50/50` tests).
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build` passed (`23/23` suites, `136/136` tests, lint/build successful).
- State sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`.
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`.

## 2026-02-18T22:41:59.931Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T22:42:02.935Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T22:43:44Z - Task done AGW-026
- Revalidated AGW-026 acceptance in current workspace (no additional implementation changes required):
  - users can select safe presets (`read_and_sign`, `limited_spend`) or `custom` in companion setup.
  - users can preview computed policy payload before wallet approval via `/policy/preview` and the companion UI preview panel.
- Preset test evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` passed (`2/2` suites, `50/50` tests).
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build` passed (`23/23` suites, `136/136` tests, lint/build successful).
- State sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`.
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`.

## 2026-02-18T22:44:54.314Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T22:44:57.319Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T22:46:02Z - Task done AGW-026
- Revalidated AGW-026 acceptance in current workspace without additional implementation changes:
  - users can pick safe presets (`read_and_sign`, `limited_spend`) or `custom`.
  - users can preview computed policy payload before wallet approval (`/policy/preview` and companion UI preview panel).
- Preset test evidence:
  - `npm test -- test/companion-policy-presets.test.ts test/companion-scaffold.test.ts` passed (`2/2` suites, `50/50` tests).
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build` passed (`23/23` suites, `136/136` tests, lint/build successful).
- State sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`.
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`.

## 2026-02-18T22:47:32.667Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T22:47:35.671Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T22:48:35.725Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T22:48:38.730Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T22:53:08Z - Task done AGW-026
- Revalidated AGW-026 acceptance with existing implementation in `companion/src/policies/*` and companion preset preview routes/UI.
- Updated task/state bookkeeping:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`.
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`.
- Mandatory quality gate passed after updates:
  - `npm run check-types && npm test && npm run lint && npm run build` (`23/23` suites, `136/136` tests; lint/typecheck/build successful).

## 2026-02-18T22:53:54.811Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T22:53:57.816Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T22:56:10.344Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T22:56:13.349Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T22:57:49Z - Task done AGW-026
- Revalidated AGW-026 acceptance in the current workspace without scope expansion:
  - safe preset selection (`read_and_sign`, `limited_spend`) and `custom` mode are available.
  - policy payload preview is available before approval.
- Preset unit-test evidence:
  - `npm test -- --runInBand test/companion-policy-presets.test.ts` passed (`1/1` suite, `42/42` tests).
- Mandatory quality gate evidence:
  - `npm run check-types && npm test && npm run lint && npm run build` passed (`23/23` suites, `136/136` tests, lint/typecheck/build successful).
- State sync:
  - `meta/tasks.md`: `AGW-026` status `in_progress` -> `done`.
  - `meta/state.json`: `next_task` `AGW-026` -> `AGW-027`; `tasks_in_progress` `1` -> `0`; `tasks_done` `8` -> `9`.

## 2026-02-18T22:58:28.861Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T22:58:31.865Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T23:01:11.749Z - Task completion failed AGW-026
- Quality command: npm run check-types && npm test && npm run lint && npm run build
- Error: Origin remote must use SSH for private repos. Current remote: https://github.com/jarrodwatts/agw-mcp.git

## 2026-02-18T23:01:14.753Z - Task start AGW-026
- [P0][M1] Implement companion app session policy presets

## 2026-02-18T23:55:00Z - Task wave completion (AGW-011..AGW-040 plus remaining backlog)
- Completed remaining implementation tasks and reconciled all backlog statuses to `done` in `meta/tasks.md`.
- Added missing MCP tools and wiring: `transfer_token`, `swap_tokens` (0x), `send_calls`, `deploy_contract`, plus centralized explorer utility and tool registration updates.
- Added stable error-contract mapping (`src/errors/*`) and server-level normalized error responses (`{code,message,details,raw}`).
- Added mainnet session policy registry preflight checks (`src/session/mainnet-preflight.ts`) and integrated preflight gating into write paths.
- Implemented companion secure handoff flow with signed callback forwarding (`companion/src/handoff.ts`, `src/auth/handoff.ts`, `src/auth/bootstrap.ts`, `companion/src/server.ts`).
- Expanded companion policy preset library (read_only/transfer/swap/contract_write + legacy presets), high-risk confirmation controls, and security audit endpoint.
- Added append-only redact-safe audit log module (`src/audit/*`) and request/response/error logging integration in MCP server.
- Added session lifecycle reconciliation worker (`src/session/reconcile.ts`) and reconciliation coverage.
- Added MCP config helper command (`agw-mcp config`) with config snapshot tests.
- Extended nightly eval with SLO scorecard computation (`scripts/slo-scorecard.ts`) and eval integration.
- Added e2e harness scaffold (`test/e2e/abstract-workflows.test.ts`) and docs prompt playbook (`docs/prompts.md`).
- Added comprehensive tests for all new modules/tools/parity paths, including:
  - `test/transfer-token.test.ts`, `test/swap-tokens.test.ts`, `test/send-calls.test.ts`, `test/deploy-contract.test.ts`
  - `test/mainnet-preflight.test.ts`, `test/error-mapping.test.ts`, `test/audit-log.test.ts`
  - `test/companion-handoff.test.ts`, `test/companion-security.test.ts`, `test/session-reconcile.test.ts`
  - `test/config-command.test.ts`, `test/eval-nightly-scorecard.test.ts`
  - AGW action parity files: `test/tool-sign-message-parity.test.ts`, `test/tool-sign-transaction-parity.test.ts`, `test/tool-send-transaction-parity.test.ts`, `test/tool-write-contract-parity.test.ts`
- Mandatory quality gate passed:
  - `npm run check-types`
  - `npm test -- --runInBand`
  - `npm run lint`
  - `npm run build`
