# Reliability SLOs

## Purpose
Define minimum reliability and quality targets for autonomous AGW MCP development loops.

## SLO Targets

1. Loop health
- Target: >= 85% of autonomous iterations finish with green quality gates over rolling 7 days.
- Gate command: `npm run check-types && npm test && npm run lint && npm run build`.

2. Task completion
- Target: >= 60% of tasks started in overnight runs end in `done` without manual intervention.

3. Regression reopen rate
- Target: < 5% of tasks marked `done` are reopened within 72 hours.

4. Secret hygiene
- Target: 0 known secret leaks in logs or persisted progress artifacts.

5. Write-path test discipline
- Target: 100% of write-tool changes include at least one success-path test and one denial/failure-path test.

6. Read-path responsiveness (testnet)
- Target: p95 < 2s for `get_*` read tools under normal network conditions.

7. Preflight responsiveness (testnet)
- Target: p95 < 4s for write tool preview/preflight paths (execution excluded).

## Reporting
- Nightly evaluation updates `meta/progress.md` and `meta/state.json`.
- Failures are logged in `meta/risks.md` with mitigation owner.

## Status Format
Use these states per SLO in `meta/state.json`:
- `green`: currently meeting target
- `yellow`: trending toward violation
- `red`: target violated
