---
owns: [blog, content-authoring, seo]
slug: blog-system
status: draft
created: 2026-08-05
last-updated: 2026-08-05
sources: 19
---

# Blog System — folder-driven authoring, minimal surface, maximal SEO

The homepage already ships `JournalStrip.svelte` with a hardcoded placeholder array and an `All journal entries →` link pointing at `/blog`, a route that does not exist. Both `JournalStrip.svelte` and `JournalCard.svelte` carry explicit `SEAM for /blog` comments naming the swap. This research decides what goes behind that seam: the markdown toolchain, the image pipeline, the rendering topology, the SEO surface, and the promotion structure. It also answers a question the seam does not raise but blocks everything downstream — the site currently renders no HTML at all for crawlers.

Trigger category, per `AGENTS.md` § Stop-and-ask: **new dependencies** and **5+ file edits**. Both apply.

Out of scope: comments, newsletter capture, analytics, search, multi-author workflow, and any form of remote content sync. Each is noted in Open questions where relevant.

## Constraints carried forward

- **Local-first.** Content is files on disk. No CMS, no database, no reachable service required to author, build, or read the blog.
- **Sovereignty first.** Nothing hosted by a third party. No CDN dependency for content, no external image service, no analytics beacon.
- **Open-source only, Apache-2.0 compatible.** Every dependency must be MIT/Apache-2.0 or compatible.
- **CRDT-friendly data.** Posts stay as plain `.md` with YAML frontmatter, so a post is representable as a text CRDT if content ever syncs over Yjs per [ADR 0004](../../adr/0004-yjs-hyperswarm-tauri.md). A framework-coupled content format would foreclose that.
- **Design system.** Plain CSS custom properties in `src/design/`. No Tailwind. Tokens only, never raw hex. Canonical source: [`design-system-minimal`](../design-system-minimal/research.md).
- **No drop shadows.** Hairlines only, per the standing direction recorded in `HANDOFF.md`. The offerings pin-card `filter: drop-shadow()` is the single deliberate exception and does not generalise.
- **Single app.** The blog is route group in the existing SvelteKit app, not a separate surface. Canonical source: [`single-app-architecture`](../single-app-architecture/research.md) and [ADR 0001](../../adr/0001-single-app-tauri.md).

## The blocking finding: the site currently renders nothing

`src/routes/+layout.ts` sets:

```ts
export const prerender = true;
export const ssr = false;
```

With `@sveltejs/adapter-static`, `prerender` walks the routes and writes files, but `ssr = false` means each written file is a client-boot shell. Measured on the committed build output:

```
$ wc -c build/index.html          →  2529
$ grep -c "Come as you are" build/index.html  →  0
```

2,529 bytes, and not one word of the page copy. Every crawler sees an empty document. This is not a blog problem, it is a whole-site problem, and it is the single highest-leverage change in this document. It matters more in 2026 than it did in 2020 because AI crawlers make it worse, not better: GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot and Google-Extended fetch HTML directly and do not execute JavaScript the way Googlebot's rendering service eventually does ([aeo.press, 2026-08-05](https://ai.aeo.press/the-state-of-llms-txt-in-2026)). A client-rendered page is invisible to the systems that decide what gets cited.

**Why `ssr = false` was set is worth stating plainly: it is not load-bearing.** An audit of every module that touches a browser API found all of them already guarded:

| Module | Browser access | Guard |
|---|---|---|
| `src/lib/scrollDriver.ts` | `window.scrollY`, `matchMedia`, `localStorage`, listeners | `typeof window !== 'undefined'` at module scope; the rest inside `bind*` functions called from `onMount` |
| `src/lib/scrollDriver.ts` | `CSS.supports` for `cssScrollDriven` | `typeof CSS !== 'undefined' && typeof CSS.supports === 'function'` |
| `src/routes/+page.svelte` | `URLSearchParams(window.location.search)` | inside `onMount` |
| `WelcomePanel`, `OfferingsSection`, `ScrollDebug` | `window.innerWidth`, `matchMedia`, `document.querySelector` | inside `onMount` |
| `RetreatsSection`, `src/lib/reveal.ts` | none | — |

Exactly one genuine hydration hazard exists, and it predates this research:

```ts
// src/lib/components/PatternDivider.svelte:27
const uid = `snake-${Math.random().toString(36).slice(2, 9)}`;
```

