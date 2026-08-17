---
slug: navbar-scroll-color-system
status: draft
created: 2026-08-15
last-updated: 2026-08-15
sources: 9
---

# Navbar scroll/color system — unify detection, fix mobile early-reveal, add real easing

The navbar's show/hide and per-section background color are driven by scroll math spread across `scrollDriver.ts` and `+layout.svelte`. User report: on smaller screens the navbar (solid background) appears before it should, covering the hero image; the color handoff between the hero and the rest of the page is a hard, arbitrary threshold (`p >= 0.85`, not tied to the second section actually being fully in view); and no part of the system eases — every color/clip write is an instant per-frame snap, so section-to-section color changes read as abrupt rather than smooth. Trigger category: 5+ files touched (`scrollDriver.ts`, `+layout.svelte`, `+page.svelte`, `OfferingsSection.svelte`, `PatternDivider.svelte`, `animations.css`), architectural (the shared scroll-progress primitives), per AGENTS.md's stop-and-ask list. Good answer: a corrected, single set of primitives for (a) a stable "is this the top of the page" reference line and (b) navbar color that eases in/out except at the one designed hard-cut (hero → second section). Out of scope: redesigning the hero clip-path choreography itself, the pattern-divider z-index story (already resolved across commits `9fe963f`/`341b26b`/`f6f3787`/`a53caef`), and anything on non-home routes (blog navbar is a separate, static, solid-paper code path).

## Constraints carried forward

- **Local-first / no external service in the render path** (AGENTS.md inviolable rule) — rules out any IntersectionObserver-polyfill CDN or analytics-style scroll library; must stay hand-rolled, same as today.
- **No code without research for 5+-file changes** — this document satisfies that gate for the change described below.
- File-level discipline already established and must be preserved (all confirmed by direct reading, not inferred):
  - One rAF-coalesced passive scroll listener per driver, geometry cached on bind/resize only, **never** a per-frame `getBoundingClientRect()` (`scrollDriver.ts:1-16`).
  - No `IntersectionObserver` anywhere in this codebase for navbar purposes — deliberate, per the file's own performance-rationale header; the `research-topic` skill and AGENTS.md's "no new deps" bias both favor extending the existing primitive over introducing a new one.
  - `HEADER_H = 60` (`scrollDriver.ts:282`) is the sticky header's height and must stay the single source of truth other files import, not a re-declared magic number.
  - Reduced-motion has a documented failure mode specific to scroll-driven CSS animations (`animation-duration: 0s` snaps a scroll-timeline animation to its END state, not "no animation") — any new CSS transition/animation this work adds must be checked against `prefers-reduced-motion` the same way `+page.svelte`'s existing `@media (prefers-reduced-motion: reduce)` block already re-asserts `animation-duration: auto !important` for the hero slide (HANDOFF.md 2026-08-07 entry, "RULE: any future scroll-driven animation must re-assert...").
  - `svh`, not `vh`/`dvh`, is already the intentional choice everywhere layout height matters (`.scroll-container`, `.scroll-wrapper`, `.offerings`, `.pin` — confirmed in `+page.svelte` and `OfferingsSection.svelte`), specifically because `dvh` recalculates mid-scroll when the mobile toolbar collapses and stalls/shifts the scroll (comments at `+page.svelte:240-260`). The JS scroll drivers do not yet follow this rule — see Landscape.

## Landscape

### Current architecture (confirmed by direct file reads)

Two independent authorities write navbar state, deliberately kept apart since commit `82da99f` ("single-authority approach"):

1. **Hero driver** (`bindHeroScroll`/`subscribeHeroScroll`, `scrollDriver.ts:150-175`) — homepage-only. Emits eased progress `p` (0→1) from `(scrollY - containerTop) / (containerHeight - viewportHeight)`. `+layout.svelte`'s subscriber (`+layout.svelte:164-187`) uses `p` for three things: the white navbar's clip-path (continuous, proportional to `p` — fine, already smooth), `welcomeVisible` (`p >= WELCOME_THRESHOLD`, `WELCOME_THRESHOLD = 0.85`), and the black navbar's background — `''` (transparent) below the threshold, hard-coded `rgb(241,231,212)` (paper) at/above it.
2. **Section-color tracker** (`bindNavbarColor`/`subscribeNavbarColor`, `scrollDriver.ts:407-575`) — scans `[data-nav-bg]` elements, and on every scroll frame finds which one(s) overlap the header strip `[scrollY, scrollY + HEADER_H]`, publishing an `rgb()` string (spatially blended when the strip straddles two sections). Only publishes when it finds an overlapping section, so it never fights the hero handler during the hero zone. This channel already correctly treats "the header strip" (`scrollY` to `scrollY + HEADER_H`) as the detection window — i.e., it already applies the "navbar's own footprint, not the bare viewport top" framing the user is asking for, but only for this one channel.

