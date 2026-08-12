---
slug: sanctuary-offerings-landing
status: draft
created: 2026-07-31
last-updated: 2026-07-31
sources: 9
---

# Sanctuary Offerings Landing

Researching the next and final sections of the homepage below the horizontal hero — the sanctuary's public story about itself. This is a composition-scope change (~6 new/4 edited files ≈ 10), satisfying the "5+ files" stop-and-ask trigger in `AGENTS.md`. The decision being unblocked: what goes into the vertical journey after the cinematic opener, how it hangs together, and how the journal strip is built as a placeholder that later connects to a `/blog` route without rework.

**Explicitly out of scope:** the blog itself (content model, routing, MD/MDX, CMS, local-first persistence), retreats detail pages, booking/contact forms, a footer/nav, the seven-wings story (deliberately excluded for this main sanctuary-only surface), and any SEO/schema work. Panel 3 ("Third Section") placeholder content is also deferred — the cinematic opener stays hero + welcome; the vertical flow below carries the rest.

## Constraints carried forward

- **Local-first.** All imagery must be local, self-hosted, and offline-operable. No hotlinks, no external CDN imagery. (Satisfied: `main_sanctuary*.webp`, `sanctuary-bungalows*.webp` are checked in under `static/images/`; new placeholders are derived locally.)
- **Design tokens are the single source of visual truth.** All color/spacing/type/radius/motion values trace to `src/design/tokens.css`; zero hardcoded values in components (`src/design/components.css` banner: "All values trace to tokens").
- **Performance contract.** The hero uses a single rAF-coalesced scroll driver (`src/lib/scrollDriver.ts`); all motion is compositor-only (transform/opacity). Vertical sections have no scrub — they use the existing declarative reveal utility. **Zero new scroll machinery.**
- **Minimal-design canon.** `docs/research/design-system-minimal/research.md` governs pacing, palette discipline (7 hues as accent, not decoration), and "images as ceremony, not decoration" (§5.3). The canonical design source wins over any plan.
- **Sanctuary-only focus.** The main landing is the place and its offerings — explicitly not the seven wings. The spectrum/rainbow band motif (the lineage of hues, already used in WelcomePanel) may appear as a quiet nod, the way it does in `WelcomePanel.svelte`, but wings are not merchandise on this surface.
- **One Imagery accent per block.** Each offering carries a single wing accent from `hues-*` kept tight to that block (per the spectrum-bar convention in `tokens.css` / `WelcomePanel.svelte`).

## Landscape

### What exists (verified in-repo)

- **Homepage** (`src/routes/+page.svelte`, 263 lines). A 450vh `.scroll-container` holding a sticky `.scroll-wrapper` and a 300vw horizontal `.panels` strip: `panel-hero` (full-bleed `main_sanctuary.webp` + scale/radius shrink over "Return to the Rhythm of Earth."), `panel` (WelcomePanel), and `panel-third` (an empty `#EADBC0` box reading "Third Section"). A thin dead `.vertical-content` stub ("Content continues below...") sits after the strip — no token reuse, placeholder copy.
- **WelcomePanel** (`src/lib/components/WelcomePanel.svelte`, 301 lines). The most authored piece. Subscribes directly to `subscribeHeroScroll(animate)` and drives reveals via a local `commit`/`fadeUp` write-skipping pattern plus `scrubImage` (the bungalow frame glides in from the right) and `drawLine` (SVG terrace strokes). Locally defines `.welcome-grid` (2-col), `.frame/.frame-inner` (ink-side hairline media frame with `clay` border + corner rule), `.greeting`, `.spectrum` (7 bars in the 7 hues), `.closing` (+ hand-drawn rainbow band behind "The door is open."), `.location-strip` (Calca · Valle Sagrado · 2,928 m). **These classes are scoped to the component — not globally reusable.**
- **Design system** (`src/design/`). `tokens.css` (three-tier: primitives → semantic → component; two papers `#F1E7D4`/`#EADBC0`, two inks `#221c14`/`#422E21`, 7 wing hues + 7 tints, 8-stop spacing scale, Shippori Antique display + Inter body). `typography.css` provides global classes `.display`, `.heading-1…4`, `.lead`, `.body-text`, `.small`, `.eyebrow`. `components.css` provides global `.card`/`.card-title`/`.card-body`, `.btn`/`.btn-primary`/`.btn-secondary`/`.btn-lg`, `.tag`, `.section`, `.page`, and importantly **`.rainbow-line`** (the 7-hue gradient hairline). `animations.css` provides `--ease-hero` and the **`[data-reveal]` / `[data-stagger]`** utilities + reduced-motion gate. `app.css` imports all five design files.
- **Available local imagery.** Two processed, responsive sets only: `main_sanctuary` (webp + 768/1920 + a 5.8MB unoptimised `.png` master) and `sanctuary-bungalows` (webp + 768/1280). No imagery of ayahuasca, temazcal, or food exists yet — hence tasteful local placeholders are required for this pass.

