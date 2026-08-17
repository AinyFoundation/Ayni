---
owns: [offerings, events-publishing]
slug: offerings-system
status: reference
created: 2026-08-15
last-updated: 2026-08-15
sources: 34
---

# Offerings/Events Publishing System

The homepage's `OfferingsSection` (the pinned image + category scroller for Retreats / Ceremonies / Events) ends in a button — `{m.offerings.allOfferings}` — whose `href` is a literal `"#"`. It is the only warning `svelte-check` currently produces on the whole codebase (`a11y_invalid_attribute`, `src/lib/components/OfferingsSection.svelte:242`). This research decides what that button should point at: a real publishing system where the collective can list individual Ceremonies, Retreats, Events, or any future category as minimal presentation cards — cover photo, date, location + map link, WhatsApp/Instagram/contact actions — closer in spirit to a listings page than to the journal. It also answers the user's explicit second ask: an audit of stranded code, disconnected surface, and Svelte/design-system convention drift, so the new feature is built on a clean foundation rather than adding to what is already adrift.

Trigger category, per `AGENTS.md` § Stop-and-ask: **5+ file edits** and a **schema decision** (a new content model). Both apply — this document exists so code does not start before it.

Out of scope: booking/payment, a CMS or admin UI, recurring-event rules (RRULE-style repetition), multi-language content (Phase 3 per `docs/research/i18n-system/research.md`), and a hosted calendar/iCal feed. Each is noted below with why.

## Constraints carried forward

- **Local-first / sovereignty.** No hosted event platform, no embedded booking widget, no third-party calendar service. WhatsApp and Instagram links are outbound-only — an outbound link is not a dependency, exactly as `MAPS_URL` and `SOCIAL_URLS` already establish in `src/lib/config.ts`.
- **Open-source only.** No new dependency without checking Apache-2.0/MIT compatibility. The recommendation below adds none.
- **CRDT-friendly / plain files.** Content as `.md` frontmatter, following the blog's precedent, not a database.
- **Design tokens are the single source of truth.** Every value traces to `src/design/tokens.css`. Zero hardcoded hex/px in new components.
- **Minimal-design canon.** `docs/research/design-system-minimal/research.md` — a neutral base, one accent per surface, palette discipline across the seven wing hues.
- **Single-source-of-truth rule (`AGENTS.md`).** Blog content architecture is owned by `docs/research/blog-system/research.md`; this document does not re-derive it, only cites and diverges where the domains differ.

## Landscape

### What already exists and is directly reusable

- **`OfferingsSection.svelte`** (`src/lib/components/OfferingsSection.svelte`) — the homepage teaser. Pinned scroller through three categories (`retreats`/`ceremonies`/`events`, `OfferingsSection.svelte:54-89`), each with its own wing hue (clay/gold/sage) and placeholder copy in `src/lib/i18n/catalogs/en/home.ts:81-118` (marked `PLACEHOLDER`). This is the entry point, not the destination — its dead CTA is what this system completes.
- **The blog system** (`docs/research/blog-system/research.md`, shipped 2026-08-05) is the closest working analog and the template to diverge from deliberately:
  - `src/content/topics.js` / `authors.js` — plain JS + JSDoc taxonomy files, validated by a function shared between the app and a bare-Node CI script. This is the right shape for an offerings category registry (see Recommendation).
  - `src/lib/blog/schema.js` — one frontmatter validator, two consumers (build + `blog-check.mjs`). Errors block, warnings advise.
  - `src/lib/seo/{Seo.svelte,site.ts,routes.ts,jsonld.ts,xml.ts}` — `Seo.svelte`, `site.ts`, `routes.ts` are **generic and fully reusable as-is**, no blog-specific logic. `jsonld.ts` has generic builders (`organization()`, `website()`, `itemList()`, `breadcrumbs()`) plus blog-specific ones (`blogPosting()`, `blog()`); it needs new `event()`/`Event` builders (see Recommendation).
  - `scripts/blog-images.mjs` — sharp pipeline, AVIF/WebP/JPEG at 480/768/1280/1920 + LQIP, content-hash cached, gitignored output — but hardcoded to `src/content/blog`/`static/_blog`/`.blog-images.json`. Built for imagery embedded mid-article; heavier than an offerings card needs.
  - `scripts/images.sh` — the **other**, simpler pipeline already used for `retreats.webp`/`ceremonies.webp`/`events.webp` (the `{768,1280,full}.webp` trio `OfferingsSection` uses today). This, not `blog-images.mjs`, is the right-sized tool for offering cover photos.
  - `.agents/skills/write-blog-post/` — interview-driven authoring skill, enforced by `blog-check.mjs` + a path-filtered `blog-check.yml` workflow. Template for a new, much shorter `publish-offering` skill.
