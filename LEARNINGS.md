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

## What Doesn't Work

---
Updated by agents automatically.