### The honest gap

There is **no global reveal action wired yet.** `animations.css` defines `[data-reveal]`/`[data-stagger]`, but nothing observes them (no IntersectionObserver action exists in `src/lib`). So vertical sections default to hidden forever unless we add that tiny piece once. That's a 1-time addition, deliberately section-agnostic.

### Story arc (Land → Meet → Offer → Join)

The journey should escalate from place to participation:

1. **Land** — hero (done). *You have arrived somewhere rare.*
2. **Meet** — welcome (done). *This is a home, and the door is open.*
3. **Offer** — the next section (this work). *Here is what we hold space for.*
4. **Join** — retreats invitation + journal strip (this work). *Here is how to come / follow.*

Three anchored offerings, from the user: **Shipibo ayahuasca ceremonies**, **temazcal ceremonies**, **retreats**.

## Sources

### Code

- `src/routes/+page.svelte` — HEAD (`7823341`, branch `dev`) — the scroll container, panel strip, dead `.vertical-content` stub, social icons.
- `src/lib/components/WelcomePanel.svelte` — HEAD — the authored welcome panel; source of the frame/greeting/spectrum/location-strip conventions and the `commit`/`fadeUp`/`scrubImage`/`drawLine` scrub pattern.
- `src/lib/scrollDriver.ts` — HEAD — the single rAF-coalesced scroll source of truth and its performance contract.
- `src/lib/components/NavContent.svelte` / `src/routes/+layout.svelte` — HEAD — nav surface and layout shell.
- `src/design/tokens.css` — HEAD — the token tiers, papers/inks, wing hues + tints, spacing + type scales; governs all value choices.
- `src/design/typography.css`, `src/design/components.css`, `src/design/animations.css` — HEAD — the global classes reused below (`.eyebrow`, `.heading-*`, `.lead`, `.card`, `.btn*`, `.rainbow-line`, `[data-reveal]`, `[data-stagger]`, `--ease-hero`).
- `static/images/` (manifest) — checked-in `main_sanctuary*` / `sanctuary-bungalows*` only; confirms placeholder imagery must be generated locally.
- `docs/research/design-system-minimal/research.md` — canonical — palette discipline + "images as ceremony" (§5.3) + pacing rules this design defers to.
- `docs/design/design-system.html` — HEAD — the living token visualization referenced by the canon.

### Web

- None. Decision is fully grounded in checked-in code + the canonical minimal-design research; no external citation required. (Journal/blog data-model and content-architecture decisions are explicitly deferred so a future web-cited pass stays honest.)

## Recommendation

Below the horizontal strip, compose **three vertical sections** in order. All are pure CSS/Svelte — no new dependencies, no new scroll machinery, no schema/auth/crypto. The only new machinery is a tiny, global, framework-free **reveal action** (IntersectionObserver) so the existing `[data-reveal]`/`[data-stagger]` utilities function on the vertical journey; everything else reuses tokens and the established WelcomePanel conventions.

**Section A — Offerings** (`surface-1` paper).
- Asymmetric two-column grid: **left/wide** holds one large `entry-media` frame (clay hairline + `clay-t` fill, the WelcomePanel "image as ceremony" treatment) showing the ayahuasca placeholder; **right/narrow** stacks three `OfferingRow` blocks (hairline bottom border, single accent dash, title + one-line body).
- Eyebrow `THE SANCTUARY` (with a subtle pulsering dot), a Shippori `heading-2` headline (*"Days shaped by the land."*), and a short lead. Each offering's accent: **ayahuasca → clay**, **temazcal → gold**, **retreats → sage**.
- Mobile: single column — figure first, rows stack with `--spacing-s-7` rhythm. Accents stay within each row (no cross-block bleed), satisfying palette discipline.

**Section B — Retreats invitation** (`surface-2` paper-bright).
- Centered Shippori headline + two quiet supporting lines and one `.btn-secondary` hairline CTA ("Enquire about retreats") pointing to `/retreats` (deferred-route seam). A `.rainbow-line` divider above the section quietly reintroduces the seven-hue lineage as a thin thread — a nod, not merchandise.
- This is the soft conversion: calm, single CTa, no form.