- **Design system** (`src/design/{tokens,typography,components,animations}.css`) — full inventory taken. Notably:
  - `.card` / `.card-title` / `.card-body` / `.card-wing` / `.card-wing-tinted` / `.card-accent` / `.tag` / `.tag-dot` in `components.css` are the **exact vocabulary the original `sanctuary-offerings-landing` research (2026-07-31) specified for offering cards** — and every one of them is currently a dead selector with zero template consumers (confirmed by cross-referencing every `.svelte` file). The shipped pinned-scroller diverged into bespoke classes (`.pin-card`, `.copy-title`, …) and stranded this vocabulary rather than using it.
  - `src/lib/reveal.ts` — a complete, SSR-safe `use:reveal` IntersectionObserver action, paired with `[data-reveal]`/`[data-stagger]` CSS in `animations.css` and a `<noscript>` safety net in `app.html`. **Zero consumers anywhere in `src/`.** Built and wired to nothing since `GallerySection` (its only past consumer) was deleted.
  - `--page-top`/`--page-x`/`--page-bottom` in `tokens.css` are explicitly documented as "the established pattern... a new page takes these, never invents its own clamp()" — the token set a real `/offerings` route (not a homepage section) should use for its outer shell.
  - `src/lib/social.ts` holds icon **path data only**, by design, so each consumer supplies its own `<svg>` stroke wrapper. Two consumers (`+page.svelte` hero corner, `SiteFooter.svelte`) currently hand-roll that identical wrapper markup independently — no shared `IconLink` component exists yet.
  - `docs/design/{components,design-system}.html` have drifted hard from `src/design/`: old token names (`--t-h1` vs. live `--text-h1`), a non-fluid type scale, pre-rename typography classes (`.h-1` vs. live `.heading-1`), and a documented Eva Icons + Iconify-CDN icon system that the live app explicitly rejected (`+page.svelte:169` — a CDN script in the render path violates the sovereignty rule). These pages are a stale prototype snapshot, not a current reference; anyone (including a new contributor) landing there first will be misled.
- **i18n.** `src/lib/i18n/catalogs/en/{home,blog,chrome}.ts` establish the pattern: domains split by *surface*, editorial/structural content stays in `src/content/*.js` (or post frontmatter), only UI chrome lives in the catalog. `blog.ts` is the closest sibling shape (`card`, `strip` with an explicit empty state, `index` with search/pagination copy) for a new `offerings` domain.

### The honest gaps (stranded code / disconnection found)

