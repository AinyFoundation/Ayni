# AGENTS.md

Cross-harness AI agent constitution. Read by Pi, Claude Code, Cursor, opencode, Codex, Aider, Gemini CLI, Copilot.

> `CLAUDE.md` is a symlink to this file. On Windows without admin, replace the symlink with a one-line `CLAUDE.md` containing `@AGENTS.md`.

## What this is

A project constitution for AI agents working in this repository. The project's domain, language, and conventions live in `README.md`, `CONTEXT.md`, and `HANDOFF.md` — read those before assuming anything about the codebase.

## Inviolable rules

- **Local-first.** All architecture must support offline operation on a local network. No feature may require a reachable external service for core functionality.
- **Sovereignty first.** Self-hosted only. Zero dependency on external cloud services to remain operational.
- **Open-source only.** No dependency with a non-open-source license. Apache 2.0 or compatible. *Compatible* includes GPL-2.0/GPL-3.0/LGPL when the dependency runs as a separate process (firmware, daemon, system service) with no static linking into Ayni code. See [ADR 0004](./docs/adr/0004-yjs-hyperswarm-tauri.md) for the precedent (Meshtastic, GPL-3.0).
- **Identity is decentralized.** Identity system must not store user credentials in a centralized table. DIDs + Verifiable Credentials.
- **Data is CRDT-friendly.** Data model must be representable as conflict-free types for local-first sync.
- **No code without research in `docs/research/`.** Changes spanning 5+ files, adding dependencies, or touching schema/auth/crypto require a research document at `docs/research/<slug>/research.md` to exist (or be written) before code is written.

## Auto-loaded skills

| Skill | Purpose |
|-------|---------|
| `research-topic` | Non-trivial features (5+ files, new deps, schema/auth/crypto). Pi-direct: uses `worker`/`scout`, `ctx_*`, `mem_*`. Produces `docs/research/<slug>/research.md` with mandatory `## Sources` block. |
| `planning-philosophy` | Earn the right to act before acting. |
| `tdd` | Red-Green-Refactor. |
| `code-quality` | Surgical edits, blast-radius, behavior-focused tests. |
| `gold-standard` | Project coding standard. Universal principles apply to every project. Stack-specific rules live in the marked section at the bottom and are filled in when the project adopts a toolchain. |
| `ponytail` | YAGNI pre-write check. The 7-rung ladder asks: does this need to exist? Is it already in the codebase? Does stdlib do it? Is there a one-line version? |

See [`.agents/skills/README.md`](./.agents/skills/README.md) for the skill directory structure and how to add new skills.

## Stop-and-ask triggers

Halt and ask the user before: new dependencies · schema/auth/crypto changes · replacing existing patterns · 5+ file edits · adding vendor directories. Run `/skill:research-topic` for any of these.

## Open-source readiness

Before declaring work complete, see [`CONTRIBUTING.md`](./CONTRIBUTING.md) and ensure the `oss-gate` workflow (in `.github/workflows/oss-gate.yml`) is green. Before changing the contribution surface or any OSS-contract file, read [`CONTRIBUTING.md`](./CONTRIBUTING.md) § "How this project evolves."

## Research workflow

For any non-trivial work (5+ files, new deps, schema/auth/crypto changes), run `/skill:research-topic`. The skill produces a single `docs/research/<slug>/research.md` per topic (research that informs decisions — no versioned drafts). Design implementation specs go to `docs/design/<slug>.md`. ADRs (binding contracts) go to `docs/adr/000N-<slug>.md`. Once research is shelf-worthy, status flips from `draft` to `reference`; a one-line outcome is appended to HANDOFF.md.

## Single-source-of-truth rule for research

Each architectural topic has exactly one canonical source. Other plans defer to it via cross-link rather than re-deriving. The canonical sources:

| Topic | Canonical source |
|-------|-----------------|
| Backend stack decision | `docs/research/backend-stack/research.md` (Tiers 1/2/4) + `docs/research/mesh-network/research.md` (Tier 3) + [ADR 0004](./docs/adr/0004-yjs-hyperswarm-tauri.md) |
| Connectivity tier semantics | [ADR 0002](./docs/adr/0002-sovereign-connectivity-tiers.md) + `docs/research/sovereign-connectivity-tiers/research.md` |
| Identity / auth | `docs/research/self-sovereign-identity/research.md` |
| Mesh / LAN transport | `docs/research/mesh-network/research.md` |
| App shell + Tauri | `docs/research/single-app-architecture/research.md` + [ADR 0001](./docs/adr/0001-single-app-tauri.md) |
| Cross-surface architecture | `docs/research/unified-platform-architecture/research.md` |
| Web3 / on-chain | `docs/research/web3-architecture/research.md` |
| Developer platform | `docs/research/developer-platform/research.md` |
| AyniDB alternative (Option 4) | `docs/research/aynidb-exploration/research.md` |
| Website / design system | `docs/research/design-system-minimal/research.md` |
| Ecosystem structure / seven wings | [ADR 0003](./docs/adr/0003-seven-wings-ecosystem.md) |

If a plan contradicts the canonical source, the canonical source wins. Update the canonical source first, then propagate to dependents.

## Memory & continuity

- Session start: read `HANDOFF.md` → read `CONTEXT.md` → query `mem_context`.
- Session end: update `HANDOFF.md` → `mem_session_summary`.
- After compact: save the summary, then `mem_context` before continuing.