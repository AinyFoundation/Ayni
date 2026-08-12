<script lang="ts">
  /**
   * SiteFooter — the last terrace.
   *
   * Rendered from +layout.svelte after the page content, so every route ends
   * the same way. It used to be a quiet close on the same paper as the page:
   * a 1px rule, a floating mark, five text links. It ended the site without
   * inviting anyone anywhere. This is the invitation — end → invitation →
   * doors → address.
   *
   * Three Andean forms, all drawn here in tokens rather than imported as
   * artwork, in the same craft register PatternDivider and ValleyMap
   * established. Sourced and argued in
   * `docs/research/footer-invitation/research.md`:
   *
   *   1. ANDENES — the top edge is a terraced crest, not a border, tiled at a
   *      constant pitch so the step size is identical at every viewport width.
   *      The site's seven-hue `.rainbow-line` is not deleted, it is promoted:
   *      the gradient now runs ALONG that crest.
   *   2. HORNACINAS — every link is a trapezoidal doorway. The jambs lean in
   *      at 5°, which is the documented slope of Inca walls, not a number
   *      picked by eye, and every one of them is DOUBLE-JAMBED. Note that in
   *      Inca building the double jamb was not ornament — it marked the
   *      doorway that mattered — so it was first given to `Visit` alone. Kept
   *      on all five by preference; the wall no longer says which door is the
   *      important one, and if that distinction is ever wanted back it is one
   *      flag on the `links` list, not a redesign.
   * NO MARK DOWN HERE. A chakana seal holding the Ayni logo was built and
   * removed: at any size that let the (badly-exported, off-centre) mark read,
   * the cross dominated the footer and cost ~260px of height, and the logo is
   * already in the header on every route. The footer's job is the doors.
   *
   * NO `opacity` ON FOOTER TEXT. On this ground, paper dimmed even 10% toward
   * the background is 4.24:1 — already under WCAG AA. Hierarchy is carried by
   * size, weight and tracking only.
   */
  import { LOCATION } from '$lib/config';
  import type { NavLink } from '$lib/nav';
  import { DEFAULT_LOCALE, t } from '$lib/i18n';
  /* Geometry shared with the hero corner — see $lib/social. */
  import { SOCIAL_MARKS } from '$lib/social';

  /* Derived, not a plain const: the locale is a property of the URL, so once
   * Phase 3 reads it from `page` this line follows the navigation instead of
   * freezing whichever catalog was current when the module first ran. */
  const m = $derived(t(DEFAULT_LOCALE).chrome);
  const social = $derived(m.social);

  /** Unique per instance — SVG `pattern`/`mask`/`gradient` ids resolve
   * document-wide. `$props.id()` and not Math.random() because the id is
   * SSR-stable: the server writes it into the def and the client re-renders
   * the matching url(#…). A random id desyncs across hydration and the crest
   * silently stops painting. Same reasoning as PatternDivider. */
  const uid = $props.id();

  /** Mirrors NavContent's list minus Home — the footer is the header's second
   * chance, so the two must not drift. Root-relative for the same reason: from
   * /blog a bare "#offerings" resolves to /blog#offerings and goes nowhere.
   *
   * Typed `NavLink[]` and carrying message keys rather than words, exactly as
   * $lib/nav does: same shape, same catalog, so the two lists can only drift
   * in which destinations they list — never in what a destination is called. */
  const links: NavLink[] = [
    { href: '/#offerings', key: 'offerings' },
    { href: '/#retreats', key: 'retreats' },
    { href: '/#book', key: 'book' },
    { href: '/blog', key: 'journal' },
    { href: '/#contact', key: 'visit' },
  ];

  /* ─── The terraced crest ───────────────────────────────────────────────
   * One 280×44 tile of a four-level ziggurat, tiled in user space so the
   * steps stay the same size from a 320px phone to a 4K monitor. Steps are
   * wide (35) and shallow (8) on purpose: at the first pass they were 30×10
   * and the crest read as castle crenellation rather than a terraced
   * hillside. The profile bottoms out at y=26, so even between ziggurats
   * there is a continuous 18-unit band of ground and the footer never shows
   * a gap. The 4-unit headroom at the peak is for the 6-unit paper keyline,
   * which is centred on the path and would otherwise be clipped by the tile. */
  const CREST_H = 44;
  const CREST_W = 280;
  const CREST_EDGE = 'M0 28 H35 V20 H70 V12 H105 V4 H175 V12 H210 V20 H245 V28 H280';
  const CREST_FILL = `${CREST_EDGE} V${CREST_H} H0 Z`;

  /** The seven wings, in the order `.rainbow-line` has always run them. */
  const SPECTRUM = ['clay', 'amber', 'gold', 'sage', 'slate', 'indigo', 'plum'];

  /* ─── The doorways ─────────────────────────────────────────────────────
   * 132×64 design units. Inca exterior walls slope inwards ~5° as they rise,
   * so a 60-unit-tall opening insets 60·tan5° ≈ 5.25 units per side — that is
   * where every number below comes from. Drawn with preserveAspectRatio="none"
   * so a long label stretches the niche: the batter is exact at the design
   * width and drifts a little either side of it, which is the tradeoff for
   * niches that fit their words in any language. */
  const JAMB = 'M7.25 2 H124.75 L130 62 H2 Z';
  /** The lintel — a single heavy stone across the top, drawn over the jambs. */
  const LINTEL = 'M7.25 2 H124.75';
  /** Second jamb, 6 units in, same 5° lean (46·tan5° ≈ 4). Only on `Visit`. */
  const JAMB_INNER = 'M12 10 H120 L124 56 H8 Z';
