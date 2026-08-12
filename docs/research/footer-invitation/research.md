---
owns: []
slug: footer-invitation
status: reference
created: 2026-08-08
last-updated: 2026-08-08
sources: 9
---

# The footer as an invitation — Cusco geometry, clay ground, five doorways

`SiteFooter.svelte` today is a quiet close: a 1px rainbow rule, a 48px logo, five
text links, two lines of address, on the same paper as the page above it. It
*ends* the site. It does not *invite*. Nothing in it says a journal exists, that
retreats can be booked, or that a human will answer an email.

This research covers the replacement: a clay-ground footer built from three
documented Andean forms, carrying the line **"You've reached the end. / Want to
know more?"** and five links rendered as doorways rather than words.

Scope: `SiteFooter.svelte`, one new token pair in `tokens.css`, two new strings
in `catalogs/en/chrome.ts`. No new dependencies, no new scroll machinery, no new
route. Four files — under the 5-file trigger, but the user asked for the Cusco
research explicitly, and the colour finding below changes a token, so it is
written down.

**Out of scope:** the header, `PatternDivider`, the seven-wings surface, a
newsletter capture, and the two dead links the build already warns about (see
Risks).

## Constraints carried forward

- **Local-first / sovereignty.** Every mark is inline SVG in design tokens. No
  icon font, no sprite sheet, no CDN, no runtime fetch. Same rule the rest of the
  site keeps.
- **Open-source only.** Nothing added to `package.json`.
- **Tokens are the single source of visual truth.** `docs/research/design-system-minimal/research.md`.
- **Motif precedent already exists.** `PatternDivider.svelte` (stepped snake,
  q'enqo/greca family, ink + gold on clay) and `ValleyMap.svelte` (real OSM
  geometry, hand-drawn in `var(--color-*)`) established that hand-drawn Andean
  SVG in tokens is the house idiom. This is a third instance, not a new register.
- **i18n.** Every reader-facing word goes through `catalogs/en/chrome.ts`
  (`.agents/skills/i18n/SKILL.md`).

## Landscape — which Cusco shapes are actually usable

Three forms survive the test of *documented, geometric, and reproducible in
plain SVG*. A fourth was rejected.

### 1. Chakana — the stepped cross — RESEARCHED, BUILT, THEN CUT

Kept in this document because the reasoning is worth having on the shelf, but
**it is not in the shipped footer.** See § Decisions and revisions.


*Chakana* is Quechua for **bridge**, and *chakay* is **to cross over**. That is
literally what a footer asking "want to know more?" is for; the semantics are
not decoration bolted onto a shape.

Geometry, as a union of three rectangles on a 12×12 grid — this is what makes it
drawable exactly rather than traced by eye:

| Part | Extent |
|---|---|
| vertical arm | x ∈ [4, 8], y ∈ [0, 12] |
| middle band | x ∈ [2, 10], y ∈ [2, 10] |
| horizontal arm | x ∈ [0, 12], y ∈ [4, 8] |

Traced clockwise from (4,0) the outline is a 20-vertex polygon with exactly
**12 convex corners** — the twelve points the literature counts. Scaled ×10 it
is one `d` attribute:

```
M40,0 H80 V20 H100 V40 H120 V80 H100 V100 H80 V120 H40 V100
H20 V80 H0 V40 H20 V20 H40 Z
```

The open centre — x,y ∈ [40, 80], one third of the frame — is where the Ayni
mark sits. In the common reading the centre square is Qosqo, Cusco as the navel
of the world; the sanctuary is in Calca, an hour down the same valley.

**Honesty note, carried into the component comment.** There is no single
authoritative interpretation of the chakana. Archaeological, cosmological,
popular and living-community readings differ, the pre-contact artefacts carry no
interpretive key, and much of the "twelve months / three worlds" gloss circulates
as modern spiritual literature rather than attested Inca doctrine. The oldest
complete example is ~4,000 years old (Huaral, Van Dalen); the motif is on the
Chavín Tello Obelisk (~800 BCE) and in Wari, Chancay and Tiwanaku material. So:
**draw the shape, do not caption it with a claimed meaning.** The footer prints
no explanation of the symbol, and the component must never grow one.

### 2. Trapezoidal doorway / niche (*hornacina*) — the link treatment

Inca openings are trapezoidal: "The trapezoid motif was repeated in doorways,
windows and interior wall niches", and exterior walls "slope inwards as they
rise (typically **around 5 degrees**)". That 5° is a real measured number, so the
niches use it rather than an invented angle: at a 64-unit-tall niche the top edge
insets 64·tan 5° ≈ **5.6 units** per side.

Two further documented details are used:

- **Double jamb.** "Doorways and windows often also have double jambs"; visitors
  entered the most important Inca buildings through double-jamb doorways. It was
  therefore given to exactly one of the five — *Visit*, the one that reaches a
  human — as the building's own way of saying which door matters. **Shipped on
  all five instead, by preference** (see § Decisions and revisions): the wall no
  longer marks a primary door, which is a real loss of meaning but a gain in
  evenness. Restoring the distinction is one flag on the `links` list.
