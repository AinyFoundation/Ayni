# Handoff

Session state ledger. Update at session-end.

## Current focus

Homepage is now a 450vh scroll-scrubbed horizontal journey (hero + WelcomePanel) followed by three vertical sections on the sanctuary-only surface: OfferingsSection (asymmetric editorial, placeholder categories One/Two/Three, accent dashes, entry-media ceremony frame with `offering-temazcal` placeholders as default), RetreatsSection (bigger quiet invitation, "Find a retreat" + "Stay with us" CTAs), and JournalStrip (compact "latest posts" strip on `--surface-1`, better `.card`-derived JournalCards with ink media top + white dots icon, seam in `JournalStrip.svelte` swaps the static array for a future `/blog` route). Vertical sections use no scroll animations and no dashes in copy. See `docs/research/sanctuary-offerings-landing/research.md` for the decisions and `docs/design/` canon.

Organic background accents: shared `.natural-accent` + `.accent-contour` + `.accent-blob` classes added to `components.css` (edge-anchored, clay/line-2 hairline, hidden on mobile). The frame treatment standardised via `.entry-media` + `.entry-media-frame`, matching the WelcomePanel bungalow so both images share the same style and no drop shadows.

New utility `src/lib/reveal.ts` is dormant. The vertical sections are deliberately static per user's direction; the action is kept in place as a seam for future intentional animated markers (and `[data-reveal]`/`[data-stagger]` in animations.css are its declarative hooks).

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
