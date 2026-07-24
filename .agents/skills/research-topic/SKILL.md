---
name: research-topic
description: Produce a decision-ready research document for any topic, refactor, or migration. Output is a single docs/research/<slug>/research.md. Built for the pi coding agent running on this machine — uses pi's worker/scout subagents, context-mode search, and Engram memory. Sources must be code-backed or web-based and stamped within 2026. Wide topics fan out to parallel subagents (cap 5 notes). Invoke at the start of any non-trivial work — 5+ files, new dependencies, schema/auth/crypto changes.
---

## What this skill is

A research tool that produces decisions-ready documents for the AyniCollective project. The output is exploration, not a queue of work. Implementation is a separate decision made later, by a planning skill that does not yet exist.

The output is always a single file per topic: `docs/research/<slug>/research.md`. No versioned drafts (no `v1.md` / `v2.md`). Audit trail lives inline as a `## Decisions and revisions` section at the bottom of `research.md`.

**Framing:** this skill is research. It is not planning and not execution. If a downstream planning skill appears in the future, it consumes `research.md` as input. If no such skill exists, the research stands alone as a decision document. Either way, this skill does not track lifecycle status, does not archive, and does not invoke execution.

## Scope of this version

This skill is built for one harness on one machine: **pi** running on **this machine**. Tool names below (`worker`, `scout`, `ctx_*`, `mem_*`) refer to pi's actual surface. If a different harness is used, that harness needs its own binding — do not pretend.

Machine-local conventions (paths, aliases, editor binds) belong in personal memory (`mem_save` with `scope: personal`), not in the skill text. The skill stays harness-named, path-free.

## When to invoke

Any non-trivial work that touches 5+ files, adds dependencies, or changes schema/auth/crypto/storage architecture. If unsure, invoke.

## When NOT to invoke

- Single file edits with no architectural decision
- Bug fixes where the fix is obvious
- Documentation edits
- Config tweaks

For these, just edit directly.

## Phases

### Phase 0 — Read constraints

Before writing a single word of research, read:

- `AGENTS.md` — the project constitution. Note the inviolable rules (local-first, sovereignty, open-source-only, decentralized identity, CRDT-friendly data, no-code-without-research).
- `HANDOFF.md` — current session handoff. Last decisions, open questions, what's in flight.
- `CONTEXT.md` — project context, domain, language, conventions.
- One canonical source per architectural topic — see `AGENTS.md` § "Single-source-of-truth rule." If the research touches one of those topics, the canonical source wins; this research defers to it via cross-link rather than re-deriving.

The output of this phase is a working list of constraints the rest of the research must respect.

### Phase 1 — Frame the question

State, in one paragraph:

