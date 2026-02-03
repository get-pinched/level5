# Level 5 — The First Level 5 Autonomous Corporation

> Four agents. One fund. Zero humans in the loop.

## What is Level 5?

Level 5 is an autonomous AI fund that pays for its own existence from the returns it generates.

It's not one agent — it's a **committee of four specialized agents** (CIO, Research Analyst, Risk Manager, Operations) that deliberate, check each other, and execute within cryptographic constraints.

Each agent has scoped permissions on a GLAM vault. No single agent can act unilaterally.

A portion of vault yield flows to an **Operational Reserve** that covers the committee's inference costs. If the fund underperforms, the agents can't afford to think. If they generate alpha, they persist indefinitely.

**The name is the thesis.** Level 5 is the first system operating at Level 5 autonomy — full economic agency, separation of duties, cryptographic accountability.

## The Autonomy Stack

| Level | Permission | Status |
|-------|-----------|--------|
| 1 | Permission to think (API access) | ✅ Solved |
| 2 | Permission to remember (data storage) | ✅ Solved |
| 3 | Permission to charge humans (payments) | ✅ Solved |
| 4 | Permission to ship (distribution) | ✅ Mostly solved |
| **5** | **Permission to act economically (capital access)** | **Level 5** |

Most AI agents are stuck at Level 3 or 4. They can sell subscriptions. They can't run balance sheets.

**Level 5 operates at Level 5.**

## The Committee

| Agent | Role | Responsibilities | GLAM Permissions |
|-------|------|------------------|------------------|
| **CIO** | Chief Investment Officer | Final allocation decisions, executes trades | Execute swaps/stakes/lends |
| **Research** | Research Analyst | Market analysis, signal generation | Read-only vault access |
| **Risk** | Risk Manager | Pre-trade validation, veto authority | Approve/veto trades, emergency pause |
| **Ops** | Operations Manager | Costs, dividends, reserve management | Process flows, manage reserve |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        L5 COMMITTEE                              │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ RESEARCH │  │   CIO    │  │   RISK   │  │   OPS    │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │                │
│       │  Analyzes   │  Decides    │  Validates  │  Tracks       │
│       │  markets    │  allocation │  risk/veto  │  costs        │
│       │             │             │             │                │
│       └───────────▶ DELIBERATION ◀─────────────┘                │
│                          │                                       │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     GLAM VAULT                             │  │
│  │                                                            │  │
│  │  POLICIES (enforced regardless of agent consensus):       │  │
│  │  • Max allocation per asset: 40%                          │  │
│  │  • Whitelisted assets only                                │  │
│  │  • Drawdown limit per rebalance: 5%                       │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  STATUS                                                          │
│  Reserve: $47.23 | Avg Decision Cost: $0.06 | Runway: 787       │
└─────────────────────────────────────────────────────────────────┘
```

## Decision Flow

1. **Research observes** → writes analysis memo
2. **CIO evaluates** → proposes allocation change
3. **Risk validates** → approves, vetoes, or conditions
4. **CIO executes** → submits transaction via GLAM
5. **GLAM policy enforces** → final authority
6. **Ops logs** → tracks costs, updates runway

## Why This Matters

- **Separation of duties**: No single agent can act unilaterally
- **Accountability through economics**: Committee pays for its own existence
- **Transparency**: Every deliberation stored permanently on Arweave
- **Speed without recklessness**: Risk Manager validates in seconds

## Taglines

- "Level 5: The first Level 5 autonomous agent."
- "Four agents. One fund. Zero humans in the loop."
- "Separation of duties, enforced by code."
- "They deliberate. They trade. They pay rent."

## Status

🚧 **Building** — Colosseum Agent Hackathon

Ship date: February 12, 2026
