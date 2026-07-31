<script lang="ts">
  /**
   * OfferingsSection, Section A of the vertical journey ("Offer").
   * The sanctuary's anchoring ceremonies as an asymmetric editorial grid:
   * one large ceremony image as ceremony on the left, a quiet list of
   * OfferingRow blocks on the right. Names and tags are placeholders until
   * copy is finalised. See docs/research/sanctuary-offerings-landing.
   *
   * Imagery contract: every offering can carry its own `image`. When an
   * offering omits one, the shared default placeholder (DEFAULT_IMAGE) shows
   * instead, so the frame is never empty. Swap the placeholder for real
   * photography by replacing the files or the DEFAULT_IMAGE paths.
   */
  import OfferingRow from './OfferingRow.svelte';

  /** Default ceremony image used when an offering has no dedicated photo.
   *  Same frame treatment as the hero and welcome bungalow; no drop shadows. */
  const DEFAULT_IMAGE = {
    src: '/images/offering-temazcal.webp',
    srcset:
      '/images/offering-temazcal-768.webp 768w, /images/offering-temazcal-1280.webp 1280w, /images/offering-temazcal.webp 1920w',
    width: 1920,
    height: 1280,
    alt: 'Warm evening light over the ceremony space at Ayni Sanctuary, Sacred Valley',
  };

  const offerings = [
    {
      title: 'Category One',
      blurb: 'A quiet line of description for this offering, to be replaced.',
      hue: 'var(--clay)',
      tag: 'Coming soon',
    },
    {
      title: 'Category Two',
      blurb: 'A quiet line of description for this offering, to be replaced.',
      hue: 'var(--gold)',
      tag: 'Coming soon',
    },
    {
      title: 'Category Three',
      blurb: 'A quiet line of description for this offering, to be replaced.',
      hue: 'var(--sage)',
      tag: 'Coming soon',
    },
  ];
</script>

<section class="offerings">
  <span class="natural-accent accent-blob" data-tint="clay" aria-hidden="true"></span>
  <span class="natural-accent accent-contour accent-contour-br" aria-hidden="true"><i></i><i></i></span>
  <div class="offerings-inner">
    <div class="section-head eyebrow">
      <span>The Sanctuary</span>
    </div>

    <h2 class="heading-2 offerings-headline">Days shaped by the land.</h2>
    <p class="lead offerings-lead">
      Ayni holds space for a small number of ceremonies and retreats, guided by
      the rhythms of the Sacred Valley.
    </p>

    <div class="offerings-grid">
      <figure class="entry-media offerings-figure">
        <div class="entry-media-frame">
          <img
            src={DEFAULT_IMAGE.src}
            srcset={DEFAULT_IMAGE.srcset}
            sizes="(max-width: 900px) 90vw, 40vw"
            width={DEFAULT_IMAGE.width}
            height={DEFAULT_IMAGE.height}
            alt={DEFAULT_IMAGE.alt}
            loading="lazy"
            decoding="async"
          />
        </div>
      </figure>

      <div class="offerings-list" role="list">
        {#each offerings as offering (offering.title)}
          <OfferingRow
            title={offering.title}
            blurb={offering.blurb}
            hue={offering.hue}
            tag={offering.tag}
          />
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  .offerings {
    position: relative;
    overflow: hidden;
    background: var(--surface-1);
    padding: clamp(64px, 12vh, 120px) clamp(24px, 5vw, 80px);
  }

  .offerings-inner {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin-inline: auto;
  }

  /* Organic accents: the blob sits behind the figure as warm light, the
   * terrace contour anchors the lower-right. Decorative, hidden on mobile. */
  .offerings .accent-blob {
    top: calc(-1 * var(--spacing-s-5));
    left: calc(-1 * var(--spacing-s-6));
    background: var(--clay-t);
  }
  .offerings .accent-contour-br {
    bottom: calc(-1 * var(--spacing-s-6));
    right: 6%;
  }

  .section-head {
    margin-bottom: var(--spacing-s-5);
  }

  .offerings-headline {
    font-weight: var(--weight-light);
    margin: 0;
    max-width: 20ch;
  }

  .offerings-lead {
    margin: var(--spacing-s-4) 0 0;
    max-width: 46ch;
  }

  .offerings-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    gap: clamp(40px, 6vw, 96px);
    align-items: center;
    margin-top: var(--spacing-s-7);
  }

  .offerings-figure {
    align-self: center;
  }

  .offerings-list {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  @media (max-width: 900px) {
    .offerings-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-s-7);
    }
  }
</style>