- **Lintel.** Openings are "usually topped with a large single stone lintel" —
  the flat top edge of each niche is drawn heavier than its jambs.

A doorway is the correct object here for a non-decorative reason: the ask was
links that *invite*, and a door is the only architectural element whose whole
purpose is that you may go through it.

### 3. Andenes — the terrace crest

The footer's top edge is not a border. It is a stepped terrace silhouette: the
page's paper meets the clay along a four-level ziggurat profile, tiled at a
constant 240×44 unit pitch so step size is fixed at every viewport width (the
`<pattern patternUnits="userSpaceOnUse">` technique `PatternDivider` already
uses). Terracing reads as both *andén* and *mountain skyline*; the stepped
triangle is the same textile grammar as the greca already on the page, at a much
larger scale — a rhyme, not a repeat.

The existing `.rainbow-line` is **not** deleted, it is promoted: the seven-hue
gradient is re-drawn as a 3-unit stroke running along the terrace crest instead
of a flat 1px rule. Implementation is a mask — one full-width `<rect>` filled
with a seven-stop `linearGradient`, masked by a tiled stroke of the crest path —
because a gradient placed *inside* a `<pattern>` would restart at every tile.

### Rejected

| Form | Why not |
|---|---|
| Polygonal masonry / the twelve-angled stone | The famous Hatun Rumiyoq stone is a *specific physical object* in Cusco. Drawing it is portraiture, not motif, and it carries no meaning a footer can use. |
| Inti / sun-disc rays | The nearest well-known "Inca sun" imagery in circulation descends from colonial and modern-tourist renderings, not attested Inca work. Too easy to get wrong. |
| Condor / puma / serpent figures | Figurative animals in a system whose whole visual discipline is geometric. Would read as a logo zoo. |
| Cusco / Tawantinsuyu rainbow flag | The site's `.rainbow-line` already *is* a seven-hue band, and it means the seven wings. Leaning on the flag would collapse two different seven-things into one and import a live political symbol. |

## The colour finding — pure clay cannot carry this footer

The brief is "clay background, drawings in paper 1". Measured, that exact pair
fails WCAG AA for the link row:

| Foreground | Background | Ratio | AA body text (4.5:1) |
|---|---|---|---|
| paper `#F1E7D4` | clay `#C36A54` | **3.11** | ✗ |
| ink `#221c14` | clay `#C36A54` | **4.43** | ✗ (just under) |
| paper `#F1E7D4` | **clay 70% + ink 30% `#935341`** | **4.82** | ✓ |

`--color-clay` is a mid-tone: it fails *both* directions at 14px. The footer
therefore grounds on a deepened clay, added as a primitive beside the existing
`--color-clay-s` and by the same mechanism (`color-mix`, so it tracks the
palette if clay ever moves):

```css
--color-clay-d: color-mix(in srgb, var(--color-clay) 70%, var(--color-ink));
```

Still unmistakably clay, one step into shadow — which is also the right read for
a footer.

Second consequence, measured: **paper cannot be dimmed on this ground.** Paper
at 90% toward the background is already 4.24:1 — under AA. So the address lines
are not faded; the hierarchy is carried by size, weight and tracking only. The
component must not reintroduce an `opacity` on any text.

Third: the focus ring. `--ring-focus` is ink, which on the deep clay is 2.9:1 —
under the 3:1 non-text minimum. The footer scopes its ring to paper.

## Composition

```
      ╱‾╲    ╱‾╲    ╱‾╲          rainbow stroke along a terraced crest
 ────╱   ╲──╱   ╲──╱   ╲────     the section above shows through, deep clay below

            You've reached the end.
              Want to know more?

     ⌂        ⌂       ⌂       ⌂       ⌂
  Offerings Retreats Book  Journal  Visit      ← five niches, all double-jambed

            Calca · Valle Sagrado · 2,928 m
        Ayni Consciousness Collective · Perú              ⧉ ⧉  ← social marks
```

Order is deliberate: **end → invitation → doors → address.** No mark down here:
the logo is in the header on every route, and a seal large enough to read cost
~260px of height for a second copy of something the reader has already seen.

### How the notches know what colour to be

The crest paints clay below its profile and nothing above it, so the notches are
a window — and what they must show is the section that ends there. That is paper
2 on the homepage (`ContactSection`) and paper 1 on every journal route, so no
fixed colour is right and a per-route lookup would be a list to maintain.

Instead the footer is pulled up by exactly the crest's height
(`margin-top: calc(-1 * var(--crest-h))`, with the variable written from the
same constant that sizes the SVG) so the crest sits **on** that section and
shows its own background, whatever it is. Measured slack below the last content
in each of those sections is 90–96px, so a 44px overlap only ever covers
padding. The crest is `pointer-events: none` — it now hovers over someone else's
box and must not eat a click meant for it.

Link list is unchanged and still mirrors `$lib/nav` minus Home, still root-relative,
still keyed to `chrome.nav` — the header's second chance must not drift.

## Strings

Two, into `chrome.footer`:

| Key | English |
|---|---|
| `end` | You've reached the end. |
| `invite` | Want to know more? |

