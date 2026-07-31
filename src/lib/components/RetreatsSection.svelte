<script lang="ts">
  /**
   * RetreatsSection, Section B of the vertical journey ("Join", part 1).
   * A generous, centered invitation on paper-bright, opened by the seven-hue
   * rainbow lineage as a thread and framed by two subtle organic accents.
   * Two hairline CTAs: find a retreat, or stay with us. No em dashes, no
   * animations; content is visible immediately.
   * See docs/research/sanctuary-offerings-landing.
   */

  /** Destinations for the calls to action. Deferred routes, swap freely. */
  export const findRetreatHref = '/retreats';
  export const stayHref = '/stay';
</script>

<section class="retreats" aria-labelledby="retreats-heading">
  <hr class="rainbow-line retreats-rule" aria-hidden="true" />
  <span class="natural-accent accent-contour accent-contour-bl" aria-hidden="true"><i></i><i></i></span>
  <span class="natural-accent accent-blob accent-blob-er" aria-hidden="true"></span>

  <div class="retreats-inner">
    <p class="section-head eyebrow retreats-eyebrow">
      <span>Come to the Valley</span>
    </p>

    <h2 id="retreats-heading" class="display retreats-headline">
      Sit with us, for a while.
    </h2>

    <p class="body-text retreats-body">
      We open the valley for a small number of retreats each season; ceremonies,
      good food, and long quiet days on the land.
    </p>

    <div class="retreats-ctas">
      <a class="btn btn-secondary btn-lg" href={findRetreatHref}>Find a retreat</a>
      <a class="btn btn-secondary btn-lg" href={stayHref}>Stay with us</a>
    </div>

    <p class="small retreats-note">Small groups, kept personal.</p>
  </div>
</section>

<style>
  .retreats {
    position: relative;
    overflow: hidden;
    background: var(--surface-2);
  }

  .retreats-rule {
    margin: 0;
    position: relative;
    z-index: 1;
  }

  .retreats-inner {
    position: relative;
    z-index: 1;
    max-width: 880px;
    margin-inline: auto;
    padding: clamp(96px, 20vh, 200px) clamp(24px, 5vw, 80px);
    text-align: center;
  }

  .retreats-headline {
    font-size: var(--text-display);
    font-weight: var(--weight-light);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-display);
    margin: 0;
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

  /* Organic accents: a terrace contour anchors the lower-left, a soft warm
   * wash rises on the right. Decorative, hidden on mobile. */
  .retreats .accent-contour-bl {
    bottom: calc(-1 * var(--spacing-s-5));
    left: 5%;
  }
  .retreats .accent-blob-er {
    top: 8%;
    right: calc(-1 * var(--spacing-s-6));
    background: var(--clay-t);
  }

  @media (max-width: 900px) {
    .retreats-inner { padding: var(--spacing-s-8) clamp(24px, 6vw, 48px); }
    .retreats-headline { font-size: var(--text-h1); }
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