Both write `navbarBlackEl.style.background` directly, as an instant inline style, every frame. **No CSS transition exists on `.navbar-black` or `.navbar-white` for background or color** (confirmed: only cosmetic transitions exist elsewhere — link underline, phone-menu bars). The only "smoothing" today is the section tracker's *spatial* interpolation across the 60px header band, which because most sections are hundreds to thousands of px tall, reads on screen as a near-instant snap during ordinary scroll speeds — not the eased, felt transition the user is describing.

A third primitive, `bindSectionScroll` (`scrollDriver.ts:205-269`), independently reimplements the same measure/rAF/cache pattern as the hero driver for sticky-pinned sections (`OfferingsSection`) and the pattern dividers' navbar-takeover claims. It computes its own `viewportH = window.innerHeight` and `scrollable = height - viewportH`, structurally identical to the hero driver's bug (below).

### Root cause: mobile "navbar appears early, covers the hero image"

`measure()` in the hero driver (`scrollDriver.ts:113-117`) computes:

```js
geometry.scrollable = Math.max(1, container.offsetHeight - window.innerHeight);
```

`container.offsetHeight` is sized by CSS `380svh` — by definition **stable**, per MDN: small-viewport units "represent the smallest possible size of the viewport... size is fixed and stable unless the viewport itself is resized" (i.e., real resize/orientation change — not toolbar collapse) (Source: MDN, `CSS length — viewport-percentage lengths`, fetched 2026-08-15). `window.innerHeight`, by contrast, tracks the **dynamic** viewport — it grows when the mobile toolbar collapses on scroll, exactly like `dvh` does, which is precisely the behavior `+page.svelte`'s own comments say the project avoids for this reason (`+page.svelte:240-251`, `344-356`).

Sequence: user scrolls on a phone → toolbar starts collapsing → `resize` fires → `onResize()` → `measure()` recomputes `geometry.scrollable` **smaller** (numerator `container.offsetHeight` unchanged, subtrahend `window.innerHeight` grew) → for the same `scrollY`, `raw = (scrollY - top) / scrollable` **jumps up** → `p` advances without the user scrolling further → `welcomeVisible` / the navbar's solid-paper flip can fire early, and the white navbar's clip can close early → the hero photograph gets covered before the user scrolled the full runway. `bindSectionScroll` has the identical defect for `OfferingsSection`'s pin and the pattern dividers' header claims, via its own `viewportH = window.innerHeight`.

This is a direct, code-confirmed mechanism, not a guess — it is the same class of bug the project has hit and fixed twice before in CSS (`vh`→`dvh`→`svh`, per the 2026-08-07 HANDOFF entries and the `82da99f`-era comments), just not yet applied to the JS geometry.

### Fix shape

`svh` has no direct JS accessor — the only way to read "the CSS `1svh` in pixels, right now" from script is to measure a live element sized with it. The codebase already has such an element: `.scroll-wrapper` is `height: 100svh` (`+page.svelte:347-361`). Reading `scrollWrapperEl.getBoundingClientRect().height` (or a small dedicated 0-opacity probe element following the same rule, for use outside the hero) gives a JS value that is *by construction* identical to what CSS already committed to, and inherits `svh`'s stability guarantee for free — it only changes on a genuine resize, never on toolbar collapse. Both `bindHeroScroll`'s `measure()` and `bindSectionScroll`'s internal `measure()` should read viewport height this way instead of `window.innerHeight`, as one shared helper so the fix (and its guarantee) lives in one place rather than being reimplemented per-driver — which is also the concrete answer to "navbar movement should be way easier to detect": one correct, shared primitive instead of two independent copies of the same now-fixed math.

### Threshold shape: "appears once the second section is 100% in view, no fade"

`WELCOME_THRESHOLD = 0.85` is an arbitrary early trigger — the black navbar goes solid paper while the WelcomePanel is still 15% of a scroll-runway away from fully occupying the viewport. Since `p` is already defined as the hero runway's own scrub progress (0 at hero, 1 when the runway is fully consumed, i.e. WelcomePanel fully fills the space below the navbar), the value the user is describing — "only appear once we reach the second section 100%" — is exactly `p >= 1`. No blend/fade is warranted for this specific transition, matching the user's explicit direction: it is a discrete arrival event (hero fully scrolled away), not a spatial overlap of two colored sections the way the `data-nav-bg` tracker's boundary blend is.

