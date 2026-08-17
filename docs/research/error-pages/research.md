---
owns:
  - src/routes/+error.svelte
slug: error-pages
status: reference
created: 2026-08-09
last-updated: 2026-08-09
sources: 5
---

# Error pages

The site has no error pages today. Three things happen as a result: a
broken post slug (the only place SvelteKit throws `404` — see
`src/routes/blog/[slug]/+page.server.ts`) renders the framework's
default error chrome with no copy and no way back; a build that somehow
ships a runtime error renders an empty document (the layout would error
again, so nothing reaches the browser); and any deep link served from
the static host that does not match a prerendered route lands on a host-
generated 404 page that is nothing to do with the site. The site is
nearly complete; this gap is the only one a visitor can fall into.

## Scope

Two surfaces, both landing in the same place:

| Path | Trigger | Renders |
|---|---|---|
| `/blog/<unknown>` and any other prerendered route that throws | SvelteKit `error(404)` etc. in a `load` | `+error.svelte` (this research) |
| `/anything-else` served from the static host | adapter-static SPA fallback (`build/404.html`) | `404.html` (this research) |
| 5xx raised by the framework | SvelteKit `error(500)` etc. | `+error.svelte` |
| Unhandled exception during render | SvelteKit | `+error.svelte` |

The 5xx case is included even though the static site cannot raise one
itself: a `prerender` failure during `npm run build` is a CI failure,
not a runtime one, but a defensive page keeps the contract honest.

## Constraints

- **Layout still applies.** Every existing page renders inside
  `src/routes/+layout.svelte`. The error page must inherit it (header,
  footer, navbar). Rendering inside nothing strips the visitor's
  context — they have no wordmark, no nav, no exit — which is exactly
  what the existing root-page failure mode already was. SvelteKit does
  this for free: `+error.svelte` mounts inside the closest layout, so
  the rule is "use the layout, do not bypass it."
- **No Chrome special-casing on error.** The navbar's white layer is
  already parked HIDDEN for any non-home route (`+layout.svelte`). The
  error page is non-home, so no extra work is needed there.
- **The header does not clip.** The hero's scroll driver only fires on
  `/`. On every other route the white navbar is `CLIP_HIDDEN` from the
  layout's mount-time effect, so the error page inherits that without
  any per-component logic.
- **Single page, three states.** 404, 500 and 503 are three flavours
  of "the page you asked for is not here". One page reads them all —
  the heading, the lead and the helper copy vary, the navigation back
  out does not.
- **i18n Phase 2 applies.** Every user-facing string lives in
  `$lib/i18n/catalogs/en/`. The `error` domain follows the existing
  split-by-surface rule (chrome / home / blog) by adding one more
  surface; a future locale widens `LOCALES` and the type contract
  enforces parity for free.
- **Sovereignty.** No third-party tracking, no cloud-hosted 404
  service, no "rate-limited visitor" feedback forms. The page is
  navigation only.
- **`npm run i18n:check` must stay green.** The scanner reads every
  `.svelte` under `src/lib/components` and `src/routes`. The error
  page ships no hardcoded prose.
- **`noindex, follow`.** Error pages should never appear in search
  results. The existing `Seo.svelte` already supports a `noindex`
  prop; this is a one-line wiring.

## Design

Three copy slots per state, all rendered the same way:

```
[Eyebrow] · small label that names the condition
[Heading] · one line, display type, states what happened
[Lead]    · two short sentences at most, in body type
[Help]    · a list of exits back to working pages
```

The list of exits replaces the page's normal next step, which is what
the rest of the site does for every CTA — none of the existing CTAs
are pure decoration, and an error page that lists exits is the same
contract carried to its endpoint. The same five doors the
`SiteFooter` exposes are the doors the error page exposes: the
homepage, offerings, retreats, book, journal, contact, and the
in-site search (the blog's input is the only one in scope today;
defer a `/search` route until it ships).

Status-specific copy:

| Status | Eyebrow | Heading | Lead |
|---|---|---|---|
| `404` | "Not found" | "This page is not here." | "The link may be old, the URL may have a typo, or the page may have moved. The valley is still here, and so are we." |
| `403` | "Off the path" | "This way is not open." | "Some pages are kept quieter than others. If you arrived here by link, write to us and we will walk you to the right one." |
| `500` | "Something broke" | "A piece on our end failed." | "We have been told, and we are looking. Try again in a moment, or read the journal while the valley settles." |
| `503` | "We are away" | "The site is being tended to." | "A short maintenance window — try again shortly, or stay for the journal." |
| default | "Something is off" | "We could not load this page." | "Try again, head home, or write to us. We read every message." |

A `notFound` boolean and a `status` number are the only state the
component needs. The rest is copy selection against `status` (404,
403, 500, 503) with a fallback for anything else.

## SEO

- `<title>` is the status + a static suffix (`"Not found · Ayni"`).
- `description` is the lead.
- `noindex, follow` — search engines should not index error pages,
  but the links out of one should pass through to the destination.
- No JSON-LD. A 404 page is not a `WebPage` worth describing.
- `canonical` is the URL the visitor actually requested, not the
  site's root — a missing canonical leaves the page ambiguous to
  crawlers, and `Seo.svelte` already handles that.

## Static fallback

`adapter-static` ships a `404.html` that the host serves for any URL
that does not match a prerendered file. With SSR on, the prerendered
404 page is also the SPA fallback: any deep link hits the host's 404,
the host serves `404.html`, the client boots SvelteKit, the route
resolves to nothing, SvelteKit shows `+error.svelte` — which is now a
real page. The fallback file the adapter generates is the empty
shell, but it already routes to `+error.svelte` correctly, so this
research does NOT need to hand-author `404.html` — the only thing
needed is the `+error.svelte`.

Two caveats worth recording:

1. The host must serve `404.html` (not a generic CGI 404). This is a
   deployment rule, not a code one. GitHub Pages, Cloudflare Pages and
   Netlify all do this by default; the rule belongs in the deploy
   docs, not here.
2. With SSR on (`+layout.ts`) every prerendered route IS a real HTML
   file, and the fallback only fires for routes that were never
   prerendered. The blog's `[slug]` route is the only one that does
   runtime work, and its `load` throws `error(404)` directly, so it
   will never serve a host-generated 404 for a missing post — the
   framework error is what fires.

## What is deliberately NOT in scope

- **A `500.html` static page.** Static hosting has no concept of a
  500; a runtime 500 only happens if SvelteKit raises it, which
  `+error.svelte` handles.
- **Per-locale error pages.** Phase 3 of i18n widens `LOCALES`; the
  `error` domain ships in `en` only, like every other domain today.
  When a second locale arrives the type contract fails on missing
  keys — that is the forcing function, not a TODO here.
- **Search.** The blog has a search input but no global one. A
  "Search the site" CTA on the error page would point at a URL that
  does not exist. The journal link serves the same function for now.
- **A fun "lost in the mountains" illustration.** Aesthetic, not
  navigation; the site's rule is hairlines not ornaments. If
  illustration lands later it lands as a separate component, not a
  blocker here.

## Decisions and revisions

- 2026-08-09 — initial research. One page (`+error.svelte`), one
  domain (`error`), five statuses (404, 403, 500, 503, default), no
  static `404.html` hand-authoring, no per-locale pages, no
  illustration.

## Sources

- `src/routes/blog/[slug]/+page.server.ts` — the only place
  `error(404)` is currently thrown.
- `src/routes/+layout.svelte` — the navbar parking logic that makes
  the error page inherit the right chrome automatically.
- `src/lib/seo/Seo.svelte` — `noindex` prop already exists.
- `svelte.config.js` — `adapter-static` with `fallback: '404.html'`,
  SSR on, `prerender` on.
- SvelteKit docs — `+error.svelte` mounts inside the closest
  layout; `error()` is thrown from `load` functions.