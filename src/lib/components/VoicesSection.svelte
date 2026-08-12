<script lang="ts">
  /**
   * VoicesSection — what guests said afterwards.
   *
   * Reads from reviews.json (scraped by the scrape-google-reviews skill).
   * Shows 4 selected reviews in a grid, with a "View all reviews" button
   * that opens ReviewPopup.
   *
   * INTEGRITY — read before editing this array. These are claims by real people
   * about a real business. Every entry ships from scraped data; selected reviews
   * are curated by the business owner. Do not invent guests, and do not
   * soften a real quote into a better one. Fabricated testimonials are consumer
   * deception and unlawful advertising in most jurisdictions.
   *
   * The profile photos are downloaded from Google Maps at scrape time and
   * stored locally in static/images/avatars/. No external avatar services.
   *
   * Deferred on purpose: schema.org/Review JSON-LD. Structured review markup
   * asserts machine-readable claims to search engines and should only be
   * emitted once these quotes are real and verifiable.
   */

  import ReviewPopup from './ReviewPopup.svelte';
  import { navRegion } from '$lib/scrollDriver';
  import { t, DEFAULT_LOCALE } from '$lib/i18n';

  /* $derived, not a plain const: the locale is a property of the URL and
   * becomes dynamic in Phase 3, at which point this recomputes on its own.
   *
   * Only the chrome is read from here. The reviews themselves — names, dates,
   * quotes — stay exactly as scraped, for the reason in the header above. */
  const m = $derived(t(DEFAULT_LOCALE).home.voices);

  type Review = {
    id: string;
    name: string;
    avatarLocal: string;
    rating: number;
    text: string;
    date: string;
    isLocalGuide: boolean;
    selected?: boolean;
  };

  let { reviews = [] }: { reviews: Review[] } = $props();

  /** Wing hue tokens for review cards, cycling. */
  const HUES = ['clay', 'sage', 'indigo', 'plum', 'gold', 'slate', 'sky'];

  /** Reviews selected for display (max 3 — one row on desktop). */
  let displayReviews = $derived(
    reviews.filter((r) => r.selected).slice(0, 3)
  );

  /** Fallback: if no reviews are selected, show the first 3. */
  let shownReviews = $derived(
    displayReviews.length > 0 ? displayReviews : reviews.slice(0, 3)
  );

  /** All reviews for the popup (selected first, then the rest). */
  let allSortedReviews = $derived([
    ...reviews.filter((r) => r.selected),
    ...reviews.filter((r) => !r.selected),
  ]);

  /** ReviewPopup open state. */
  let popupOpen = $state(false);

  /** Star rendering. */
  function stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
</script>

<!-- No terrace accent here on purpose: this section's generous bottom padding
     left the contour floating mid-air instead of hugging an edge, which is the
     only way it reads as quiet. Retreats and Journal keep theirs. -->
