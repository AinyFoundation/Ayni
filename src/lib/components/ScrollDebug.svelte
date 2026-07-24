<script lang="ts">
  /**
   * ScrollDebug — dev-only motion HUD.
   *
   * Mounted when the URL contains ?debug (see +page.svelte). Shows the
   * live state of the scroll machinery so choreography issues can be
   * diagnosed in any real browser at a glance:
   *
   *   hero p     eased progress the driver is emitting (0 → 1)
   *   scrollY    window scroll position
   *   section 2  armed = hidden states live · IS-IN = reveal fired
   *   env        reduced-motion flag · css scroll-driven support
   *
   * Reads once per driver emit, writes textContent directly — no reactive
   * churn, same discipline as the rest of the scroll architecture.
   */
  import { onMount } from 'svelte';
  import { subscribeHeroScroll, cssScrollDriven } from '$lib/scrollDriver';

  let elP: HTMLElement;
  let elScroll: HTMLElement;
  let elState: HTMLElement;

  let reduced = $state(false);

  onMount(() => {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return subscribeHeroScroll((p) => {
      elP.textContent = p.toFixed(3);
      elScroll.textContent = `${Math.round(window.scrollY)}px`;
      const cls = document.querySelector('.welcome')?.classList;
      const armed = cls?.contains('is-armed') ?? false;
      const isIn = cls?.contains('is-in') ?? false;
      elState.textContent = `${armed ? 'armed' : 'UNARMED'} · ${isIn ? 'IS-IN' : 'hidden'}`;
    });
  });
</script>

<div class="scroll-debug" aria-hidden="true">
  <span class="label">hero p</span>
  <span class="val" bind:this={elP}>—</span>
  <span class="label">scrollY</span>
  <span class="val" bind:this={elScroll}>—</span>
  <span class="label">section 2</span>
  <span class="val" bind:this={elState}>—</span>
  <span class="label">env</span>
  <span class="val">{reduced ? 'REDUCED-MOTION ⚠' : 'motion ok'} · {cssScrollDriven ? 'css-sda' : 'js driver'}</span>
</div>

<style>
  .scroll-debug {
    position: fixed;
    left: 12px;
    bottom: 12px;
    z-index: 999;
    display: grid;
    grid-template-columns: auto auto;
    gap: 2px 14px;
    align-items: baseline;
    padding: 8px 12px;
    border-radius: 6px;
    background: rgba(20, 16, 10, 0.88);
    color: #b8e986;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.7;
    pointer-events: none;
  }
  .label {
    color: #8a8271;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .val { font-weight: 600; white-space: nowrap; }
</style>
