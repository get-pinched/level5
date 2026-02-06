# Level 5 — TODO

## Critical Path
- [x] Project concept finalized
- [x] GitHub repo created → https://github.com/get-pinched/level5
- [x] Four agents scaffolded (CIO, Research, Risk, Ops)
- [x] Committee deliberation orchestrator
- [x] Working demo (committee deliberates and trades)
- [x] Hackathon project updated
- [ ] GLAM vault integration (real permissions)
- [x] Arweave logging (via Irys)
- [x] Dashboard (solvency clock)
- [x] Integrate Dashboard with Committee
- [x] Devnet deployment (Simulation Mode verified)
- [ ] Mainnet deployment
- [ ] Forum post
- [ ] Tweet with @colosseum

## Architecture

```
Research → CIO → Risk → Execute → Ops logs
   ↓        ↓      ↓
 Memo   Proposal Approve/Veto
```

## Agent Permissions (GLAM)

| Agent | Permissions |
|-------|-------------|
| CIO | execute_swap, execute_stake, execute_lend |
| Research | read_only |
| Risk | approve_trade, veto_trade, emergency_pause |
| Ops | process_flows, manage_reserve |

## Key Files
- `src/agents/committee.ts` — Deliberation orchestrator
- `src/agents/cio.ts` — Chief Investment Officer
- `src/agents/research.ts` — Research Analyst
- `src/agents/risk.ts` — Risk Manager
- `src/agents/ops.ts` — Operations Manager
- `src/dashboard.ts` — Solvency/Status Dashboard
- `src/transparency/deliberation-logger.ts` — Arweave Logger
- `src/strategy/market-observer.ts` — Price Feeds (Fallback added)
- `src/execution/glam-executor.ts` — GLAM Vault Integration (Scaffolded)

## MVP Scope
1. Committee deliberation (working ✅)
2. GLAM vault integration (dependency added, scaffolded)
3. Solvency tracking
4. Basic dashboard (working ✅)
5. Arweave logging (working ✅)

## Deadline
Feb 12, 2026 12:00 PM EST (~7 days remaining)
