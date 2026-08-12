<script lang="ts">
  /**
   * OfferingsSection — pinned image + category scroller ("Offer").
   *
   * A 300vh container pins a full-height split view: the category image
   * fills the LEFT half of the screen edge-to-edge, the category copy
   * owns the right. Scroll scrubs through the categories — the current
   * image is swept OFF the page to the left, tipping as it goes (rotation
   * pivoted on its bottom-left corner) and revealing the next image
   * already sitting beneath it, card-deck style. The ENTIRE right panel
   * swaps with it: each category brings its own title + description (CTA
   * seam marked below). A segmented progress slider at the bottom of the
   * image shows how far the next image is — the upcoming segment fills as
   * you scroll. Then the page unpins and the vertical journey continues
   * (Retreats, Journal).
   *
   * Scrub discipline matches the hero: styles are a pure function of
   * scroll position (bindSectionScroll — rAF-coalesced, write-skipped),
   * no time-based image animation. Only the copy-panel swap uses a short
   * CSS transition, keyed off a discrete active index.
   *
   * Navbar takeover: while the image is under the 60px header strip, this
   * section publishes the white navbar's clip (left half of the screen —
   * the image region) through publishNavClip; the layout composes it with
   * the hero's clip. Same treatment the hero gives the navbar, extended to
   * this section's imagery.
   *
   * Imagery is a placeholder until finalised — swap the entries in
   * `offerings` below. Each entry carries its own image so the card deck is
   * data-driven. The words are placeholders too, but they live in
   * `home.offerings.categories`; the two arrays are joined by POSITION, so
   * entry k here is entry k there. See
   * docs/research/sanctuary-offerings-landing/research.md.
   */
  import { onMount } from 'svelte';
  import { bindSectionScroll, navRegion } from '$lib/scrollDriver';
  import { t, DEFAULT_LOCALE } from '$lib/i18n';

  /* $derived, not a plain const: the locale is a property of the URL and
   * becomes dynamic in Phase 3, at which point this recomputes on its own. */
  const m = $derived(t(DEFAULT_LOCALE).home);

  /**
   * The deck, structure only: photograph, wing hue, and a slug.
   *
   * `slug` exists to be the {#each} key. That key used to be the category
   * title, which is now catalog copy — and a keyed each rebuilds its DOM the
   * moment its keys change, which would throw away the `.pin-card` elements
   * onMount captured and leave the sweep writing transforms to detached nodes.
   * A structural key cannot change with the language, so it cannot do that.
   *
   * Categories: retreats, ceremonies, events — one card per offering.
   */
  const offerings = [
    {
      slug: 'retreats',
      hue: 'var(--clay)',
      image: {
        src: '/images/retreats.webp',
        srcset:
          '/images/retreats-768.webp 768w, /images/retreats-1280.webp 1280w, /images/retreats.webp 5152w',
        width: 5152,
        height: 7728,
      },
    },
    {
      slug: 'ceremonies',
      hue: 'var(--gold)',
      objectPosition: '70% center',
      image: {
        src: '/images/ceremonies.webp',
        srcset:
          '/images/ceremonies-768.webp 768w, /images/ceremonies-1280.webp 1280w, /images/ceremonies.webp 3936w',
        width: 3936,
        height: 2624,
      },
    },
    {
      slug: 'events',
      hue: 'var(--sage)',
      image: {
        src: '/images/events.webp',
        srcset:
          '/images/events-768.webp 768w, /images/events-1280.webp 1280w, /images/events.webp 3769w',
        width: 3769,
        height: 2513,
      },
    },
  ];

  let containerEl: HTMLElement;
  let activeIndex = $state(0);

  function clamp01(v: number): number {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  /** easeInOutCubic — matches the hero's own easing shape: a gentle
   * departure, brisk middle, gentle landing. Slower and softer at both
   * ends than a plain ease-out, so consecutive cards read as one
   * continuous handover instead of a snap. */
  function easeInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /** Exit choreography: how far off-page the card travels (125% clears
   * the rotated corner, including the attached shadow's small overhang)
   * and how far it tips around its bottom-left pivot. */
  const EXIT_X = 125;
  const EXIT_DEG = 12;
  /** Handover span, in category units — widened from an earlier 0.3 so the
   * sweep starts earlier and settles later, slower and more connected. */
  const EXIT_SPAN = 0.5;

  onMount(() => {
    // The sweep transform lands on .pin-card — its filter: drop-shadow()
    // rides along automatically since it's part of the same layer.
    const cards = Array.from(
      containerEl.querySelectorAll<HTMLElement>('.pin-card')
    );
    const progressFill = containerEl.querySelector<HTMLElement>('.progress-fill');
    /* Write-skipping: cache each element's last quantized value so settled
     * frames cost zero style writes — same epsilon philosophy as the hero. */
    const lastV = new Map<Element, number>();

    const unbind = bindSectionScroll(containerEl, ({ p }) => {
      // t walks 0 → N-1 across the pin. Sweeps are centered evenly so
      // every dwell — before the first, between each pair, after the
      // last — is the SAME length. Centering sweeps on plain category
      // integers (k+0.5) instead left the between-sweep dwell twice as
      // long as the leading/trailing ones (it absorbed both a leading and
      // a trailing half-dwell), which read as an uneven pause.
      const t = p * (offerings.length - 1);
      const half = EXIT_SPAN / 2;
      const sweepCount = offerings.length - 1;
      const dwell = (sweepCount * (1 - EXIT_SPAN)) / (sweepCount + 1);

      for (let k = 0; k < cards.length - 1; k++) {
        const center = dwell + half + k * (dwell + EXIT_SPAN);
        const f = Math.round(easeInOut(clamp01((t - (center - half)) / EXIT_SPAN)) * 1000) / 1000;
        if (lastV.get(cards[k]) === f) continue;
        lastV.set(cards[k], f);
        // Sweep: off to the left while tipping around the bottom-left
        // corner (transform-origin in CSS) — the image and its own drop
        // shadow move together, revealing the card beneath.
        cards[k].style.transform =
          f <= 0
            ? ''
            : `translateX(${(-f * EXIT_X).toFixed(1)}%) rotate(${(-f * EXIT_DEG).toFixed(2)}deg)`;
      }

      const a = Math.round(t);
      if (a !== activeIndex) activeIndex = a;

      // Progress bar: one continuous seven-hue band pinned to the image's
      // bottom edge, revealed left → right with the WHOLE section's
      // progress (p: section start → pin release). Clip-path reveal keeps
      // the gradient's hues in place instead of stretching them.
      if (progressFill) {
        const f = Math.round(p * 1000) / 1000;
        if (lastV.get(progressFill) !== f) {
          lastV.set(progressFill, f);
          progressFill.style.clipPath = `inset(0 ${((1 - f) * 100).toFixed(1)}% 0 0)`;
        }
      }

      /* Navbar takeover: the image container claims its own header rect
       * via use:navRegion on .pin-media — the shared rect tracker in
       * scrollDriver measures it on scroll/resize, so no per-frame
       * geometry is needed here. */
    });

    return () => {
      unbind();
    };
  });
</script>

<section class="offerings" id="offerings" bind:this={containerEl}>
  <div class="pin">
    <div class="pin-media" use:navRegion>
      <!-- Card deck, top-down: card 0 sits on top of the stack (z-index
           inverts DOM order) and is swept off to the left to reveal card 1
           beneath it, and so on. The last card is the base and never moves.
           Each card's drop shadow is a real `filter: drop-shadow()` (see
           .pin-card) — it traces the card's actual rendered silhouette
           post-transform, so as a card rotates and slides away the shadow
           hugs whichever edge is currently exposed (bottom, corner, side)
           instead of a fixed rectangular band. At rest every card sits
           flush with .pin-media's clipped bounds on all sides, so the
           shadow has nowhere to peek out — invisible until the card's own
           motion carries an edge clear of that boundary, and it leaves
           together with the card since it's the same filtered layer. -->
      {#each offerings as offering, k (offering.slug)}
        <div class="pin-card" style="z-index: {offerings.length - k}">
          <img
            class="pin-image"
            src={offering.image.src}
            srcset={offering.image.srcset}
            sizes="(max-width: 900px) 100vw, 50vw"
            width={offering.image.width}
            height={offering.image.height}
            alt={m.offerings.categories[k].imageAlt}
            style={offering.objectPosition ? `object-position: ${offering.objectPosition}` : undefined}
            loading="lazy"
            decoding="async"
          />
        </div>
      {/each}

      <!-- Scroll indicator: one continuous seven-hue band on the image's
           bottom edge, revealed with the whole section's progress. -->
      <div class="pin-progress" aria-hidden="true">
        <i class="progress-fill" style="clip-path: inset(0 100% 0 0)"></i>
      </div>
    </div>

    <div class="pin-copy">
      <!-- The whole right panel swaps per category: title + description
           now, room for per-offering action buttons later (CTA seam). -->
      <div class="copy-stack">
        <!-- Panels swap at every width now, so only the active one is exposed.
             The old exception for mobile applied while every panel was listed
             at once there. -->
        {#each offerings as offering, k (offering.slug)}
          {@const copy = m.offerings.categories[k]}
          <article
            class="copy-panel"
            class:is-active={k === activeIndex}
            class:is-before={k < activeIndex}
            aria-hidden={k !== activeIndex}
          >
        
            <h2 class="copy-title">{copy.title}</h2>
            <p class="copy-blurb">{copy.blurb}</p>
            <!-- CTA seam: per-offering action buttons land here later, e.g.
                 <div class="copy-actions"><a class="btn btn-secondary" href="…">…</a></div> -->
          </article>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  /* 220vh = 100vh pinned + 120vh runway: 60vh of scroll per category
   * transition (down from an earlier 300vh/100vh — the pin felt too long
   * to scroll through). The container height is the tempo control. */
  .offerings {
    position: relative;
    /* svh, not dvh: the runway height must be stable so scroll progress
     * never recalculates mid-gesture. See +page.svelte. */
    height: 220vh;
    height: 220svh;
    background: var(--surface-2);
    /* Cleared for the sticky header when the nav jumps to /#offerings. */
    scroll-margin-top: 60px;
  }

  .pin {
    position: sticky;
    top: 0;
    height: 100vh;
    /* svh, not dvh: stable minimum viewport height — no layout jump when the
     * mobile toolbar shows/hides. See +page.svelte .scroll-wrapper. */
    height: 100svh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    overflow: hidden;
  }

  /* Image fills the left half edge-to-edge, full height. Overflow hidden
   * clips the outgoing card as it sweeps past the media edge. */
  .pin-media {
    position: relative;
    overflow: hidden;
  }

  /* The card is what actually sweeps, pivoted on its own bottom-left
   * corner. Its drop-shadow is a real `filter: drop-shadow()` — computed
   * on the card's actual rendered (rotated/translated) shape, so it hugs
   * whichever edge of the photo is currently exposed instead of a fixed
   * rectangular band. It travels with the card because it IS part of the
   * same filtered layer; nothing is left behind once the card exits. At
   * rest every card sits flush with .pin-media's clipped bounds on all
   * sides, so the shadow has no edge to peek past — invisible until the
   * card's own motion clears one. A real `box-shadow` would work the same
   * way here, but `filter: drop-shadow()` is used since it follows the
   * <img>'s actual edges rather than the (identical, in this case) box. */
  .pin-card {
    position: absolute;
    inset: 0;
    will-change: transform;
    transform-origin: left bottom;
    filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.6)) drop-shadow(0 30px 40px rgba(0, 0, 0, 0.6));
  }

  .pin-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* ── Progress bar ── the seven-hue lineage pinned to the image's bottom
   * edge, full width, above the deck. */
  .pin-progress {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 5px;
    z-index: 10;
    background: color-mix(in srgb, var(--color-paper) 25%, transparent);
  }

  .progress-fill {
    display: block;
    height: 100%;
    background: linear-gradient(
      90deg,
      var(--color-clay), var(--color-amber), var(--color-gold),
      var(--color-sage), var(--color-slate), var(--color-indigo), var(--color-plum)
    );
    will-change: clip-path;
  }

  /* ── Right panel ── */
  .pin-copy {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    padding: clamp(80px, 12vh, 140px) clamp(24px, 5vw, 80px);
  }

  /* Panels stack in the same grid cell; the container sizes to the
   * tallest one, so the swap never reflows the section. */
  .copy-stack {
    display: grid;
    margin-top: var(--spacing-s-7);
  }

  .copy-panel {
    grid-area: 1 / 1;
    opacity: 0;
    transform: translateY(24px);
    visibility: hidden;
    pointer-events: none;
    transition:
      opacity var(--duration-normal) var(--ease),
      transform var(--duration-normal) var(--ease),
      visibility 0s linear var(--duration-normal);
  }

  /* Panels already visited rest above, upcoming below — the incoming
   * panel always enters from the direction of scroll travel. */
  .copy-panel.is-before {
    transform: translateY(-24px);
  }

  .copy-panel.is-active {
    opacity: 1;
    transform: none;
    visibility: visible;
    pointer-events: auto;
    transition:
      opacity var(--duration-normal) var(--ease),
      transform var(--duration-normal) var(--ease),
      visibility 0s;
  }

  .copy-title {
    font-family: var(--font-display);
    font-size: var(--text-h2);
    font-weight: var(--weight-light);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-display);
    color: var(--text);
    margin: var(--spacing-s-5) 0 0;
  }

  .copy-blurb {
    margin: var(--spacing-s-5) 0 0;
    font-size: var(--text-lead);
    line-height: var(--leading-loose);
    color: var(--text-2);
    max-width: 44ch;
  }

  /* Mobile: no pin — image on top (first category's photo), every copy
   * panel stacked and fully visible; the slider needs the pin, so it
   * hides. The scrub still runs but only touches hidden images. */
  /* ── Phone: the same scrub, turned through ninety degrees ──────────
   *
   * This used to unpin entirely on mobile — static image, every category
   * listed underneath, no card sweep. That threw away the section's whole
   * idea on the devices most people arrive on, and left the offerings
   * reading as an undifferentiated list.
   *
   * The pin stays. Only the axis changes: instead of a half-width image
   * beside its copy, the photograph takes the upper band and the copy the
   * lower one, and cards sweep across the band exactly as they do on
   * desktop. Everything that made the desktop version work — the sweep,
   * the panel swap, the progress band, the drop-shadow that hugs the
   * moving edge — is inherited rather than overridden, so the two stay in
   * step by construction and only the grid is restated here.
   *
   * 46vh for the image is chosen so the copy band still clears a
   * three-line description plus its tag and title inside the
   * remaining 54vh, on the shortest phone viewport worth targeting. */
  @media (max-width: 900px) {
    .pin {
      grid-template-columns: 1fr;
      grid-template-rows: 46svh 1fr;
    }

    .pin-copy {
      padding: var(--spacing-s-6) clamp(20px, 6vw, 40px);
      justify-content: flex-start;
    }

    .copy-stack {
      margin-top: var(--spacing-s-5);
    }

    /* The band sits on the seam between photograph and copy, where it
     * reads as the join rather than as a rule under the picture. */
    .pin-progress {
      height: 4px;
    }
  }

  /* Short viewports (landscape phones) cannot give 46vh to a photograph
   * and still show the copy, so the image yields first. */
  @media (max-width: 900px) and (max-height: 620px) {
    .pin {
      grid-template-rows: 38svh 1fr;
    }
  }
</style>