- **`RetreatsSection.svelte` is orphaned.** Not imported by `+page.svelte` or anywhere else — confirmed by tracing every import, not just grep. It still holds two dead links (`/retreats`, `/stay`, neither `routeExists()`-gated the way blog CTAs are). `HANDOFF.md`'s own "Current focus" section still narrates it as live on the page ("Then RetreatsSection... and JournalStrip"), which is stale. This sits squarely in the domain this research covers (retreats is one of the three offering categories) and needs an explicit decision — delete, resurrect as-is, or fold into the new system — before more offerings-adjacent surface is added.
- **`svelte.config.js`'s `PLANNED_ROUTES` allowlist has drifted from the live link graph.** `/community` has zero current or planned referrer anywhere in `src/`. `/retreats` (referenced only by the orphaned `RetreatsSection`) isn't in the allowlist at all, though that's currently moot since nothing renders it.
- **`OfferingsSection.svelte:242`**'s `href="#"` is the one dead link in a component that otherwise gates every other CTA correctly.
- **`.orca/drops/Ceremonies.jpg` and `.orca/drops/Events.jpg`** are real, camera-shot photographs (Sony ILCE-7M2, Lightroom-processed, shot 2026-06-25) sitting in the drop folder, unprocessed. `HANDOFF.md`'s "Open content gates" section explicitly flags "no imagery of events" as a blocker. No `Retreats.jpg` has been dropped yet. These look like exactly the asset this system needs, but nothing in-repo says so — flagged as an open question rather than assumed.
- **`tests/verify-scroll-reveal.mjs`** is a real Playwright check with no `package.json` script and no CI wiring — an automation gap, not blocking, but adjacent to a feature that will add another scroll-driven grid.

### Content model — where offerings diverge from blog posts

An offering is not a long-form article. It has no multi-paragraph body requiring headings, footnotes, or smart quotes — it has structured fields (category, date(s), location, price, contact) plus one short blurb. Everything downstream of that difference should diverge deliberately rather than copy the blog's weight:

| Blog has | Offerings need instead |
|---|---|
| `unified`/`remark`/`rehype` HTML pipeline (`render.server.ts`) | Nothing — frontmatter fields only, no body rendering |
| Free-text search + 12/page pagination (`/blog` client state) | Category filter chips + upcoming/past sort (expected volume: a handful per category, not dozens) |
| Hub-and-spoke topic **pillar pages** (`/blog/topic/[topic]`, prerendered even when empty, for compounding organic authority across many posts) | Not justified yet — three categories with a handful of items each don't need dedicated SEO landing pages; a query-param filter on one `/offerings` index does the same job with less surface |
| Permanent content — no expiry concept anywhere (sitemap, feeds, `listPosts()` all assume "grows forever") | **Transient content.** Events have a date after which they're past. No existing precedent in this codebase for excluding stale content from a sitemap or for an upcoming/past split — this is new logic, not adaptation |
| RSS 2.0 + JSON Feed, full body in the feed | Skip for v1 — the stated rationale for shipping full body ("so a subscriber can read without coming back") doesn't transfer to a dateline; an iCal (`.ics`) feed would be the closer analog and has zero precedent in this codebase |
| `BlogPosting` JSON-LD | **`Event` JSON-LD** — a real, absent capability. Required: `name`, `startDate`, `location` (a `Place` with `address`). Recommended for full rich-result eligibility: `endDate`, `image`, `description`, `offers` (price/currency/availability/url), `organizer`, `eventStatus`, `eventAttendanceMode` — Google's Events rich result surfaces date/venue/ticket-link above organic results, and pages shipping only the three required fields get materially less SERP prominence than fully populated ones. |

## Sources

### Code

