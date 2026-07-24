<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import '../app.css';
  import NavContent from '$lib/components/NavContent.svelte';
  import { subscribeHeroScroll } from '$lib/scrollDriver';

  let { children } = $props();

  let navbarWhiteEl: HTMLElement;

  /** The hero clip only belongs to the homepage — other (site) routes keep
   * the navbar fully revealed. Match on the URL, not the route id, so route
   * groups like (site) don't matter. */
  const isHome = $derived(page.url.pathname === '/');

  // Leaving the hero page: the CSS animation drops off with the class, and
  // the JS fallback's last-written clip is reset here.
  $effect(() => {
    if (!isHome && navbarWhiteEl) {
      navbarWhiteEl.style.clipPath = 'inset(0vh 0vw 0 0 round 0px)';
    }
  });

  onMount(() => {
    // On scroll-driven-animation browsers the CSS keyframes below own the
    // clip — no listener at all. On the fallback, subscribing to the shared
    // driver (instead of a second scroll listener that parses a CSS variable
    // back out of <html>) keeps this write direct and coalesced to one frame.
    return subscribeHeroScroll((p) => {
      const rightInset = 107.5 * p;
      const topInset = 7.5 * p;
      const radius = p * 24;
      navbarWhiteEl.style.clipPath = `inset(${topInset}vh ${rightInset}vw 0 0 round ${radius}px)`;
    });
  });
</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="A seven-wing sovereign ecosystem rooted in Calca, Sacred Valley, Perú" />
  <meta name="theme-color" content="#221c14" />
  <title>Ayni Consciousness Collective</title>
</svelte:head>

<!--
  One layout, rendered twice.
  Both navbars are absolutely positioned inside a single sticky header.
  Identical box → identical layout → pixel-perfect alignment.
-->

<header class="site-header">
  <!-- Black navbar — always visible, underneath -->
  <div class="navbar navbar-black">
    <div class="header-inner">
      <NavContent>
        <img slot="logo" src="/images/branding/logo-horizontal.svg" alt="Ayni" class="logo-img" />
      </NavContent>
    </div>
  </div>

  <!-- White navbar — on top, clipped -->
  <div
    class="navbar navbar-white"
    class:on-hero={isHome}
    bind:this={navbarWhiteEl}
    style="clip-path: inset(0vh 0vw 0 0 round 0px)"
  >
    <div class="header-inner">
      <NavContent>
        <img slot="logo" src="/images/branding/logo-horizontal.svg" alt="Ayni" class="logo-img" />
      </NavContent>
    </div>
  </div>
</header>

{@render children()}

<style>
  :global(html) {
    overscroll-behavior: none;
  }

  /* ── Single sticky header ── */
  .site-header {
    position: sticky;
    top: 0;
    z-index: 1;
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
  }

  .navbar-black :global(.logo-img) {
    height: 120px;
    width: auto;
    display: block;
    margin: -30px 0;
    filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3));
  }

  /* ── White (on top) ── */
  .navbar-white {
    z-index: 1;
    color: var(--color-paper);
  }

  .navbar-white :global(.logo-img) {
    height: 120px;
    width: auto;
    display: block;
    margin: -30px 0;
    filter: invert(1) drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3));
  }

  @media (max-width: 768px) {
    .navbar-black :global(.logo-img),
    .navbar-white :global(.logo-img) {
      height: 100px;
      margin: -20px 0;
    }
  }

</style>
