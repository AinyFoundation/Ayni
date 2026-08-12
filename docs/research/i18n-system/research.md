---
owns: [i18n, localization, language-detection]
slug: i18n-system
status: reference
created: 2026-08-08
last-updated: 2026-08-08
sources: 24
---

# i18n System — typed catalogs, URL-prefixed locales, detection without redirects

The site ships hardcoded English strings across ~15 components, `nav.ts`, `seo/site.ts` and the blog chrome. This research decides the language system: how strings are organized, how the visitor's language is detected, how additional languages get added, and how translated pages surface to search engines — including the blog.

The brief: replicate the language systems of `Alquimia-Web` and `Bioma` (both studied on this machine), adapted to this repo's stack. Both references are client-rendered React SPAs; this site is SvelteKit prerendered static with SSR, where server-rendered HTML was the whole SEO unlock (`docs/research/blog-system/research.md`). That constraint reshapes the runtime but not the authoring model.

Trigger category, per `AGENTS.md` § Stop-and-ask: **5+ file edits** and **replacing existing patterns** (string authoring). No new dependencies are proposed.

Deliberately phased: **the system lands first with zero visible change**, English extraction second, additional languages third. The site is still being written; translating prose that is still moving would be wasted work.

## Constraints carried forward

- **Local-first / sovereignty.** No translation SaaS, no CDN-hosted locale files, no external service in any render path. Everything builds and reads offline.
- **Open-source only.** Moot: the recommendation adds zero dependencies.
- **Design canon.** The switcher is a component like any other — tokens only, hairlines, no flags-as-images.
- **Single app.** Locales are part of the one SvelteKit app. No per-language builds, no duplicate trees.
- **Prerender discipline.** Every language variant must exist as prerendered HTML. Anything decided client-side (stored preference, `navigator.languages`) may only *suggest*, never gate content.

## Reference systems studied

### Alquimia-Web (`/opt/projects/Alquimia-Web`) — i18next + URL prefixes

i18next 26 + react-i18next + browser-languagedetector. Six languages as TypeScript modules (`src/i18n/locales/{es,en,fr,de,pt,ru}.ts`), single namespace, `as const` on the source language (`es`) feeding `i18next.d.ts` so translation keys are compile-checked. URL is authoritative: `/` = Spanish, `/en/`, `/fr/`… prefixed; `languageChanged` rewrites history and `document.documentElement.lang`; localStorage (`alquimia-language`) caches the choice. A post-build script prerenders per-language `dist/<lang>/index.html` with full hreflang clusters (self-referencing, `x-default` → `/en/`) and per-language JSON-LD.

**Keep:** URL-prefix model with default language at root; source-language-derived key typing; localStorage persistence; per-language `<html lang>`, title/meta; hreflang with x-default.

**Avoid:** the prerender script carries a *second copy* of the translated copy (`scripts/seo-data.mjs`) — two sources of truth that drift; sibling locales are never checked against the source shape (a missing Russian key is silent); no `tsc` in the build so even source-key typos ship; all six locales eagerly bundled for every visitor; hardcoded `aria-label`s escaped the system; an unused `circle-flags` dependency.

### Bioma (`/opt/projects/bioma`, `/opt/projects/Bioma`) — zero-dependency typed catalogs

No i18n library at all. `type Locale = 'es' | 'en'`; catalogs are plain TypeScript objects, one file per domain (`src/locales/app/{en,es}/drive.ts`, `auth.ts`, …), aggregated by barrels typed against a shared contract — **adding a key to the contract fails compilation in any language that lacks it**. Translation is property access (`t.drive.someKey`); interpolation is function-valued properties (`t.auth.waitMinutes(3)`) with compiler-checked arity. Detection: localStorage under a **two-key scheme** — `app-language` plus `app-language-source: 'user' | 'auto'` — where the stored value is only *trusted* over other signals when the user explicitly chose it; otherwise `navigator.languages[0]` (region stripped), then fallback. Page-scoped catalogs (landing, pitch-deck) hold their own `locales/` dir sharing only the language *state*. Written rule, auto-loaded for agents: *"Never hardcode English strings inline in a component or email template."*

**Keep:** zero-dependency typed-object catalogs; compiler-enforced parity; function-valued interpolation; domain-per-file organization; the `user`/`auto` provenance scheme; endonym-labeled switcher without flags; the written i18n rules as an agent skill.