- `src/lib/components/OfferingsSection.svelte` — HEAD — the pinned scroller, its `PLACEHOLDER` category data, and the dead `href="#"` CTA (line 242) this system resolves.
- `src/lib/components/RetreatsSection.svelte` — HEAD — orphaned component, two ungated dead links (`/retreats`, `/stay`).
- `src/lib/config.ts` — HEAD — `SOCIAL_URLS`, `CONTACT_EMAIL`, `CONTACT_ENDPOINT`, `LOCATION`, `MAPS_URL` — the singleton-constants pattern an offerings default location/contact should extend, not duplicate.
- `src/lib/social.ts` — HEAD — path-data-only icon convention; confirmed no generalized `IconLink` component exists, two independent hand-rolled consumers (`+page.svelte`, `SiteFooter.svelte`).
- `src/lib/components/JournalCard.svelte`, `JournalStrip.svelte` — HEAD — one component reused across four surfaces; the closest existing analog to a reusable offering card.
- `src/lib/components/BookSection.svelte` — HEAD — `SEAM: entries below is a static typed array... Point it at a real content source and nothing else here changes` (line 25) — direct prior art for migrating component-local arrays to real content.
- `src/lib/blog/{types.ts,schema.js,list.ts,cta.ts,render.server.ts,cards.server.ts}` — HEAD — full blog data-model pipeline; frontmatter validation, `.server.ts` boundary discipline, `ctaFor()`'s resolve-or-null idiom, `toCard()`'s cover-resolution pattern.
- `src/lib/seo/{Seo.svelte,site.ts,routes.ts,jsonld.ts,xml.ts}` — HEAD — single-writer SEO head, `routeExists()` glob-derived route manifest, generic vs. blog-specific JSON-LD builders, shared XML/date-format helpers.
- `src/routes/blog/{+page.svelte,+page.server.ts,[slug]/+page.svelte,[slug]/+page.server.ts,topic/[topic]/+page.svelte,topic/[topic]/+page.server.ts}` — HEAD — index (client-side search/pagination/URL state, SSR guard on `page.url.searchParams`), detail (`entries()` prerender discovery, TOC scroll-spy, CTA-only-if-resolvable), pillar (always-prerendered-even-empty hub page) patterns.
- `src/routes/{rss.xml,feed.json,sitemap.xml}/+server.ts` — HEAD — feed/sitemap generation, all `prerender = true`, sitemap built only from routes that actually exist.
- `src/content/{topics.js,authors.js}` — HEAD — plain-JS-plus-JSDoc taxonomy pattern, shared between app and bare-Node CI script; direct template for an offerings category registry.
- `scripts/blog-images.mjs` — HEAD — sharp pipeline (AVIF/WebP/JPEG, 480–1920px ladder, LQIP, content-hash cache), hardcoded to the blog content dir.
- `scripts/blog-check.mjs`, `.github/workflows/blog-check.yml` — HEAD — CI content validator (required fields, banned phrases, CTA resolution, heading order) and its path-filtered workflow trigger; template for an `offerings-check.mjs`.
- `scripts/images.sh` — HEAD — the simpler, already-in-use pipeline behind `retreats.webp`/`ceremonies.webp`/`events.webp`; recommended over `blog-images.mjs` for offering covers.
- `.agents/skills/write-blog-post/SKILL.md` — HEAD — interview structure, voice rules, file-output contract; template (much shortened) for `publish-offering`.
- `.agents/skills/research-topic/SKILL.md` — HEAD — the format this document follows.
- `src/design/tokens.css` — HEAD — full token inventory (color primitives/semantics, 8-stop spacing, fluid type scale, `--page-*` page-shell tokens, motion/radius primitives).
- `src/design/typography.css`, `components.css`, `animations.css` — HEAD — global type classes; `.card`/`.tag`/`.entry-media`/`.dropdown*` family and the confirmed-dead `.card-title`/`.card-wing`/`.card-wing-tinted`/`.card-accent`/`.tag`/`.tag-dot`/`.btn-ghost`/`.btn-disabled` selectors; `[data-reveal]`/`[data-stagger]` utilities.
- `src/lib/reveal.ts` — HEAD — complete, SSR-safe reveal action; confirmed zero consumers anywhere in `src/` (`grep` for `use:reveal`/`data-reveal`/`data-stagger` returns nothing outside its own file and the CSS/noscript that targets it).
- `src/lib/i18n/{types.ts,index.ts,locales.ts,catalogs/en/index.ts,catalogs/en/home.ts,catalogs/en/blog.ts,catalogs/en/chrome.ts}` — HEAD — typed-catalog architecture, the `offerings` placeholder copy (`home.ts:81-118`), the domain-per-surface split rule.
- `docs/design/{components.html,design-system.html,base.css,tokens.css}` — HEAD — confirmed drifted from `src/design/` (old token names, pre-rename class names, an abandoned Iconify-CDN icon system the live app rejects).
- `svelte.config.js` — HEAD — `PLANNED_ROUTES` allowlist, `handleHttpError`/`handleUnseenRoutes` prerender safety net; confirmed stale `/community` entry.
- `package.json` — HEAD — `predev`/`prebuild` hooks, `blog:check`/`blog:images`/`i18n:check` script wiring.
- `AGENTS.md` — HEAD — stop-and-ask triggers, single-source-of-truth rule.
- `HANDOFF.md` — HEAD — stale "Current focus" narration of `RetreatsSection` as live; "Open content gates" flagging missing event imagery; `--color-clay-d` WCAG note.
- `docs/research/sanctuary-offerings-landing/research.md` — HEAD — the original offerings design intent (`.card`/`.tag` vocabulary now stranded), superseded scope note ("the blog itself... explicitly out of scope").
- `docs/research/blog-system/research.md` — canonical — the blog architecture this document diverges from deliberately; markdown/image/SEO tooling choices and their stated rationale.
- `docs/research/design-system-minimal/research.md` — canonical — token architecture and rainbow-palette discipline this system must follow.
- `.orca/drops/{Ceremonies.jpg,Events.jpg}` — file metadata read 2026-08-15 — Sony ILCE-7M2, Lightroom Classic-processed, shot 2026-06-25, 3936×2624 / 3769×2513 — real, unprocessed photography sitting outside the image pipeline.

