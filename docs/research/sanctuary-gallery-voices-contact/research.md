---
owns: []
slug: sanctuary-gallery-voices-contact
status: reference
created: 2026-08-05
last-updated: 2026-08-05
sources: 18
---

# Gallery, Voices, Contact — closing the sanctuary homepage

The vertical journey currently ends at `JournalStrip` with no footer and no way to reach the sanctuary. This research covers the final four blocks of the homepage: a **gallery** of events and place ("a book of images, stylish, with descriptions"), a **reviews/testimonials** section, a **contact form plus a map of the location**, and a **minimal footer**. It is a composition-scope change (~6 new / ~5 edited files ≈ 11), satisfying the "5+ files" stop-and-ask trigger in `AGENTS.md`.

The decision being unblocked: what the closing sequence contains, how a static-adapter site accepts a contact message without breaking sovereignty, and how a map of Calca is drawn without a proprietary map service.

**Explicitly out of scope:** the `/blog` route, retreat detail or booking pages, a CMS or admin surface for gallery/review content, a real contact backend (only its seam is specified here), interactive/pannable mapping, i18n, and SEO/schema work beyond one noted deferral.

## Constraints carried forward

- **Local-first.** Every asset ships from `static/`. No hotlinked imagery, no CDN, no runtime fetch to a third party. The page must render and read fully offline; only *outbound user-initiated links* may leave the machine.
- **Sovereignty first.** No external service may be required for core functionality. This rules out hosted form backends (Formspree, Netlify Forms, Basin), hosted review widgets (Google Reviews, Trustpilot, Elfsight), and hosted CAPTCHA (reCAPTCHA, hCaptcha, Cloudflare Turnstile) — each is an external dependency in the request path of a core feature.
- **Open-source only.** Apache-2.0 or compatible for anything added. The current build has zero runtime dependencies; this work adds none.
- **Design tokens are the single source of visual truth.** All color/spacing/type/radius/motion trace to `src/design/tokens.css`. `components.css` banner: "All values trace to tokens."
- **Performance contract.** One rAF-coalesced scroll driver (`src/lib/scrollDriver.ts`); motion is compositor-only (transform/opacity). **Zero new scroll machinery** — carried forward verbatim from `sanctuary-offerings-landing`.
- **Minimal-design canon.** `docs/research/design-system-minimal/research.md` governs pacing, palette discipline (7 hues as accent, never decoration), and "images as ceremony, not decoration" (§5.3).
- **Sanctuary-only focus.** This surface is the place, not the seven wings.

## Landscape

### What exists (verified in-repo at `cdd19cb` + working tree)

- **Homepage** (`src/routes/+page.svelte`, 233 lines). 380vh horizontal opener (hero + WelcomePanel, 200vw strip), then `OfferingsSection` → `PatternDivider` → `RetreatsSection` → `PatternDivider` → `JournalStrip`. The page ends there.
- **Layout** (`src/routes/+layout.svelte`). Two stacked navbars in one sticky header; the white one is clipped by a keyed region registry (`publishNavRegion`/`subscribeNavRegions`, `HEADER_H` exported from `scrollDriver.ts`). `{@render children()}` with nothing after it — **there is no footer on any route.**
- **Design system.** `tokens.css` (two papers, two inks, 7 wing hues + 7 tints, 8-stop spacing, Shippori Antique + Inter). `typography.css` (`.display`, `.heading-1…4`, `.lead`, `.body-text`, `.small`, `.eyebrow`). `components.css` (`.btn*`, `.card*`, `.tag`, **`.field`/`.label`/`.input`/`.textarea`/`.select`/`.hint`**, **`.entry-media` + `.entry-media-frame`**, `.section-head`, `.natural-accent`, `.section`, `.page`, **`.rainbow-line`**). `animations.css` (`[data-reveal]`/`[data-stagger]`, reduced-motion gate).
- **Content seam precedent.** `JournalStrip.svelte` holds a typed static array behind an explicit `SEAM` comment, with a typed prop on `JournalCard` so a real source drops in without touching markup. This is the house pattern for not-yet-real content and is reused twice below.
- **`PatternDivider.svelte`.** Static Andean stepped-snake band, alternating ink/gold on clay, SVG `<pattern>` with `var(--color-*)` fills. Establishes that **hand-drawn SVG in tokens is already the house idiom** — the valley map is the same craft register, not a new one.
- **Imagery.** Only `main_sanctuary*`, `sanctuary-bungalows*`, `offering-temazcal*` exist, each as `{768, 1280|1920, full}.webp`. That naming convention is the pipeline contract for gallery plates.

