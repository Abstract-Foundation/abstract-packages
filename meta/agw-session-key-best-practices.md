# AGW Session Key Best Practices

Primary references:
- Session keys overview: https://docs.abs.xyz/abstract-global-wallet/session-keys/overview
- Going to production (session policy registry): https://docs.abs.xyz/abstract-global-wallet/session-keys/going-to-production
- AGW actions: `deployContract`, `signTransaction`, `sendTransaction`, `sendCalls`, `signMessage`, `writeContract`

## Policy Defaults (v1)
- Default to short-lived sessions (hours, not days).
- Require explicit `feeLimit`, `maxValuePerUse`, and per-target policies.
- Prefer `LimitType.Lifetime`/`Allowance` over unlimited limits unless user explicitly opts in.
- Scope call policies by exact `target + selector`; avoid wildcard behavior.
- Require explicit destination constraints for approval/transfer-like selectors.

## Mainnet Requirements
- For Abstract mainnet, ensure policies are compatible with `SessionKeyPolicyRegistry`.
- Treat registry `Unset` and `Denied` states as hard failures in write-path preflight.
- Keep testnet-first rollout, with mainnet behind explicit config + checks.

## Action Parity Requirements
- MCP write/sign tools should route through official AGW action surface:
  - `signMessage`
  - `signTransaction`
  - `sendTransaction`
  - `sendCalls`
  - `writeContract`
  - `deployContract`
- Add parity tests so tool handlers prove they call the expected AGW action.