</script>

<!-- --crest-h is written from the constant, not repeated in the stylesheet:
     the negative margin that slides the crest over the section above has to
     equal the crest's height exactly or the seam reopens. -->
<footer class="site-footer" style="--crest-h: {CREST_H}px">
  <!-- Purely decorative: the seam between page and footer. -->
  <svg
    class="crest"
    height={CREST_H}
    aria-hidden="true"
    role="presentation"
    focusable="false"
  >
    <defs>
      <pattern
        id="crest-fill-{uid}"
        width={CREST_W}
        height={CREST_H}
        patternUnits="userSpaceOnUse"
      >
        <path d={CREST_FILL} fill="var(--footer-bg)" />
        <!-- Paper keyline under the seven hues. Not decoration: three of the
             wings (clay, amber, gold) are within 2.7:1 of the deep clay
             ground and the leftmost stretch of the gradient disappeared into
             it entirely. Riding the hues on paper gives every one of them an
             edge on both sides — page paper above, this below. -->
        <path
          d={CREST_EDGE}
          fill="none"
          stroke="var(--footer-ink)"
          stroke-width="6"
          stroke-linejoin="miter"
        />
      </pattern>

      <!-- The crest stroke, in white, used only as a mask. It has to be a mask
           rather than a stroke in its own right: a gradient placed INSIDE a
           pattern restarts at every tile, so the seven hues would repeat every
           240px instead of running once across the page. -->
      <pattern
        id="crest-edge-{uid}"
        width={CREST_W}
        height={CREST_H}
        patternUnits="userSpaceOnUse"
      >
        <path
          d={CREST_EDGE}
          fill="none"
          stroke="#fff"
          stroke-width="2.5"
          stroke-linejoin="miter"
        />
      </pattern>

      <mask id="crest-mask-{uid}">
        <rect width="100%" height={CREST_H} fill="url(#crest-edge-{uid})" />
      </mask>

      <linearGradient id="crest-hues-{uid}" x1="0" y1="0" x2="1" y2="0">
        {#each SPECTRUM as hue, i}
          <stop
            offset={`${(i / (SPECTRUM.length - 1)) * 100}%`}
            stop-color="var(--color-{hue})"
          />
        {/each}
      </linearGradient>
    </defs>

    <rect width="100%" height={CREST_H} fill="url(#crest-fill-{uid})" />
    <rect
      width="100%"
      height={CREST_H}
      fill="url(#crest-hues-{uid})"
      mask="url(#crest-mask-{uid})"
    />
  </svg>

  <!-- The ground is a SIBLING of the crest, not an ancestor: a background on
       .site-footer would paint behind the crest's notches and fill them in,
       which is exactly the shape the crest exists to cut. -->
  <div class="footer-ground">
    <div class="footer-inner">
      <p class="footer-end">{m.footer.end}</p>
      <p class="footer-invite">{m.footer.invite}</p>

      <nav class="footer-doorways" aria-label={m.aria.footerNav}>
        {#each links as link}
          <a class="niche" href={link.href}>
            <svg
              class="niche-frame"
              viewBox="0 0 132 64"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <path class="jamb" d={JAMB} vector-effect="non-scaling-stroke" />
              <path
                class="jamb jamb-inner"
                d={JAMB_INNER}
                vector-effect="non-scaling-stroke"
              />
              <path class="lintel" d={LINTEL} vector-effect="non-scaling-stroke" />
            </svg>
            <span class="niche-label">{m.nav[link.key]}</span>
          </a>
        {/each}
      </nav>

      <!-- Three columns so the address stays centred on the page's axis while
           the marks hold the right edge; the empty first column is what keeps
           the middle one honest. Collapses to a stack below 700px. -->
      <div class="footer-base">
        <div class="footer-address">
          <p class="footer-place">
            {LOCATION.town} · {LOCATION.region} · {LOCATION.elevation}
          </p>
          <p class="footer-name">
            Ayni Consciousness Collective · {LOCATION.country}
          </p>
        </div>

        <div class="footer-social">
          {#each SOCIAL_MARKS as mark}
            <a href={mark.href} class="social-chip" aria-label={social[mark.key]}>
              <!-- Stroke settings live on the <svg> so the shared path data
                   stays pure geometry; `currentColor` is what lets the chip
                   flip the glyph to clay on hover with no second drawing. -->
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                {@html mark.path}
              </svg>
            </a>
          {/each}
        </div>
      </div>
    </div>
  </div>
</footer>

<style>
  .site-footer {
    /* Component tier. On a clay GROUND the semantic names invert — paper is
     * the ink here — so the inversion is named once and everything below
     * reads from it.
     *
     * --footer-bg is the DEEPENED clay, not --clay. Measured: paper on raw
     * clay is 3.11:1 and ink on it 4.43:1, so the mid-tone fails AA in both
     * directions at 14px. See tokens.css and the research doc. */
    --footer-bg: var(--clay-d);
    --footer-ink: var(--color-paper);

    color: var(--footer-ink);

    /* The crest paints clay BELOW its profile and nothing above it, so the
     * notches are a window — and what they must show is the section that ends
     * here, which is paper 2 on the homepage (ContactSection) and paper 1 on
     * every journal route. Rather than teach the footer which route it is on,
     * slide it up by exactly the crest's height so the notches sit ON that
     * section and show its own background, whatever it is. Measured slack
     * below the last content in each of those sections: 90–96px, so a 44px
     * overlap only ever covers padding.
     *
     * position: relative and nothing else — the footer is later in the DOM
     * than the section it overlaps, so document order already paints it on
     * top and a z-index would only invite a fight. */
    position: relative;
    margin-top: calc(-1 * var(--crest-h));
  }

  .crest {
    display: block;
    width: 100%;
    line-height: 0;
    /* Decorative and now hovering over someone else's box — it must not
     * intercept a click meant for the section underneath. */
    pointer-events: none;
    /* The crest's bottom row and the ground below it are the same clay, so
     * overlapping them by a pixel costs nothing and removes the hairline that
     * fractional device pixel ratios leave between two abutting boxes. */
    margin-bottom: -1px;
  }

  .footer-ground {
    background: var(--footer-bg);
  }

  .footer-inner {
    max-width: 1200px;
    margin-inline: auto;
    padding: var(--spacing-s-6) clamp(24px, 5vw, 80px) var(--spacing-s-5);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .footer-end {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-h2);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-display);
  }

  .footer-invite {
    margin: var(--spacing-s-2) 0 0;
    font-size: var(--text-lead);
  }

  /* Wraps rather than shrinking: five doorways fit one row on a desktop, two
   * per row on a phone, and a doorway that has been squeezed is no longer a
   * doorway. */
  .footer-doorways {
    margin-top: var(--spacing-s-6);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--spacing-s-3);
  }

  .niche {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* 56px tall and 124px wide clears the 44px touch floor in both directions
     * with room to spare, which matters here because the doorways sit in a
     * row and a miss hits the neighbour. */
    min-width: 124px;
    height: 56px;
    /* Clears the second jamb, which eats ~11px into the opening on each side
     * at this width. */
    padding-inline: var(--spacing-s-6);
    color: var(--footer-ink);
    /* The lift is a doorway opening, not decoration. Safe unguarded: the
     * global reduced-motion rule in animations.css zeroes transition-duration
     * site-wide. */
    transition: transform var(--duration-quick) var(--ease);
  }

  .niche:hover,
  .niche:focus-visible {
    transform: translateY(-2px);
  }

  .niche-frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .jamb {
    fill: none;
    stroke: var(--footer-ink);
    stroke-width: 1.5;
    transition:
      fill var(--duration-quick) var(--ease),
      stroke var(--duration-quick) var(--ease);
  }

  .lintel {
    fill: none;
    stroke: var(--footer-ink);
    stroke-width: 3;
    transition: stroke var(--duration-quick) var(--ease);
  }

  .niche-label {
    position: relative;
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    transition: color var(--duration-quick) var(--ease);
  }

  /* Hover lights the doorway: the opening fills with paper and the frame is
   * redrawn in the ground colour, so the stonework stays legible against it. */
  .niche:hover .jamb,
  .niche:focus-visible .jamb {
    fill: var(--footer-ink);
  }

  .niche:hover .jamb-inner,
  .niche:focus-visible .jamb-inner,
  .niche:hover .lintel,
  .niche:focus-visible .lintel {
    stroke: var(--footer-bg);
  }

  .niche:hover .niche-label,
  .niche:focus-visible .niche-label {
    color: var(--footer-bg);
  }

  /* --ring-focus is ink, which on this ground is 2.9:1 — under the 3:1 floor
   * for non-text contrast. Scoped to paper here. */
  .niche:focus-visible {
    outline: 2px solid var(--footer-ink);
    outline-offset: 3px;
  }

  .footer-base {
    width: 100%;
    margin-top: var(--spacing-s-6);
    display: grid;
    /* 1fr auto 1fr, so the address is centred on the PAGE axis rather than on
     * whatever is left after the marks take their width. */
    grid-template-columns: 1fr auto 1fr;
    align-items: end;
    gap: var(--spacing-s-4);
  }

  .footer-address {
    grid-column: 2;
  }

  .footer-social {
    grid-column: 3;
    justify-self: end;
    display: flex;
    gap: var(--spacing-s-2);
  }

  .social-chip {
    /* 44×44 is the touch floor, and these sit side by side in a corner where
     * a miss lands on the neighbour. The glyph stays 24px; only its box is
     * the target. */
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius);
    color: var(--footer-ink);
    transition:
      background var(--duration-quick) var(--ease),
      color var(--duration-quick) var(--ease);
  }

  /* Same "lit" move as the doorways: the chip fills with paper and the glyph
   * — drawn in currentColor — falls back to the ground. No opacity. */
  .social-chip:hover,
  .social-chip:focus-visible {
    background: var(--footer-ink);
    color: var(--footer-bg);
  }

  .social-chip:focus-visible {
    outline: 2px solid var(--footer-ink);
    outline-offset: 2px;
  }

  .social-chip svg {
    width: 24px;
    height: 24px;
    display: block;
  }

  /* Below this the three columns cannot hold a centred address AND a right
   * edge without squeezing one of them, so they stack. The marks keep the
   * right edge — that is where they were asked for. */
  @media (max-width: 700px) {
    .footer-base {
      grid-template-columns: 1fr;
      gap: var(--spacing-s-3);
    }

    .footer-address {
      grid-column: 1;
    }

    .footer-social {
      grid-column: 1;
    }
  }

  /* Both address lines are FULL paper. They are separated by size and
   * tracking, never by opacity — see the header comment. */
  .footer-place {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-body);
    letter-spacing: var(--tracking-wide);
  }

  .footer-name {
    margin: var(--spacing-s-2) 0 0;
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wider);
  }
</style>
