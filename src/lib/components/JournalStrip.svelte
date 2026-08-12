<script lang="ts">
  /**
   * JournalStrip — Section C of the vertical journey ("Join", part 2).
   *
   * Shows the three newest published posts, loaded by src/routes/+page.server.ts
   * and resolved to cards there. The static placeholder array this component
   * used to carry is gone: the seam it described is now connected.
   *
   * With no posts yet it does not render an empty grid — it says so, and still
   * offers the way through to /blog.
   */
  import JournalCard from './JournalCard.svelte';
  import type { PostCard } from '$lib/blog/cards.server';
  import { t, DEFAULT_LOCALE } from '$lib/i18n';

  let { posts = [] }: { posts?: PostCard[] } = $props();

  /** Copy for the strip. `$derived` so it survives the locale becoming dynamic. */
  const m = $derived(t(DEFAULT_LOCALE).blog);
</script>

<section class="journal" data-nav-bg="#F1E7D4" aria-labelledby="journal-heading">
  <span class="natural-accent accent-contour accent-contour-bl" aria-hidden="true"><i></i><i></i></span>
  <div class="journal-inner">
    <div class="journal-head">
      <h2 id="journal-heading" class="heading-4 journal-title">
        {posts.length > 0 ? m.strip.headline : m.strip.headlineEmpty}
      </h2>
      <a class="journal-all" href="/blog">{m.index.all} →</a>
    </div>

    {#if posts.length > 0}
      <ul class="journal-grid" role="list">
        {#each posts as post (post.slug)}
          <li class="journal-item">
            <JournalCard {post} />
          </li>
        {/each}
      </ul>
    {:else}
      <p class="journal-empty">{m.strip.empty}</p>
    {/if}
  </div>
</section>

<style>
  .journal {
    position: relative;
    overflow: hidden;
    background: var(--surface-1);
    /* Slimmer than every other band on the page on purpose: this strip is a
     * pointer to /blog, not a destination in its own right, and it now leads
     * into the book of days rather than closing the page, so it should read
     * as a quiet header for what follows, not a full section. */
    padding: clamp(20px, 2.5vw, 32px) clamp(24px, 5vw, 80px);
  }

  .journal-inner {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin-inline: auto;
  }

  /* Organic accent: a terrace contour anchors the lower-left. Together
   * with the invitation's top-hanging contour above, the two frame the
   * invitation + journal as ONE page (the old top border between them is
   * gone for the same reason). Decorative, hidden on mobile. */
  .journal .accent-contour-bl {
    bottom: calc(-1 * var(--spacing-s-5));
    left: 5%;
  }

  .journal-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--spacing-s-5);
    margin-bottom: var(--spacing-s-4);
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

  /* Measured 24px tall — a single line of text with no box around it. */
  @media (pointer: coarse) {
    .journal-all {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
    }
  }

  /* Gutter matched to the Voices grid below it. Both bands are rows of small
     cards now, and a wider gutter here made them read as different systems. */
  .journal-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--spacing-s-4);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .journal-item {
    min-width: 0;
    display: flex;
  }

  .journal-empty {
    margin: 0;
    max-width: 48ch;
    font-size: var(--text-body);
    line-height: var(--leading-loose);
    color: var(--text-2);
  }

  @media (max-width: 900px) {
    .journal-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-s-4);
    }
    .journal-head {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-s-2);
    }
  }
</style>