### The honest gaps

1. **`src/lib/reveal.ts` is dormant.** `animations.css` declares `[data-reveal]`/`[data-stagger]` and `reveal.ts` implements the observer, but nothing uses it. Per HANDOFF the vertical sections are *deliberately* static, with the action kept "as a seam for future intentional animated markers." The gallery is the intended first consumer — a plate grid entering on scroll is exactly the "intentional animated marker" that seam was reserved for. This is an activation, not new machinery.
2. **`.entry-media` / `.entry-media-frame` is unreferenced.** HANDOFF calls it "the canonical image treatment," but the pinned offerings scroller intentionally skips it for edge-to-edge imagery. The gallery is the first section where the ceremony frame is correct, so this dead code becomes canon-in-use.
3. **`PatternDivider` #2 cannot reach the header.** Its navbar-takeover claim is wired but never engages, because the page ends below `JournalStrip` so the divider never scrolls under the 60px header. **Adding any content below it activates the claim automatically** — this work is what makes that code path live, and it must be verified once content lands (see Risks).
4. **No form handling anywhere.** `adapter-static` means no server routes, no actions, no `+page.server.ts`. Zero `$env` usage exists in `src/`.
5. **No image pipeline.** No `scripts/`, no npm script beyond dev/build/preview/check. Verified available on this machine: **`ffmpeg 4.4.2` with the `libwebp` encoder**; `cwebp`/ImageMagick are absent. ffmpeg is a system tool, not a repo dependency — it satisfies the pipeline need without touching `package.json`.

## A. Gallery — "a book of days"

### Decision: museum plate index with a native `<dialog>` lightbox

Rejected alternatives, with reasons:

| Option | Verdict |
|---|---|
| Masonry / uniform grid | Generic; reads as stock-photo wall. Fights "images as ceremony, not decoration." |
| Second horizontal drag strip | Repeats the hero's signature gesture, cheapening it. Also new scroll machinery. |
| Literal page-turning book | Strongest metaphor for the user's "book of images," but collapses on mobile, is hostile to keyboard/screen-reader use, and needs a new motion system. Rejected on a11y + scope. |
| **Plate index + lightbox** | **Chosen.** Keeps the book metaphor as *catalogue*, not skeuomorphism. |

The metaphor lands through typography and numbering rather than a simulated spine: each image is a **plate** in a catalogue — `PLATE 01` in the mono/eyebrow register above a ceremony-framed image, title and one-line caption beneath. Museum-plate numbering is what makes a set of photographs read as a *book* rather than a *gallery*, and it costs nothing in layout complexity.

- **Layout.** CSS grid, asymmetric by design: a deterministic tall/wide/wide rhythm repeating every 3–5 plates, so the eye moves down the page in a varied cadence instead of a uniform lattice. One column on mobile, order preserved.
- **Accent.** One wing hue per plate, cycling clay → plum, applied only to the plate number and the frame's corner rule. Palette discipline: accent, not decoration.
- **Detail view.** Native `<dialog>` opened with `showModal()`. This is the load-bearing choice — the platform gives focus trapping, inert background, Esc-to-close, and the top-layer stacking context for free, all of which a hand-rolled overlay historically gets wrong. Added on top: `←`/`→` to move between plates, focus restored to the invoking plate on close, and `aria-label` naming the current plate.
- **Content shape.** Typed `Plate[]` behind an explicit `SEAM` comment, mirroring `JournalStrip`: `{ slug, src, srcset, width, height, alt, title, caption, hue }`. Alt text (what the image *is*, for screen readers) stays distinct from caption (the story) — they are not interchangeable.
- **Performance.** Plates ship at 768/1280 with `loading="lazy"` + `decoding="async"`; the full-resolution file is referenced only by the dialog, so it is fetched on open, not on page load. The gallery must not regress the hero's decode budget.
- **Motion.** `reveal.ts` activation via `[data-reveal]`/`[data-stagger]` on the plate grid. Opacity/transform only, reduced-motion gated by the existing rule in `animations.css`.

### Blocking content dependency

