<script lang="ts">
  /**
   * JournalStrip — Section C of the vertical journey ("Join", part 2).
   * A quiet strip of placeholder journal cards below the retreats invitation.
   * Built as pure presentation so it can later be connected to a real /blog
   * without touching this markup.
   *
   * SEAM for /blog: replace the static `posts` array below with data from the
   * `/blog` index route (or a shared content source) when the blog is built.
   * JournalCard takes a typed `post` prop — keep that prop's shape and this
   * strip is a drop-in. Nothing else here is content-specific.
   */
  import JournalCard, { type JournalPost } from './JournalCard.svelte';

  /** SEAM: static placeholder posts. Replace with real route data later. */
  const posts: JournalPost[] = [
    {
      category: 'Farm & Food',
      date: 'Forthcoming',
      title: 'The mountain feeds the table',
      excerpt:
        'Slow mornings, open fire, and food grown steps from where it is eaten. Notes on how the valley feeds the kitchen each season.',
    },
    {
      category: 'The Land',
      date: 'Forthcoming',
      title: 'Reading the valley',
      excerpt:
        'What the terraces, the weather, and the river teach us about pacing a retreat, and why the land sets the schedule here.',
    },
    {
      category: 'Ceremony',
      date: 'Forthcoming',
      title: 'What a night asks',
      excerpt:
        'On arriving as you are, sitting well, and the quiet work that happens between songs. A gentle orientation to ceremony.',
    },
  ];
</script>

<section class="journal" aria-labelledby="journal-heading">
  <span class="natural-accent accent-contour accent-contour-tr" aria-hidden="true"><i></i><i></i></span>
  <div class="journal-inner">
    <p class="section-head eyebrow journal-eyebrow">
      <span>Notes from the Valley</span>
    </p>

    <div class="journal-head">
      <h2 id="journal-heading" class="heading-4 journal-title">
        Field notes, forthcoming.
      </h2>
      <a class="journal-all" href="/blog">All journal entries →</a>
    </div>

    <ul class="journal-grid" role="list">
      {#each posts as post (post.title)}
        <li class="journal-item">
          <JournalCard {post} />
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .journal {
    position: relative;
    overflow: hidden;
    background: var(--surface-1);
    border-top: 1px solid var(--border-subtle);
    padding: clamp(48px, 8vh, 72px) clamp(24px, 5vw, 80px);
  }

  .journal-inner {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin-inline: auto;
  }

  /* Organic accent: an upside-down terrace contour hangs from the top edge,
   * decorative and quiet. Hidden on mobile. */
  .journal .accent-contour-tr {
    top: calc(-1 * var(--spacing-s-4));
    right: 7%;
    transform: scaleY(-1);
  }

  .journal-eyebrow {
    margin-bottom: var(--spacing-s-3);
  }

  .journal-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--spacing-s-5);
    margin-bottom: var(--spacing-s-6);
  }

  .journal-title {
    margin: 0;
    font-weight: var(--weight-light);
  }

  .journal-all {
    flex-shrink: 0;
    font-size: var(--text-sm);
    font-weight: var(--weight-med);
    color: var(--text-2);
    text-decoration: none;
    border-bottom: 1px solid var(--border-strong);
    padding-bottom: 1px;
    transition: color var(--duration-quick) var(--ease),
      border-color var(--duration-quick) var(--ease);
  }

  .journal-all:hover {
    color: var(--text);
    border-color: var(--text);
  }

  .journal-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--spacing-s-6);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .journal-item {
    min-width: 0;
    display: flex;
  }

  /* Cards invert on the lighter surface so each card reads as its own
     quiet island of deeper paper within the band. */
  .journal-item :global(.card.journal-card) {
    width: 100%;
    background: var(--surface-2);
    border-color: var(--border-strong);
  }

  @media (max-width: 900px) {
    .journal-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-s-5);
    }
    .journal-head {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-s-2);
    }
  }
</style>
