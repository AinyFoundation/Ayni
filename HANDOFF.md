# Handoff

Session state ledger. Update at session-end.

## Current focus

Clean starting point established 2026-07-24. The website is a minimal SvelteKit static site: one layout, one page, two components, one scroll util, five CSS token files. Styling is plain CSS custom properties — no CSS framework. See `README.md` for structure.

## Decisions in effect

- **Backend:** Yjs + Hyperswarm + Tauri 2 (Tiers 1/2/4) + Meshtastic (Tier 3) — [ADR 0004](./docs/adr/0004-yjs-hyperswarm-tauri.md).
- **Design tokens:** `docs/research/design-system-minimal/research.md` (canonical). Living visualization: `docs/design/design-system.html`.
- **Styling:** plain CSS custom properties in `src/design/`. No Tailwind.

## Open work

- [ ] Add `LLM_API_KEY` secret in GitHub once connected (optional; CI degrades to shell-only).
- [ ] Decide if the web build ships as a pure PWA (open question in `docs/research/single-app-architecture/research.md`).
- [ ] Create the separate `ayni-dev/` repo; move provisioner / CLI / protocol / agent / `.infra/` out (per `docs/research/developer-platform/research.md`).
- [ ] `docs/research/design-system-minimal/research.md` still cites the removed `website-design-system.md` as a source — trim that citation when convenient.

## Conventions

- Research → `docs/research/<slug>/research.md` (single file, `## Decisions and revisions` audit trail, Sources block, frontmatter `owns:`).
- Design specs → `docs/design/`. Binding contracts → `docs/adr/` (sparingly).
- Merge: PR needs `oss-gate.yml` green · Squash & Merge · `<area>: <one-line>` commit format · no force-push to `main`.
