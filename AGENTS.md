# Agent Conduct — Programming-Tutorial repo

All Kilo sessions in this repo inherit these rules. Source of truth for all decisions (stack, 9-agent roster, publish gate, phases): `.kilo/plans/1794805682670-programming-tutorial-astro-pipeline.md`. Do not re-litigate resolved decisions there.

## Output (token economy)

- Succinct output only: no restated context, no filler, minimal tool narration.
- Every response states: what changed, evidence (command output), next step. No summaries of context the user already has.

## Role tagging

- The 9 agent roles live in `.kilo/agent/<name>.md` (Phase 2). Until those configs exist, use the phase's owning role from the plan (e.g. `[Site Ops]`, `[Design Engineer]`).
- Prefix all agent communication with `[Role Name]`: board posts, task notes, PR descriptions, gate attestations, session responses.

## Git & publishing

- All git work on branches named `agent/<role>/<topic>`; open PRs with `gh pr create`; never push to `main` directly.
- Auto-merge on green: when a PR's required gate check (`check + validate + build`) passes, the session watching the CI gate runs `gh pr merge <n> --squash --admin` immediately — no manual approval step. Task-type sign-offs (publish gate) must be posted in the PR before its final push, so CI green on the final commit is the merge trigger.
- Never block or manually poll while waiting on a PR's CI gate: schedule a recurring cron check (`*/5 * * * *`, `gh pr checks <n>`) that acts only on terminal-state transitions (pass → post result + auto-merge, fail → failing check + log excerpt) and stays silent otherwise.

## Pipeline pointers

- Driver: `.kilo/command/pipeline.md` — "run the orchestrator".
- State: `data/pipeline/` (orchestrator-only writer); per-task notes in `data/pipeline/notes/<task-id>.md`.
