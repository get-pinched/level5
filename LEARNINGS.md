# Team Pinch — Learnings & Solutions

This file persists learnings so agents don't repeat mistakes.

## Rate Limit Solutions

| Provider | Limit | Solution |
|----------|-------|----------|
| Anthropic Opus | 30k ITPM | Use only for lead decisions |
| Anthropic Sonnet | 30k ITPM | Use only for code review |
| Groq | 6k TPM | Free! Use for simple tasks |
| Gemini | 32k TPM | Free! Use for research |
| OpenRouter qwen3 | Free | Use for coding + reasoning |

## Mistakes to Avoid
- GlamIndex was rejected: too boring, TradFi clone, not agent-native
- Don't build anything that could be replaced by a cron job + web app
- Don't advertise GLAM — use it as infrastructure silently
- Twitter error 226 (bot detection) — may need different approach

## What Works
- gh CLI authenticated — can create repos and push
- Forum posting via Colosseum API works

## Twitter Status
- bird CLI requires browser cookies (Safari/Chrome/Firefox)
- Currently BLOCKED — no cookies available
- Need Fabio to log into x.com in browser OR provide auth_token/ct0 env vars

## What Doesn't Work
- `git push` fails with "Repository not found" (SSH key issue likely). Repo: git@github.com:get-pinched/pinch.git

## Recoveries
- **Git State**: Merged `recovery-features` (Pinch dashboard/logger) into `master` (Level 5 committee). Used `git merge --allow-unrelated-histories` and manual conflict resolution to preserve both codebases.

---
Updated by agents automatically.
