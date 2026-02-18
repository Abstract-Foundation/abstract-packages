# Architecture Decisions

| id | date | decision | rationale | status |
| --- | --- | --- | --- | --- |
| ADR-001 | 2026-02-18 | Use standalone `agw-mcp` repo | Separate release/security surface from SDK monorepo | accepted |
| ADR-002 | 2026-02-18 | Session-key-only model for v1 | Align with AGW non-custodial design | accepted |
| ADR-003 | 2026-02-18 | Local stdio MCP first | Faster iteration with lower operational risk | accepted |
| ADR-004 | 2026-02-18 | Direct-to-main autonomous mode | Maximize unattended overnight throughput | accepted |
| ADR-005 | 2026-02-18 | Markdown memory is mandatory | Durable human-readable context across agent runs | accepted |
| ADR-006 | 2026-02-18 | Use 0x as v1 swap backend | Fastest path for common user swap workflow | accepted |
| ADR-007 | 2026-02-18 | Split transaction tools by behavior | `sign_transaction` is non-broadcast; `send_transaction` broadcasts | accepted |
| ADR-008 | 2026-02-18 | Session policies are fully customizable | Product requirement: user-defined limits and permissions | accepted |
| ADR-009 | 2026-02-18 | Testnet-first with easy mainnet config | Lower rollout risk with clear production path | accepted |
| ADR-010 | 2026-02-18 | Never-stop loop policy | User preference for continuous overnight execution | accepted |
| ADR-011 | 2026-02-18 | No hard product-level denylist | User preference: no fixed blocked action classes | accepted |
| ADR-012 | 2026-02-18 | Add machine-readable JSON state alongside markdown | Avoid brittle markdown-only automation state | accepted |
| ADR-013 | 2026-02-18 | Reliability SLOs are mandatory | Prevent silent quality drift in autonomous execution | accepted |
| ADR-014 | 2026-02-18 | Single assistant persona for v1 | Minimize complexity while validating core wallet workflows | accepted |
| ADR-015 | 2026-02-18 | Enforce test criteria + quality + commit/push per task | Keep autonomous throughput high without weakening release discipline | accepted |
| ADR-016 | 2026-02-18 | Companion app is in v1 critical path | AGW session approval UX requires explicit human policy setup and secure handoff | accepted |
