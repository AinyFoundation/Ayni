<script lang="ts">
  /**
   * FeaturedOffering — the one offering a homepage category leads with.
   *
   * A badge saying which way it points ("Next ceremony" / "Last retreat"),
   * the offering's name, and its date. Whether it reads next or last is
   * decided against the READER'S clock, not the build's — see
   * `$lib/offerings/clock.svelte.ts` for why that matters on a site with no
   * server.
   *
   * Two shapes, one component. On desktop it is a compact card sitting under
   * the category blurb. On the phone the category photograph already fills
   * the band directly above it, so a thumbnail here would be the same picture
   * twice; it becomes a single full-width row instead. Neither is a modal or
   * a sheet — the offerings pin is short on height and a popup on top of a
   * scroll-scrubbed section is a fight nobody wins.
   *
   * A past offering is dimmed by ONE step and keeps its full contrast text.
   * `--color-clay` cannot carry text in either direction (see the footer
   * research), and dimming the words is how a badge quietly drops under the
   * contrast floor.
   */
  import type { Featured } from '$lib/offerings/featured';
  import { formatDateRange } from '$lib/offerings/format';
  import { t, DEFAULT_LOCALE } from '$lib/i18n';

  let { featured, hue }: { featured: Featured; hue: string } = $props();

  /* $derived, not a plain const: the locale is a property of the URL and
   * becomes dynamic in Phase 3, at which point this recomputes on its own. */
  const m = $derived(t(DEFAULT_LOCALE).offerings);

  const offering = $derived(featured.offering);
  const dates = $derived(formatDateRange(offering.dateStart, offering.dateEnd));
  const badge = $derived(
    featured.state === 'next'
      ? m.featured.next(offering.categorySingular)
      : m.featured.last(offering.categorySingular)
  );
</script>

<a
  class="featured"
  class:is-last={featured.state === 'last'}
  href={offering.href}
  style="--featured-hue: var(--{hue})"
>
  <span class="featured-badge">{badge}</span>

  <span class="featured-body">
    <span class="featured-title">{offering.title}</span>
    <time class="featured-date" datetime={offering.dateStart}>{dates}</time>
  </span>

  <span class="featured-arrow" aria-hidden="true">→</span>
</a>

<style>
  /* A hairline island on the panel's paper, marked with the category's hue on
   * its leading edge — the same accent language `.card-wing` gives the cards
   * on the index, so the two surfaces read as one system. */
  .featured {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'badge arrow'
      'body  arrow';
    align-items: center;
    column-gap: var(--spacing-s-4);
    row-gap: var(--spacing-s-1);
    max-width: 34rem;
    padding: var(--spacing-s-4) var(--spacing-s-5);
    border: 1px solid var(--border-strong);
    border-left: 3px solid var(--featured-hue);
    border-radius: var(--radius);
    background: var(--surface-1);
    color: inherit;
    text-decoration: none;
    transition:
      border-color var(--duration-quick) var(--ease),
      background var(--duration-quick) var(--ease);
  }

  .featured:hover {
    border-color: var(--color-ink-2);
    border-left-color: var(--featured-hue);
  }

  .featured:focus-visible {
    outline: 2px solid var(--ring-focus);
    outline-offset: 2px;
  }

  /* Something already finished is still worth showing — it is the proof the
   * sanctuary runs these — but it should not read as an invitation. One step
   * of ground, never dimmed text. */
  .is-last {
    background: var(--surface-2);
  }

  .featured-badge {
    grid-area: badge;
    font-size: var(--text-xs);
    font-weight: var(--weight-med);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    color: var(--text-3);
  }

  .featured-body {
    grid-area: body;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--spacing-s-1) var(--spacing-s-3);
    min-width: 0;
  }

  .featured-title {
    font-family: var(--font-display);
    font-size: var(--text-lead);
    font-weight: var(--weight-book);
    line-height: var(--leading-snug);
    color: var(--text);
  }

  .featured-date {
    font-size: var(--text-sm);
    font-weight: var(--weight-med);
    color: var(--text-2);
  }

  .featured-arrow {
    grid-area: arrow;
    font-size: var(--text-lead);
    color: var(--text-3);
    transition: transform var(--duration-quick) var(--ease);
  }

  .featured:hover .featured-arrow {
    transform: translateX(3px);
    color: var(--text);
  }

  /* Phone: the photograph is already on screen above this, so the row goes
   * full width and gives its height back to the copy band. The badge and the
   * date share a line — they are both metadata and neither needs its own. */
  /* Phone: full width, and as short as it can be while still naming the thing
   * and its date. The pin's copy band is the whole height budget here, so
   * every stop of padding this gives back is a line the blurb above keeps. */
  @media (max-width: 900px) {
    .featured {
      max-width: none;
      padding: var(--spacing-s-2) var(--spacing-s-4);
      column-gap: var(--spacing-s-3);
      row-gap: 0;
    }

    .featured-title {
      font-size: var(--text-body);
    }

    .featured-date {
      font-size: var(--text-xs);
    }
  }

  @media (pointer: coarse) {
    /* WCAG 2.5.8 floor, keyed to the pointer rather than the viewport —
     * matching the convention in components.css. */
    .featured {
      min-height: 44px;
    }
  }
</style>