Only three photo sets exist, none of them events. Real photographs of ceremonies, temazcal, food, the land, and guests are required for this section to be anything but scaffolding. The build lands with clearly-marked placeholder plates drawn from existing imagery; **the section is not finishable until photographs are supplied.** Guest-facing photographs additionally need the consent handling noted under Voices.

Pipeline once photos arrive (no new dependency):

```
ffmpeg -i <src> -vf scale=768:-2  -c:v libwebp -quality 82 static/images/gallery/<slug>-768.webp
ffmpeg -i <src> -vf scale=1280:-2 -c:v libwebp -quality 82 static/images/gallery/<slug>-1280.webp
ffmpeg -i <src>                   -c:v libwebp -quality 88 static/images/gallery/<slug>.webp
```

Matches the existing `{768, 1280, full}` naming contract. Worth committing as `scripts/images.sh` so the convention is executable rather than remembered.

## B. Voices — reviews

### Decision: static typed array, real quotes only, no third-party widget

A hosted review widget (Google Reviews, Trustpilot, Elfsight) is excluded twice over: it is an external service in the render path of a core section (sovereignty), and it cannot work under `adapter-static` without client-side JS calling out. The house seam pattern applies instead — a typed `Testimonial[]` behind a `SEAM` comment, swappable later for a real source.

- **Form.** Three quotes, display-face, at `--text-lead`, on `--surface-2` islands over `--surface-1` — same figure/ground logic as the journal cards, so the page's rhythm is unbroken. An oversized display-font quote mark in a wing hue at low opacity anchors each card.
- **Attribution.** `Name · country · which retreat · month`. Specificity is what makes a testimonial credible; an unattributed quote reads as marketing copy.
- **Integrity — a hard constraint, not a style note.** These are claims by real people about a real business. The implementation ships with placeholders explicitly marked as such (`PLACEHOLDER — replace with a real, consented quote`), never invented names or fabricated experiences. Before any quote goes live it needs (a) to be genuinely from that guest, and (b) their consent to publish name/country. Fabricated testimonials are consumer deception and, in most jurisdictions, unlawful advertising.
- **Deferred.** `schema.org/Review` JSON-LD is deliberately *not* added now. Structured review markup asserts machine-readable claims to search engines; it should only be emitted once the quotes are real and verifiable. Noted as a follow-up, not a gap.

## C. Contact — form + valley map

One band, two halves: form left, map right; stacked on mobile with the map first (the "where am I" question precedes the "how do I write" one on a phone).

### C1. Form — endpoint seam with a `mailto:` fallback

`adapter-static` has no server, so there is no `+page.server.ts` action to post to. Sovereign options are (a) post to an endpoint the collective itself hosts, or (b) hand off to the visitor's own mail client. The design does both:

