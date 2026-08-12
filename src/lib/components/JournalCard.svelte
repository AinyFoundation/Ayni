<script lang="ts">
  /**
   * JournalCard — one post, used on the homepage strip, the blog index, the
   * pillar pages and the related block. One component, four surfaces.
   *
   * Two media treatments: the post's cover when it has one, and the dark ink
   * strip with the white dots when it does not. The dots were the placeholder
   * treatment and stay as the honest fallback rather than a grey box.
   *
   * Deliberately short. Three of these sit in a row under the fold, so the card
   * is a pointer, not a page: a 16/9 crop instead of 4/3, two lines of excerpt
   * instead of three, and padding one stop down throughout.
   *
   * No drop shadows, no translate on hover. The hairline darkens, nothing else.
   */
  import type { PostCard } from '$lib/blog/cards.server';
  import { formatDate, formatReadingTime } from '$lib/blog/format';
  import { navRegion } from '$lib/scrollDriver';
  import { t, DEFAULT_LOCALE } from '$lib/i18n';

  let { post }: { post: PostCard } = $props();

  /** Copy for the card. `$derived` so it survives the locale becoming dynamic. */
  const m = $derived(t(DEFAULT_LOCALE).blog);
</script>

<article class="journal-card">
  <a class="card-link" href={post.href}>
    {#if post.coverImage}
      <div class="card-media card-media-image" use:navRegion>
        <picture>
          <source type="image/avif" srcset={post.coverImage.avif} sizes="(min-width: 900px) 380px, 100vw" />
          <source type="image/webp" srcset={post.coverImage.webp} sizes="(min-width: 900px) 380px, 100vw" />
          <img
            src={post.coverImage.fallback}
            alt={post.coverImage.alt}
            width={post.coverImage.width}
            height={post.coverImage.height}
            loading="lazy"
            decoding="async"
            style="background-image:url({post.coverImage.lqip});background-size:cover"
          />
        </picture>
      </div>
    {:else}
      <div class="card-media" role="img" aria-label={m.card.media}>
        <span class="dots" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
      </div>
    {/if}

    <div class="card-body-inner">
      <p class="meta">
        <span class="cat">{post.topicLabel}</span>
        <span class="sep" aria-hidden="true">·</span>
        <time class="date" datetime={post.date}>{formatDate(post.date)}</time>
      </p>
      <h3 class="card-heading">{post.title}</h3>
      <p class="card-excerpt">{post.description}</p>
      <span class="cta">{m.card.cta} <span class="reading">· {formatReadingTime(post.readingMinutes)}</span></span>
    </div>
  </a>
</article>

<style>
  .journal-card {
    display: flex;
    width: 100%;
    height: 100%;
    min-width: 0;
    overflow: hidden;
    /* One look everywhere (landing strip, /blog, topic pages, related
     * posts): a quiet island of deeper paper on the page's surface-1,
     * framed by the strong hairline. Hover darkens the frame a step. */
    background: var(--surface-2);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    transition: border-color var(--duration-quick) var(--ease);
  }

  /* The whole card is the link. One target, one focus ring, no nested
     interactive elements for a screen reader to announce twice. */
  .card-link {
    display: flex;
    flex-direction: column;
    width: 100%;
    color: inherit;
    text-decoration: none;
  }

  .card-link:focus-visible {
    outline: 2px solid var(--ring-focus);
    outline-offset: 2px;
  }

  /* No translate on hover and no drop shadows. The frame darkens only. */
  .journal-card:hover {
    border-color: var(--color-ink-2);
  }

  /* The ink band earns its place as a mark of "no photograph yet", not as a
     block of colour, so it is only tall enough to hold the dots. */
  .card-media {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-ink);
    min-height: var(--spacing-s-8);
  }

  .card-media-image {
    display: block;
    min-height: 0;
    aspect-ratio: 21 / 9;
    overflow: hidden;
  }

  .card-media-image picture,
  .card-media-image img {
    display: block;
    width: 100%;
    height: 100%;
  }

  .card-media-image img {
    object-fit: cover;
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
    gap: var(--spacing-s-1);
    padding: var(--spacing-s-3) var(--spacing-s-4) var(--spacing-s-4);
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
    height: var(--spacing-s-4);
    flex-shrink: 0;
    border-radius: var(--radius-full);
    background: var(--clay);
    opacity: 0.9;
  }

  .sep { opacity: 0.5; }

  .card-heading {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-lead);
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
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    box-orient: vertical;
    overflow: hidden;
  }

  .cta {
    margin-top: auto;
    padding-top: var(--spacing-s-2);
    font-size: var(--text-sm);
    font-weight: var(--weight-med);
    color: var(--text);
  }

  .cta::before {
    content: '';
    display: block;
    width: var(--spacing-s-6);
    height: 1px;
    background: var(--border-strong);
    margin-bottom: var(--spacing-s-2);
    transition: background var(--duration-quick) var(--ease);
  }

  .journal-card:hover .cta::before {
    background: var(--clay);
  }

  .reading {
    font-weight: var(--weight-book);
    color: var(--text-3);
  }
</style>