### Easing shape: colors should transition, this one flip should not

The user wants navbar background-color changes to ease in/out — this applies to the `data-nav-bg` section tracker's handoffs (Offerings ↔ divider ↔ Book ↔ divider ↔ Journal ↔ Voices ↔ Contact) and to the `dark-bg` text/logo color toggle, all of which are currently instant. A CSS `transition: background-color, color` on `.navbar-black` covers this with no new JS machinery, consistent with the project's general pattern of letting CSS own continuous visual state. The one flip that must stay a hard cut per the user's direction — hero-runway-consumed → solid paper — needs to bypass that transition for that single write (set `transition-duration: 0s` immediately before the write, restore it on the next frame), since it is a one-time discrete event, not a spatial section-to-section handoff.

### Reduced motion

Per the constraint above, a `background-color`/`color` CSS transition is not a scroll-timeline animation (it is not scroll-linked; it just smooths a discrete style write), so it does not have the "snaps to end state" failure mode that scroll-driven `animation-timeline` rules do — no `!important` re-assertion block is needed for this one, unlike the hero slide. This should still be verified under `prefers-reduced-motion: reduce` before shipping, since the surrounding system has been wrong about this twice before (HANDOFF.md 2026-08-07 entries).

## Sources

### Code

- `/opt/projects/AyniCollective/src/lib/scrollDriver.ts` — full file read 2026-08-15 — the entire scroll-progress/section-tracker/navbar-color-tracker implementation; primary source for the root-cause diagnosis and all driver behavior described above.
- `/opt/projects/AyniCollective/src/routes/+layout.svelte` — full file read 2026-08-15 — navbar shell, hero-clip/color subscriber, `WELCOME_THRESHOLD`, CSS z-index/stacking, non-home parking effect.
- `/opt/projects/AyniCollective/src/routes/+page.svelte` — full file read 2026-08-15 — `.scroll-container`/`.scroll-wrapper` `svh` sizing and its documented rationale (dvh-vs-svh mid-scroll stall), hero mount sequence.
- `/opt/projects/AyniCollective/src/lib/components/PatternDivider.svelte` — read via recon pass 2026-08-15 — navbar-takeover claim via `bindSectionScroll`, z-index history.
- `/opt/projects/AyniCollective/src/lib/components/OfferingsSection.svelte` — read via recon pass 2026-08-15 — sticky pin `top: 60px`, `data-nav-bg`.
- `/opt/projects/AyniCollective/HANDOFF.md` — read 2026-08-15 — 2026-08-07 entries documenting the prior `vh`→`dvh`→`svh` iOS viewport bugs and the reduced-motion scroll-timeline trap; both directly inform the constraints above.
- `git log --oneline` on this repo, commits `a53caef`, `341b26b`, `9fe963f`, `82da99f`, `f6f3787` — read 2026-08-15 via recon pass — snake-divider/navbar z-index and single-authority history, confirms this work should not re-touch that already-settled area.

### Web

- `https://developer.mozilla.org/en-US/docs/Web/CSS/length#viewport-percentage_lengths` — MDN, "CSS length — viewport-percentage lengths" — fetched 2026-08-15 — confirms `svh` is fixed/stable unless the viewport itself is resized (i.e., not on mobile toolbar show/hide), while `dvh` recalculates dynamically; backs the root-cause diagnosis and the recommended fix (read a live `100svh`-sized element instead of `window.innerHeight`).

## Recommendation

Fix in `scrollDriver.ts` first (shared primitives), then the two call sites that consume it:

