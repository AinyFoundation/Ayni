<script lang="ts">
  import { onMount } from 'svelte';
  import WelcomePanel from '$lib/components/WelcomePanel.svelte';
  import OfferingsSection from '$lib/components/OfferingsSection.svelte';
  import RetreatsSection from '$lib/components/RetreatsSection.svelte';
  import JournalStrip from '$lib/components/JournalStrip.svelte';
  import ScrollDebug from '$lib/components/ScrollDebug.svelte';
  import { bindHeroScroll, subscribeHeroScroll } from '$lib/scrollDriver';

  let containerEl: HTMLElement;
  let panelsEl: HTMLElement;
  let heroPanelEl: HTMLElement;
  let heroImageEl: HTMLImageElement;
  let lastRadius = -1;

  /** Dev-only motion HUD — enable with ?debug in the URL. */
  let showDebug = $state(false);

  onMount(() => {
    showDebug = new URLSearchParams(window.location.search).has('debug');
    // Decode the hero bitmap up front so the first scroll never races the
    // image decoder (Safari shows the background color until decode lands).
    heroImageEl.decode().catch(() => {
      /* A rejected decode() is harmless — the browser still renders the image. */
    });

    const unbind = bindHeroScroll(containerEl);
    const unsubscribe = subscribeHeroScroll((p) => {
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

<svelte:head>
  <title>Ayni Consciousness Collective</title>
</svelte:head>

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
          alt="Sacred Valley Sanctuary"
          class="panel-image"
          loading="eager"
          decoding="async"
          fetchpriority="high"
        />
        <div class="hero-text">
          <h1 class="hero-title">Return to the Rhythm of Earth.</h1>
          <p class="hero-subtitle">Ayni is the sacred balance of giving and receiving. Leave behind the noise of the modern world and remember the harmony that already lives within you.</p>
        </div>

        <div class="social-icons">
          <a href="#" class="social-link" aria-label="Instagram">
            <iconify-icon icon="mdi:instagram"></iconify-icon>
          </a>
          <a href="#" class="social-link" aria-label="Facebook">
            <iconify-icon icon="eva:facebook-outline"></iconify-icon>
          </a>
          <a href="#" class="social-link" aria-label="Twitter">
            <iconify-icon icon="eva:twitter-outline"></iconify-icon>
          </a>
        </div>
      </div>

      <div class="panel">
        <!-- WelcomePanel subscribes to the scroll driver directly — no prop
             plumbing, so scroll frames never trigger a framework re-render. -->
        <WelcomePanel />
      </div>

      <div class="panel panel-third">
        <div class="placeholder-content">
          <span class="placeholder-text">Third Section</span>
        </div>
      </div>
    </div>
  </div>
</section>

{#if showDebug}
  <ScrollDebug />
{/if}

<!-- Vertical journey. Below the horizontal cinematic opener the story
     turns vertical: Offer (the sanctuary's ceremonies) then Join (retreats
     plus journal). The vertical sections are static; the horizontal strip
     above is the only scrubbed choreography. See
     docs/research/sanctuary-offerings-landing/research.md. -->
<OfferingsSection />
<RetreatsSection />
<JournalStrip />

<style>
  /* 450vh = 350vh of scrollable runway. The extra length is deliberate:
   * every scrub window in section 2 is a fraction of this distance, so
   * the container height is the master tempo control for the reveals. */
  .scroll-container {
    height: 450vh;
    position: relative;
    margin-top: -60px;
  }

  .panels {
    display: flex;
    width: 300vw;
    height: 100%;
    will-change: transform;
  }

  .scroll-wrapper {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
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

  .panel-third {
    background-color: #EADBC0 !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .placeholder-content {
    text-align: center;
  }

  .placeholder-text {
    font-family: var(--font-display);
    font-size: var(--text-h2);
    color: var(--text-3);
  }

  .social-icons {
    position: absolute;
    bottom: 24px;
    right: 24px;
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

  .social-link iconify-icon {
    font-size: 32px;
    /* no filter — shadows removed per design direction */
  }

</style>
