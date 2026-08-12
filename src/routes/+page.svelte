<script lang="ts">
  import { onMount } from 'svelte';
  import WelcomePanel from '$lib/components/WelcomePanel.svelte';
  import OfferingsSection from '$lib/components/OfferingsSection.svelte';
  import PatternDivider from '$lib/components/PatternDivider.svelte';
  import RetreatsSection from '$lib/components/RetreatsSection.svelte';
  import JournalStrip from '$lib/components/JournalStrip.svelte';
  import BookSection from '$lib/components/BookSection.svelte';
  import VoicesSection from '$lib/components/VoicesSection.svelte';
  import ContactSection from '$lib/components/ContactSection.svelte';
  import ScrollDebug from '$lib/components/ScrollDebug.svelte';
  import Seo from '$lib/seo/Seo.svelte';
  import { organization, website } from '$lib/seo/jsonld';
  import { bindHeroScroll, subscribeHeroScroll } from '$lib/scrollDriver';
  import { t, DEFAULT_LOCALE } from '$lib/i18n';
  /* Geometry shared with SiteFooter — see $lib/social for why it is not
   * inline here any more. */
  import { SOCIAL_MARKS } from '$lib/social';

  /** Latest posts for the journal strip, from src/routes/+page.server.ts. */
  let { data } = $props();

  /* $derived, not a plain const: the locale is a property of the URL and
   * becomes dynamic in Phase 3, at which point this recomputes on its own. */
  const m = $derived(t(DEFAULT_LOCALE).home);
  /** The social marks are labelled from `chrome`, not `home` — the footer
   * renders the same two links. */
  const social = $derived(t(DEFAULT_LOCALE).chrome.social);

  let containerEl: HTMLElement;
  let panelsEl: HTMLElement;
  let heroPanelEl: HTMLElement;
  let heroImageEl: HTMLImageElement;
  let lastRadius = -1;

  /** Dev-only motion HUD — enable with ?debug in the URL. */
  let showDebug = $state(false);

  /**
   * Does the browser drive the strip itself, from CSS?
   *
   * This matters more than it looks. The horizontal journey is 380vh of sticky
   * container, and until the scroll driver hydrates NOTHING responds to scroll:
   * you scroll the full runway past a motionless hero and land in Offerings,
   * having never seen WelcomePanel at all. The page reads as one vertical
   * column with its second section missing. Measured on this machine, that dead
   * window was ~1.5s on a production build and ~3.8s in dev, and it grows with
   * the module graph and with the distance to the server.
   *
   * Where scroll-driven animations exist, the CSS block at the bottom of this
   * file runs the same slide off a view-timeline, so the journey works from
   * first paint with no JavaScript at all. When it does, JS must not also write
   * transforms: animations outrank inline styles in the cascade, so the writes
   * would be dead code burning a frame budget. One driver at a time.
   */
  const cssDrivesStrip =
    typeof CSS !== 'undefined' &&
    CSS.supports?.('animation-timeline: view()') &&
    !document.documentElement.classList.contains('motion-forced');

  onMount(() => {
    showDebug = new URLSearchParams(window.location.search).has('debug');

    /**
     * Land at the start of the journey, not in the middle of it.
     *
     * Browsers restore the previous scroll position on reload and on back
     * navigation. For ordinary pages that is exactly right. For the first
     * 380vh of this one it is not: that runway is not content, it is a scrub,
     * and any position inside it is a frame of an animation rather than a
     * place. Restoring to it means the hero — the photograph the whole page
     * opens on — is already swept off-screen before the visitor has seen it,
     * every reload, every time they come back from /blog. Phones make it
     * constant: pull-to-refresh, tab restore and app switching all reload.
     *
     * So the correction is deliberately narrow. Only positions INSIDE the
     * runway are overridden, because only there is the restored offset
     * meaningless. Scroll restoration still works normally for the whole
     * vertical page below it — someone reading Contact who reloads stays at
     * Contact. An explicit #hash always wins, since that is the visitor
     * asking for a specific place.
     */
    if (!window.location.hash) {
      const runway = containerEl.offsetHeight - window.innerHeight;
      if (window.scrollY > 0 && window.scrollY < runway) {
        window.scrollTo(0, 0);
      }
    }
    // Decode the hero bitmap up front so the first scroll never races the
    // image decoder (Safari shows the background color until decode lands).
    heroImageEl.decode().catch(() => {
      /* A rejected decode() is harmless — the browser still renders the image. */
    });

    const unbind = bindHeroScroll(containerEl);
    const unsubscribe = subscribeHeroScroll((p) => {
      // Subscribers other than the strip still need the progress signal (the
      // navbar clip, WelcomePanel's reveals), so the subscription stays live
      // either way — only these two writes stand down.
      if (!cssDrivesStrip) {
        // Continuous, compositor-only: the whole strip slides on the GPU.
        panelsEl.style.transform = `translateX(${-p * 100}vw)`;

        // Quantized on purpose. WebKit re-rasters the image layer whenever a
        // scale delta crosses an internal threshold, and repaints whenever a
        // radius changes mid-frame. Stepping in tiny increments caps that work
        // (~75 scale steps, 24 radius steps across the whole scroll) while the
        // slide itself stays perfectly smooth. The steps are sub-pixel per
        // scroll distance — visually identical to continuous.
        const scale = Math.round((1 - p * 0.15) * 500) / 500;
        heroPanelEl.style.transform = `scale(${scale})`;
      }

      // Border-radius: 5 discrete steps — only writes when value changes.
      const radius = Math.min(24, Math.round(p * 4) * 6);
      if (radius !== lastRadius) {
        heroPanelEl.style.borderRadius = `${radius}px`;
        lastRadius = radius;
      }
    });

    return () => {
      unbind();
      unsubscribe();
    };
  });