1. Add one shared helper that returns a stable viewport-height reading — by measuring a live `100svh`-sized element (reuse `.scroll-wrapper` for the hero driver; a small persistent probe element, or the section's own sticky-pinned element where one already exists at `100svh`, for `bindSectionScroll`) — and use it everywhere `window.innerHeight` is currently read for scrollable-distance math. This is the mobile-early-reveal fix and directly answers "movement should be way easier to detect": one correct primitive instead of two independent, both-slightly-wrong copies.
2. Raise `WELCOME_THRESHOLD` from `0.85` to `1` (or equivalently branch on `p >= 1`) in `+layout.svelte`, so the navbar only goes solid once the hero runway is fully consumed (second section 100% in view) — no interpolation, a discrete flip, matching the user's explicit "no fade in or out" direction for this one case.
3. Add `transition: background-color <duration> <ease>, color <duration> <ease>` to `.navbar-black` in `+layout.svelte`, so every OTHER color handoff (the `data-nav-bg` tracker's section-to-section blends, the `dark-bg` toggle) eases instead of snapping. Suppress that transition for the single hero→solid-paper write only (zero the transition-duration immediately before that specific write, restore after).
4. Document the "reference line for section start = `scrollY + HEADER_H`, not `scrollY`" convention as a comment on `HEADER_H`'s export in `scrollDriver.ts`, since the `data-nav-bg` tracker already implements it correctly but nothing currently states it as the intended house rule other primitives (`bindSectionScroll`'s `p`, any future section-boundary code) should also follow.
5. Verify under `prefers-reduced-motion: reduce` and on an actual mobile viewport (or emulated toolbar-collapse via `ScrollDebug.svelte`'s `?debug` HUD) before calling this done, per the project's own history of shipping viewport-unit fixes that needed a second pass.

No new dependency, no schema/auth/crypto surface, no violation of local-first/sovereignty rules — this is confirmed by the above to be a same-file-family correction of an existing, already-hand-rolled system.

## Open questions

- Exact transition duration/easing curve for the color fades (proposing 200–250ms `ease-out`, matching the site's existing `--duration-normal`/`--ease` tokens used for the nav-link underline — needs eyeballing against real scroll speed once implemented, not something research alone can settle).
- Whether `bindSectionScroll`'s `p` formula should also subtract `HEADER_H` from its scrollable-distance math for pixel-exact pin-edge timing (a ~60px effect against runways of 1500+px) — flagged in Landscape as likely negligible; left as an implementation-time judgment call rather than a research blocker.

## Decisions and revisions

- 2026-08-15 (revision, same day) — **The CSS-transition recommendation (§Recommendation item 3) was implemented, shipped broken, and is REVERSED.** Two defects surfaced immediately in real use:
  1. **A time-based `transition` on `.navbar-black` fights the per-frame color writes.** The section tracker writes `style.background` every scroll frame; each write restarts the transition, so the painted color permanently lags the section actually under the header, and the `dark-bg` text/logo toggle (a binary class flip driven by the *published* color) desynchronizes from the *displayed* background. This is exactly the collision the codebase's "styles are a pure function of scroll position" discipline exists to prevent — the research above noted that discipline as a constraint and then violated it anyway. Easing now lives where it belongs: **in the tracker, spatially** — `NAV_BLEND_PX = 160` of scroll travel centered on each section boundary (window widened to swallow untracked gaps like the divider bands), smoothstep-eased, anchored on the navbar's bottom edge (`scrollY + HEADER_H`). Scroll-driven, perfectly reversible, and the text toggle stays in sync because it derives from the same blended value. A virtual paper "section" before the first tracked one blends the WelcomePanel→Offerings seam too. `applyNavbarBgInstant()` and the transition CSS are deleted; the layout's write pattern reverted to the original proven per-frame form.
  2. **`WELCOME_THRESHOLD = 1` was unsound against the driver's epsilon skip.** `frame()` skips emits with deltas < 0.0004, and the hero ease's power-2.6 tail creeps toward 1 in sub-epsilon steps — so the exact `p = 1` emit was frequently swallowed, `welcomeVisible` never went true, `.on-welcome` never applied, and the white navbar layer (force-hidden below the hero by that class's `!important` clip) re-activated across the whole page wherever nav-region claims exist — white ghost text over the black navbar's text at the offerings image, dividers, and journal strip. Fixed in the driver: terminal values (exactly 0 or 1) are exempt from the epsilon skip, so the arrival flip is now guaranteed. The threshold itself stays 1 — it was the emit guarantee that was missing, not the threshold that was wrong.
  - **Testing lesson recorded**: the original verification scrolled in one large jump (delta ≫ epsilon), which masked the epsilon-skip bug entirely. Scroll-behavior verification must creep in small steps like a real user — the re-verification suite now does (down and back up, sampling colors across both blend windows).
- 2026-08-15 — Initial research, triggered by user report of premature navbar reveal on small screens plus a request to formalize section-start detection, add color easing, and change the hero→second-section handoff to a hard cut at full arrival. No prior research document existed for this subsystem; closest precedent is `docs/research/sanctuary-gallery-voices-contact/research.md`'s retrospective notes on the same navbar shell, cross-linked above via HANDOFF.md history rather than re-derived.