That runs at component-init scope, so under SSR the server emits `snake-a1b2c3d` into the SVG `<pattern id>` and the client re-renders `snake-x9y8z7w` into the `url(#…)` reference. The ids desync at hydration and the Andean stepped-snake band stops painting. Svelte 5.20 shipped `$props.id()` for exactly this case, and the project runs `svelte@5.56.5`, so the fix is one line.

## Landscape

### Markdown toolchain

| Option | Verdict |
|---|---|
| **mdsvex** `0.12.8` | **Rejected.** `peerDependencies.svelte` does permit `^5.0.0-next.120`, but layouts break in runes mode — `Cannot use $$props in runes mode`, open as [issue #738](https://github.com/pngwn/MDsveX/issues/738) since June 2025. It also hard-depends on `prismjs` and `prism-svelte`, and it couples every content file to Svelte, which conflicts with the CRDT-friendly constraint above. Notably, `svelte.config.js` already lists `.md` in `extensions`, which suggests mdsvex was anticipated. That anticipation should be reversed, not honoured. |
| **marked + gray-matter** | Rejected on headroom. Two deps and about forty lines, but heading anchors, smart quotes, footnotes and external-link `rel` each become a hand-rolled extension. Cheap now, expensive at post twenty. |
| **unified / remark / rehype** | **Chosen.** The plugin ecosystem covers every requirement as a named, maintained package, and it operates on `.md` without imposing a component model on it. All MIT. Runs server-side only, so none of it reaches the client bundle. |

### Image pipeline

| Option | Verdict |
|---|---|
| **`@sveltejs/enhanced-img`** | **Rejected on capability.** It transforms `<enhanced:img>` tags inside `.svelte` files at compile time. Markdown-referenced images never pass through the Svelte compiler, so the plugin cannot see them. |
| **`vite-imagetools`** | **Rejected on a version wall.** `v11.0.0` declares `peerDependencies: { vite: ">=8.0.0" }`. This project runs `vite@6.4.3` (and `@sveltejs/kit@2.69.3`). Older majors are looser — `v9.0.0` and below declare no peer at all — but pinning to a trailing major to dodge a peer range is a coupling with no upside when the underlying engine is available directly. |
| **`sharp` directly, in a build script** | **Chosen.** `0.35.3`, Apache-2.0, and already the engine underneath both alternatives. A `prebuild`/`predev` script gives full control over output naming, LQIP generation, EXIF stripping and content-hash caching, with no peer-range coupling. It also matches the convention the repo already hand-maintains in `static/images/` (`main_sanctuary-768.webp`, `-1920.webp`). |

The payoff is a Core Web Vital, not an aesthetic. Intrinsic `width`/`height` on every image drives CLS to zero, and AVIF/WebP derivatives cut transfer 30–70% against JPEG, which is what moves LCP under the 2.5s threshold ([Core Web Vitals 2026](https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide)). INP is the most-failed vital in 2026 at 43% of sites, and a prerendered article page with no client-side interaction passes it by construction.

### Structured data and the AI-citation surface

JSON-LD is the only format Google recommends, and in 2026 its role has widened past rich snippets: it is how AI Overviews, ChatGPT and Perplexity decide whether a page is worth citing, with AI Overviews now appearing in over 15% of Google searches ([digitalapplied](https://www.digitalapplied.com/blog/structured-data-seo-2026-rich-results-guide), [netstager](https://netstager.ae/blog/json-ld-for-modern-seo/)). The required set for a blog is `BlogPosting` with `headline`, `description`, `image`, `datePublished`, `dateModified`, `author` → `Person`, `publisher` → `Organization`, `mainEntityOfPage`, plus `BreadcrumbList` on posts and pillars, and `Organization` + `WebSite` site-wide.

**`llms.txt` is not worth shipping.** A SE Ranking study of 300,000 domains found 10.13% adoption after eighteen months, of which 39.6% are plugin stubs. AI crawlers overwhelmingly skip the file and crawl HTML directly, no major AI vendor has committed to reading it in production as of Q1 2026, Google's Gary Illyes confirmed no support and no plans, and Search Engine Land reported 8 of 9 sites saw no measurable traffic change after implementing it ([aeo.press](https://ai.aeo.press/the-state-of-llms-txt-in-2026), [codersera](https://codersera.com/blog/llms-txt-complete-guide-2026/)). Clean semantic HTML plus JSON-LD is the thing that actually earns citations, and Phase 1 delivers the HTML half.

### Content structure

Publishing isolated posts is the dominant 2026 SEO failure mode. The structure that compounds is hub-and-spoke: a pillar page per topic, every cluster post linking back to it, the pillar linking out to every post. Topical authority beats depth-in-one-document — twenty interconnected articles outrank one superior 5,000-word guide, and mature clusters drive 2–3× the organic traffic of the same content published as isolated posts ([Brafton](https://www.brafton.com/blog/strategy/topic-cluster-content-strategy/), [digitalapplied](https://www.digitalapplied.com/blog/seo-content-clusters-2026-topic-authority-guide)). Google's Helpful Content system evaluates breadth of coverage across a topic, and E-E-A-T rewards demonstrated first-hand experience, which for a retreat centre in Calca is the one asset that cannot be synthesised.

Cluster set chosen with the user, extending the three categories already hardcoded in `JournalStrip.svelte`: `ceremony`, `the-land`, `farm-and-food`, `retreats`, `sacred-valley`.

### Humanised writing

The 2026 tells are structural, not typographic. Em-dash frequency was the folk signal and has decayed as one; what detectors and readers now register is hedging verbs, formulaic sentence shapes, uniform pacing, and the absence of a stated position. The durable corrections are: cut the robotic opener and the summary wrap-up, break every list of three, take a side instead of hedging, vary sentence length, and drop the vocabulary tell-words — delve, tapestry, pivotal, furthermore, moreover, in conclusion, it is worth noting ([Medium](https://medium.com/@vaibhav.agarwal.iitd/how-to-make-ai-writing-sound-genuinely-human-and-beat-top-ai-detectors-in-2026-2ff888b8d5c5), [Context Link](https://www.context-link.ai/blog/chatgpt-em-dash-remover)).

Most of that list is mechanically checkable, which is the useful property: it belongs in a script (`blog-check.mjs`), not only in prose guidance a model may drift from. The user's stated preference is zero em dashes, which is stricter than the evidence requires and costs nothing.

### Feeds

RSS survives as direct, unmediated distribution — access to a publisher without an algorithm in between ([GeoBarta](https://geobarta.com/en/blog/why-rss-feeds-still-matter-2026-open-web-vs-algorithms)). For a project whose constitution is sovereignty and local-first, a feed is not a legacy checkbox, it is the ideologically correct distribution channel. RSS 2.0 plus JSON Feed 1.1, both prerendered, no server.

## Recommendation

Build the blog as seven sequenced phases, SSR first and alone.

1. **Site-wide SSR.** `ssr = true` in `src/routes/+layout.ts`, plus the one-line `$props.id()` fix in `PatternDivider.svelte`. Land as its own commit — a landing-page agent is working concurrently, and this diff must stay trivially reviewable against theirs. Verification is a grep: `build/index.html` must contain `Come as you are.`
2. **Content model.** `src/content/blog/<slug>/index.md` with colocated images. The `$content` alias already exists in `svelte.config.js`. Frontmatter contract validated by a plain function, no schema library. Taxonomy in `src/content/topics.ts`, authorship in `src/content/authors.ts` feeding `Person` JSON-LD.
3. **Markdown pipeline.** unified/remark/rehype/shiki, in a `.server.ts` module so none of it reaches the client. Two custom plugins: post-relative image resolution against the build manifest, and `<hr>` → the existing `PatternDivider` band.
4. **Images.** `scripts/blog-images.mjs` on `prebuild`/`predev`. AVIF + WebP at 480/768/1280/1920 without upscaling, 24px inline LQIP, EXIF stripped, content-hash cached, manifest at `static/_blog/manifest.json`, derivatives gitignored.
5. **Routes and prose design.** `/blog`, `/blog/[slug]`, `/blog/topic/[topic]`, all prerendered. New `src/design/prose.css` on tokens only, 68ch measure. The cover image finally uses `.entry-media` + `.entry-media-frame` from `components.css` — the canonical image treatment, currently unreferenced. `JournalCard.svelte` is reused across all three surfaces rather than duplicated.
6. **SEO surface.** One origin constant (`https://aynicollective.org`) in `src/lib/seo/site.ts`; `Seo.svelte` as the single writer of `<svelte:head>`. The existing `+layout.svelte` head block duplicates `charset` and `viewport` already present in `src/app.html` and hardcodes a title every route must fight — fold it into `Seo.svelte`.
7. **Promotion.** Pillar pages, tag-scored related posts, feeds, sitemap with `lastmod`, robots. Contextual CTA mapped from topic, with a hard constraint noted below. `JournalStrip` reads the three real latest posts via a new `src/routes/+page.server.ts`.
8. **Authoring skill.** `.agents/skills/write-blog-post/` — interviews the author, pushes back when the post lacks first-hand specifics, applies the humanisation rules, places at most one in-body link and one CTA card, and must be willing to emit zero CTAs when no destination is genuinely relevant. Enforced by `scripts/blog-check.mjs` in `oss-gate.yml`.

**Constraint that must not be lost in implementation:** the CTA destinations agreed with the user (`/sanctuary#ceremonies`, `/wings/energy`, `/sanctuary#restaurant`, `/sanctuary#stay`, `/about`) correspond to routes that **do not exist yet**. `NavContent.svelte` links to `/wings`, `/about`, `/community`, `/sanctuary`, and none of them have a `src/routes/` entry. A CTA system that ships dead links is worse for SEO than no CTA system. `cta.ts` must resolve against the real route manifest and degrade to nothing, and `blog-check.mjs` must fail the build on an unresolvable destination.

## Open questions

- **Origin.** `https://aynicollective.org` was chosen by the user for canonical, sitemap and feed URLs. It is not yet confirmed as registered or pointed at this build. One constant, one line to change.
- **Author identity.** `Person` JSON-LD wants a real name and ideally `sameAs` profile URLs for E-E-A-T. Placeholder until supplied.
- **Pillar pages start as indexes.** They capture head terms only once they carry real evergreen copy. That is content work, not engineering, and it is where the ranking actually comes from.
- **Analytics.** Deliberately absent. Umami or Plausible CE, self-hosted on the VPS, would satisfy the sovereignty rule if measurement is later wanted. No third-party beacon is acceptable.
- **Comments.** Not built. Every viable option is either a hosted service (violates sovereignty) or a spam surface. A `mailto:` reply line is the proposed substitute.
- **Content sync.** Posts are files today. Whether they ever become Yjs documents is a question for [`backend-stack`](../backend-stack/research.md); keeping them as plain `.md` preserves the option without committing to it.
- **Dev-time image ergonomics.** Adding an image mid-`dev` requires a dev-server restart. A custom Vite plugin would fix it and is judged not worth the code.

## Sources

Every claim in this document traces to an entry below.

### Code

- `src/routes/+layout.ts` — `cdd19cb` — 2026-08-05 — the `ssr = false` / `prerender = true` pair that makes the site unindexable.
- `build/index.html` — build of `cdd19cb` — 2026-08-05 — measured 2,529 bytes, zero page copy; the empirical proof of the SSR finding.
- `src/lib/components/PatternDivider.svelte` — `cdd19cb` — 2026-08-05 — `Math.random()` id at component-init scope, line 27; the one real hydration hazard.
- `src/lib/scrollDriver.ts` — `cdd19cb` — 2026-08-05 — browser-API audit; all access guarded by `typeof window` or confined to `onMount`.
- `src/lib/components/JournalStrip.svelte`, `JournalCard.svelte` — `cdd19cb` — 2026-08-05 — the `SEAM for /blog` comments and the `JournalPost` prop shape this work must preserve.
- `src/lib/components/OfferingsSection.svelte`, `WelcomePanel.svelte`, `RetreatsSection.svelte`, `ScrollDebug.svelte`, `src/lib/reveal.ts` — `cdd19cb` — 2026-08-05 — remainder of the SSR-safety audit.
- `src/lib/components/NavContent.svelte` — `cdd19cb` — 2026-08-05 — nav links to `/wings`, `/about`, `/community`, `/sanctuary`; none of these routes exist, which is why CTA destinations must degrade.
- `svelte.config.js` — `cdd19cb` — 2026-08-05 — adapter-static config, the `$content` alias, and the `.md` extension entry that anticipated mdsvex.
- `src/design/tokens.css`, `typography.css`, `components.css` — `cdd19cb` — 2026-08-05 — the token vocabulary `prose.css` must use, and the unreferenced `.entry-media` ceremony frame.
- `src/app.html`, `src/routes/+layout.svelte` — `cdd19cb` — 2026-08-05 — the duplicated `charset`/`viewport` and hardcoded title that `Seo.svelte` replaces.
- `package.json` — `cdd19cb` — 2026-08-05 — `svelte@5.56.5`, `@sveltejs/kit@2.69.3`, `vite@6.4.3`; the versions that decide the imagetools and `$props.id()` questions.
- `AGENTS.md`, `HANDOFF.md`, `CONTEXT.md` — `cdd19cb` — 2026-08-05 — constraints, standing design direction, domain glossary.

### Web

- <https://registry.npmjs.org/mdsvex/latest> — mdsvex npm metadata — 2026-08-05 — version `0.12.8`, Svelte 5 peer range, prismjs dependency.
- <https://github.com/pngwn/MDsveX/issues/738> — "Runes mode with Svelte 5 breaks layout use" — 2026-08-05 — the open defect that disqualifies mdsvex here.
- <https://registry.npmjs.org/vite-imagetools/latest> — vite-imagetools npm metadata — 2026-08-05 — `11.0.0`, MIT, `peerDependencies.vite >= 8.0.0`, depends on sharp.
- <https://registry.npmjs.org/sharp/latest> — sharp npm metadata — 2026-08-05 — `0.35.3`, Apache-2.0.
- <https://svelte.dev/docs/kit/images> — SvelteKit Images — 2026-08-05 — `@sveltejs/enhanced-img` operates on `<enhanced:img>` in `.svelte` files only.
- <https://www.digitalapplied.com/blog/structured-data-seo-2026-rich-results-guide> — Structured Data SEO 2026 — 2026-08-05 — JSON-LD as AI-citation infrastructure; AI Overviews in 15%+ of searches.
- <https://netstager.ae/blog/json-ld-for-modern-seo/> — JSON-LD for SEO in 2026 — 2026-08-05 — required BlogPosting property set.
- <https://ai.aeo.press/the-state-of-llms-txt-in-2026> — The State of llms.txt in 2026 — 2026-08-05 — AI crawlers skip llms.txt and parse HTML directly; no vendor commitment as of Q1 2026.
- <https://codersera.com/blog/llms-txt-complete-guide-2026/> — llms.txt Explained, May 2026 — 2026-08-05 — 10.13% adoption across 300k domains, 39.6% plugin stubs.
- <https://www.brafton.com/blog/strategy/topic-cluster-content-strategy/> — Topic Cluster Content Strategy 2026 — 2026-08-05 — hub-and-spoke structure and internal-linking rules.
- <https://www.digitalapplied.com/blog/seo-content-clusters-2026-topic-authority-guide> — SEO Content Clusters 2026 — 2026-08-05 — topical authority over single-document depth; 2–3× traffic for mature clusters.
- <https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide> — Core Web Vitals 2026 — 2026-08-05 — LCP < 2.5s, INP < 200ms, CLS < 0.1; INP the most-failed vital at 43%.
- <https://geobarta.com/en/blog/why-rss-feeds-still-matter-2026-open-web-vs-algorithms> — Why RSS Feeds Still Matter in 2026 — 2026-08-05 — unmediated distribution as the argument for feeds.
- <https://medium.com/@vaibhav.agarwal.iitd/how-to-make-ai-writing-sound-genuinely-human-and-beat-top-ai-detectors-in-2026-2ff888b8d5c5> — Humanising AI writing, 2026 — 2026-08-05 — the tells are structural; vocabulary and pacing corrections.
- <https://www.context-link.ai/blog/chatgpt-em-dash-remover> — Em-dash as an AI signal — 2026-08-05 — em-dash frequency has decayed as a reliable tell.
- <https://gebna.gg/blog/blog-from-scratch-using-sveltekit> — Static SvelteKit blog without mdsvex — 2026-08-05 — the `import.meta.glob('…?raw')` + unified topology this design follows.

## Decisions and revisions

**2026-08-05 — Initial pass.** Decided: site-wide SSR before anything else, on the evidence that the built homepage contains zero copy. Chose unified/remark/rehype over mdsvex (Svelte 5 runes defect, prismjs weight, framework coupling vs. the CRDT-friendly constraint). Chose `sharp` directly over `vite-imagetools` (v11 peer requires `vite >= 8`, project on `6.4.3`) and over `@sveltejs/enhanced-img` (cannot see markdown-referenced images). Rejected `llms.txt` on 2026 adoption and crawler evidence. Adopted hub-and-spoke topic clusters — `ceremony`, `the-land`, `farm-and-food`, `retreats`, `sacred-valley` — extending the categories already in `JournalStrip.svelte`. Canonical origin set to `https://aynicollective.org` by the user. Recorded the `PatternDivider` `Math.random()` hydration hazard, which is a pre-existing latent bug that only becomes visible once SSR is on. Recorded that every agreed CTA destination currently routes to nothing, making graceful degradation a hard requirement rather than a nicety.
