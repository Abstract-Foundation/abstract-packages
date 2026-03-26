# Releasing

This repository uses Changesets for versioning and GitHub Actions for CI and
publishing.

## Workflow

1. Run `pnpm changeset` in any PR that changes `@abstract-foundation/mpp`.
2. Merge changesets into `main`.
3. The `Release PR` workflow opens or updates a `Version Packages` pull request.
4. Merge the `Version Packages` pull request.
5. The `Publish` workflow verifies the merged commit, waits for approval on the
   protected `npm` environment, and then publishes to npm.

## GitHub setup

Create a GitHub environment named `npm` and configure:

- Required reviewers for the publish approval gate
- Optional `prevent self-review` if you want a second person to approve every
  release

The publish job references that environment directly in
`.github/workflows/publish.yml`.

## npm setup

Configure npm trusted publishing for `@abstract-foundation/mpp`:

- Repository owner: `Abstract-Foundation`
- Repository: `mpp-abstract`
- Workflow filename: `publish.yml`
- Environment name: `npm`

This workflow uses npm trusted publishing with GitHub OIDC, so it does not need
an `NPM_TOKEN`.

## Changesets bot

The repo-local automation is already configured with `changesets/action`, which
creates and maintains the `Version Packages` pull request.

If you also want PR reminder comments from the Changesets GitHub App, install
the Changesets bot separately from GitHub Apps. That install cannot be done from
the repository files alone.
