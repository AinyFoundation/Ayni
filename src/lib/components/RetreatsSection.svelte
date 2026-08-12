<script lang="ts">
  /**
   * RetreatsSection, Section B of the vertical journey ("Join", part 1).
   * A generous, centered invitation on paper-bright, opened by the seven-hue
   * rainbow lineage as a thread and framed by two subtle organic accents.
   * Two hairline CTAs: find a retreat, or stay with us. No em dashes, no
   * animations; content is visible immediately.
   * See docs/research/sanctuary-offerings-landing.
   */

  import { t, DEFAULT_LOCALE } from '$lib/i18n';

  /* $derived, not a plain const: the locale is a property of the URL and
   * becomes dynamic in Phase 3, at which point this recomputes on its own. */
  const m = $derived(t(DEFAULT_LOCALE).home.retreats);

  /** Destinations for the calls to action. Deferred routes, swap freely. */
  export const findRetreatHref = '/retreats';
  export const stayHref = '/stay';
</script>

<!-- The rainbow-line rule that used to open this section was replaced by
     the PatternDivider seam rendered above it in +page.svelte. -->
<section class="retreats" id="retreats" aria-labelledby="retreats-heading">
  <span class="natural-accent accent-contour accent-contour-tr" aria-hidden="true"><i></i><i></i></span>

  <div class="retreats-inner">
    <h2 id="retreats-heading" class="display retreats-headline">
      {m.headline}
    </h2>

    <p class="body-text retreats-body">
      {m.body}
    </p>

    <div class="retreats-ctas">
      <a class="btn btn-secondary btn-lg" href={findRetreatHref}>{m.findRetreat}</a>
      <a class="btn btn-secondary btn-lg" href={stayHref}>{m.stay}</a>
    </div>

    <p class="small retreats-note">{m.note}</p>
  </div>
</section>

<style>
  .retreats {
    position: relative;
    overflow: hidden;
    background: var(--surface-1);
    /* Cleared for the sticky header when the nav jumps to /#retreats. */
    scroll-margin-top: 60px;
  }

  .retreats-inner {
    position: relative;
    z-index: 1;
    max-width: 880px;
    margin-inline: auto;
    /* Reduced from 12.5vw (200px cap) — the invitation is short enough
     * that the old air dwarfed the content. 6vw gives ~86px on 1440, ~53px
     * on 390, and a 96px cap from 1600px up — generous but not cavernous. */
    padding: clamp(40px, 6vw, 96px) clamp(24px, 5vw, 80px);
    text-align: center;
  }

  /* 6vw is what min(--text-display, 6vw) always resolved to — the token only
   * wins above ~8000px — and it is also what keeps the invitation on one
   * line: the line is ~8.5em wide against an 880px measure, so tying size to
   * the viewport makes the two track each other at every desktop width.
   *
   * The floor is the new part. Below ~600px 6vw would take the headline under
   * the body copy it introduces, so it stops at the scale's own display
   * floor. (The old rule instead JUMPED to --text-h1 at 900px, which is how a
   * sixteen-character invitation ended up at 64px and eleven characters
   * per line on a phone.) */
  .retreats-headline {
    font-size: clamp(2.25rem, 6vw, var(--text-display));
    font-weight: var(--weight-light);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-display);
    margin: 0;
  }

  /* nowrap only while the vw term is driving. Once the size stops tracking
   * the viewport the box keeps shrinking under a fixed line, and nowrap
   * would push it off a 320px screen rather than wrap it. */
  @media (min-width: 601px) {
    .retreats-headline {
      white-space: nowrap;
    }
  }

  .retreats-body {
    max-width: 46ch;
    margin: var(--spacing-s-6) auto 0;
    font-size: var(--text-lead);
  }

  .retreats-ctas {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--spacing-s-4);
    margin-top: var(--spacing-s-7);
  }

  .retreats-note {
    margin: var(--spacing-s-6) auto 0;
    max-width: 50ch;
    opacity: 0.8;
  }

  /* Organic accent: a terrace contour hangs from the top edge. Together
   * with the journal's bottom-left contour below, the two frame the
   * invitation + journal as ONE page (they share --surface-1 now) instead
   * of decorating their join. Decorative, hidden on mobile. */
  .retreats .accent-contour-tr {
    top: calc(-1 * var(--spacing-s-4));
    right: 7%;
    transform: scaleY(-1);
  }

  @media (max-width: 520px) {
    .retreats-ctas {
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-s-3);
    }
    .retreats-ctas .btn {
      width: 100%;
      max-width: 320px;
    }
  }
</style>
