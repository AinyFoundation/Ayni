<script lang="ts">
  /**
   * JournalCard, one placeholder card in the journal strip.
   * Dark ink media top strip with the white dots icon, content body below.
   * Presentational only; renders a typed `post` object with static copy.
   *
   * Seam for /blog: swap the source of `post` (currently a static array in
   * JournalStrip.svelte) for route data when the blog is built. Markup and
   * styling below do not change. No drop shadows, hairline only.
   */

  export type JournalPost = {
    category: string;
    date: string;
    title: string;
    excerpt: string;
  };

  let { post }: { post: JournalPost } = $props();
</script>

<article class="journal-card">
  <div class="card-media" role="img" aria-label="Ayni Sanctuary journal">
    <span class="dots" aria-hidden="true">
      <i></i><i></i><i></i>
    </span>
  </div>

  <div class="card-body-inner">
    <p class="meta">
      <span class="cat">{post.category}</span>
      <span class="sep" aria-hidden="true">·</span>
      <time class="date">{post.date}</time>
    </p>
    <h3 class="card-heading">{post.title}</h3>
    <p class="card-excerpt">{post.excerpt}</p>
    <span class="cta">Read this note</span>
  </div>
</article>

<style>
  .journal-card {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-width: 0;
    overflow: hidden;
    background: var(--color-card-bg-on-2);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    cursor: pointer;
    transition: border-color var(--duration-quick) var(--ease);
  }

  /* No translate on hover and no drop shadows. Hairline darkens only. */
  .journal-card:hover {
    border-color: var(--border-strong);
  }

  .card-media {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-ink);
    min-height: 112px;
  }

  .dots {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-s-2);
  }

  .dots i {
    width: 5px;
    height: 5px;
    border-radius: var(--radius-full);
    background: var(--color-paper);
  }

  .card-body-inner {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: var(--spacing-s-2);
    padding: var(--spacing-s-5) var(--spacing-s-6) var(--spacing-s-6);
  }

  .meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-s-2);
    margin: 0;
    font-size: var(--text-xs);
    font-weight: var(--weight-med);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--text-3);
  }

  .cat {
    display: flex;
    align-items: center;
    gap: var(--spacing-s-2);
  }

  .cat::before {
    content: '';
    width: 2px;
    height: 22px;
    flex-shrink: 0;
    border-radius: var(--radius-full);
    background: var(--clay);
    opacity: 0.9;
  }

  .sep { opacity: 0.5; }

  .card-heading {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-h4);
    font-weight: var(--weight-book);
    line-height: var(--leading-snug);
    color: var(--text);
  }

  .card-excerpt {
    margin: 0;
    font-size: var(--text-sm);
    line-height: var(--leading-norm);
    color: var(--text-2);
    display: -webkit-box;
    display: box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    box-orient: vertical;
    overflow: hidden;
  }

  .cta {
    margin-top: auto;
    font-size: var(--text-sm);
    font-weight: var(--weight-med);
    color: var(--text);
    text-decoration: underline;
    text-underline-offset: 0.2em;
    text-decoration-color: var(--border-strong);
    transition: text-decoration-color var(--duration-quick) var(--ease);
  }

  .journal-card:hover .cta {
    text-decoration-color: var(--text);
  }
</style>
