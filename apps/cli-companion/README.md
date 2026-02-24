# AGW MCP Hosted Onboarding App

This package hosts the browser-side onboarding flow for `agw-mcp init`.

## Entry Point

- Route: `/session/new`
- File: `src/app/session/new/page.tsx`
- Expected query parameters:
  - `callback_url`: loopback callback URL (`http://localhost`, `http://127.0.0.1`, `http://[::1]`)
  - `chain_id`: supported chains only (`11124`, `2741`)

If validation fails, the page renders a non-retryable parameter error and instructs the user to restart from CLI.

## Callback Contract

After wallet link succeeds, the app redirects to `callback_url` with:

- `session=<base64url(json-bundle)>`

Bundle payload fields:

- `accountAddress`
- `chainId`

No signer private key, signer reference, policy, or delegated session data is returned in the redirect.

## State Machine

Wizard state is centralized in `src/stores/useSessionWizardStore.ts`:

- `not_logged_in -> creating -> success`
- Errors transition to `error` and retry returns to `not_logged_in`.

All transitions are invoked through explicit store actions.
