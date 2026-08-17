<script lang="ts">
  /**
   * OfferingCard — one offering, on the offerings index.
   *
   * A pointer, not a page: photograph, category, dates, title, one blurb. The
   * contact actions (WhatsApp, maps, Instagram) live on the offering's own
   * page, where there is room to label them — a row of bare icons on a grid
   * card is a guessing game, and four of them per card across a dozen cards
   * is noise.
   *
   * Built on the GLOBAL `.card` / `.card-title` / `.card-body` / `.card-wing`
   * / `.tag` / `.tag-dot` vocabulary in `components.css` rather than a bespoke
   * set. That vocabulary was written for exactly this — offering cards, per
   * `docs/research/sanctuary-offerings-landing/research.md` — and then sat
   * with zero consumers when the homepage scroller went its own way. Two
   * consequences worth knowing: the root overrides `.card`'s padding to 0 so
   * the photograph can reach the edges (the body carries the padding
   * instead), and `.card`'s hover was corrected in `components.css` to drop a
   * `translateY` that contradicted the site's no-shadow direction.
   *
   * The category accent is `.card-wing`'s left border, coloured from the
   * category registry's hue token — so a new category in
   * `src/content/offeringCategories.js` arrives with its accent already
   * wired, and the homepage scroller and this card cannot disagree about
   * which colour ceremonies are.
   */
  import type { OfferingSummary } from '$lib/offerings/types';
  import { formatDateRange } from '$lib/offerings/format';
  import { isPastNow } from '$lib/offerings/clock.svelte';
  import { t, DEFAULT_LOCALE } from '$lib/i18n';

  let { offering }: { offering: OfferingSummary } = $props();

  /* $derived, not a plain const: the locale is a property of the URL and
   * becomes dynamic in Phase 3, at which point this recomputes on its own. */
  const m = $derived(t(DEFAULT_LOCALE).offerings);
  const dates = $derived(formatDateRange(offering.dateStart, offering.dateEnd));
  /* The reader's clock, not the build's — see clock.svelte.ts. A card whose
   * date passed after the last deploy earns its "Past" mark without one. */
  const past = $derived(isPastNow(offering));
</script>

<article
  class="card card-wing offering-card"
  class:is-past={past}
  style="border-left-color: var(--{offering.categoryHue})"
>
  <a class="offering-link" href={offering.href}>
    <div class="offering-media">
      <img
        src={offering.cover.src}
        srcset={offering.cover.srcset}
        sizes="(min-width: 900px) 380px, 100vw"
        width={offering.cover.width}
        height={offering.cover.height}
        alt={offering.cover.alt}
        loading="lazy"
        decoding="async"
      />
    </div>

    <div class="offering-body">
      <p class="offering-meta">
        <span class="tag">
          <i class="tag-dot" style="background: var(--{offering.categoryHue})" aria-hidden="true"></i>
          {offering.categoryLabel}
        </span>
        {#if past}
          <span class="tag offering-past">{m.card.past}</span>
        {/if}
      </p>

      <h3 class="card-title offering-title">{offering.title}</h3>

      <!-- `datetime` carries the machine-readable start; the visible text is
           the human range, which may collapse the month or the year. -->
      <p class="offering-when">
        <time datetime={offering.dateStart}>{dates}</time>
      </p>

      <p class="card-body offering-blurb">{offering.description}</p>

      <span class="offering-cta">{m.card.cta}</span>
    </div>
  </a>
</article>

<style>
  .offering-card {
    display: flex;
    width: 100%;
    height: 100%;
    /* .card pads its contents; this card's photograph reaches the edges, so
     * the padding moves inward to .offering-body. */
    padding: 0;
    background: var(--surface-2);
    border-color: var(--border-strong);
  }

  /* A past offering stays legible — it is a record of what the sanctuary
   * does — but stops competing with what is still ahead. Applied to the
   * photograph only: dimming the text would take it under the contrast floor,
   * which is the same trap `--color-clay` set in the footer. */
  .is-past .offering-media img {
    opacity: 0.62;
  }

  /* The whole card is the link. One target, one focus ring, no nested
     interactive elements for a screen reader to announce twice. */
  .offering-link {
    display: flex;
    flex-direction: column;
    width: 100%;
    color: inherit;
    text-decoration: none;
  }

  .offering-link:focus-visible {
    outline: 2px solid var(--ring-focus);
    outline-offset: 2px;
  }

  .offering-media {
    aspect-ratio: 3 / 2;
    overflow: hidden;
  }

  .offering-media img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .offering-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: var(--spacing-s-2);
    padding: var(--spacing-s-4) var(--spacing-s-5) var(--spacing-s-5);
  }

  .offering-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-s-2);
    margin: 0;
  }

  .offering-past {
    /* No hue dot — "past" is a state, not a category, and giving it one would
     * put it in the same visual class as the thing beside it. */
    color: var(--text-3);
  }

  .offering-title {
    margin: 0;
    font-size: var(--text-lead);
    line-height: var(--leading-snug);
    color: var(--text);
  }

  .offering-when {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: var(--weight-med);
    color: var(--text-2);
  }

  .offering-blurb {
    margin: 0;
    display: -webkit-box;
    display: box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    box-orient: vertical;
    overflow: hidden;
  }

  .offering-cta {
    margin-top: auto;
    padding-top: var(--spacing-s-3);
    font-size: var(--text-sm);
    font-weight: var(--weight-med);
    color: var(--text);
  }

  .offering-cta::before {
    content: '';
    display: block;
    width: var(--spacing-s-6);
    height: 1px;
    background: var(--border-strong);
    margin-bottom: var(--spacing-s-2);
    transition: background var(--duration-quick) var(--ease);
  }

  .offering-card:hover .offering-cta::before {
    background: var(--clay);
  }
</style>
