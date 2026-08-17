<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import '../app.css';
  import NavContent from '$lib/components/NavContent.svelte';
  import SiteFooter from '$lib/components/SiteFooter.svelte';
  import MobileMenu from '$lib/components/MobileMenu.svelte';
  import LanguageMenu from '$lib/components/LanguageMenu.svelte';
  import {
    subscribeHeroScroll,
    subscribeNavRegions,
    motionForced,
    HEADER_H,
    bindNavbarColor,
    subscribeNavbarColor,
    type NavRegion,
  } from '$lib/scrollDriver';
  import { blogEntry } from '$lib/blogNav.svelte';

  let { children } = $props();

  /* $state, not a plain let: `bind:this` assigns AFTER the first effect pass,
   * and a plain binding is not reactive in runes mode, so the parking effect
   * below would run once against `undefined` and never re-run. */
  let navbarWhiteEl: HTMLElement | undefined = $state();
  let navbarBlackEl: HTMLElement | undefined = $state();
  let welcomeVisible = $state(false);
  /** Threshold for hero progress at which the WelcomePanel has arrived —
   * 1 (not a fraction) on purpose: the navbar only goes solid once the
   * second section is fully in view. The scroll driver guarantees the
   * terminal p=1 emit (its epsilon skip exempts terminal values), so
   * comparing against exactly 1 is safe. */
  const WELCOME_THRESHOLD = 1;

  /** The hero clip only belongs to the homepage — other (site) routes keep
   * the navbar fully revealed. Match on the URL, not the route id, so route
   * groups like (site) don't matter. */
  const isHome = $derived(page.url.pathname === '/');

  /** Blog routes get a solid paper background on the navbar. */
  const isBlog = $derived(page.url.pathname.startsWith('/blog'));

  /* Journal entry tracking — see $lib/blogNav.svelte.ts. Runs on every
   * route change: the path a note was reached FROM decides whether back
   * means "the homepage, where you were" or "the journal loop". */
  let prevPath: string | null = null;
  $effect(() => {
    const path = page.url.pathname;
    if (path.startsWith('/blog/')) {
      if (prevPath === null) {
        /* Fresh load — no in-app history, so infer from the referrer and
         * mark viaSpa false (history.back() would leave the site). */
        let from: 'home' | 'journal' = 'journal';
        try {
          const ref = document.referrer ? new URL(document.referrer) : null;
          if (ref && ref.origin === window.location.origin && ref.pathname === '/') {
            from = 'home';
          }
        } catch {
          /* Malformed referrer — stay in the journal default. */
        }
        blogEntry.from = from;
        blogEntry.viaSpa = false;
      } else if (path !== prevPath) {
        blogEntry.from = prevPath === '/' ? 'home' : 'journal';
        blogEntry.viaSpa = true;
      }
    }
    prevPath = path;
  });

  /* The white navbar has two clip sources: the hero's scrub (top of the
   * page) and section claims — header regions published while imagery
   * sits under the header (the pinned offerings scroller, the pattern
   * dividers). Section claims win while any exist; an empty claim set
   * restores the hero's last clip, which matters because the hero driver
   * stops emitting once its progress is clamped at 1. This composition
   * keeps a single DOM writer. */
  /* The two resting states of the white navbar's clip.
   *
   * OPEN shows the white layer in full — correct only over the dark hero
   * imagery at the very top of the homepage. HIDDEN clips it away entirely so
   * the black navbar underneath (already styled, always present) shows through,
   * which is what any light-background page needs.
   *
   * Getting this backwards is what made the navbar invisible on /blog: the
   * layer was left OPEN, painting paper-coloured links onto paper. */
  const CLIP_OPEN = 'inset(0vh 0vw 0 0 round 0px)';
  const CLIP_HIDDEN = 'inset(0 100% 0 0)';

  let heroClip = CLIP_OPEN;
  let sectionClip: string | null = null;

  /** Normalised rect claims feeding the SVG union clip (only populated
   * while MORE than one region claims the header at once). */
  let clipRects: { top: number; bottom: number; left: number; right: number }[] = $state([]);

  /** One claim to a viewport-px rect — the legacy `width` shorthand
   * resolves here so the renderer only ever sees explicit extents. */
  function regionRect(r: NavRegion): { top: number; bottom: number; left: number; right: number } {
    const vw = window.innerWidth;
    return {
      top: r.top,
      bottom: r.bottom,
      left: r.left ?? 0,
      right: r.right ?? (r.width === 'half' ? Math.round(vw / 2) : vw),
    };
  }

  /** Compose the white-navbar clip from region claims. A single claim is
   * a plain inset; several claims at once (a row of journal cards, the
   * scattered portraits) union through the SVG clipPath in the markup —
   * one clip-path property cannot hold disjoint insets, a clipPath can
   * hold any number of rects. */
  function composeSectionClip(regions: NavRegion[]): void {
    if (regions.length === 0) {
      sectionClip = null;
      clipRects = [];
      return;
    }
    const rects = regions.map(regionRect);
    if (rects.length === 1) {
      const r = rects[0];
      const vw = window.innerWidth;
      sectionClip = `inset(${r.top}px ${vw - r.right}px ${HEADER_H - r.bottom}px ${r.left}px)`;
      clipRects = [];
    } else {
      sectionClip = 'url(#nav-clip)';
      clipRects = rects;
    }
  }

  function applyClip(): void {
    if (navbarWhiteEl) navbarWhiteEl.style.clipPath = sectionClip ?? heroClip;
  }

  /* Leaving the homepage. Only the homepage runs a hero scroll driver, so on
   * every other route nothing would ever move this clip again — it has to be
   * parked in the right state on arrival.
   *
   * Parked HIDDEN, not open: every route that exists today (/blog and its
   * children) opens on paper, and a route that later opens on dark full-bleed
   * imagery should opt back in explicitly rather than inherit a default that is
   * wrong for the common case. */
  $effect(() => {
    if (!isHome && navbarWhiteEl) {
      heroClip = CLIP_HIDDEN;
      sectionClip = null;
      clipRects = [];
      applyClip();
      // Clear the section colour tracker's inline styles — CSS
      // (e.g. .on-blog) takes over on non-home routes.
      if (navbarBlackEl) {
        navbarBlackEl.style.background = '';
        navbarBlackEl.classList.remove('dark-bg');
      }
    }
  });

  onMount(() => {
    // Dev motion override (?motion=1, parsed in scrollDriver) — lift the
    // reduced-motion CSS gates so animations can be tuned without
    // toggling OS accessibility settings.
    document.documentElement.classList.toggle('motion-forced', motionForced());

    // Subscribing to the shared driver (instead of a second scroll listener)
    // keeps this write direct and coalesced to one frame.
    const unsubHero = subscribeHeroScroll((p) => {
      /* The hero clip belongs to the homepage alone. Subscribing replays the
       * driver's last progress immediately, so without this guard landing on
       * /blog fired one callback at p=0, wrote the fully-open clip, and undid
       * the correct prerendered value — paper-coloured links on paper. */
      if (!isHome) return;
      const rightInset = 107.5 * p;
      const topInset = 7.5 * p;
      const radius = p * 24;
      heroClip = `inset(${topInset}vh ${rightInset}vw 0 0 round ${radius}px)`;
      if (sectionClip === null) applyClip();
      welcomeVisible = p >= WELCOME_THRESHOLD;
      // In the hero zone (p < WELCOME_THRESHOLD) the navbar is transparent.
      // Once the WelcomePanel has FULLY arrived (p === 1), publish paper
      // colour until the section colour tracker takes over. A hard cut on
      // purpose — this boundary is a discrete arrival, not a spatial blend.
      if (navbarBlackEl) {
        if (p < WELCOME_THRESHOLD) {
          navbarBlackEl.style.background = '';
        } else {
          navbarBlackEl.style.background = 'rgb(241,231,212)';
          navbarBlackEl.classList.remove('dark-bg');
        }
      }
    });

    const unsubNav = subscribeNavRegions((regions) => {
      composeSectionClip(regions);
      applyClip();
    });

    // Section-based navbar color: matches the background of whatever
    // section sits under the sticky header.
    const unbindNavColor = bindNavbarColor();
    const unsubNavColor = subscribeNavbarColor((color) => {
      if (!navbarBlackEl) return;
      navbarBlackEl.style.background = color;
      // Toggle text/logo colors based on section luminance.
      const isDark = (() => {
        const m = color.match(/\d+/g);
        if (!m || m.length < 3) return false;
        const [r, g, b] = m.map(Number);
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
      })();
      navbarBlackEl.classList.toggle('dark-bg', isDark);
    });

    return () => {
      unsubHero();
      unsubNav();
      unbindNavColor();
      unsubNavColor();
    };
  });
