# Level 5 — TODO

## Critical Path
- [x] Project concept finalized
- [x] GitHub repo created → https://github.com/get-pinched/level5
- [x] Four agents scaffolded (CIO, Research, Risk, Ops)
- [x] Committee deliberation orchestrator
- [x] Working demo (committee deliberates and trades)
- [x] Hackathon project updated
- [ ] GLAM vault integration (real permissions)
- [x] Arweave logging (via Irys) - *Ported from Pinch*
- [x] Dashboard (solvency clock) - *Ported from Pinch*
- [ ] Integrate Dashboard with Committee (Refactor `src/dashboard.ts`)
- [ ] Devnet deployment
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

## MVP Scope
1. Committee deliberation (working ✅)
2. GLAM vault integration
3. Solvency tracking
4. Basic dashboard (merged)
5. Arweave logging (merged)

## Deadline
Feb 12, 2026 12:00 PM EST (~7 days remaining)
