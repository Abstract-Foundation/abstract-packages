<div align="center">
    <img src="https://mintlify.s3-us-west-1.amazonaws.com/abstract/images/Block.svg" width="700px" alt="abstract banner"/>
    <br />
    <h1>abstract-packages</h1>
    <p align="center">The TypeScript and Solidity monorepo for building on <a href="https://abs.xyz">Abstract</a> — smart-account SDKs, a headless CLI for agents, on-chain payment primitives, and the contracts behind them.</p>
</div>

<br/>

## Overview

This repository publishes the client-side surface area for [Abstract Global Wallet (AGW)](https://docs.abs.xyz/overview) — a cross-application smart contract wallet powered by Abstract's [native account abstraction](https://docs.abs.xyz/how-abstract-works/native-account-abstraction) — along with the [`mppx`](https://github.com/anthropics/mppx) payment method plugin for Abstract and the Solidity contracts it settles against.

Everything is built on [viem](https://viem.sh), ships ESM + CJS dual builds with full type definitions, and is released with npm provenance.

## Packages

### Published SDKs

| Package | Description | Version |
| --- | --- | --- |
| [`@abstract-foundation/agw-client`](packages/agw-client) | Core viem-based client for AGW — transactions, sponsored gas, session keys, typed signatures. | [![npm](https://img.shields.io/npm/v/@abstract-foundation/agw-client.svg)](https://www.npmjs.com/package/@abstract-foundation/agw-client) |
| [`@abstract-foundation/agw-react`](packages/agw-react) | React hooks and connectors for AGW — Wagmi, Privy, and Thirdweb integrations. | [![npm](https://img.shields.io/npm/v/@abstract-foundation/agw-react.svg)](https://www.npmjs.com/package/@abstract-foundation/agw-react) |
| [`@abstract-foundation/agw-web`](packages/agw-web) | Generic EIP-6963 provider for AGW. Framework-agnostic. | [![npm](https://img.shields.io/npm/v/@abstract-foundation/agw-web.svg)](https://www.npmjs.com/package/@abstract-foundation/agw-web) |
| [`@abstract-foundation/web3-react-agw`](packages/web3-react-agw) | `@web3-react/core` connector for AGW. | [![npm](https://img.shields.io/npm/v/@abstract-foundation/web3-react-agw.svg)](https://www.npmjs.com/package/@abstract-foundation/web3-react-agw) |
| [`@abstract-foundation/agw-cli`](packages/agw-cli) | Agent-first CLI and MCP server for AGW workflows. JSON-first, sanitizable, with Claude Code and Gemini extension scaffolds. | [![npm](https://img.shields.io/npm/v/@abstract-foundation/agw-cli.svg)](https://www.npmjs.com/package/@abstract-foundation/agw-cli) |
| [`@abstract-foundation/mpp`](packages/mpp) | [mppx](https://github.com/anthropics/mppx) payment method plugin for Abstract — ERC-3009 one-shot charges and ERC-20 payment-channel sessions. | [![npm](https://img.shields.io/npm/v/@abstract-foundation/mpp.svg)](https://www.npmjs.com/package/@abstract-foundation/mpp) |

### Internal packages

| Path | Description |
| --- | --- |
| [`packages/agw-core`](packages/agw-core) | Shared command registry and error envelopes consumed by `agw-cli`. Private, not published. |
| [`packages/contracts`](packages/contracts) | Foundry/ZKsync Solidity project. Houses `AbstractStreamChannel.sol` (payment channel escrow used by `@abstract-foundation/mpp`). |

### Apps

| Path | Description |
| --- | --- |
| [`apps/cli-companion`](apps/cli-companion) | Next.js browser-side trust boundary for AGW session approval (onboarding, delegated signer approval, revoke). Deployed as the companion URL the CLI opens. |

### Examples

| Path | Description |
| --- | --- |
| [`examples/agent-client`](examples/agent-client) | Minimal `mppx` client paying an Abstract-gated API with `@abstract-foundation/mpp`. |
| [`examples/agw-nextjs`](examples/agw-nextjs) | Next.js example app using the AGW client and React packages. |
| [`examples/hono-server`](examples/hono-server) | Hono server that charges ERC-3009 and opens payment channel sessions via `@abstract-foundation/mpp`. |
| [`examples/mpp-demo`](examples/mpp-demo) | Next.js demo combining AGW login with the MPP payment flow end-to-end. |

### Tools

| Path | Description |
| --- | --- |
| [`tools/skills`](tools/skills) | [Abstract Skills](tools/skills/README.md) — Claude Code plugin with opinionated skills for building on Abstract (wallet integration, contract deployment, MCP usage, prediction markets, ERC-8004, Safe multisig). |

## Quick start

Install the SDK you need. Most applications start with one of:

```bash
# React app using wagmi / Privy / Thirdweb
npm install @abstract-foundation/agw-react

# Framework-agnostic / vanilla TypeScript
npm install @abstract-foundation/agw-client

# Agent / CLI workflows
npm install -g @abstract-foundation/agw-cli
```

Minimal React example:

```tsx
import { useLoginWithAbstract } from "@abstract-foundation/agw-react";

export function Login() {
  const { login, logout } = useLoginWithAbstract();
  return <button onClick={login}>Connect with Abstract</button>;
}
```

Minimal client example:

```ts
import { createAbstractClient } from "@abstract-foundation/agw-client";
import { abstractTestnet } from "viem/chains";

const client = await createAbstractClient({ signer, chain: abstractTestnet });
const hash = await client.sendTransaction({ to, value });
```

See each package's README for full API reference and sponsored transaction / session key examples.

## Repository layout

```
abstract-packages/
├── apps/                     # Deployable applications
│   └── cli-companion/        # Next.js session approval UI
├── examples/                 # Runnable reference integrations
│   ├── agent-client/         # mppx client example
│   ├── agw-nextjs/           # Next.js AGW example app
│   ├── hono-server/          # Hono + mpp server example
│   └── mpp-demo/             # Full Next.js demo
├── packages/                 # Published + internal packages
│   ├── agw-cli/              # Published — agent-first CLI
│   ├── agw-client/           # Published — core viem client
│   ├── agw-core/             # Internal — shared CLI core
│   ├── agw-react/            # Published — React bindings
│   ├── agw-web/              # Published — EIP-6963 provider
│   ├── contracts/            # Internal — Foundry/ZKsync contracts
│   ├── mpp/                  # Published — mppx payment plugin
│   └── web3-react-agw/       # Published — web3-react connector
├── tools/                    # Developer tooling
│   └── skills/               # Abstract Skills plugin for Claude Code
├── .changeset/               # Changesets config and queued releases
└── .github/                  # CI workflows and release scripts
```

## Tooling

| Concern | Tool |
| --- | --- |
| Package manager | [pnpm](https://pnpm.io) (10.x, enforced via `packageManager`) |
| Task runner | [Turborepo](https://turbo.build/repo) |
| Lint + format | [Biome](https://biomejs.dev) |
| TypeScript | 5.x (shared `tsconfig.base.json`, `strict` + `noUncheckedIndexedAccess`) |
| Unit tests | [Vitest](https://vitest.dev) |
| Solidity | [Foundry](https://getfoundry.sh) with ZKsync toolchain |
| Versioning | [Changesets](https://github.com/changesets/changesets) |
| Git hooks | [husky](https://typicode.github.io/husky) + [lint-staged](https://github.com/lint-staged/lint-staged) |

## Prerequisites

- **Node.js** ≥ 20 (CI runs on Node 24).
- **pnpm** 10.30.2 or later — `corepack enable` then `corepack prepare pnpm@10.30.2 --activate`.
- **Foundry** (only if working on `packages/contracts` or running `@abstract-foundation/agw-client` tests that spin up anvil).

## Development

Install, build, and verify:

```bash
pnpm install
pnpm build        # turbo run build across the graph
pnpm typecheck    # turbo run typecheck
pnpm test         # turbo run test across the graph (requires Foundry for contracts + agw-client anvil tests)
pnpm lint         # biome lint
pnpm format       # biome format --write
```

Work on a single package with Turbo's filter syntax:

```bash
pnpm --filter @abstract-foundation/agw-client build
pnpm --filter @abstract-foundation/agw-react typecheck
pnpm --filter @abstract-foundation/agw-cli dev
```

Solidity work happens inside `packages/contracts` via Foundry:

```bash
pnpm --filter contracts install   # runs ./scripts/install.mjs (soldeer)
pnpm --filter contracts build
pnpm --filter contracts test
pnpm --filter contracts build:zksync
pnpm --filter contracts test:zksync
```

## Releasing

Public packages ship via [Changesets](https://github.com/changesets/changesets) with npm provenance. In short:

1. Author a changeset in your PR: `pnpm changeset` (choose affected packages and bump type).
2. Merge to `main`.
3. The `Release PR` workflow opens or updates a "Version Packages" PR that applies version bumps and changelog entries.
4. Merging that PR triggers the `Publish` workflow, which re-runs the release-surface + `agw-client` verification jobs and then runs `pnpm changeset:publish`.

Private packages (`contracts`, `agw-core`, example apps, `cli-companion`) are ignored by Changesets (see `.changeset/config.json`) and never published.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow, including CI layout, package-specific checks, and the `ci:release-surface` validation that every publishable package must pass.

## Documentation

- Abstract docs: <https://docs.abs.xyz>
- AGW overview: <https://docs.abs.xyz/how-abstract-works/abstract-global-wallet/overview>
- Native account abstraction: <https://docs.abs.xyz/how-abstract-works/native-account-abstraction>

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Issues and PRs are welcome.

## License

MIT. Each published package declares MIT in its own `package.json`; see the package directories for details.
