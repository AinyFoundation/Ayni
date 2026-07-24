# Research

Decisions-ready research for any architectural topic. Not implementation, not executable code — living documents that capture constraints, landscape, and recommendations.

## Structure

```
docs/research/
├── README.md              ← you are here
└── <slug>/research.md     ← one file per topic
```

## Conventions

- **One `research.md` per topic.** Edit in place; append to `## Decisions and revisions` instead of rewriting.
- **No versioned drafts.** The file is the artifact. There is no `v1.md`, `v2.md`, or sibling `research.md`.
- **Cross-link, don't re-derive.** Each research document defers to the canonical source for its domain (see single-source-of-truth table in `AGENTS.md`).
- **Two statuses only.** `draft` while research is in progress; `reference` once the recommendation (or "no recommendation") is shelf-worthy.

## How a research document is produced

1. `/skill:research-topic` produces `docs/research/<slug>/research.md`.
2. Document is edited in place as research evolves.
3. When the recommendation is final, status flips to `reference`.
4. `HANDOFF.md` gets a one-line outcome entry.

## Related

- Design specs: `docs/design/<slug>.md`
- Binding contracts: `docs/adr/000N-<slug>.md`
- Research skill: `.agents/skills/research-topic/SKILL.md`