### Web

- <https://schemavalidator.org/guides/event-schema-markup-guide> — Event Schema JSON-LD Requirements (2026) — 2026-08-15 — required (`name`/`startDate`/`location`) vs. recommended (`endDate`/`image`/`description`/`offers`/`organizer`/`eventStatus`/`eventAttendanceMode`) Event properties, nested `Place`/`Offer` requirements, the "less SERP prominence with only required fields" finding.
- <https://www.digitalapplied.com/blog/structured-data-after-io-2026-schema-updates> and <https://www.digitalapplied.com/blog/structured-data-seo-2026-rich-results-guide> — 2026-08-15 — corroborating Google Events rich-result behavior (date/venue/ticket-link surfaced above organic results); consistent with the JSON-LD guidance already cited in `docs/research/blog-system/research.md`.
- WhatsApp click-to-chat URL format — corroborated across multiple third-party technical guides (`gowalink.org`, `quadlayers.com`, `sendapp.live`, `wati.io`) fetched 2026-08-15: `https://wa.me/<countrycode+number, digits only, no +/spaces/leading zeros>` with an optional `?text=<URL-encoded prefill>`. WhatsApp's own FAQ page (`faq.whatsapp.com/5913398998672934`) confirms the `wa.me` domain but its full technical content was not retrievable through automated fetch in this pass — flagged so a future pass can re-verify directly against the primary source before this becomes a binding format in code.

## Recommendation

Build **one unified content type** (`offering`), not three parallel ones — Ceremonies, Retreats and Events share every field that matters (photo, date, location, contact actions) and differ only in a `category` value. This also satisfies the user's explicit ask that the category list be open-ended ("any other category we would want to create"), which a closed enum per content type would not.

**1. Content model.** `src/content/offerings/<slug>/index.md`, frontmatter-only (no body rendering — skip `unified`/`remark`/`rehype` entirely, since there is no long-form prose to process). Fields: `title`, `category` (validated against a registry, see below), `dateStart`, `dateEnd?` (optional, for multi-day retreats), `location?` (falls back to `LOCATION` in `config.ts` when absent), `price?` (plain string — "S/. 350", "Free" — no commerce), `whatsapp?` / `instagram?` (per-offering overrides of site-wide defaults), `cover` + `coverAlt` (required-together, exactly as blog enforces), `description` (short — 80–140 chars, card-sized, not a meta-description-length blurb), `draft`. Parsed with `gray-matter` the same way `list.ts` does, minus the render step.

