---
name: i18n
description: How user-facing text works in this repo — typed catalogs, no i18n library. Use when adding or changing any string a reader sees, or when adding a language.
---

# i18n

**Never hardcode a user-facing string.** Not in a template, not in an `aria-label`, `alt`, `title` or `placeholder`, not in a data array inside `<script>`. Every word a reader sees comes from a catalog.

Canonical source: `docs/research/i18n-system/research.md`.

## The system in one paragraph

There is no i18n library. Catalogs are plain TypeScript objects, so a message is a property (`t.chrome.nav.home`) rather than a string key — which means typos are compile errors and autocomplete works. English is the source of record; the `Messages` contract is *derived* from it, so every other language is checked against English by the compiler.

```
src/lib/i18n/
├── locales.ts          the registry — LOCALES, DEFAULT_LOCALE, isLocale, HTML_LANG, OG_LOCALE
├── types.ts            Messages, derived from the English catalog
├── index.ts            messages, t(), href(), stripLocale(), splitLocale()
└── catalogs/
    ├── en/             chrome · home · blog · seo  (SOURCE OF RECORD, not annotated)
    └── <lang>/         mirrors en/, every file annotated `Messages['<domain>']`
```

## Adding a string

1. Put it in the right domain file under `catalogs/en/`: `chrome` (nav, menu, footer), `home` (the homepage journey), `blog` (journal, cards, topics), `seo` (titles, descriptions, JSON-LD prose).
2. Read it through the catalog at the call site.
3. `npm run check` — every other language now fails to compile until it has the key. That is the intended workflow, not an obstacle.

Interpolation is a **typed function**, never a `{{placeholder}}` string:

```ts
// catalogs/en/blog.ts
readingTime: (minutes: number) => `${minutes} min read`
```

Word order around a value differs by language (`4 min read` / `4 min de lectura`), and a function lets each language write its own sentence. Plurals are ternaries inside the function — correct for English and Spanish. Do not reach for `Intl.PluralRules` until a language needs more than two forms.

## Adding a language

1. Widen `LOCALES` in `src/lib/i18n/locales.ts` and add its `HTML_LANG` / `OG_LOCALE` entries.
2. Run `npm run check`. Every `Record<Locale, …>` in the codebase now errors. **That list of errors is the complete worklist** — work it down.
3. Create `catalogs/<lang>/`, mirroring `en/`. **Annotate every domain file:**

   ```ts
   import type { Messages } from '$lib/i18n/types';
   const chrome: Messages['chrome'] = { … };
   export default chrome;
   ```

   Annotating the barrel instead is NOT equivalent — excess-property checking only applies to fresh object literals, so a stray key in an unannotated file composed through a barrel passes silently. Per-file annotation is what makes a misspelled key an error.

   English files are deliberately NOT annotated: `Messages` is derived from them, so annotating them would be circular.

4. The structural work (route group, hreflang, feeds, sitemap, detection) is Phase 3 in the research document. Follow it in order — several build-time consumers are coupled to route shape and break silently.

## What the compiler does and does not guarantee

| | |
|---|---|
| Missing key | error `TS2741` |
| Extra key | error `TS2353` — **only in annotated files** |
| Function with MORE parameters | error `TS2322` |
| Function with FEWER parameters | **allowed, silently** |
| Typo at a consumer | error `TS2339` |

## Comparing pathnames

Always `stripLocale(pathname)` before comparing a path to a literal:

```ts
import { stripLocale } from '$lib/i18n';
const isHome = stripLocale(page.url.pathname) === '/';
```

A raw `pathname === '/'` is false on `/es`, which silently disables the hero's scroll-driven navbar clip and leaves the page looking broken with nothing in the console. This is the single most common way prefixed URLs break a page.

Use `href(path, locale)` to build links; it preserves fragments (`/#offerings` → `/es#offerings`).

## Checks

- `npm run check` — the real enforcement: key parity, arity, consumer typos.
- `npm run i18n:check` — scans templates for hardcoded text and attributes. Warn-only during extraction. If it is still noisy after the extraction lands, delete it; a check nobody trusts is worse than none.
