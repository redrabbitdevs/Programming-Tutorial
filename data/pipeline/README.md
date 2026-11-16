# `data/pipeline/` — pipeline state

Single source of truth for the content pipeline. Rendered at build time by `/dashboard` and summarized in the terminal by `npm run dashboard`.

## Writer rule

**Only the Orchestrator writes `tasks.json` / `activity.jsonl`.** As the final step of reviewing a PR, the Orchestrator commits the state update (task → `approved`/`published`, activity lines consolidated from the task note + board posts) **to the PR branch**, then approves and squash-merges. No separate state PRs.

Workers may only add their own task note under `notes/` on their own branch.

## Files

| File | Format | Purpose |
|---|---|---|
| `tasks.json` | JSON `{version, tasks[]}` | Task board (see schema below). Array order = execution priority; the Orchestrator picks the first eligible `backlog` task top-down. |
| `activity.jsonl` | JSON lines, one event per line | Append-only timeline of inter-agent interactions and gate transitions. |
| `notes/<task-id>.md` | Markdown, one file per task | Worker's task note: what was done, evidence (command output), open questions. Written on the worker's branch; committed to `main` via the PR merge. |

## Task schema (`tasks.json`)

```jsonc
{
  "id": "T-002",                    // unique, T-NNN, immutable
  "title": "Short human title",     // for /dashboard display (extension beyond plan schema)
  "agent": "lesson-writer",         // owning role = .kilo/agent/<agent>.md
  "type": "lesson",                 // lesson | encyclopedia | design | infra | refresh
  "lang": "python",                 // language slug, or null for cross-language work
  "branch": "agent/lesson-writer/python-batch-1",  // set on assign
  "pr": 5,                          // PR number, set when the PR opens (or null)
  "status": "in_progress",          // see lifecycle below
  "updatedAt": "2026-11-16T10:15:57Z",
  "history": [
    { "ts": "...", "from": "backlog", "to": "assigned", "note": "..." }
  ]
}
```

Status lifecycle: `backlog → assigned → in_progress → review → approved | rejected → published`. A `rejected` task returns to work on the same branch (PR updates) and re-enters `review`; the full gate re-runs.

## Activity schema (`activity.jsonl`)

One JSON object per line: `{ts, taskId, from, to, kind, note}` with `kind: assign | handoff | reply | review | gate_pass | gate_fail | merge`. Pre-seed events may use `taskId: null`.

## Notes convention (`notes/<task-id>.md`)

```markdown
# T-002 — <title>  [Role Tag]

## What was done
...

## Evidence
<command output / PR check results>

## Open questions / handoffs
...
```

One file per task → no cross-branch conflicts. The Orchestrator consolidates the note + board posts into `activity.jsonl` during final review.
