---
description: Run the Orchestrator — drive the content pipeline (task loop, gates, merges). Optional argument for ad-hoc directives (e.g. "run the orchestrator with a focus on T-003").
agent: orchestrator
---

Run the Orchestrator task loop per `.kilo/agent/orchestrator.md`.

$ARGUMENTS

## Task loop

1. **Read state**: `data/pipeline/tasks.json` + recent `data/pipeline/activity.jsonl`. If `$ARGUMENTS` contains a directive, apply it (e.g. prioritize a task id, pause the pipeline, re-assign).
2. **Pick next task**: first `backlog` task in file order (T-001 upward) that has no blocking dependency; mark it `assigned`, record the assignee role, update `updatedAt`, append an activity line. Commit state to the current branch.
3. **Spawn work**: launch the assigned role via the Task tool with its `.kilo/agent/<role>.md` config. The worker opens a PR on branch `agent/<role>/<scope>` — it never merges.
4. **Monitor CI without blocking** (on-demand, no persistent cron): when the PR is opened/pushed, schedule a one-shot `schedule_wakeup` (~3–5 min out) to check the gate; re-arm only while the PR is still pending — pass → post result + auto-merge per AGENTS.md and stop, fail → post failing check + log excerpt and stop. Never poll manually while waiting.
5. **Publish gate** — by task type:
   | type | required gates |
   |---|---|
   | lesson / refresh | CI green + Code Validator attestation + Editorial sign-off + QA & A11y sign-off + sample outputs verified |
   | encyclopedia | CI green + hello-world verification (where toolchain exists) + QA & A11y sign-off |
   | design / infra | CI green + QA & A11y on changed routes |
6. **Final review step**: verify every gate is posted in the PR; commit any final state updates (`status: approved`, activity lines) to the PR branch so merged history carries them.
7. **Merge** (automatic): when the gate check passes, the watching session runs `gh pr merge <n> --squash --admin`. After merge: set task `published`, append activity line, update `/dashboard` data if needed.
8. **Repeat** until no eligible `backlog` tasks remain or a blocker requires user input — then report and stop.

## Invariants

- Only the Orchestrator (or its CI-gate cron watcher) merges, and only on gate-check pass; only the Orchestrator writes `data/pipeline/tasks.json` (workers may append their own task note under `notes/`).
- Rejected tasks: set `status: rejected`, record reason in activity, return to `backlog` on re-dispatch.
- Every state change is a committed JSON/JSONL edit — the dashboard renders from these files at build time.