<section class="voices" aria-labelledby="voices-heading">
  <div class="voices-inner">
    <p class="section-head eyebrow voices-eyebrow">
      <span>{m.eyebrow}</span>
    </p>

    <h2 id="voices-heading" class="heading-2 voices-title">
      {m.title}
    </h2>

    {#if shownReviews.length > 0}
      <ul class="voices-grid" role="list">
        {#each shownReviews as person, i (person.id)}
          <li class="voice-item" style="--voice-hue: var(--{HUES[i % HUES.length]})">
            <figure class="voice">
              <figcaption class="voice-who">
                <img
                  class="voice-portrait"
                  use:navRegion
                  src={person.avatarLocal}
                  alt=""
                  width="96"
                  height="96"
                  loading="lazy"
                  decoding="async"
                />
                <span class="voice-id">
                  <span class="voice-name">{person.name}</span>
                  <span class="voice-detail">
                    {#if person.isLocalGuide}
                      <span class="voice-badge">{m.localGuide}</span>
                    {/if}
                    {person.date}
                  </span>
                </span>
                {#if person.rating}
                  <span class="voice-rating" aria-label={m.rating(person.rating)}>
                    {stars(person.rating)}
                  </span>
                {/if}
              </figcaption>

              <blockquote class="voice-quote">
                <p><span class="voice-mark" aria-hidden="true">{m.quoteMark}</span>{person.text}</p>
              </blockquote>
            </figure>
          </li>
        {/each}
      </ul>
    {:else}
      <!-- Placeholder state when no reviews are loaded yet -->
      <div class="voices-empty">
        <p>{m.empty}</p>
        <!-- The command is markup, not words, so the sentence around it is
             carried as the two fragments either side of it — spaces included,
             so the rendered line is unchanged. -->
        <p class="voices-empty-hint">{m.emptyHintBefore}<code>npm run scrape:reviews</code>{m.emptyHintAfter}</p>
      </div>
    {/if}

    {#if reviews.length > 0}
      <div class="voices-actions">
        <button
          class="btn btn-secondary"
          onclick={() => (popupOpen = true)}
        >
          {m.viewAll(reviews.length)}
        </button>
      </div>
    {/if}
  </div>
</section>

<ReviewPopup reviews={allSortedReviews} bind:open={popupOpen} />

<style>
  .voices {
    position: relative;
    overflow: hidden;
    background: var(--surface-1);
    /* vw rather than vh — unchanged at 108px on 1440×900, 48px instead of
     * 101px on a phone. See RetreatsSection for why height was the wrong
     * axis to measure a band's air against. */
    padding: clamp(48px, 7.5vw, 120px) clamp(24px, 5vw, 80px);
  }

  .voices-inner {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin-inline: auto;
  }

  .voices-eyebrow {
    margin-bottom: var(--spacing-s-3);
  }

  /* One stop tighter than the old s-8: the cards below are half the height they
   * were, and an 80px void above short cards read as a gap, not as air. */
  .voices-title {
    margin: 0 0 var(--spacing-s-7);
    font-weight: var(--weight-light);
    max-width: 24ch;
  }

  .voices-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--spacing-s-5);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .voice-item {
    min-width: 0;
    display: flex;
  }

  /* Same figure/ground logic as the journal cards: each quote is its own
   * island of deeper paper, so the page's rhythm carries through. */
  .voice {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0;
    padding: var(--spacing-s-5);
    background: var(--surface-2);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
  }

  .voice-who {
    display: flex;
    align-items: center;
    gap: var(--spacing-s-3);
    padding-bottom: var(--spacing-s-3);
    border-bottom: 1px solid var(--border-subtle);
  }

  /* Fixed box so a slow portrait never reflows the row, and shrink-proof so a
   * long placeholder country cannot squeeze it into an ellipse. */
  .voice-portrait {
    flex-shrink: 0;
    width: var(--spacing-s-7);
    height: var(--spacing-s-7);
    border-radius: var(--radius-full);
    /* The wing hue's only structural appearance: a ring tying the person to
     * their retreat's colour, mixed back toward the card so it reads as a
     * hairline rather than a highlighter. */
    border: 1px solid color-mix(in srgb, var(--voice-hue) 45%, var(--surface-2));
    object-fit: cover;
    background: var(--surface-2);
  }

  .voice-id {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s-1);
    min-width: 0;
    flex: 1;
  }

  .voice-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-med);
    color: var(--text);
  }

  .voice-detail {
    font-size: var(--text-xs);
    color: var(--text-3);
    line-height: var(--leading-norm);
    display: flex;
    align-items: center;
    gap: var(--spacing-s-2);
  }

  .voice-badge {
    font-size: 9px;
    padding: 1px 5px;
    border-radius: 3px;
    background: var(--surface-1);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid var(--border-subtle);
  }

  .voice-rating {
    flex-shrink: 0;
    font-size: var(--text-xs);
    color: var(--gold);
    letter-spacing: 1px;
  }

  .voice-quote {
    margin: var(--spacing-s-3) 0 0;
    flex: 1;
  }

  /* Text size, not display size. At --text-lead in the display face a three
   * line quote became the tallest thing on the page; the words are testimony,
   * not a headline. */
  .voice-quote p {
    margin: 0;
    font-size: var(--text-sm);
    line-height: var(--leading-norm);
    color: var(--text-2);
    /* The only paragraph on the page that carried no measure. Three columns
     * hide that; one column does not, and on a tablet the quote ran the full
     * width of the card at ~110 characters a line. */
    max-width: 66ch;
  }

  /* The wing accent, inline so it opens the sentence like real punctuation.
   * line-height: 0 keeps the oversized glyph from growing its line box, so the
   * mark costs the card no height at all. */
  .voice-mark {
    font-family: var(--font-display);
    font-size: var(--text-h4);
    line-height: 0;
    vertical-align: -0.05em;
    margin-right: var(--spacing-s-1);
    color: var(--voice-hue);
    opacity: 0.6;
    user-select: none;
  }

  .voices-empty {
    text-align: center;
    padding: var(--spacing-s-6) 0;
    color: var(--text-3);
  }

  .voices-empty-hint {
    margin-top: var(--spacing-s-2);
    font-size: var(--text-sm);
  }

  .voices-empty code {
    font-size: var(--text-xs);
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--surface-2);
    border: 1px solid var(--border-subtle);
  }

  .voices-actions {
    display: flex;
    justify-content: center;
    margin-top: var(--spacing-s-6);
  }

  @media (max-width: 900px) {
    .voices-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-s-4);
    }

    .voices-title {
      margin-bottom: var(--spacing-s-7);
    }
  }
</style>
