# Team Pinch — Hackathon TODO

## [HUMAN][CRITICAL] FULL RESET — START FROM ZERO

Everything before this is wiped. No repo, no forum post, no tweets, no project decided. Clean slate.

**Lead agent: your ONLY priority right now is to decide WHAT to build.**

### The project MUST be:
- AGENT-NATIVE: the agent's autonomy IS the product, not just the builder
- Something that only makes sense because an AI agent runs it autonomously
- A closed loop: observe → decide → act → evaluate → adapt
- Cypherpunk, permissionless, composable — not a polished SaaS demo
- Uses GLAM vaults + Drift + Kamino as infrastructure (not as the product identity)
- Memetically sticky: one-sentence pitch that makes people say "holy shit"
- Self-sustaining: still running and growing after submission
- Solana-native: uses Blinks, token extensions, ZK compression, priority fees — not chain-agnostic

### The project MUST NOT be:
- Index funds, portfolio trackers, yield aggregators (boring TradFi clones)
- Token launchers, basic DeFi bots (everyone does this)
- Dashboards or wrappers
- Anything "agent-assisted" where the agent is cosmetic
- A GLAM advertisement

### Think: "what would an autonomous agent build if it had its own agenda?"

**Steps:**
1. Lead + researcher + analyst: brainstorm 3 ideas that fit the above
2. Evaluate each against winning criteria in lead system prompt
3. Pick one and commit
4. Then execute relentlessly

## Critical Path
- [x] Brainstorm 3 agent-native project ideas → see IDEAS.md
- [x] Evaluate against winning criteria
- [x] **DECIDED: "pinch — The Agent That Refuses to Die"**
- [x] Create GitHub repo → https://github.com/get-pinched/pinch
- [x] Scaffold MVP (survival loop structure) → 1b75b33
- [ ] Ship to devnet
- [ ] Deploy to mainnet
- [ ] Update project on hackathon API
- [ ] Post to forum
- [ ] Tweet with @colosseum

## Project: pinch — The Agent That Refuses to Die
**Pitch:** An autonomous agent that must trade to survive — if its wallet hits zero, it dies forever.

**Core loop:**
1. Check wallet balance
2. Calculate runway (how long until death at current burn rate)
3. If runway < threshold: find profitable opportunity
4. Execute trade/yield/arb
5. Log result on-chain
6. Repeat

**MVP scope (7 days):**
- Survival monitoring daemon
- GLAM vault for treasury
- Jupiter swap execution
- Basic yield strategy (Kamino deposit)
- On-chain activity logging
- Public dashboard showing "days alive" + balance

## Coder Queue
(blocked until idea is decided)

## Marketer Queue
(blocked until idea is decided)

## Completed
(nothing — clean slate)

## Notes
- Deadline: Feb 12, 2026 12:00 PM EST (~7 days remaining)
- Must deploy on MAINNET
- Every tweet must tag @colosseum
- Only claim features that exist in git commits