**Avoid:** `<html lang>` never synced (hardcoded `en` for Spanish users); a hand-maintained 1,274-line `types.ts` mega-file (the contract can be *derived* instead — see below); a latent compile error shipped because the build skips typechecking; plurals as inline ternaries (fine for en/es, breaks at 3-plural-form languages — `Intl.PluralRules` fixes this for free); the switcher's own `aria-label` hardcoded in English in both repos.

## What the search engines actually do (researched 2026-08-08)

Condensed from Google's current official docs (last updated Dec 2025 – May 2026) and corroborating sources; full list in Sources.

- **URL structure.** Google recommends different URLs per language and explicitly advises against cookie/browser-setting language switching and against `?lang=` parameters. Subdirectory (`/es/`) is the standard for small sites: one domain, consolidated authority. This matches Alquimia's model.
- **hreflang.** Must be self-referencing and bidirectional or it is ignored. `x-default` points at the version for unmatched languages. Three delivery methods (head tags, HTTP headers, sitemap `xhtml:link`) — pick **one**, don't mix. hreflang is a *hint*; canonicals can override it, so every language version must be **self-canonical** (never canonicalize `/es/` to the English page). Bing largely ignores hreflang and reads `<html lang>` + `Content-Language` instead — ship both signals.
- **"Can Google make its own pages per language?" — yes, but it is not a strategy.** Google's *Translated results* feature (alive, 21 languages including Spanish) machine-translates the title link and snippet in the SERP and serves an on-the-fly translation on click. Nothing is hosted or indexed. Critically, it only fires when a page *already ranks* for a query in the searcher's language — an English page essentially never ranks for Spanish-keyword queries, so the feature is a safety net for stray traffic, not a substitute for publishing `/es/`. Only a real Spanish page targets Spanish queries. (Opt-out exists via `notranslate` if ever wanted.)
- **Machine translation policy softened, with a line.** March 2024 replaced "auto-generated content" spam policy with **scaled content abuse** — translation is spam only "where little value is provided." June 2025: Google removed its old advice to robots.txt-block auto-translated pages. The Reddit precedent (tens of millions of MT pages, no penalty, publicly blessed) confirms the softening. Accepted practice for a small site: **human-reviewed machine translation is safe and standard**; if unreviewed MT is ever published, `noindex` it until reviewed. At this site's scale the policy is not a realistic risk.
- **Never auto-redirect by Accept-Language or IP.** Google: "Avoid automatically redirecting users from one language version to another" — Googlebot crawls mostly from US IPs with **no Accept-Language header**, so a sniffing root can hide `/es/` from the crawler entirely. Recommended pattern: root is the real default-language site and the `x-default` target; language assistance is a dismissible client-side suggestion, and only a *stored explicit user choice* is ever honored automatically. This aligns exactly with Bioma's `user`/`auto` provenance scheme — the design was already forced by prerendered static hosting, which cannot header-sniff at all.
- **Partial translation (the blog case).** hreflang only between translation pairs that exist. No placeholder URLs serving the other language's text; no auto-redirect from a missing translation. Per-language blog indexes list only that language's posts; per-language RSS feeds with correct `<language>`. Chrome (nav/footer) on a translated page must be fully in that page's language — mixed-language pages blur Google's per-page language detection. Translate the conversion path (home, offerings, retreats, book, contact) completely **before** any blog post.
- **Is it worth it here?** Yes for marketing pages, selectively for the blog. A Spanish version doubles the indexable surface and targets queries the English pages will never rank for; Spanish-language competition for niche Sacred Valley wellness long-tail ("retiro de bienestar Valle Sagrado") is a fraction of the English equivalent; the business has a natural Spanish-speaking audience (Perú, Latin America, Spain). Do light Spanish keyword research rather than translating the English keyword list. Personal-voice journal entries can stay English-only forever with zero penalty.

## Recommendation