**Section C — Journal strip** (`surface-2`, visually grouped with B or a hairline rule between).
- Eyebrow `NOTES FROM THE VALLEY` + `heading-4` title ("Field notes, forthcoming"), then a 3-up grid of **`JournalCard`** (derived from `.card`: hairline border, small uppercase category+date meta, `card-title` Shippori `h4`, two-line `.card-body` excerpt, a `→` read affordance). Built with static placeholder copy now.
- **Seam for /blog:** cards are a pure presentational component with a typed `post` prop and a static array in the parent; a comment marks the swap point so the static array later comes from `/blog` route data with zero markup change. No routing/content-model work here.

**Cause/ADR candidate (do not write unless asked):** *Homepage vertical journey order = Offerings → Retreats invitation → Journal strip, always below the horizontal hero, always token-driven.* This is a binding composition contract worth ratifying as `docs/adr/000N-homepage-vertical-journey.md`, but per constitution the ADR is a human decision.

### Why not the alternatives (one honest sweep)

- **Another horizontal panel for offerings:** fights the existing scrub + adds machinery; vertical pacing reads more premium after the cinematic opener. Rejected.
- **A card grid for offerings:** flattens "ceremony" to "features"; the asymmetric editorial grid (one ceremony image + rows) is the canon-compliant choice. Rejected. (Journal cards intentionally use `.card` because they *are* a repeatable list — the two cases differ.)
- **Wing cards on the main site:** out of scope for the sanctuary-only surface. Rejected.
- **Real blog content model now:** premature; the placeholder seam keeps the door open without committing. Rejected.

## Open questions

- **Real offerings imagery** (ayahuasca / temazcal / food photographs). Placeholders derived from `main_sanctuary` are stand-ins.
- **Retreats CTA destination** — `/retreats` route, a modal, an email link, or WhatsApp? Placeholder points at `/retreats` and is trivially swappable.
- **Blog data source when real** — local MD files vs. MDsveX vs. a local-first store (project-fitting but heavier); deferred to a future web-cited research pass.
- **Panel 3 ("Third Section") fate** — keep as empty closer, give it a quiet closer message, or drop the third panel to tighten the 450vh runway? Deferred; nothing below depends on it.

## Decisions and revisions

- **2026-07-31** — Drafted. Scope fixed to the sanctuary-only vertical journey (offerings + retreats + journal placeholder). Confirmed a single global IntersectionObserver reveal action is required for `[data-reveal]`/`[data-stagger]` to function; otherwise zero new machinery. Three offerings anchored by the user: Shipibo ayahuasca, temazcal, retreats. Placeholder imagery = locally derived from `main_sanctuary.webp`.
- **2026-08-01** — Offerings recomposed per user direction: the static asymmetric editorial grid is replaced by a **pinned image + category scroller**. A 300vh container pins a full-height split view (image fills the left half edge-to-edge, category list on the right); scrolling scrubs a crossfade through per-category images while the active row follows, then the page unpins into Retreats/Journal. This supersedes the "no scroll animation in vertical sections" note for this one section — the scrub is scroll-scrubbed (pure function of position via `bindSectionScroll` in `scrollDriver.ts`), not time-triggered, matching the hero's discipline. Refined same day per user: images transition as a **card sweep** (the current image exits to the left, rotating around its bottom-left corner, revealing the next image already stacked beneath — direction corrected from an earlier slide-in-from-right draft) instead of a crossfade; the right column is a **full swapped panel per category** (title + description + future CTA seam, persistent eyebrow + `01 / 03` counter) rather than a dimming list; a **segmented progress slider** at the image's bottom-left telegraphs the next image's approach (all segments empty at section entry; the active one fills to 1 exactly at its swap); a **PatternDivider** band (Andean stepped-snake border of the greca / stepped-fret family, a.k.a. q'enqo zigzag — each unit one continuous 6px square-wave stroke starting at the bottom: up, down, up, down; the next unit vertically mirrored, alternating ink/gold on clay; slow infinite leftward drift) seams the offerings imagery to the next section, replacing the retreats rainbow-line; and the **white navbar extends over the image region** while it sits under the header — the section publishes a clip-path via a `publishNavClip`/`subscribeNavClip` channel in `scrollDriver.ts` and the layout composes it with the hero's clip (single DOM writer, no style fights). `OfferingRow.svelte` deleted (rows are inline in `OfferingsSection.svelte`). Panel 3 fate resolved: **dropped** — the horizontal strip is now hero + welcome (200vw). Background accents muted per user: `.accent-contour` lost its clay edge (neutral `--color-line-2` hairline, opacity 0.4) and `.accent-blob` removed entirely.
