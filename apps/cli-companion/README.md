# AGW Companion App

This app is the browser-side trust boundary for AGW session approval. It is not a general control plane.

## Responsibilities

- onboarding and delegated signer approval
- finalize-init callback token creation
- revoke flow
- callback verification key publication

## Entry Routes

- `/session/new`: onboarding entrypoint
- `/session/revoke`: revoke entrypoint

## Required Query Parameters

For `/session/new`:

- `callback_url`
- `chain_id`
- `auth_pubkey`

`callback_url` must already contain a `state` query parameter before the app finalizes or revokes.

Validation lives in:

- `src/lib/onboarding-params.ts`
- `src/lib/redirect.ts`

## Server Routes

- `POST /api/session/provision`
- `POST /api/session/finalize-init`
- `GET /api/session/revoke`
- `POST /api/session/revoke`
- `GET /api/session/callback-key`

## Callback Contract

The app redirects back to the loopback `callback_url` with:

- `session=<signed-token>`

The token is a compact signed payload, not raw base64url JSON. It uses an EdDSA signature envelope produced by `src/lib/server/callback-attestation.ts`.

For `init`, the signed payload includes:

- `version: 2`
- `action: "init"`
- `state`
- `accountAddress`
- `underlyingSignerAddress`
- `chainId`
- `walletId`
- `signerType`
- `signerId`
- `policyIds`
- `signerFingerprint`
- `signerLabel`
- `signerCreatedAt`
- `policyMeta`
- `capabilitySummary`
- freshness claims such as `iss`, `iat`, and `exp`

For `revoke`, the signed payload includes:

- `version: 2`
- `action: "revoke"`
- `state`
- `accountAddress`
- `underlyingSignerAddress`
- `chainId`
- `walletId`
- `signerType`
- `signerId`
- `revokedAt`
- freshness claims such as `iss`, `iat`, and `exp`

## State Machine

The onboarding wizard is centered in `src/stores/useSessionWizardStore.ts`.

Primary states:

- `not_logged_in`
- `select_policy`
- `creating`
- `success`
- `error`

Error recovery routes the user back through policy selection rather than directly to the initial login state.
