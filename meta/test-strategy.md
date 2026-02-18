# Test Strategy

## TDD Policy
Every task must define tests first in task acceptance criteria and include test evidence in `meta/progress.md`.

## Test Layers
1. Unit tests for policy/session/utils modules
2. Tool-level tests for schema handling and policy behavior
3. Integration tests for AGW session client adapter
4. E2E tests on Abstract testnet for full loop confidence
5. Action-parity tests for AGW SDK write/sign actions (`signMessage`, `signTransaction`, `sendTransaction`, `sendCalls`, `writeContract`, `deployContract`)
6. Harness reliability tests (lock recovery, retry behavior, state sync)

## Mandatory Quality Gate
Run after each task completion attempt:

```bash
npm run check-types && npm test && npm run lint && npm run build
```

Lint coverage must include `src`, `companion`, `scripts`, and `test`.

## Failure Handling
- If quality gate fails, mark task `failed`, append failure evidence to progress, continue to next ready task.
- Never silently skip tests for state-changing functionality.

## Completion Discipline
- Each task must have meaningful `tests_required` criteria before execution.
- After quality gates pass, task completion requires `git commit` and `git push`.
