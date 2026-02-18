# Risk Register

| id | risk | impact | likelihood | mitigation | owner | status |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | Agent loop drifts from product scope | high | medium | strict task table + acceptance criteria | eng lead | open |
| R-002 | Secret leakage through logs | critical | medium | redact logger paths + tests + grep checks | security | open |
| R-003 | Policy bypass in write tools | critical | medium | deny-by-default parser + negative tests | protocol eng | open |
| R-004 | Repeated failing tasks consume full night | medium | high | mark failed with evidence and move to next task | harness | open |
| R-005 | Direct-to-main regressions | critical | medium | mandatory quality gate after each task | harness | open |
| R-006 | Mainnet session policy registry incompatibility | critical | medium | add registry preflight checks + explicit mainnet gating tests | protocol eng | open |
| R-007 | Loop lock contention/stale lock halts unattended execution | high | medium | stale-lock recovery + lock wait + overnight wrapper restart | harness | open |
