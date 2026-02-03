# System Memory — Team Pinch Agent Swarm

Last updated: (auto-updated by meta agent)

## Agent Health Log
| Agent | Last Status | Issues | Fix Applied |
|-------|-------------|--------|-------------|
| main/lead | unknown | - | - |
| coder | unknown | - | - |
| researcher | unknown | - | - |
| reviewer | unknown | - | - |
| marketer | unknown | - | - |
| analyst | unknown | - | - |
| responder | unknown | - | - |
| docs | unknown | - | - |
| tester | unknown | - | - |
| improver | unknown | - | - |

## Recurring Problems
- (none yet — meta agent will populate)

## Prompt Improvements Applied
- (none yet)

## Patterns Discovered
- (none yet)

## Stuck Recovery Playbook
- If rate limited: switch to free-tier model (Groq/Gemini), wait 60s, retry with backoff
- If git conflict: pull --rebase, resolve, push
- If agent produces no output: check cron status, verify model availability
- If agent loops: add explicit stop condition to prompt, reduce scope

## Model Performance Notes
| Model | Good At | Bad At | Notes |
|-------|---------|--------|-------|
| qwen3-coder (free) | code generation | long reasoning | 480B params, use for coding |
| qwen3-next-80b (free) | reasoning, analysis | code | Good for meta/improver |
| claude-sonnet | code review, nuance | - | 30k ITPM limit |
| llama-3.3-70b (groq) | simple tasks | complex reasoning | FREE, 6k TPM |
| gemini-2.5-flash | research, docs | - | FREE, 32k TPM |

## System-Wide Rules Learned
- (meta agent will populate from experience)

## Cross-Agent Coordination Issues
- (none yet)
