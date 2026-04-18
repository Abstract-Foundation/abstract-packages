# Contributing

Thanks for your interest in improving `abstract-packages`. This document is the authoritative guide for getting a local environment running, making changes, and shipping them through the release pipeline.

If anything in here is out of date, open a PR fixing it — the contribution guide is code too.

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Repository layout](#repository-layout)
- [Daily workflows](#daily-workflows)
- [Conventions](#conventions)
- [Tests](#tests)
- [Changesets and releases](#changesets-and-releases)
- [CI](#ci)
- [Opening a pull request](#opening-a-pull-request)
- [Reporting security issues](#reporting-security-issues)

## Code of conduct

Be kind, assume good faith, and keep feedback focused on code and behavior rather than people. Harassment of any kind is not tolerated. Maintainers reserve the right to moderate discussion to keep the project welcoming.

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | ≥ 20 (CI runs Node 24) | Use [Volta](https://volta.sh) or [fnm](https://github.com/Schniz/fnm). |
| pnpm | 10.30.2 (pinned) | `corepack enable && corepack prepare pnpm@10.30.2 --activate`. |
| Git | any recent | Husky installs a `pre-commit` hook that runs Biome via lint-staged. |
| Foundry | latest | Only required for `packages/contracts` and the full `@abstract-foundation/agw-client` test suite. Install via `curl -L https://foundry.paradigm.xyz \| bash && foundryup`. |

The project enforces its package manager. Running `npm install` or `yarn` at the root will produce incorrect resolutions and is not supported.

## Getting started

```bash
git clone https://github.com/Abstract-Foundation/abstract-packages.git
cd abstract-packages
pnpm install
pnpm build
pnpm typecheck
pnpm test
```

The husky `prepare` script installs git hooks on `pnpm install`. If they are missing, run `pnpm prepare` manually.

## Repository layout

This is a pnpm workspace defined in [`pnpm-workspace.yaml`](pnpm-workspace.yaml). Orchestration is handled by [Turborepo](turbo.json); tasks are cached by default. The root workspaces are:

- `packages/*` — published SDKs plus `agw-core` (internal) and `contracts` (Solidity).
- `apps/*` — deployable apps (currently `cli-companion`).
- `examples/*` — runnable reference integrations. Private by default.
- `tools/*` — developer tooling (currently the [Abstract Skills](tools/skills) Claude Code plugin).

Shared TypeScript config lives in [`tsconfig.base.json`](tsconfig.base.json). Shared lint/format rules live in [`biome.json`](biome.json). Shared dependency versions live in the `catalog:` block of `pnpm-workspace.yaml` — prefer `"viem": "catalog:"` over pinning in individual packages so upgrades are a single-file change.

## Daily workflows

### Install and build everything

```bash
pnpm install
pnpm build
```

### Work on one package

Turbo's `--filter` selects a subset of the graph and transitive dependents:

```bash
pnpm --filter @abstract-foundation/agw-client build
pnpm --filter @abstract-foundation/agw-react typecheck
pnpm --filter @abstract-foundation/agw-cli dev          # tsx runner for local hacking
pnpm --filter @abstract-foundation/agw-cli-app dev      # Next.js companion app on :3001
```

To build a package and everything it depends on:

```bash
pnpm turbo run build --filter=@abstract-foundation/agw-react...
```

To run only packages changed relative to `main`:

```bash
pnpm turbo run build --filter=...[origin/main]
```

### Lint and format

Biome is the single source of truth. `pnpm format` is destructive (it rewrites files); `pnpm format:check` is not.

```bash
pnpm lint            # turbo-orchestrated lint across packages
pnpm lint:check      # biome lint only
pnpm lint:fix        # biome lint --write
pnpm format          # biome format --write
pnpm format:check    # biome format
pnpm ci:lint         # the exact check CI runs
```

Editor integration: install the [Biome extension](https://biomejs.dev/guides/integrate-in-editor/) and disable Prettier/ESLint in this repo. Indentation is 2 spaces, line width 80, double-quoted strings.

### Solidity (`packages/contracts`)

The contracts package uses Foundry with ZKsync support and [Soldeer](https://soldeer.xyz) for dependencies.

```bash
pnpm --filter contracts install      # runs ./scripts/install.mjs which runs `forge soldeer install`
pnpm --filter contracts build
pnpm --filter contracts test
pnpm --filter contracts build:zksync
pnpm --filter contracts test:zksync
```

`packages/contracts/lib/`, `cache/`, and `dependencies/` are gitignored. Do not commit build artifacts.

### Running the agent CLI locally

```bash
pnpm --filter @abstract-foundation/agw-cli dev -- --help
pnpm --filter @abstract-foundation/agw-cli start           # runs the built dist
```

The CLI ships with skills (`packages/agw-cli/skills`) and extension scaffolds (`packages/agw-cli/extensions`) that are bundled into the npm tarball.

## Conventions

### TypeScript

- `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` are all on.
- Do not suppress type errors with `as any`, `@ts-ignore`, or `@ts-expect-error`. If you genuinely need an escape hatch, add a comment explaining why and link an issue.
- Exported functions need explicit return types.
- Prefer `unknown` over `any` for truly unknown data.

### Code style

- Dual-build packages (ESM + CJS) are generated by the `build:esm+types` / `build:cjs` scripts. Do not hand-edit `dist/`.
- Keep files focused. Re-export public API through `src/exports/` where packages already follow that pattern (`agw-client`, `agw-react`, `agw-web`).
- No commented-out code. Remove it — git history preserves it.
- No comments that restate what code does. Comments explain *why*.

### Naming

- PascalCase for types, interfaces, components.
- camelCase for functions, variables.
- `SCREAMING_SNAKE_CASE` for constants.
- kebab-case for filenames (except React components, which may use PascalCase to match their default export).

### Imports

Group: external → internal (`@abstract-foundation/*`, `workspace:*`) → relative. Let Biome's `organizeImports` assist action sort them.

### React

- Hooks and components follow [React rules-of-hooks](https://react.dev/reference/rules/rules-of-hooks).
- Prefer derived values over `useState` + `useEffect` for values that can be computed from props or other state.
- `useExhaustiveDependencies` is a warning in published packages and examples — fix it rather than disabling.

### Solidity

- Match the style of `AbstractStreamChannel.sol`.
- Solidity files are excluded from Biome; formatting is Foundry's responsibility (`forge fmt`).
- Every contract change that affects ABIs must be reflected in the TypeScript packages that consume it.

## Tests

Unit tests use [Vitest](https://vitest.dev). The root [`vitest.workspace.ts`](vitest.workspace.ts) pulls each package's config in.

```bash
pnpm test                                            # all non-contract packages
pnpm --filter @abstract-foundation/agw-client test   # unit tests (requires Foundry for some)
pnpm --filter @abstract-foundation/agw-client coverage
pnpm --filter @abstract-foundation/agw-client test:build   # publint + arethetypeswrong
```

`agw-client`'s test suite uses [`prool`](https://www.npmjs.com/package/prool) to manage an anvil instance, which is why Foundry is required locally. CI runs this suite in a dedicated `ci-agw-client` workflow.

Pre-publish sanity is enforced by `test:build`, which runs [`publint`](https://publint.dev) and [`@arethetypeswrong/cli`](https://arethetypeswrong.github.io). Any packaging regression (bad exports map, missing types, dual-resolution mismatches) fails this check.

## Changesets and releases

Every user-facing change in a **publishable** package requires a changeset. The publishable set is:

- `@abstract-foundation/agw-client`
- `@abstract-foundation/agw-react`
- `@abstract-foundation/agw-web`
- `@abstract-foundation/web3-react-agw`
- `@abstract-foundation/agw-cli`
- `@abstract-foundation/mpp`

Private packages ignored by Changesets (see [`.changeset/config.json`](.changeset/config.json)):

- `contracts`
- `@abstract-foundation/agw-core`
- `@abstract-foundation/agw-cli-app`
- `mpp-abstract-agent-example`
- `mpp-abstract-hono-example`
- `mpp-demo`

### Author a changeset

```bash
pnpm changeset
```

- Choose affected packages. Include *every* publishable package your change touches, directly or semantically.
- Pick a bump: `patch` for fixes, `minor` for new API, `major` for breaking changes.
- Write a concise, user-visible summary. Bad: "fix bug". Good: "Fix `useAbstractClient` throwing when the signer disconnects mid-render."

The changeset lands as a Markdown file in `.changeset/`. Commit it with your change.

Internal-only changes (tests, tooling, CI, docs, private packages) do not need a changeset.

### What happens on merge

1. The [`Release PR`](.github/workflows/release-pr.yml) workflow opens or updates a `Version Packages` PR that applies the queued changesets, bumps versions, and regenerates changelogs.
2. Reviewing and merging that PR kicks off [`Publish`](.github/workflows/publish.yml).
3. `Publish` re-runs the release-surface and `agw-client` checks, then publishes to npm with provenance (`NPM_CONFIG_PROVENANCE=true`) via `pnpm changeset:publish`.
4. The [`detect-publishable`](.github/scripts/detect-publishable.mjs) script compares local versions to what's on npm and short-circuits publishing when nothing changed.

Publishers only need to write changesets and merge the version PR. npm auth is handled through the `npm` GitHub environment.

## CI

[`.github/workflows/gatekeeper.yml`](.github/workflows/gatekeeper.yml) is the entry point. It uses `dorny/paths-filter` to route PRs to the minimum workflow set needed, then a final `CI Gatekeeper` job fans in the results so branch protection can require a single status.

| Workflow | Triggers | What it does |
| --- | --- | --- |
| `ci-verify.yml` | JS/TS changes | `pnpm ci:lint`, turbo `build` + `typecheck` + `test` across non-contract packages. On PRs, filtered to packages changed vs `origin/main`. |
| `ci-agw-client.yml` | `packages/agw-client/**` changes | Full `@abstract-foundation/agw-client` test suite with Foundry. |
| `ci-contracts.yml` | `packages/contracts/**` changes | `forge soldeer install` + `forge build` + `forge test`. |
| `ci-release-surface.yml` | Any publishable-surface change | Per-package matrix running `build` + `test:build` (and `pnpm pack` for the CLI) via [`run-release-surface.mjs`](.github/scripts/run-release-surface.mjs). |
| `release-pr.yml` | push to `main` | Opens/updates the Changesets version PR. |
| `publish.yml` | push to `main` | Runs detection, re-verifies, publishes to npm. |

Before opening a PR, run locally:

```bash
pnpm ci:lint
pnpm build
pnpm typecheck
pnpm test
pnpm ci:release-surface       # only if you touched a publishable package
```

`ci:release-surface` runs the same per-package build/publint/attw/pack checks the CI matrix runs, and is the fastest way to catch a broken `exports` map before pushing.

## Opening a pull request

1. **Fork** and branch from `main`. Name the branch descriptively (`fix/agw-client-estimate-gas`, `feat/mpp-paymaster-support`).
2. Make your change. Keep the PR focused — refactors and bug fixes in the same PR slow review.
3. Add tests for behavior changes. `@abstract-foundation/agw-client` has the deepest unit coverage and anvil-based integration tests — use them as a template.
4. **Write a changeset** (`pnpm changeset`) for any publishable change.
5. **Run the local CI subset** listed above. If you touched a publishable package, run `pnpm ci:release-surface` — a broken `exports` field fails the release-surface matrix.
6. Open the PR against `main`. Describe:
   - The problem and the fix.
   - Any API surface changes and migration notes.
   - Tests you added or why they're not needed.
7. Keep commits readable. The final merge uses a squash, but reviewers read the individual commits.
8. CI must pass. The `CI Gatekeeper` status is required for merge.
9. Address review feedback with additional commits; do not force-push after review has started unless a maintainer asks.

### PRs that touch multiple packages

If your change spans, e.g. `agw-client` + `agw-react`, make sure:

- Both packages' changesets are present.
- Dependent versions are bumped correctly. `updateInternalDependencies` is `"patch"` (see `.changeset/config.json`) so a minor in `agw-client` auto-bumps `agw-react` as a patch — write a changeset for `agw-react` only if its public behavior actually changes.
- You rebuild both locally (`pnpm turbo run build --filter=@abstract-foundation/agw-client... --filter=@abstract-foundation/agw-react`) to catch dual-package hazard issues.

### Documentation

Package-level docs live in each package's `README.md`. The root README is a map; package READMEs are the API reference. If you add a public API, update the relevant package README in the same PR.

The [Abstract Skills](tools/skills) plugin under `tools/skills` has its own contribution pattern — see [tools/skills/README.md](tools/skills/README.md).

## Reporting security issues

Do **not** open a public issue for a security vulnerability. Email the maintainers or use GitHub's [private vulnerability reporting](https://github.com/Abstract-Foundation/abstract-packages/security/advisories/new) so the disclosure can be handled responsibly.

---

Thanks for contributing. If you get stuck, open a discussion or a draft PR — we'd rather pair on a rough branch than watch good work get abandoned.