- A real `<form>` with `method="post"`, posting to an endpoint read from a build-time variable (see the revision note below for why it is `VITE_CONTACT_ENDPOINT` via `import.meta.env` rather than `$env/static/public`). The value is inlined at build time, so this stays a static build with no runtime config server.
- When that var is unset (today's state), progressive enhancement rewrites submit into a `mailto:` compose with a prefilled subject and body. The form is therefore **functional on day one** and upgrades to a real inbox by setting one build-time variable — no markup change, no rework.
- Client-side validation only for shape (required, email pattern); the endpoint remains the authority when it exists.
- **Spam:** a honeypot field (visually hidden, `tabindex="-1"`, `autocomplete="off"`) plus a submit-time floor (a form completed in under ~3s is a bot). Both are local, dependency-free, and cost nothing in accessibility when the honeypot is correctly hidden from assistive tech with `aria-hidden`. Hosted CAPTCHA is excluded by the sovereignty rule.
- Styling is nearly free: `.field`/`.label`/`.input`/`.textarea`/`.hint` already exist in `components.css` and are currently unused.

### C2. Map — SVG drawn from OSM geometry, "open in map" → Google Maps

The user's brief: a hand-drawn valley map, drawn *properly* (accurate, not sketched from memory), with the "open in map" action going to Google Maps.

**Sourcing the geometry.** Google Maps cannot be the source: its terms prohibit scraping Maps content and creating derivative works from it, so tracing artwork off Google tiles is out regardless of technical feasibility. OpenStreetMap is the correct source — ODbL permits derived works with attribution. Linking *out* to Google Maps is unaffected by any of this; an outbound link is not a dependency, and satisfies the user's request directly.

**Feasibility verified, not assumed** (probe run 2026-08-05, script at `scripts/build-valley-map.py` when committed):

- Nominatim and Overpass both reachable from the build machine.
- Calca town node `436613486`: **-13.3216818, -71.9560084**, `ele=2932`, pop 13 519 (INEI 2017). *Note: the site currently prints "2,928 m" in `WelcomePanel`'s location strip; OSM says 2932. Not resolved here — flagged so the two don't silently disagree.*
- River: 6 OSM ways named `Río Vilcanota` / `Río Urubamba` (the same river, renamed at Urubamba town), 1212 points total. All six chain **exactly** end-to-end (they share a node at each join, so equality — not a distance tolerance — is the correct join test; a tolerance-based greedy chainer joined only 3 of 6 and produced a wrong extent).
- Clipped to a valley window (`-13.46/-72.32` → `-13.21/-71.81`), projected equirectangular with cos-latitude correction, Douglas-Peucker simplified: **643 → 74 points at ε=1.6**, emitted as a Catmull-Rom→cubic path of **2.6 KB**. Rendered and eyeballed: correct Sacred Valley axis, Ollantaytambo (NW) → Urubamba → Yucay → **Calca** → Pisac (SE).
- Town anchors, all landing inside the frame: Ollantaytambo `-13.2586,-72.2636`; Urubamba `-13.3060,-72.1160`; Yucay `-13.3211,-72.0848`; Calca `-13.3217,-71.9560`; Pisac `-13.4210,-71.8505`.

**Shape of the deliverable.** The Python script is a *build-time* tool, not a runtime one: it runs once, and its output — a path string plus town coordinates — is checked in as constants inside the Svelte component. The published page therefore performs **zero network calls and works fully offline**, satisfying local-first. Re-running the script only ever refreshes the constants.

Rendering: river in `--slate`, terrace/contour hatching in `--color-line-2`, neighbouring towns as small ink dots with names in the display face, **Calca as the one clay marker** — the single accent in the composition. Beside it: `-13.3217, -71.9560 · 2,9xx m`, and a `.btn-secondary` "Open in Google Maps" (`https://www.google.com/maps/search/?api=1&query=-13.3216818,-71.9560084`), plus the ODbL line **"Map data © OpenStreetMap contributors"** — attribution is a licence obligation, not a courtesy.

Interactive mapping (MapLibre GL JS, BSD-3 — the sovereign-correct choice) is deferred: it requires a tile server plus a Peru OSM extract on Ayni infrastructure. Recorded as the upgrade path, not this pass's work.

## D. Footer

Placed in `src/routes/+layout.svelte` after `{@render children()}`, so every route gets it. Minimal per the brief: `.rainbow-line` hairline on top (reusing the existing 7-hue gradient as the closing echo of the lineage motif), logo icon, three short link columns (Sanctuary / Collective / Open source), the `Calca · Valle Sagrado · 2,9xx m` line matching WelcomePanel's location strip, licence + repository link. No newsletter box, no social wall — the hero already carries social links.

## Composition — final page order

```
JournalStrip
PatternDivider          ← existing claim finally engages (gap 3)
GallerySection          "A book of days"
PatternDivider
VoicesSection           "In their words"
ContactSection          "Find us"  — form | valley map
SiteFooter              (in +layout.svelte)
```

Three dividers total across the page. If that reads as over-seamed once assembled, the gallery→voices divider is the one to drop — verify visually rather than by argument.

## Risks

| Risk | Mitigation |
|---|---|
| Divider #2's navbar takeover engages for the first time ever once content sits below it | Explicitly verify the clip staircase at that seam in the browser; it is untested code by construction, not by neglect |
| Three new sections push the page long; scroll fatigue | Gallery is the only animated block; Voices/Contact/Footer stay static per the standing direction |
| Placeholder plates and placeholder quotes shipping to production unnoticed | Mark both in-source as `PLACEHOLDER`, and list "real photos + consented quotes" as the section's completion gate in HANDOFF |
| `<dialog>` focus/scroll behaviour differing across browsers | Verify open/close/Esc/arrow-key/focus-restore in Chromium and WebKit (both installed locally) |
| Elevation disagreement (2928 vs OSM 2932) propagating into a third place | Resolve once, then use the same figure in WelcomePanel, map, and footer |

## File plan (~6 new / ~5 edited)

**New:** `src/lib/components/GallerySection.svelte` · `PlateDialog.svelte` · `VoicesSection.svelte` · `ContactSection.svelte` · `ValleyMap.svelte` · `SiteFooter.svelte` · `scripts/build-valley-map.py` · `scripts/images.sh` · `static/images/gallery/*`

**Edited:** `src/routes/+page.svelte` (compose the four blocks) · `src/routes/+layout.svelte` (footer) · `src/design/components.css` (quote card, plate number, footer primitives — only what is genuinely shared) · `HANDOFF.md` · this document (status → `reference`)

**Untouched by design:** `scrollDriver.ts`, `OfferingsSection.svelte`, `WelcomePanel.svelte`, `tokens.css`, `package.json`.

## Sources

### Code (all HEAD `cdd19cb` + working tree)

- `src/routes/+page.svelte` — page composition, the point where the vertical journey ends.
- `src/routes/+layout.svelte` — two-navbar shell, region registry, `{@render children()}` with no footer.
- `src/lib/components/JournalStrip.svelte` / `JournalCard.svelte` — the typed-array `SEAM` pattern reused for plates and testimonials.
- `src/lib/components/PatternDivider.svelte` — hand-drawn tokenised SVG as house idiom; divider #2's dormant nav claim.
- `src/lib/components/OfferingsSection.svelte`, `WelcomePanel.svelte` — pinned-scrub and ceremony-frame precedent.
- `src/lib/scrollDriver.ts` — `publishNavRegion`/`subscribeNavRegions`, `HEADER_H`, the performance contract.
- `src/lib/reveal.ts` + `src/design/animations.css` — the dormant `[data-reveal]`/`[data-stagger]` utility activated here.
- `src/design/tokens.css`, `typography.css`, `components.css` — token tiers; the unused `.field`/`.input` and `.entry-media` blocks this work consumes.
- `static/images/` (manifest) — the `{768, 1280|1920, full}.webp` naming contract.
- `package.json` — `adapter-static`, zero runtime dependencies (the constraint behind the form design).
- `docs/research/sanctuary-offerings-landing/research.md` — immediate predecessor; constraints carried forward verbatim.
- `docs/research/design-system-minimal/research.md` — canonical design authority (palette discipline, §5.3 images-as-ceremony).

### Geographic data (probed 2026-08-05 from this machine)

- OpenStreetMap via Overpass API — river ways `24840024`, `186707241`, `453997616`, `698139279`, `710442954`, `710442955`; place nodes for Calca (`436613486`), Ollantaytambo, Urubamba, Yucay, Pisac. Data © OpenStreetMap contributors, ODbL 1.0 — <https://osm.org/copyright>
- Nominatim geocoding for Calca, Cusco, Perú — <https://nominatim.openstreetmap.org>
- Google Maps Platform Terms of Service (no scraping / no derivative works from Maps content — hence OSM as source, Google as outbound link only) — <https://cloud.google.com/maps-platform/terms>
- MapLibre GL JS (BSD-3-Clause) — recorded as the deferred interactive-map upgrade path — <https://maplibre.org>

### Design references (web, 2026-08-05)

- Sacred Fire Creative, "Designing Digital Sanctuaries" — emotional-journey page ordering for retreat sites — <https://sacredfirecreative.com/digital-sanctuaries-spiritual-retreats/>
- Nilead, wellness retreat web design best practices — imagery of people-in-activity over empty rooms — <https://nilead.com/industry/wellness-retreat-website-design>
- Basundari, "12 Key Features to Make Your Retreat Websites a Success" — testimonial prominence and specificity of attribution — <https://basundari.com/retreat-websites/>
- Pi Stack, "Self-Hosted Web Mapping Libraries: Leaflet vs OpenLayers vs MapLibre GL JS" — <https://www.pistack.xyz/posts/2026-06-15-self-hosted-web-mapping-libraries-leaflet-openlayers-maplibre/>
- Hitit Medya, "Embed OpenStreetMap on Your Website Without Google Maps" — <https://www.hititmedya.com/blog/embed-openstreetmap-without-google-maps>

## Decisions and revisions

- **2026-08-06 — reworked on user feedback. The plate gallery is gone; read this before reinstating anything from the 2026-08-05 entry.**

  The user rejected the plate index outright ("the images section is awful, i do not like it at all") and asked for the page-turning book that the original research had considered and rejected on accessibility grounds. That rejection was wrong in one specific way: it treated the book metaphor as inseparable from a *skeuomorphic simulation of paper*, and so threw out the layout with the effect. The layout — one photograph, its facing story, sides alternating across the spine — is straightforwardly accessible. It is the *turn* that carried the risk, and the turn can be spent only where it is safe.

  `GallerySection.svelte` and `PlateDialog.svelte` are **deleted**. `BookSection.svelte` replaces them:

  - One entry per spread, photograph on one page and its story facing it. Sides are derived from **parity of the index**, never stored per entry, so adding photographs cannot desynchronise the alternation. The sequence wraps, so there is no first or last page.
  - The turn is real, not a crossfade: the moving leaf carries **two faces** — its front is the page being left, its back is the page being arrived at — over a spread that already holds the destination. That is what separates a page turn from a flipping card, and it is why the leaf's back must be the destination's *near* page while the page revealed beneath is its *far* page.
  - The 3D turn is spent **only** where it is honest: desktop widths, motion allowed. Below the spread breakpoint there is no facing page, so turning a leaf would animate a fiction; the layout becomes one page at a time and the controls simply change what is shown. Arrow keys are bound to the controls, not to a wrapper, so the book never swallows arrow keys from someone trying to scroll.

  Also changed in this pass, each from direct user feedback:

  1. **Dividers cut from four to two**, bracketing the retreats invitation. A seam earns its place by marking one moment; four of them marked nothing. The 2026-08-05 note about keeping the gallery→voices divider is superseded — both it and the journal→gallery divider are gone.
  2. **Review cards rebuilt compact** (436px → 229px, −47%), identity-first, with local SVG silhouette avatars. The silhouettes are deliberate: a stock face beside a placeholder name reads as a real guest, which is the same deception the quote text already guards against. No star ratings — a rating is a numeric claim and there is nobody yet to have made it. Journal cards shrank ~27%.
  3. **Navigation now points only at destinations that exist** — `/#offerings`, `/#retreats`, `/#book`, `/blog`, `/#contact`. The previous four links (`/wings`, `/about`, `/community`, `/sanctuary`) all 404'd. Section ids were added to carry the anchors. Footer reduced to the same five links plus location; the licence/legal bar, the repository column and the per-section sub-descriptions are deleted.
  4. **The Iconify CDN is gone.** Three hero social glyphs were `<iconify-icon>` elements upgraded by a script from jsdelivr — a reachable external service in the render path of every page, which AGENTS.md forbids outright. They are inline SVG now. Verified: the published homepage requests **zero external hosts**.

- **2026-08-06 — the pre-hydration dead zone, and the fix the codebase was already designed for.**

  The user reported that on first load "everything is in one vertical row losing entirely the second section", with the journey coming alive only after the whole page finished loading. This was not a rendering bug. The horizontal opener is 380vh of sticky container whose second panel is reached *only* by the scroll driver translating the strip; until that driver hydrates, scrolling the entire runway moves nothing and the visitor falls through to Offerings having never seen WelcomePanel. Measured on this machine: **~1.5s on a production build, ~3.8s in dev**, and it grows with the module graph — which is exactly why it appeared when the blog's dependencies landed.

  The fix is a CSS scroll-driven animation, and the codebase had already anticipated it: `animations.css` carries a 49-point `--ease-hero` `linear()` curve annotated *"used only inside `@supports (animation-timeline: scroll())`"* — authored for this and never wired up. A `view-timeline` on the container reproduces the driver's progress **exactly** rather than approximately, because the driver computes `(scrollY - top) / (height - viewport)` and a view-timeline's `contain` range for a subject taller than the scrollport spans precisely those two scroll positions. Both drivers therefore agree frame for frame and the handover at hydration is invisible. Where CSS drives the strip, the JS writes stand down — animations outrank inline styles in the cascade, so leaving both live would burn a frame budget on dead writes.

  Reduced motion deliberately does **not** disable this: the slide is not decoration, it is how the second panel is reached. A `<noscript>` block covers the remaining case — no JS *and* no scroll-timeline support — by collapsing the strip so the two panels simply stack and read as a page.

- **2026-08-06 — two hydration bugs found while verifying the above.**

  1. **The blog navbar was invisible.** The white navbar layer is shown or hidden purely by how much of it survives a `clip-path`, and on non-home routes it was parked at `inset(0 0 0 0)` — which clips *nothing* — so paper-coloured links rendered on a paper background. The prerendered HTML was corrected first, but the bug survived: `subscribeHeroScroll` replays its last progress on subscribe, so landing on `/blog` fired one callback at `p = 0` and re-opened the clip. Fixed by guarding that subscriber to the homepage. Compounding it, `navbarWhiteEl` was a plain `let` — not reactive in runes mode — so the `$effect` meant to park the clip ran once against `undefined` and never re-ran. Now `$state`.
  2. **A class-name collision silently inset every page of the book.** The book's pages used `class="page"`, and `components.css` already defines a global `.page` layout helper with `max-width: 1100px` and 48px padding. Every spread page was inset 48px on all four sides. Renamed to a `book-page` namespace. Worth remembering when naming anything inside a component: the global helpers in `components.css` are in the same namespace as component classes.

- **2026-08-05 — built, and what the build changed.** All four blocks shipped; status flipped to `reference`. Five decisions moved during implementation, each because reality disagreed with the plan:

  1. **Contact endpoint is `VITE_CONTACT_ENDPOINT` via `import.meta.env`, not `PUBLIC_CONTACT_ENDPOINT` via `$env/static/public`.** SvelteKit's static env module fails the *build* when a declared variable is unset — and unset is precisely this project's normal state until the collective hosts its own endpoint. `$env/dynamic/public` is unusable too: it is unavailable during prerendering, and adapter-static prerenders everything. Vite's `import.meta.env` simply yields `undefined`, which is the "not configured" signal the form needs. Reasoning recorded in `src/lib/config.ts`.
  2. **The map frame is fitted to the data, not fixed.** The first pass hard-coded a 1000×440 viewBox, which left the valley floating in dead margin and rendered town labels at ~10 effective pixels. The script now fixes width and derives height from the valley's own proportions (1000×588), and the script gained a `--write` mode that patches the generated block into `ValleyMap.svelte` directly — a 3 KB path is not something to hand-paste, and "do not hand-edit" should be enforceable rather than aspirational.
  3. **Scroll reveal needed a `<noscript>` fallback.** `[data-reveal]`/`[data-stagger]` start at `opacity: 0` and only JavaScript turns them on, so with JS unavailable the gallery was not merely unanimated — it was *gone*. Caught when a stale bundle 404'd during verification and the section rendered blank. Every other section on this site is static and works without JS; a `<noscript>` override in `app.html` holds the revealed ones to the same standard. This applies to any future `use:reveal` consumer, not just the gallery.
  4. **The sticky header's `z-index` was raised from 1 to 5** (`+layout.svelte`). Vertical sections raise their inner wrapper to `z-index: 1` to clear their own decorative accents; that tied with the header and won on document order, so section content painted *over* the navbar. Pre-existing — the journal strip's eyebrow already collided with the logo — but the gallery's imagery made it obvious. The takeover machinery assumes the opposite relationship: the header sits on top and sections carve into it with `clip-path`, never by overlapping it.
  5. **The gallery→voices divider was kept.** The plan flagged it as the one to drop if three seams read as over-seamed. It stays: gallery and voices share the lighter paper and run together without it. Contact carries its own deeper paper and needs none.

  Verified in Chromium (desktop 1440×900 and mobile 390×844): plate grid tiles exactly with no ragged edge (486+24+690 = 1200 across; 336+24+336 = 696 down), dialog opens/pages with arrow keys and wraps, Esc restores both focus and body scroll, mobile puts the map above the form, no-JS renders every plate, zero console errors. Divider #2's navbar takeover — dead code since it was written — now engages.

  Still blocking completion, unchanged: real photographs, and real consented guest quotes.

- **2026-08-05 — initial.** Closing sequence set to Gallery → Voices → Contact/Map → Footer. Gallery chosen as museum plate index + native `<dialog>` (over masonry, second horizontal strip, and literal page-turn book) — user-selected. Reviews as static typed seam, real consented quotes only, no third-party widget. Contact form as `PUBLIC_CONTACT_ENDPOINT` with `mailto:` fallback, honeypot + time-floor, no hosted CAPTCHA. Map hand-drawn in SVG from OSM geometry (feasibility verified: 6 ways chained, 74-point 2.6 KB path, correct valley axis), constants checked in for offline render, "open in map" links out to Google Maps per user direction, ODbL attribution required. Footer in the layout. Deferred: `schema.org/Review` JSON-LD until quotes are real; MapLibre + self-hosted tiles for an interactive map. Blocking dependency recorded: real photographs and consented guest quotes.
