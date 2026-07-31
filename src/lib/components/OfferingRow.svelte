<script lang="ts">
  /**
   * OfferingRow — one offering in the Sanctuary Experience grid.
   * A quiet hairline block, not a card: ink title, one-line body, and a
   * single wing accent dash. Part of the asymmetric editorial layout in
   * OfferingsSection.svelte. Static and fully visible (no reveal animation
   * per the vertical sections' no-animation direction).
   */
  let {
    title,
    blurb,
    hue = 'var(--clay)',
    tag,
  }: {
    title: string;
    blurb: string;
    /** Wing accent token for the leading dash. One hue per offering. */
    hue?: string;
    /** Optional quiet qualifier shown as a hairline tag to the right. */
    tag?: string;
  } = $props();
</script>

<div class="offering">
  <span class="dash" style="background: {hue}" aria-hidden="true"></span>
  <div class="offering-copy">
    <h3 class="offering-title">{title}</h3>
    <p class="offering-blurb">{blurb}</p>
  </div>
  {#if tag}
    <span class="offering-tag">{tag}</span>
  {/if}
</div>

<style>
  .offering {
    position: relative;
    display: flex;
    align-items: baseline;
    gap: var(--spacing-s-4);
    padding: var(--spacing-s-5) 0;
    border-bottom: 1px solid var(--border-subtle);
  }

  .offering:last-child {
    border-bottom: none;
  }

  .dash {
    flex-shrink: 0;
    width: var(--spacing-s-6);
    height: 3px;
    border-radius: 2px;
    transform: translateY(-3px);
  }

  .offering-copy {
    flex: 1;
    min-width: 0;
  }

  .offering-title {
    display: inline;
    font-family: var(--font-display);
    font-size: var(--text-h4);
    font-weight: var(--weight-book);
    line-height: var(--leading-snug);
    color: var(--text);
    margin: 0;
  }

  .offering-blurb {
    margin: var(--spacing-s-2) 0 0;
    font-size: var(--text-body);
    line-height: var(--leading-norm);
    color: var(--text-2);
    max-width: 40ch;
  }

  .offering-tag {
    flex-shrink: 0;
    margin-left: auto;
    padding-left: var(--spacing-s-4);
    font-size: var(--text-xs);
    font-weight: var(--weight-med);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--text-3);
  }
</style>