**2. Category registry.** `src/content/offeringCategories.js` — plain JS + JSDoc, mirroring `topics.js`'s shape exactly (`slug`/`label`/`hue`/`description`, a `Map`, a slug-array, a type guard). Seeded with `ceremonies`/`retreats`/`events`, each keyed to the wing hue `OfferingsSection` already uses (clay/gold/sage) so the homepage teaser and the new listing pages agree by construction. Adding a fourth category is a one-entry edit, not a schema migration.

**3. Images.** Reuse `scripts/images.sh`, not `blog-images.mjs`. It already produces the `{768,1280,full}.webp` trio `OfferingsSection` consumes today, and an offering card needs one cover photo at a couple of fixed sizes — not the AVIF/WebP/JPEG-plus-manifest system built for imagery embedded mid-article. Building a second sharp+manifest pipeline for a simpler need is unjustified weight.

**4. Routes.** `/offerings` (index — cover-grid of `OfferingCard`, category filter chips reading the registry, upcoming-first sort with a past/upcoming toggle, no free-text search or pagination at this scale) and `/offerings/[slug]` (detail — larger image, full description, full action row, `Event` JSON-LD). This is what the homepage's dead `href="#"` should become. Skip a per-category pillar route (`/offerings/category/[slug]`) for now — a query-param filter on one index route does the same job with far less surface, and the hub-and-spoke SEO reasoning behind blog pillars was earning compounding authority across dozens of interlinked posts, which doesn't obviously apply to three categories with a handful of items each.

**5. Card component.** New `OfferingCard.svelte`, and this is where the stranded `.card`/`.card-title`/`.card-body`/`.card-wing`/`.tag`/`.tag-dot` classes in `components.css` finally get consumers — exactly the vocabulary the original `sanctuary-offerings-landing` research specified for this purpose before the shipped scroller diverged into bespoke classes. `.card-wing`'s left-border accent, colored from the category registry's hue, is the natural way to color-code category without inventing new CSS.

**6. Action row (the genuinely new UI).** Maps / WhatsApp / Instagram / Contact, each an icon + label. Extract a small `IconLink.svelte` now rather than hand-rolling a third copy of the SVG-stroke-wrapper markup that `+page.svelte` and `SiteFooter.svelte` already duplicate independently — three independent hand-rolled instances is the threshold past which the existing `social.ts` path-data pattern should back a shared component instead. WhatsApp links follow the standard `https://wa.me/<digits>?text=<encoded>` shape (no `+`, no separators); the phone number becomes a new constant in `config.ts` alongside `SOCIAL_URLS`, not invented per-card.

**7. Structured data.** New builders in `src/lib/seo/jsonld.ts`: an `event()` function emitting `name`/`startDate`/`endDate`/`location` (`Place` built from `LOCATION` + optional override)/`image`/`description`/`organizer` (reusing the existing `Organization` builder)/`offers` (only when `price` is set)/`eventStatus` (defaults `EventScheduled`). This is a capability the blog has no equivalent for and directly serves both users ("get all the information") and search ("Events" rich results, which reward full property coverage over the bare minimum).

**8. Validation.** `scripts/offerings-check.mjs`, mirroring `blog-check.mjs`'s structure but with a different check set — no heading-order/pacing/banned-phrase checks (no long-form prose exists to check), but: required fields present, `category` resolves against the registry, `cover`/`coverAlt` paired, `whatsapp` (if set) matches the `wa.me` phone-digit shape, `dateStart` is a real date. Wired the same way — a path-filtered CI workflow, `npm run offerings:check`.

**9. Authoring skill.** `.agents/skills/publish-offering/SKILL.md`, structurally modeled on `write-blog-post` but deliberately short: category, title, date(s), location (if not the default), WhatsApp/Instagram overrides, price, one 2–3 sentence blurb, one photo. No voice/banned-word/pacing rules — those are tuned for journal essays, not a listing.

**10. i18n.** New `catalogs/en/offerings.ts` domain (UI chrome only — button labels, empty state, category-chip labels, upcoming/past toggle), added to the barrel exactly as `blog.ts` was. Editorial content (title, description) stays in frontmatter, per the split `home.ts`/`blog.ts` already establish.