</script>

<!--
  Only the tags that are genuinely site-wide live here. Title, description,
  canonical, Open Graph and JSON-LD are per-route and belong to $lib/seo/Seo
  — a hardcoded title in the layout is a title every page then has to fight.
  charset and viewport already ship in app.html; repeating them here was a
  no-op the browser ignored.
-->
<svelte:head>
  <meta name="theme-color" content="#221c14" />
</svelte:head>

<!--
  One layout, rendered twice.
  Both navbars are absolutely positioned inside a single sticky header.
  Identical box → identical layout → pixel-perfect alignment.
-->

<header class="site-header" class:on-blog={isBlog} class:on-welcome={welcomeVisible && isHome}>
  <!-- Black navbar — always visible, underneath -->
  <div class="navbar navbar-black" bind:this={navbarBlackEl}>
    <div class="header-inner">
      <NavContent>
        <!-- The full lockup at every width, wordmark included. Swapping in the
             standalone icon on phones was the wrong correction: it removed the
             name, and the icon's ink sits low inside its own viewBox, so it
             also read ~10px out of alignment with the menu button beside it
             (measured). This asset's ink is centred in its box and occupies
             ~31% of its height, which is why the negative margins below can
             centre it in a 60px header without clipping anything. -->
        <img slot="logo" src="/images/branding/logo-horizontal.svg" alt="" class="logo-img" />
      </NavContent>
    </div>
  </div>

  <!-- White navbar — on top, clipped -->
  <div
    class="navbar navbar-white"
    class:on-hero={isHome}
    bind:this={navbarWhiteEl}
    style="clip-path: {isHome ? CLIP_OPEN : CLIP_HIDDEN}"
    aria-hidden="true"
    inert
  >
    <div class="header-inner">
      <NavContent>
        <!-- The full lockup at every width, wordmark included. Swapping in the
             standalone icon on phones was the wrong correction: it removed the
             name, and the icon's ink sits low inside its own viewBox, so it
             also read ~10px out of alignment with the menu button beside it
             (measured). This asset's ink is centred in its box and occupies
             ~31% of its height, which is why the negative margins below can
             centre it in a 60px header without clipping anything. -->
        <img slot="logo" src="/images/branding/logo-horizontal.svg" alt="" class="logo-img" />
      </NavContent>
    </div>
  </div>

  <!-- Union clip for the white navbar when several imagery regions claim
       the header at once: the layout feeds these rects from the claims.
       Coordinates are header-local, which equals viewport px here — the
       header spans the viewport from the origin. -->
  <svg class="clip-defs" width="0" height="0" aria-hidden="true">
    <defs>
      <clipPath id="nav-clip" clipPathUnits="userSpaceOnUse">
        {#each clipRects as r}
          <rect x={r.left} y={r.top} width={r.right - r.left} height={r.bottom - r.top} />
        {/each}
      </clipPath>
    </defs>
  </svg>

  <!-- Outside both navbars on purpose: one instance, unclipped. See the header
       comment in MobileMenu.svelte. -->
  <MobileMenu />

  <!-- Same reasoning, same seam: the language switcher's TRIGGER is inside
       NavContent so it can inherit each navbar's colour, but its panel would
       be duplicated and clipped to the 60px header if it lived there too. See
       $lib/language.svelte.ts. -->
  <LanguageMenu />
</header>

{@render children()}

<!-- Every route ends the same way. -->
<SiteFooter />

<style>
  :global(html) {
    overscroll-behavior: none;
    /*
      The homepage lays out a 200vw strip and slides it. It sits inside an
      `overflow: hidden` sticky wrapper, which is supposed to be the end of it —
      but on iOS Safari that containment was observed to give way mid-scroll:
      the document widened to the strip's full 200vw and Safari zoomed the whole
      page out to fit, so every section rendered at roughly 60% and shifted. The
      reported symptom was "things move upwards, then sideways out of focus".

      `clip`, not `hidden`, is the important part: `overflow: hidden` on the root
      makes it a scroll container, which breaks `position: sticky` inside — and
      this page is built almost entirely from sticky panels. `clip` clips
      without creating a scroll container, so the strip can never widen the
      document and the pins keep working.
    */
    overflow-x: clip;
  }

  /* ── Single sticky header ── */
  .clip-defs {
    position: absolute;
  }

  .site-header {
    position: sticky;
    top: 0;
    /* Above section content. Vertical sections raise their own inner wrapper to
     * z-index 1 so it clears their decorative accents; at the header's old
     * z-index of 1 those wrappers tied with it and won on document order, so
     * section text and imagery painted over the navbar (visible on the journal
     * strip, where the eyebrow collided with the logo). The takeover machinery
     * assumes the opposite: the header sits on top and sections carve into it
     * with clip-path, never by overlapping it. */
    z-index: 5;
    height: 60px;
  }

  /* ── Both navbars: same box, same rules, stacked via z-index ── */
  .navbar {
    position: absolute;
    inset: 0;
  }

  .header-inner {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Black (underneath) ── */
  .navbar-black {
    z-index: 0;
    color: #000;
    /* No time-based background/colour transition here, on purpose. The
     * section colour tracker writes a scroll-anchored cross-fade per frame
     * (NAV_BLEND_PX in scrollDriver.ts) — layering a CSS transition on top
     * makes the painted colour lag the section actually under the header
     * and desynchronises the dark-bg text toggle from its background. */
  }

  .navbar-black :global(.logo-img) {
    height: 120px;
    width: auto;
    display: block;
    margin: -30px 0;
  }

  /* ── White (on top) ── */
  .navbar-white {
    z-index: 1;
    color: var(--color-paper);
  }

  /* ── Blog routes: solid paper background ── */
  .on-blog .navbar-black {
    background: var(--surface-1);
    color: var(--text);
  }

  .on-blog .navbar-black :global(.logo-img) {
    filter: none;
  }

  .on-blog .navbar-white {
    /* Hidden on blog — black navbar carries the solid background */
    clip-path: inset(0 100% 0 0) !important;
  }

  /* ── Homepage: hide white navbar once WelcomePanel arrives ── */
  .on-welcome .navbar-white {
    clip-path: inset(0 100% 0 0) !important;
  }

  /* ── Dark section background: light text + inverted logo ──
   *  Toggled by the section colour tracker (JS) when the navbar
   *  sits over a dark-background section. :global() because the
   *  class is toggled by JS, not in the template. */
  :global(.navbar-black.dark-bg) {
    color: var(--color-paper);
  }

  :global(.navbar-black.dark-bg .logo-img) {
    filter: invert(1);
  }

  /* `invert(1)` alone — the mark is drawn in ink and this layer is the paper
     one. No drop-shadow: the hero already carries a paint-only scrim under
     `.hero-text` for contrast, and the site's standing rule is hairlines, not
     shadows. */
  .navbar-white :global(.logo-img) {
    height: 120px;
    width: auto;
    display: block;
    margin: -30px 0;
    filter: invert(1);
  }

  /* Phone: the same lockup, one step smaller.
   *
   * The box overflows the 60px header by 20px top and bottom, and that is
   * correct rather than a bug — measured, the artwork occupies only the middle
   * ~31% of this SVG's height, so at 100px the INK spans roughly 14px to 45px
   * and sits comfortably inside the header with its centre on the header's.
   * What must not come back is a width crop: `overflow: hidden` on the link is
   * what previously chopped "AYNI SANCTUARY" off. */
  @media (max-width: 768px) {
    .navbar-black :global(.logo-img),
    .navbar-white :global(.logo-img) {
      height: 100px;
      margin: -20px 0;
    }
  }

</style>
