# AI summary & sentiment — decision record (Issue #315)

## Decision

**Shipped, with a stub-first rollout.** The job is live in the backend and
writes `submissions.sentiment` plus the `missions.ai_summary` rollup, but the
default provider is the deterministic offline stub (`AI_PROVIDER=stub`). A live
LLM provider is one config change away and requires no code changes.

## Why stub-first

1. **No external dependency in the critical path.** Submission ingestion keeps
   working when the AI provider is down, rate-limited, or the key is missing —
   the provider degrades to the stub and logs a warning instead of throwing.
2. **No data leaves the deployment by default.** Hunter feedback text stays in
   Postgres until the team deliberately opts into a hosted LLM.
3. **The schema and job pipeline are the risky part, not the provider.** Both
   are exercised identically by the stub.

## Go-live checklist for a real provider

Set these in the backend environment (see [backend/.env.example](../backend/.env.example)):

| Variable | Value |
|---|---|
| `AI_PROVIDER` | `openai` |
| `AI_API_KEY` | key with Chat Completions access |
| `AI_MODEL` | e.g. `gpt-4o-mini` |
| `AI_SWEEP_ENABLED` | `true` to enable the 5-minute catch-up sweep |

Behaviour when enabled:

- Summaries are generated per submission (≤ 8k chars) with
  `temperature: 0.2` and a 20 s timeout; failures fall back to the stub.
- `sentiment` is stored in `[-1, 1]` and clamped.
- The mission rollup (`aiSummary`) keeps any previously generated narrative and
  appends a `-- AI rollup --` section with tone + average score.

## Where the summary is readable

`GET /missions/:id` returns `aiSummary`; the mission-detail UI surfaces it on
the creator dashboard (see `CreatorQuestDetail`). Per-submission scores ride
along on `submissions.sentiment`.