**11. Animation.** Use `use:reveal` + `[data-stagger]` on the offerings grid — this is the first real consumer of infrastructure that is already fully built and currently orphaned, rather than writing a new animation for the grid.

**12. Sitemap/feed.** Include offerings pages in `sitemap.xml` the same way posts are (derived only from what actually built, never hand-maintained). Skip a dedicated feed (RSS/JSON/iCal) for v1 — no clear demand signal yet and no precedent in this codebase for the calendar-subscription format an events feed would actually want (iCal, not RSS). Revisit if requested.

### Why not the alternatives (one honest sweep)

- **Three separate content types (one per category)** — rejected. The fields that matter are identical; only the category value differs, and the user explicitly wants the category list open-ended.
- **Reusing `blog-images.mjs` for offering photos** — rejected. Built for many-images-per-long-article with a manifest system; an offering needs one cover photo, and `scripts/images.sh` already does that job for this exact imagery.
- **A per-category pillar route, hub-and-spoke like blog topics** — rejected for v1. The SEO rationale (compounding authority across dozens of interlinked posts) doesn't transfer at this content volume; a query-param filter is less surface for the same user-facing result. Revisit if the collective publishes enough offerings per category to want dedicated landing pages.
- **Full-text search + pagination on `/offerings`, copied from `/blog`** — rejected. Built for a large, growing corpus; a handful of listings per category don't need it, and building it anyway is unused weight per the project's own YAGNI convention (`ponytail` skill).
- **An RSS/JSON feed for offerings** — rejected for v1. The blog's stated reason to ship full body in the feed doesn't apply to a dateline; the format that would genuinely serve "subscribe to upcoming events" is iCal, which has no precedent here and is a real, separate decision.

## Open questions