</script>

<Seo
  title={m.seo.title}
  description={m.seo.description}
  path="/"
  jsonLd={[organization(), website()]}
/>

<section class="scroll-container" bind:this={containerEl}>
  <div class="scroll-wrapper">
    <div class="panels" bind:this={panelsEl} style="transform: translateX(0vw)">
      <div class="panel panel-hero" bind:this={heroPanelEl} style="transform: scale(1); border-radius: 0px">
        <img
          bind:this={heroImageEl}
          src="/images/main_sanctuary.webp"
          srcset="
            /images/main_sanctuary-768.webp 768w,
            /images/main_sanctuary-1920.webp 1920w,
            /images/main_sanctuary.webp 2558w
          "
          sizes="100vw"
          width="2558"
          height="1439"
          alt={m.hero.imageAlt}
          class="panel-image"
          loading="eager"
          decoding="async"
          fetchpriority="high"
        />
        <div class="hero-text">
          <h1 class="hero-title">{m.hero.title}</h1>
          <p class="hero-subtitle">{m.hero.subtitle}</p>
        </div>

        <!-- The height indicator, moved here from WelcomePanel (section 2):
             white, bottom-left, reading as the photograph's own caption. -->
        <div class="hero-location">
          <span>Calca</span><span class="loc-dot" aria-hidden="true"></span><span>Valle Sagrado</span><span class="loc-dot" aria-hidden="true"></span><span>2,928 m</span>
        </div>

        <!--
          Inline SVG, not an icon font or a web component. These were three
          <iconify-icon> elements upgraded by a script fetched from a CDN, which
          put a reachable external service in the render path of the homepage —
          the one thing AGENTS.md's local-first rule forbids outright. Three
          hairline glyphs are not worth a network dependency, so they are drawn
          here and the CDN preconnect and script are gone from app.html.

          SEAM: the hrefs are still placeholders, now held in
          `SOCIAL_URLS` in $lib/config. They need the collective's real
          profile URLs; until then they go nowhere on purpose rather than to
          an invented account.
        -->
        <div class="social-icons">
          {#each SOCIAL_MARKS as mark}
            <a href={mark.href} class="social-link" aria-label={social[mark.key]}>
              <!-- Stroke settings live on the <svg>, so each mark's path data
                   stays pure geometry and every glyph is guaranteed the same
                   weight. -->
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

      <div class="panel">
        <!-- WelcomePanel subscribes to the scroll driver directly — no prop
             plumbing, so scroll frames never trigger a framework re-render. -->
        <WelcomePanel />
      </div>
    </div>
  </div>
</section>

{#if showDebug}
  <ScrollDebug />
{/if}

<!-- Vertical journey. Below the horizontal cinematic opener the story
     turns vertical: Offer (the pinned image + category scroller) then Join
     (retreats plus journal). Retreats and Journal are static; the pinned
     offerings scrub is the only choreography after the strip. See
     docs/research/sanctuary-offerings-landing/research.md. -->
<OfferingsSection />

<!-- The two woven seams on the page, and the only two. They bracket the
     invitation and the journal that follows it — the ask, then its proof —
     a seam earns its place by marking that one moment, and four of them
     marked nothing. Everything below the second seam is the story after
     the ask, and runs unbroken. -->
<PatternDivider />
<RetreatsSection />
<hr class="rainbow-line" />
<JournalStrip posts={data.latestPosts} />
<PatternDivider />

<!-- The close: the book of days, then what guests said, then how to reach
     us. See docs/research/sanctuary-gallery-voices-contact/research.md. -->
<BookSection />
<VoicesSection reviews={data.reviews} />
<ContactSection />

<style>
  /* 380vh = 280vh of scrollable runway (shortened from 450vh — the
   * hero→welcome transition felt too long to scroll through). Every scrub
   * window in section 2 is a fraction of this distance, so the container
   * height is the master tempo control for the reveals. */
  .scroll-container {
    /*
      dvh, not vh. On iOS `vh` is the LARGE viewport — the height the page
      would have if the toolbar were hidden — so with the toolbar showing, a
      100vh panel is taller than the screen and its bottom sits under the
      chrome, while the scroll-driven progress is measured against the REAL
      scrollport. The two disagree by the height of the toolbar, and they
      disagree by a DIFFERENT amount the moment the toolbar starts collapsing
      mid-scroll. That mismatch is what shifts everything upward as you scroll.

      This container is the SCROLL RUNWAY — its height determines how much
      scrolling drives the horizontal slide. It uses svh (small viewport
      height) for stability: dvh resizes when the toolbar shows/hides, which
      recalculates scroll progress mid-gesture and stalls the scroll.
    */
    height: 380vh;
    /* svh, not dvh: the runway height must be stable so scroll progress
     * never recalculates mid-gesture. dvh shrinks when the toolbar reappears
     * on scroll-up, stalling the scroll position. */
    height: 380svh;
    position: relative;
    margin-top: -60px;
  }

  /* ── The journey, driven by the browser ────────────────────────────
   *
   * A view-timeline on the container reproduces the JS driver's progress
   * exactly rather than approximately. The driver computes
   *
   *     (scrollY - containerTop) / (containerHeight - viewportHeight)
   *
   * and a view-timeline's `contain` range for a subject taller than the
   * scrollport runs from the moment the subject first covers the scrollport to
   * the moment it stops covering it — which is the same two scroll positions.
   * So both drivers agree frame for frame, and the handover at hydration is
   * invisible.
   *
   * --ease-hero (animations.css) is a 49-point sampling of the driver's own
   * easeInOutCustom(), and was authored for exactly this block; using it here
   * is what keeps the CSS path from feeling like a different animation.
   *
   * Reduced motion deliberately does NOT disable this. The slide is not
   * decoration — it is how the second panel is reached — and animations.css
   * already carves out scroll-linked motion for that reason. */
  @supports (animation-timeline: view()) {
    .scroll-container {
      view-timeline-name: --hero-strip;
      view-timeline-axis: block;
    }

    .panels {
      animation: hero-strip auto linear both;
      animation-timeline: --hero-strip;
      animation-range: contain 0% contain 100%;
      animation-timing-function: var(--ease-hero);
    }

    .panel-hero {
      animation: hero-shrink auto linear both;
      animation-timeline: --hero-strip;
      animation-range: contain 0% contain 100%;
      animation-timing-function: var(--ease-hero);
    }

    /*
      Reduced motion must NOT zero these, and the failure is not "no
      animation" — it is far worse than that.

      animations.css blanket-applies `animation-duration: 0s !important` under
      (prefers-reduced-motion: reduce). For a time-driven animation that means
      "do not play". For a SCROLL-driven one it means the animation is instantly
      at its end state and stays there: the strip sits at translateX(-100vw)
      forever, so the hero is off-screen before the page is even scrolled and
      the second panel is all anyone ever sees. Confirmed in both Chromium and
      WebKit with Reduce Motion on — heroX -361px at scrollY 0.

      This is the exception animations.css's own header already anticipates: the
      slide is not decoration, it is how the second panel is reached, and it is
      user-driven — nothing moves that the reader did not move themselves by
      scrolling. `auto` (the scroll-driven default, meaning "take the length of
      the timeline") is restored here, and !important is required only because
      the blanket rule uses it too.
    */
    @media (prefers-reduced-motion: reduce) {
      :global(html:not(.motion-forced)) .panels,
      :global(html:not(.motion-forced)) .panel-hero {
        animation-duration: auto !important;
        animation-delay: 0s !important;
      }
    }

    @keyframes hero-strip {
      from { transform: translateX(0); }
      to { transform: translateX(-100vw); }
    }

    @keyframes hero-shrink {
      from { transform: scale(1); }
      to { transform: scale(0.85); }
    }
  }

  .panels {
    display: flex;
    width: 200vw;
    height: 100%;
    will-change: transform;
  }

  .scroll-wrapper {
    position: sticky;
    top: 0;
    height: 100vh;
    /* svh, not dvh: the small viewport height is the STABLE minimum (toolbar
     * shown). dvh tracks the dynamic viewport which resizes when the mobile
     * toolbar shows/hides, causing the entire layout to jump. svh is slightly
     * taller than the visible area when the toolbar is hidden, but that extra
     * space is invisible behind the toolbar and never causes a layout shift. */
    height: 100svh;
    /* clip rather than hidden for the same reason as the root: it contains the
     * 200vw strip without turning this into a scroll container. */
    overflow: clip;
    background: var(--surface-1);
  }

  .panel {
    width: 100vw;
    height: 100%;
    flex-shrink: 0;
    position: relative;
    will-change: transform;
    transform-origin: center center;
    /* Prevent a blank flash before the image decodes */
    background: var(--surface-1, #221c14);
    /*
      Rounded corners live on the panel, not the image. With overflow hidden
      on a composited layer (will-change: transform), browsers clip children
      with a GPU-side rounded mask — changing border-radius updates the mask,
      it does not repaint the image. Rounding the <img> directly did exactly
      that repaint every frame, which is what made Safari stutter.
    */
    overflow: hidden;
  }

  .panel-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
  }

  .hero-text {
    position: absolute;
    top: 120px;
    left: 22%;
    z-index: 1;
  }

  .hero-title {
    font-family: var(--font-display);
    font-size: var(--text-h2);
    font-weight: var(--weight-light);
    color: var(--color-paper);
    line-height: var(--leading-tight);
    margin: 0;
  }

  .hero-subtitle {
    font-family: var(--font-text);
    font-size: var(--text-lead);
    font-weight: var(--weight-book);
    color: var(--color-paper);
    line-height: var(--leading-loose);
    max-width: 48ch;
    margin: var(--spacing-s-3) auto 0;
    text-align: center;
  }

  /* The height indicator — moved here from WelcomePanel (section 2) per
   * direction: white, bottom-left, the valley's coordinates as the
   * photograph's caption. Legibility over bright ground comes from the
   * bottom scrim (.panel-hero::before). */
  .hero-location {
    position: absolute;
    left: clamp(24px, 4vw, 64px);
    bottom: calc(var(--spacing-s-6) + env(safe-area-inset-bottom, 0px));
    z-index: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-s-3);
    font-size: var(--text-xs);
    font-weight: var(--weight-med);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    color: var(--color-paper);
  }

  .hero-location .loc-dot {
    width: 4px;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--color-paper);
    opacity: 0.6;
  }

  .social-icons {
    position: absolute;
    /* Clear of the home indicator, and of Safari's bottom toolbar — the panel
     * is sized in dvh now, so the toolbar is already outside it, and the
     * safe-area inset covers the indicator that is not. */
    bottom: calc(var(--spacing-s-5) + env(safe-area-inset-bottom, 0px));
    right: calc(var(--spacing-s-5) + env(safe-area-inset-right, 0px));
    display: flex;
    gap: var(--spacing-s-4);
    z-index: 1;
  }

  .social-link {
    color: var(--color-paper);
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity var(--duration-quick) var(--ease);
  }

  .social-link:hover {
    opacity: 0.85;
  }

  .social-link svg {
    /* Back up to the size they were before being redrawn — 30px read as
     * cramped against the hero's scale. */
    width: 34px;
    height: 34px;
    display: block;
    /* no filter — shadows removed per design direction */
  }

  /* The glyphs are 30px and were the whole target — 26×26 measured, well under
   * the 44px floor, on three links sitting side by side in a corner where a
   * miss lands on the neighbour. The mark stays 30px; only its box grows. */
  @media (pointer: coarse) {
    .social-link {
      min-width: 44px;
      min-height: 44px;
    }

    .social-icons {
      gap: var(--spacing-s-2);
    }
  }

  /*
    Contrast. Paper-white type over sky and sunlit foliage measures well under
    what body text needs — worst in exactly the bright patches that move as the
    panel scales. Measured worst-pixel under .hero-text against paper #F1E7D4:
    3.48:1 on desktop and 4.05:1 on a phone, both below the 4.5:1 floor the
    20px subtitle falls under (the 44px title only needs 3:1).

    A pseudo-element rather than a filter on the image or a background on
    .hero-text: it paints between the photograph and the words (the img is in
    flow at z-index auto, .hero-text is positioned at 1), it costs no layout
    box so nothing shifts, and being paint-only it composites with the panel's
    per-frame scale and border-radius writes instead of forcing a re-raster.
    It covers only the top of the frame, so the photograph is darkened where
    the words are and nowhere else.

    Desktop stops are deliberately lighter than the phone's: the text block is
    narrower and higher there, so less of the frame needs help, and the valley
    is the reason anyone stays on this page.
  */
  /* Bottom scrim for the height indicator: a low gradient so the one
   * white line stays legible over the bright valley floor without
   * dimming more of the photograph than it needs. */
  .panel-hero::before {
    content: '';
    position: absolute;
    inset: auto 0 0;
    height: 30%;
    z-index: 0;
    pointer-events: none;
    background: linear-gradient(
      0deg,
      color-mix(in srgb, var(--color-ink) 45%, transparent) 0%,
      color-mix(in srgb, var(--color-ink) 22%, transparent) 55%,
      transparent 100%
    );
  }

  .panel-hero::after {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 60%;
    z-index: 0;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-ink) 46%, transparent) 0%,
      color-mix(in srgb, var(--color-ink) 30%, transparent) 55%,
      transparent 100%
    );
  }

  /* ── Phone: one block, one alignment, one scrim ─────────────────────
   *
   * The desktop composition is a left-aligned title parked at 22% with the
   * subtitle centred beneath it. Neither half survives a 390px screen: 22%
   * is 86px of the 390 the title has to live in, so the line ran past the
   * right edge and was clipped by the panel, and the two alignments stacked
   * read as two unrelated blocks rather than one address to the reader.
   *
   * Below 900px the block spans the panel with symmetric padding and
   * everything centres. Desktop is untouched — the rule only exists here. */
  @media (max-width: 900px) {
    .hero-text {
      left: 0;
      right: 0;
      top: clamp(88px, 13vh, 132px);
      padding-inline: clamp(20px, 6vw, 40px);
      text-align: center;
    }

    .hero-location {
      left: clamp(20px, 6vw, 40px);
      bottom: calc(var(--spacing-s-5) + env(safe-area-inset-bottom, 0px));
    }

    /* Hide "Calca" and its trailing dot on mobile — only Valle Sagrado + altitude remain. */
    .hero-location > span:first-child,
    .hero-location > span:nth-child(2) {
      display: none;
    }

    /* Phone stops, stronger than the base. 70% of the panel, not the ~40%
     * the words occupy: the gradient's own fade has to finish BELOW the last
     * line, or the closing words sit in the tail where the scrim has already
     * given up. Measured worst pixel: 4.05:1 bare, 5.45:1 with these. */
    .panel-hero::after {
      height: 70%;
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--color-ink) 62%, transparent) 0%,
        color-mix(in srgb, var(--color-ink) 46%, transparent) 60%,
        transparent 100%
      );
    }
  }
</style>