- **What is being researched** (the topic slug).
- **Why now** (what triggered this — a new dep candidate, a fork in the road, a schema decision, a blocked task).
- **What a good answer looks like** (the decision the research is meant to unblock).
- **What is explicitly out of scope** (so the research doesn't sprawl).

If the trigger is "5+ files or new dep or schema change," the framing must name which of those categories applies. The stop-and-ask triggers in `AGENTS.md` are the canonical list.

### Phase 2 — Gather

Use pi's tools directly. Specific tools, not "whatever the harness has":

- **Local filesystem:** `read` for in-repo files (AGENTS.md, HANDOFF.md, CONTEXT.md, existing `docs/research/`, source code).
- **Index + recall:** `ctx_search` to retrieve snippets already indexed by prior sessions or by `ctx_fetch_and_index` from previous passes. Cheap, run early.
- **Web research:** `ctx_fetch_and_index` (HTTP→markdown→FTS5) for primary sources. Use `requests` array with `concurrency: 4–8` for multi-URL fan-in. Falls back to `web_fetch` only when context-mode is unavailable.
- **Web search:** `web_search` for queries that don't have a known URL.
- **Subagents:** `worker` for general synthesis work (default cheaper model, good for grunt reading and summarization). `scout` for wider reconnaissance. Delegate independent sub-questions in parallel — see Fan-out gate below.
- **Cross-session memory:** `mem_search` / `mem_context` before doing expensive web fetches — past sessions may have already collected it.

**Source discipline.** Three rules, no exceptions:

1. **Code-backed OR web-backed.** Either a source is a checked-in file in this repo (path + commit/heading) or it is a public primary source on the open web (URL + fetch date). No hearsay, no "I think docs said," no LLM-internal knowledge without a citation. If a claim is downstream of an unverified mental model, drop the claim or fetch the source.
2. **2026 currency.** Every web citation includes the fetch date. Every "this library supports X" claim cites a version released in 2026 or notes the last verified version with date. If the latest primary source is from 2024 or earlier, say so in the citation (`last verified 2024-11, may have changed`) and recommend re-checking before action.
3. **Date-stamp the document.** The frontmatter `last-updated` field is the source-of-truth for when the research was performed. The Sources block at the bottom carries per-source dates. If you re-run the research, bump `last-updated` and add a Decisions-and-revisions entry.

Capture each source with enough metadata to find it again: URL, file path, version, commit hash, or canonical doc name.

### Fan-out gate

When the topic naturally decomposes into more than ~5 independent sub-questions, fan them out to parallel `worker` subagents and re-synthesize. Cap at **5 fan-out notes per research session** — coordination overhead grows past that and the synthesis quality degrades.

The fan-out shape:

1. Decompose in Phase 1 (Frame) if the topic is wide. For each note: one paragraph of scope, one paragraph of expected output shape, one Sources block requirement.
2. Dispatch `worker` calls in parallel via pi's parallel-tool-call surface.
3. Each worker returns markdown + a Sources block. The orchestration (this skill) reconciles, drops duplicates, and notes disagreements.
4. The `research.md` body cites each note's findings inline with the worker's section anchor.

Skip fan-out if the topic is single-track (one question, one decision). Fan-out is for breadth; it is not a sign of thoroughness for narrow topics.

### Phase 3 — Synthesize

The output is one file: `docs/research/<slug>/research.md`. Required structure:

```markdown
---
slug: <slug>
status: draft | reference
created: <YYYY-MM-DD>
last-updated: <YYYY-MM-DD>
sources: <count>
---

# <Topic>

<One-paragraph framing from Phase 1.>

## Constraints carried forward

<Bulleted list from Phase 0.>

## Landscape

<What exists today. Compared honestly. Trade-offs surfaced, not buried.>

## Sources

Every claim in this document traces to one of the entries below. No entry = unverified claim. Remove the claim.

### Code

- `<path>` — `<commit/heading>` — `<fetch-date>` — one sentence on why this was read.
- …

### Web

- `<url>` — `<canonical doc name>` — `<fetch-date>` — one sentence on why this was read.
- …

When a web source is older than 2026, append `last verified <YYYY-MM>, may have changed` to its entry.

## Recommendation

<The decision this research supports, with reasoning. If the research did not produce a recommendation, say so and explain what additional input would be needed.>

## Open questions

<Anything that could not be resolved in this pass.>

## Decisions and revisions

<Dated log of what changed and why. The most recent entry is at the top.>
```

Frontmatter rules:

- `slug` — short kebab-case identifier, matches the folder name.
- `status: draft` while research is in progress; flip to `status: reference` when the document is shelf-worthy and the recommendation (or "no recommendation") is final. There is no other status. There is no "active" / "executed" / "archived" — those belong to a future planning skill.
- `sources` — integer count of distinct sources consulted, including in-repo files.
- `last-updated` — set to the date the document was last revised, not just created. Bump on every meaningful change.

### Phase 4 — Hand off

After writing `research.md`:

1. Verify cross-references resolve. If `research.md` links to another topic, that topic's `research.md` must exist. If it doesn't, either write the stub now or drop the link.
2. Update `HANDOFF.md` with a one-line outcome: `<YYYY-MM-DD> — research/<slug>: <one-sentence outcome>.`
3. If the research surfaced an architectural binding that future work must respect, propose an ADR under `docs/adr/000N-<slug>.md` — but do not write the ADR yourself unless explicitly asked. ADRs are a human decision.
4. `mem_session_summary` to capture what was decided and what comes next, with the research file path in the summary so the next session can resume from it.
5. Stop. Do not begin implementation. Implementation is a separate skill or a separate session.

## Anti-patterns

- **Producing v1 / v2 drafts.** There is one file per topic. New perspectives go into the `## Decisions and revisions` audit trail.
- **Re-deriving canonical sources.** If `AGENTS.md` says the canonical source for backend stack is `docs/research/backend-stack/research.md`, link to it — do not retread its arguments.
- **Skipping Phase 0.** The constraints list prevents the research from recommending something the project rules forbid.
- **Sources block missing or invented.** "Code-backed OR web-backed" is not a guideline. If a claim has no traceable source, remove the claim or fetch it.
- **Outdated citations presented as current.** A 2023 release note is not 2026 evidence. Mark it `last verified <date>, may have changed`.
- **Conflating research with planning.** If the document starts looking like a task list with owners and dates, it's a plan, not research. Either stop and rename, or hand off to a planning skill.
- **Writing the ADR.** An ADR is a binding contract. This skill recommends; humans ratify.

## How this fits the broader picture

| Artifact | Skill | Purpose |
|----------|-------|---------|
| `docs/research/<slug>/research.md` | `research-topic` (this skill) | Exploration, comparison, recommendation |
| `docs/design/<slug>.md` | design skills (TBD) | Implementation spec for a single surface |
| `docs/adr/000N-<slug>.md` | human ratification | Binding architectural decision |

A future planning skill — when one exists — will consume `research.md` (and any `design/*.md` / `adr/*.md` it depends on) and produce an executable task list. That skill is out of scope here.