The brief wrote "You reach the end"; English needs the perfect there — the reader
has arrived, they are not arriving repeatedly. Every other word in the footer is
either a nav label (already in `chrome.nav`), a proper noun, or geography.

## Risks

1. **Overlap.** The crest covers the last 44px of whatever section precedes it.
   Verified at 90–96px of slack on `/`, `/blog`, `/blog/[slug]` and
   `/blog/topic/[topic]`. A future section that ends flush with its content, or
   one that sets `overflow: hidden` and a `z-index` above the footer, breaks
   this. Re-measure when a new route lands.
2. **`color-mix` support.** Baseline since 2023 and already load-bearing for
   `--color-clay-s`; a browser without it falls back to the unresolved custom
   property, i.e. no background. Accepted on the existing precedent.
3. **Niche width vs. translation.** The trapezoid is drawn with
   `preserveAspectRatio="none"`, so a long label stretches the niche horizontally
   and the batter drifts off 5°. Exact at the design width, visually fine either
   side of it. A future locale with very long nav labels should be eyeballed.
4. **Pre-existing, not caused here:** `npm run build` warns
   `[prerender] not built yet: /retreats` and `[404] GET /stay`, both linked from
   `/`. Out of scope for this change; worth its own fix.

## Sources

- [Chakana — Wikipedia](https://en.wikipedia.org/wiki/Chakana)
- [Chakana: The Sacred Andean Cross of the Incas — Inkayni Peru Tours](https://www.inkayniperutours.com/blog/chakana-or-andean-cross-millenary-symbol-of-the-aboriginal-peoples)
- [Chakana Andean Cross — Machu Picchu Soul](https://machupicchusoul.com/blog/chakana-andean-cross-oldest-symbols-of-the-andes/)
- [Inca Architecture — World History Encyclopedia](https://www.worldhistory.org/Inca_Architecture/)
- [Inca Textiles — World History Encyclopedia](https://www.worldhistory.org/article/791/inca-textiles/)
- [Tocapu — Wikipedia](https://en.wikipedia.org/wiki/Tocapu)
- [Inca tapestry with pattern of tocapu bands — Museo de América](https://www.cultura.gob.es/museodeamerica/en/coleccion/america-prehispanica/tejido-tocapus-inca.html)
- [Qorikancha trapezoidal door — Yatrika One](https://yatrikaone.com/ancient-civilizations/inca/peru_cusco_coricancha4/)
- [Symmetry Analysis of Inca Textiles and Ceramics — Miles Daly, GCSU](https://www.gcsu.edu/sites/files/page-assets/node-808/attachments/daly.pdf)

## Decisions and revisions

- **2026-08-08.** Deep clay (`--color-clay-d`) adopted over pure `--color-clay`
  for the footer ground, on the measured 3.11:1 failure. Chakana adopted as the
  logo's frame; twelve-angled stone, Inti disc, figurative animals and the Cusco
  flag rejected. Trapezoid batter fixed at the documented 5°. Double jamb
  reserved for *Visit*.
- **2026-08-08, same day, after seeing it built.** Chakana and logo **cut**. At
  a size where the (badly-exported, off-centre) mark read at all, the cross
  dominated the footer and added ~260px — worst on a phone, where it pushed the
  footer to 787px. The logo is already in the header on every route, so the seal
  was a second copy of something the reader had just seen. Removing it, tightening
  the rhythm and taking the doorways to 56×124 puts the footer at **360px on a
  desktop and 475px on a 390px phone**. The cultural risk logged above goes away
  with it. Crest-notch colour switched from a fixed paper to the overlap
  technique in § "How the notches know what colour to be", because the journal
  ends on paper 1 and the homepage on paper 2.
- **2026-08-08, third pass.** Double jamb extended from *Visit* alone to **all
  five doorways**, on preference for the look. The wall no longer says which
  door is the important one — that was the whole point of the detail — so this
  is recorded as an aesthetic choice overriding the sourced one, not as a
  correction. `padding-inline` goes to `--spacing-s-6` on every niche to clear
  the inner jamb, which puts them at 124–133px wide. Footer height unchanged
  (360px desktop / 475px phone).
- **2026-08-08, fourth pass.** Instagram and Facebook marks added at the bottom
  right. They already existed inline in the hero, so the geometry was lifted to
  a new `$lib/social.ts` (`SOCIAL_MARKS`, keyed against
  `Messages['chrome']['social']`, exactly as `$lib/nav` is keyed against
  `chrome.nav`) rather than copied — two drawings of one logo would have been
  free to diverge. Their labels moved `home.hero` → `chrome.social` for the same
  reason: the same two links now sit on two surfaces. **The hrefs are still
  `'#'`**, now in one place as `SOCIAL_URLS` in `$lib/config.ts`; filling them
  in lights up both surfaces. A guessed handle would send visitors to somebody
  else's account, which is worse than a link that goes nowhere. Address stays
  centred on the page axis via a `1fr auto 1fr` grid; below 700px the two
  stack and the marks keep the right edge. Phone footer 475 → 531px.