- ~~Are `.orca/drops/Ceremonies.jpg` and `Events.jpg` intended for this system?~~ **Resolved 2026-08-15 — already in use.** The user confirmed these are already the source images behind `OfferingsSection`'s current `ceremonies*.webp`/`events*.webp`. No reprocessing needed; the same processed derivatives are the right cover images to reference for the corresponding seed categories once real offering entries exist.
- ~~`RetreatsSection.svelte`'s fate.~~ **Resolved 2026-08-15 — delete.** Dead code with no live consumer; its two dead links (`/retreats`, `/stay`) go with it.
- **WhatsApp number and Instagram destination.** `SOCIAL_URLS` in `config.ts` still holds placeholder `'#'` values (flagged as open in `HANDOFF.md`'s "Open work" list already). This system needs a real WhatsApp number to be useful at all — implementation ships a `WHATSAPP_URL` placeholder alongside `SOCIAL_URLS`, filled in the same way.
- ~~Past-event handling.~~ **Resolved 2026-08-15 — keep live, sort behind a toggle.** No expiry/archival logic for v1.
- **`docs/design/{components,design-system}.html`** — confirmed stale and drifted. Still open: regenerate from `src/design/` as a real living reference, or delete it so it stops being a trap for the next contributor who finds it first. Not addressed by this implementation pass.
- **Recurring ceremonies** (e.g. a weekly ceremony night) — still out of scope. A `dateStart`/`dateEnd` pair per entry handles one-off and multi-day events; recurrence would need manual duplicate entries (fine at low volume) or an RRULE-style field later.
- **`AGENTS.md`'s single-source-of-truth table** — still not touched in this pass; adding an "Offerings / events" row pointing at this document is a separate, explicit constitution edit for the user to make or approve.

## Addendum — connecting the homepage scroller to the system (2026-08-15)

The pinned scroller and `/offerings` shipped as two disconnected surfaces: the scroller's CTA pointed at the index but carried nothing from it, and the index's own "is this past?" answer was frozen at build time. Three changes join them.

**1. The scroller becomes a filter.** The single static CTA (kept outside the animated panels so it never reflows) gains a reactive `href` and label tracking the active category: `/offerings?category=ceremonies`, "All ceremonies". The index already reads `?category=`, so no index change is needed. One caveat to accept rather than fix: `/offerings?category=x` is served by the same prerendered file as `/offerings`, so the unfiltered list paints for one frame before hydration applies the filter — identical to how `/blog?topic=` already behaves.

**2. A Next/Last card per category.** Below each panel's blurb: the soonest upcoming offering in that category, or — when none is upcoming — the most recent past one, labelled accordingly. A category with nothing published renders **nothing at all** (user direction): no skeleton, no placeholder card. That is today's state for all three categories, so the section must look deliberate while empty, not broken.

**3. The clock moves to the browser, site-wide.** This is the load-bearing decision. `isPast` was computed in `list.ts` against `new Date()` at BUILD time, which means a passed event keeps its "upcoming" badge and its upcoming sort position until someone redeploys. That is wrong for the scroller's Next/Last card and it was already wrong for the index's upcoming/past toggle. There is no runtime server to ask, and there should not be one — so the date comparison runs in the browser against the reader's own clock.

Shape: `src/lib/offerings/clock.svelte.ts` holds one shared reactive `today`, empty until `startClock()` runs in `onMount`. `isPastNow(offering)` returns the build-time `isPast` while `today` is empty and the live comparison afterwards. Server-rendered HTML therefore matches the build-time value exactly (no hydration mismatch), and the browser corrects it on the first frame after mount. Both the scroller's featured selection and the index's partition/badge read that one helper, so the two can never disagree about what "past" means.

`isPast` stays on `OfferingSummary` rather than being deleted: the sitemap builder runs at build time with no browser to ask, and a build-time answer is the correct one for a `lastmod`/priority hint.

**4. Mobile.** The featured item stays inside the pin's lower copy band — not a modal, not a sheet, not moved out of the section (user direction: the space is there, use it properly). It renders as a single full-width row rather than a shrunken copy of the desktop card, because the category photograph already fills the upper band and a thumbnail beside it would be the same picture twice. Verified for zero overflow at 390×844, 360×640 and 320×568, which is the standing bar for this page.

Category `singular` labels are added to the registry so the badge can read "Next ceremony" rather than "Next Ceremonies". Known Phase-3 wrinkle, recorded not solved: Spanish needs gender agreement (*próximo retiro* / *próxima ceremonia*), which a single `(label) => …` catalog function cannot produce from the plural alone.

## Decisions and revisions

- **2026-08-15** — Second pass, after the first shipped: the scroller and the index were joined (see Addendum). User resolved three forks — the featured card stays inside the pin's mobile copy band ("we actually have space, just use it correctly"), an empty category shows nothing at all, and the past/upcoming state must be worked out by the site itself with no server. That last one promoted a build-time `isPast` to a browser-clock comparison shared by both surfaces, and fixed a staleness bug the index already had.
- **2026-08-15** — User approved the recommendation as-is and resolved three open questions: delete `RetreatsSection.svelte` outright; `.orca/drops/{Ceremonies,Events}.jpg` are already the source of `OfferingsSection`'s current category images, no reprocessing needed; past offerings stay live, sorted behind a toggle rather than archived. Status flipped `draft` → `reference`. Implementation follows in the same session.
- **2026-08-15** — Initial research. Framed as a unified `offering` content type (not three parallel ones) with an open-ended category registry mirroring `topics.js`. Recommended reusing `scripts/images.sh` over `blog-images.mjs`, skipping per-category pillar routes and full-text search/pagination as premature for the expected content volume, and adding `Event` JSON-LD as a genuinely new capability. Surfaced five stranded-code findings that predate and intersect this feature: the dead `.card`/`.tag` CSS vocabulary (this system's natural consumer), the orphaned `RetreatsSection.svelte`, the dormant `reveal.ts`, the drifted `docs/design/*.html`, and the one dead CTA link that motivated this research in the first place.