Bioma's authoring model + Alquimia's URL/SEO model, executed natively in SvelteKit so there is no second rendering system. **Zero new dependencies.** (i18next would add a ~40 kB runtime the Bioma design proves unnecessary; Paraglide would add a compiler and inlang toolchain for benefits — tree-shaken messages — that a site with two-ish locales and full prerendering doesn't need. Both re-evaluated if the catalog count or size ever makes eager loading hurt; noted in Open questions.)

### Locale model

```ts
// src/lib/i18n/locales.ts — the single registry
export const DEFAULT_LOCALE = 'en';
export const LOCALES = ['en'] as const;          // Phase 3: ['en', 'es']
export type Locale = (typeof LOCALES)[number];
```

Default language lives at root (`/`, `/blog/…`); every other locale is a prefix peer (`/es/`, `/es/blog/…`). Widening `LOCALES` is the forcing function: every `Record<Locale, …>` in the codebase fails to compile until the new language is complete — Bioma's proven mechanism.

### Catalogs

```
src/lib/i18n/
├── locales.ts            registry (above)
├── types.ts              Messages contract — DERIVED from the English catalog
├── index.ts              messages: Record<Locale, Messages>, href helpers
├── detect.ts             client-side suggestion logic (Phase 3)
└── catalogs/
    ├── en/
    │   ├── index.ts      barrel: const en = { nav, home, offerings, … }
    │   ├── nav.ts  home.ts  offerings.ts  retreats.ts  book.ts
    │   ├── voices.ts  contact.ts  footer.ts  blog.ts  seo.ts  common.ts
    └── es/               Phase 3 — mirrors en/, typed `: Messages`
```

English is the source of record (per the stated plan: English first, others derived from it). The contract is **derived, not hand-maintained** — fixing both reference systems' weakness at once (Alquimia: siblings unchecked; Bioma: 1,274-line hand-written interface):

```ts
// types.ts
import type en from './catalogs/en';
type Message<T> = T extends (...args: infer A) => string
  ? (...args: A) => string
  : T extends string
    ? string
    : { readonly [K in keyof T]: Message<T[K]> };
export type Messages = Message<typeof en>;
```

`const es: Messages = { … }` then has every missing key as a compile error and every extra key as an excess-property error. `npm run check` (already in the repo and CI) is the enforcement — unlike both references, this repo's workflow actually runs its typechecker.

Interpolation is Bioma's function-valued style, typed for free: `count: (n: number) => \`${n} min read\``. Plurals use `Intl.PluralRules` inside the catalog function when a language needs more than a ternary — zero-dependency, correct for future Slavic/Arabic locales.

### Runtime — URL is the only authority

No language store, no context gymnastics. The locale is derived from the route:

- `src/params/locale.ts` — param matcher accepting only non-default locales, so `/es/…` matches and `/blog/…` still resolves normally; unknown prefixes 404.
- Routes move under an optional group: `src/routes/[[lang=locale]]/+page.svelte`, `[[lang=locale]]/blog/…`. `robots.txt` and `sitemap.xml` stay global; `rss.xml` / `feed.json` move under the group (per-language feeds).
- `+layout.ts` `load` resolves `params.lang ?? DEFAULT_LOCALE` → `{ locale }`; `+layout.svelte` exposes `locale` and `t = messages[locale]` via context. Components read `t.nav.home` — property access, autocompleted, compile-checked.
- Switching language is **navigation**: the switcher renders `<a href hreflang rel="alternate">` links to the peer URL (crawlable, works without JS); a click handler additionally persists the choice. Everything re-renders through the load invalidation SvelteKit already does.
- `<html lang>`: `app.html` gains a `%lang%` placeholder; a new `src/hooks.server.ts` `transformPageChunk` substitutes the route's locale. Runs at prerender time, so every emitted HTML file carries the right `lang` — the signal Bing actually reads, and the thing both reference systems got wrong or duplicated.
- Locale-aware links: an `href(path, locale)` helper prefixes non-default locales. `nav.ts` keeps its structural role but its `label` fields become message keys resolved through `t` (labels leave `nav.ts`, hrefs stay).

### Detection — every knob, none of them a redirect

Precedence, executed client-side only (the static server cannot and must not sniff):

1. **URL prefix** — authoritative, always wins. What you share is what anyone opens.
2. **Stored explicit choice** — `ayni-language` + `ayni-language-source: 'user' | 'auto'` (Bioma's two-key provenance scheme). Only when source is `user`: landing on `/` from outside the site triggers a client-side `goto` to the chosen locale's homepage. Crawlers have no localStorage; Google's no-auto-redirect rule is untouched.
3. **`navigator.languages`** — suggestion only: a dismissible one-line banner ("¿Prefieres español?") when the browser's language has a version the current page isn't in. Dismissal is remembered (`source: 'auto'`, banner-dismissed flag). Never navigates on its own.
4. **Fallback** — the page's own locale. `DEFAULT_LOCALE` for anything ambiguous.

Choosing a language via the switcher writes the store with `source: 'user'`. That is the entire state machine; there is no cookie (nothing server-side reads one) and no `Accept-Language` handling (no server).

### SEO surface

- `Seo.svelte` (already the single head writer) gains an `alternates` prop: the set of locales this page exists in. It emits self-referencing + bidirectional hreflang link tags plus `x-default` → the English URL — head-tag method chosen over sitemap alternates (one method only per Google; head tags are per-page verifiable and this site is small). Pages without translations emit nothing new.
- Per-locale `og:locale` (`en_US`, `es_PE`), localized title/description from the `seo` catalog domain, self-canonical per language variant.
- `sitemap.xml` enumerates all locale URLs (plain `<url>` entries, no `xhtml:link` — that would be the second hreflang method).
- JSON-LD gains `inLanguage`; localized descriptions come from the catalogs, not a parallel copy — the Alquimia drift bug is structurally impossible because prerendering *is* the one rendering path.
- Blog feeds: `/rss.xml` (en) and `/es/rss.xml`, each listing only its language's posts with the proper `<language>` element.

### Blog

Colocated translations, same slug, filename suffix:

```
src/content/blog/<slug>/
├── index.md        English (source)
├── index.es.md     Spanish, when and only when translated
└── *.jpg           shared images
```

- The loader (`list.ts`) builds per-locale collections; a post appears in a locale's index, feed, JournalStrip and topic pages only if that locale's file exists.
- A translation pair shares its slug and directory; `Seo.svelte` receives both URLs as `alternates` → hreflang pair. An untranslated post has no `/es/` URL at all — no placeholder pages, no fallback redirects, per Google's partial-translation guidance.
- `blog-check.mjs` extends: an `index.es.md` must carry the same frontmatter contract, and (optional, recommended) a `translationOf`-free world — the filename is the declaration, nothing to desync.
- Workflow: machine-translate a post, human-review (the collective has native Spanish speakers on the ground in Calca), publish. If ever published unreviewed, frontmatter `noindex: true` (already supported by `Seo.svelte`) until reviewed.
- Priority order per the research: never translate a blog post before the marketing pages are fully translated. Personal-voice journal entries may remain English-only indefinitely.

### Enforcement — what prevents hardcoded strings

1. **Compiler.** Key parity and interpolation arity via `Messages` + `npm run check` (exists, runs in CI). A new language is "done" when the build compiles.
2. **`scripts/i18n-check.mjs`** (`npm run i18n:check`), modeled on `blog-check.mjs`: scans `.svelte` templates for raw text nodes and string-literal `aria-label` / `alt` / `title` / `placeholder` attributes outside `src/lib/i18n/`, against a small allowlist (brand names, numerals, the ODbL attribution). Warn-only in Phase 1, failing in Phase 2+, wired into the existing check workflow. Both reference systems leaked hardcoded `aria-label`s precisely because nothing scanned for them.
3. **`.agents/skills/i18n/SKILL.md`** — the agent-facing constitution, ported from Bioma's: never hardcode user-facing strings; where strings go (domain file table); how to add a string (en first, `check` forces the rest); the full add-a-language checklist (widen `LOCALES`, create catalog dir, compiler drives the TODO list, add switcher entry — which is itself a `Record<Locale, …>` and therefore compiler-forced); blog translation workflow. Registered in `AGENTS.md`'s skill table.

## Phasing

Revised after adversarial review (see § Review outcomes). **The route-group move is deferred to Phase 3.** A "dormant" `[[lang=locale]]` group buys nothing while there is one locale, yet it relocates every route file and breaks four build-time consumers — so Phase 1 kept none of its promised byte-identity. Keeping the tree flat until Spanish actually lands is the ponytail-correct call; the cost is a larger Phase 3 diff, which is gated on an explicit user signal anyway.

**Phase 1 — the system (now, genuinely zero visible change).** `src/lib/i18n/`: registry (`locales.ts`), derived `Messages` contract (`types.ts`), `catalogs/en/` skeleton with **every domain file annotated** `Messages['<domain>']`, and the `href()` / `stripLocale()` helpers. Plus `hooks.server.ts` + `%lang%` in `app.html`; `Seo.svelte` gains `locale` and `alternates` props (emitting nothing while there is one locale) and a `Content-Language` meta; `format.ts` becomes locale-keyed; `i18n-check.mjs` in warn mode; the `.agents/skills/i18n` skill. **No route move, no switcher, no detection.** Output byte-identical by construction.

**Phase 2 — English extraction.** The ~165 measured strings move into `catalogs/en/` — components, `nav.ts` labels, `Seo` titles/descriptions, JSON-LD copy, form validation and aria text. `i18n:check` flips to failing. Output still byte-identical; English now flows from the catalog. This is the moment the copy gets its final read-through, since the site is still being written.

**Phase 3 — first added language (es, on the user's signal).** The structural phase, in dependency order:

1. Route group `[[lang=locale]]` + `src/params/locale.ts`.
2. **Rewrite `src/lib/seo/routes.ts` to enumerate `LOCALES × pages` from the registry** instead of globbing file paths, and fix `routeExists`; mirror in `scripts/blog-check.mjs`.
3. Update `svelte.config.js`: `handleUnseenRoutes` route id, per-locale `PLANNED_ROUTES`, and `prerender.entries` seeded with each non-default locale root.
4. Audit every hardcoded pathname (list in § Review outcomes) behind `stripLocale()`.
5. Thread `locale` through `Seo.svelte`, both feeds and their self/discovery links.
6. Blog loader: widen the glob, locale-aware `getPost`/`href`, and a `blog-check` rule that `index.es.md` requires a sibling `index.md`.
7. `catalogs/es/`, switcher, detection, hreflang, per-locale sitemap and `/es/rss.xml`.
8. Post-build assertion script over `build/` (hreflang bidirectional, every locale URL in the sitemap, `html lang` matches URL prefix).

Ship only when the full conversion path is translated — chrome and marketing pages complete; an empty Spanish blog is fine. Posts translate opportunistically afterward.

## Review outcomes (adversarial review, 2026-08-08)

Reviewed by an independent agent against the installed toolchain, then every load-bearing claim re-verified here. Sixteen findings; two blockers. The direction held — URL-prefix model, no-auto-redirect policy, `%lang%` via `transformPageChunk`, the matcher-excludes-default param, and the derived-type contract are all correct — but the following corrections are folded in above.

**Blocker 1 — the route-group move breaks four build-time consumers.** `src/lib/seo/routes.ts:19` filters `STATIC_ROUTES` by `!route.includes('[')`; after the move every path contains `[[lang=locale]]`, so the set empties and **the sitemap loses every static page**. `routeExists` (`routes.ts:33`) builds its regex with `route.replace(/\[[^\]]+\]/g, '[^/]+')`, which on `/[[lang=locale]]/blog` yields `^/[^/]+]/blog$` — a stray literal `]` that matches nothing, verified in node — so `ctaFor` (`src/lib/blog/cta.ts`) silently drops **every post CTA**. `scripts/blog-check.mjs:91` strips only `(group)` parens and breaks identically. Resolved by deferring the move and rewriting these from the registry (Phase 3, steps 2–3).

**Blocker 2 — the prerender guards go stale on the move.** `svelte.config.js:44` whitelists the literal route id `'/blog/[slug]'`, which becomes `/[[lang=locale]]/blog/[slug]`, so an empty-blog build — an explicitly supported state — would throw. `PLANNED_ROUTES` holds unprefixed paths only, so a Phase-3 crawl of `/es/wings` throws. Same resolution.

**Correction to the parity claim (my verification was wrong).** Excess-property checking applies only to *fresh* object literals. Composing unannotated domain consts through a barrel (`const es: Messages = { nav: esNav }`) lets a stray key pass **silently** — verified: no error. Annotating each domain file `const nav: Messages['nav'] = {…}` restores it (`TS2353`, verified). Arity is one-directional: extra parameters error, **fewer parameters do not** (`() => string` is assignable to `(n: number) => string`). The plan now mandates per-file annotation and states the arity limit honestly.

**Prerender enumeration** — as recorded in § Verification, plus per-route `entries()` emitting `{ lang, slug }` pairs for locales that have a file, and a matcher unit test rejecting `'fr'`, `'blog'`, `'en'`.

**Pathname audit list** (all break under a locale prefix): `+layout.svelte:27` `isHome`, `:30` `isBlog`, `:37–45` the `blogEntry` effect (`startsWith('/blog/')`, `prevPath === '/'`, `ref.pathname === '/'`) feeding `src/lib/blogNav.svelte.ts`; `src/lib/blog/list.ts:45` `href`; `src/lib/blog/cards.server.ts:28` `topicHref`. The `isHome` failure is the dangerous one — it disables the hero navbar-clip machinery visually and silently.

**Detection trigger, now specified.** The redirect-on-stored-choice fires only on a fresh entry (`afterNavigate` with `type === 'enter' | 'reload'`) and no-ops when the locale already matches, so the Home link cannot bounce a Spanish user in a loop. Because the homepage is a 380vh scroll-driven journey that paints before `onMount`, the redirect is instead a tiny inline script in `app.html`'s head running before first paint (no CSP on this site); the `afterNavigate` guard remains as the no-JS-ordering fallback.

**Feeds and head links** — `Seo.svelte:78–79` advertises `/rss.xml` and `/feed.json` on every page, `rss.xml/+server.ts:56` and `feed.json/+server.ts:17` hardcode self/home URLs. All become locale-derived in Phase 3, step 5. `hreflang` on switcher anchors is advisory only — Google reads head `<link>`, sitemaps or headers; the anchors stay for crawlability and no-JS, but earn no SEO credit.

**Accepted cuts (ponytail).** The `ayni-language-source` key is dropped: Bioma needed provenance because auto-detection *wrote* the store, whereas here nothing auto-writes, so the key's mere presence already means "the user chose it". One value key plus one banner-dismissed flag. Catalogs start at ~3–4 domain files, not 11, splitting only when a file hurts. `Intl.PluralRules` gets a comment and zero code — ternaries are correct for en/es.

**Smaller decisions taken.** 404 chrome stays English/language-neutral (adapter-static emits a single `fallback: '404.html'`; per-locale fallbacks are impossible). `Content-Language` ships as `<meta http-equiv>` from `Seo.svelte`, since static hosting sets no per-page headers. `formatReadingTime`'s English prose moves into the catalog; per-locale `Intl` requires full-ICU Node in CI, which is pinned as an assumption. `i18n-check.mjs` stays line/regex-based with an allowlist and gets deleted if it is still noisy after Phase 2 — the typechecker and the skill are the real enforcement. Spanish glyph coverage (á é í ó ú ñ ¿ ¡) in the display font is a one-time check before Phase 3. No RTL scaffolding: en and es are both LTR.

## Open questions

## Verification — what was tested against the real toolchain

Run 2026-08-08 against the installed versions: SvelteKit 2.69.3, Svelte 5.56.5, Vite 6.4.3, TypeScript 5.x. These are empirical results, not readings of documentation.

**The derived `Messages` contract does enforce parity.** A scratch catalog compiled with `tsc --strict` produced exactly the intended errors and no others: a missing key is `TS2741`, an extra key is `TS2353` (excess-property checking does reach nested object literals typed as `Messages`), a function with wrong arity is `TS2322`, and a typo at a consumer (`t.nav.nope`) is `TS2339`. A complete translation compiles clean, and a plain `string` is assignable where the English source had a literal type — so translations need not be `as const`. The mechanism works as designed.

**The optional locale param does not swallow existing routes.** Tested against SvelteKit's own `parse_route_id`/`exec`, with a matcher accepting only `es`:

| Route id | URL | Result |
|---|---|---|
| `/[[lang=locale]]` | `/` | `{}` |
| `/[[lang=locale]]` | `/es` | `{lang:'es'}` |
| `/[[lang=locale]]` | `/blog` | no match (falls through correctly) |
| `/[[lang=locale]]` | `/fr` | no match → 404 |
| `/[[lang=locale]]/blog/[slug]` | `/blog/my-post` | `{slug:'my-post'}` |
| `/[[lang=locale]]/blog/[slug]` | `/es/blog/my-post` | `{lang:'es',slug:'my-post'}` |

The matcher rejecting the default locale is what makes `/blog` resolve as a path segment rather than a language. Confirmed correct.

**Hooks do run during prerendering.** `node_modules/@sveltejs/kit/src/core/postbuild/prerender.js:260` calls the full `server.respond(...)`, and `runtime/server/index.js:113` resolves the user's `handle` hook on that path. So `transformPageChunk` substituting `%lang%` in `app.html` executes at build time and every emitted file carries the right `lang`. Confirmed viable.

### Defects found in this plan by that verification

1. **`/es/*` would never be prerendered.** `prerender.js:566` expands the default `entries: ['*']` by *stripping optional segments* — `get_route_segments(id).filter((s) => !s.startsWith('[['))` — so `'*'` enumerates `/blog` and never `/es/blog`. Locale pages would exist only if the crawler happened to follow switcher links, and `handleUnseenRoutes` in `svelte.config.js` would fire. **Fix:** derive `kit.prerender.entries` from the locale registry (`['*', ...NON_DEFAULT_LOCALES.map((l) => \`/${l}\`)]`) so each locale root is seeded explicitly; the crawler then reaches `/es/blog`, `/es/blog/<slug>` and the rest from there via real links. `export const entries` is available on both page and server nodes (`types/index.d.ts:2797`) as a per-route escape hatch if any locale page ends up unlinked.

2. **The layout's route tests break under a locale prefix.** `src/routes/+layout.svelte:27,30` derive `isHome` as `page.url.pathname === '/'` and `isBlog` as `.startsWith('/blog')`. Under `/es` and `/es/blog` both go false, which silently disables the hero navbar-clip takeover and the blog white-navbar parking — the exact machinery `HANDOFF.md` records as the source of two prior hydration bugs. **Fix:** a `stripLocale(pathname)` helper in `$lib/i18n`, applied before every path comparison. Audit for the same pattern anywhere else before Phase 3.

3. **Nav hrefs are root-relative with fragments.** `NAV_LINKS` uses `/#offerings`, `/#retreats`, `/#book`, `/#contact` (deliberately, so they work from `/blog`). Under `/es` these jump to the English homepage. **Fix:** the `href()` helper must prefix the path portion while preserving the fragment.

4. **Content data modules were not addressed.** `src/content/topics.js` holds 24 prose strings (topic names and pillar `intro` copy) and `authors.js` holds 3. These are content, not UI chrome, so they belong with the content model rather than the UI catalogs. **Fix:** decide explicitly in Phase 2 — recommended is per-locale fields on the topic/author records, since a topic slug is a URL and must not be translated casually.

5. **String count, measured.** ~96 user-facing strings in templates plus ~69 prose literals in `<script>` blocks and data modules — roughly **165**, heaviest in `blog/+page.svelte` (16), `blog/[slug]/+page.svelte` (10), `ContactSection` (12), `BookSection` (24), `OfferingsSection` (12), `VoicesSection` (9). Phase 2 is about a dozen catalog domain files. `ScrollDebug.svelte` is a dev tool and is exempt.

## Open questions

- **Default at root = English?** Recommended (international guest audience, `x-default` → root). Alquimia chose Spanish-at-root for a Costa Rican business; this site's booking audience is anglophone-first. Needs user confirmation before Phase 3 — it is one constant, but it decides every URL.
- **Second language = es, region flavor `es_PE`?** Assumed. Any further languages (fr/de/pt per Alquimia's set?) change nothing structurally — each is a catalog dir + one `LOCALES` entry.
- **Translated blog slugs** (`/es/blog/ceremonia-del-valle` vs shared `/es/blog/valley-ceremony`): shared slug chosen for Phase 3 (simpler, no mapping table). Localized slugs are an SEO nicety that can be added later via frontmatter without breaking URLs already published — revisit only if Spanish keyword research says the slug matters.
- **Eager bundle growth.** All locales ship in the JS bundle (both references accepted this). At two locales × marketing-site catalog size this is a few KB gzipped. If the catalog count or size ever makes this hurt, per-locale dynamic import at the layout boundary is the escape hatch — or Paraglide, which exists to solve exactly this. Not now (ponytail).

## Decisions and revisions

- 2026-08-08 — Initial research. Zero-dependency Bioma-style typed catalogs + Alquimia-style URL-prefix locales, executed natively via SvelteKit `[[lang=locale]]` + prerender (no post-build script, no second copy of strings). Detection: URL > stored user choice > navigator suggestion banner; no auto-redirects (Google guidance + static hosting both forbid it). Blog: colocated `index.<lang>.md`, hreflang only between real pairs, per-language indexes/feeds. Phased: system → English extraction → first language.
- 2026-08-08 — **Phases 1 and 2 implemented and verified.** All four gates green: `npm run check` 0 errors, `npm run i18n:check` 0 findings (now a failing gate, negative-tested), `npm run blog:check` 0 failing, `npm run build` exit 0 with `Wrote site`. Built output confirms `<html lang="en">` on every page with no leftover `%lang%`, no hreflang while monolingual, and unchanged canonical/feed URLs. Two deliberate deviations from byte-identity, both corrections: `og:locale` `en` → `en_US` (Open Graph wants `language_TERRITORY`), and the hero social links' accessible names now name their destination. The `seo` catalog domain was created in Phase 1 and **deleted** in Phase 2 — page metadata belongs with the page's own copy, and the separate domain immediately duplicated the blog title. Phase 3 remains gated on the two open questions below.
- 2026-08-08 — Revised after adversarial review (16 findings, 2 blockers) and independent re-verification. **The route-group move moves from Phase 1 to Phase 3**: it breaks `seo/routes.ts` sitemap derivation and `routeExists`/`ctaFor`, `scripts/blog-check.mjs`'s route scan, and both prerender guards in `svelte.config.js`, so Phase 1 could not have been byte-identical as written. **Parity claim corrected**: excess-property checking does not survive barrel composition, so every locale domain file must be annotated `Messages['<domain>']`; under-arity functions are silently allowed. Added: explicit `/es/*` prerender enumeration, the hardcoded-pathname audit list, a specified redirect trigger (pre-paint inline script + `afterNavigate` enter/reload guard), locale-derived feed and head links, and a post-build assertion script. Cut per ponytail: the `-source` localStorage key, 11-way catalog splitting, `Intl.PluralRules` code.

## Sources

Reference implementations (read in full on this machine, 2026-08-08):

- `/opt/projects/Alquimia-Web/src/i18n/index.ts`, `src/i18n/i18next.d.ts`, `src/i18n/locales/*.ts`, `src/components/LanguageDropdown.tsx`, `scripts/prerender.mjs`, `scripts/seo-data.mjs`, `SEO_SETUP.md`
- `/opt/projects/bioma/src/shared/contexts/LanguageContext.tsx`, `src/shared/hooks/useAppTranslation.ts`, `src/shared/components/language-switcher.tsx`, `src/shared/lib/date-locale.ts`, `src/locales/app/**`, `.agents/skills/i18n/SKILL.md`, `docs/architecture.md` §i18n
- `/opt/projects/Bioma/src/contexts/LanguageContext.tsx`, `src/locales/app/types.ts`, `src/pages/landing/locales/*`, `.claude/rules/i18n.md`, `convex/email/locales/*`

Search-engine guidance (verified current 2026-08-08):

- Google Search Central — [Managing multi-regional and multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites) (updated 2025-12-10)
- Google Search Central — [Localized versions of your pages (hreflang)](https://developers.google.com/search/docs/specialty/international/localized-versions) (updated 2025-12-22)
- Google Search Central — [Translated results](https://developers.google.com/search/docs/appearance/translated-results) (updated 2025-12-10)
- Google Search Central — [Spam policies: scaled content abuse](https://developers.google.com/search/docs/essentials/spam-policies) (updated 2026-05-15)
- Google Search Central — [Locale-adaptive pages](https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages) (updated 2025-12-10)
- Search Engine Journal — [Google removes robots.txt guidance for blocking auto-translated pages](https://www.searchenginejournal.com/google-removes-robots-txt-guidance-for-blocking-auto-translated-pages/548870/) (2025-06-11)
- GSQi — [Google's evolving view of auto-translated content (Reddit case)](https://www.gsqi.com/marketing-blog/auto-translating-content-google-scaled-content-abuse/) (2025-06-11)
- Ahrefs — [hreflang guide](https://ahrefs.com/blog/hreflang-tags/) · Search Engine Land — [What is hreflang](https://searchengineland.com/guide/what-is-hreflang)
- Digital Ready Marketing — [Bing doesn't use hreflang](https://digitalreadymarketing.com/bing-doesnt-use-hreflang-annotation-what-does-it-use/)
- hreflang.org — [Redirection and international SEO](https://hreflang.org/redirection-and-international-seo/)
