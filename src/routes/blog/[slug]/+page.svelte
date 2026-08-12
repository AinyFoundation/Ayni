<script lang="ts">
  import { onMount } from 'svelte';
  /**
   * One post.
   *
   * The reading column is the whole design. No scroll-driven motion here —
   * on the homepage the scroll IS the interaction, but in an article the
   * reading is, and anything that moves competes with it.
   */
  import JournalCard from '$lib/components/JournalCard.svelte';
  import Seo from '$lib/seo/Seo.svelte';
  import { SITE } from '$lib/seo/site';
  import { blogEntry } from '$lib/blogNav.svelte';
  import { blogPosting, breadcrumbs, organization, website } from '$lib/seo/jsonld';
  import { absolute } from '$lib/seo/site';
  import { formatDate, formatReadingTime } from '$lib/blog/format';
  import { t, DEFAULT_LOCALE } from '$lib/i18n';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  /** Copy for this page. `$derived` so it survives the locale becoming dynamic. */
  const m = $derived(t(DEFAULT_LOCALE).blog);

  const post = $derived(data.post);
  const cover = $derived(post.coverImage);
  /** The rail is noise on a short post; three sections is where it starts helping. */
  const showToc = $derived(data.headings.length >= 3);
  const ogImage = $derived(data.ogImage ?? SITE.defaultOgImage);

  /** Scroll-spy: which heading is currently in view. */
  let activeId = $state('');

  onMount(() => {
    if (!showToc) return;

    const headings = data.headings
      .map((h) => document.getElementById(h.id))
      .filter((h): h is HTMLElement => h !== null);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first heading that's intersecting
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeId = entry.target.id;
            return;
          }
        }
      },
      {
        // Trigger when heading hits top 20% of viewport
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    );

    for (const h of headings) {
      observer.observe(h);
    }

    return () => observer.disconnect();
  });
</script>

<Seo
  title={post.title}
  description={post.description}
  path={post.href}
  image={ogImage}
  imageAlt={post.coverAlt ?? post.title}
  type="article"
  publishedTime={post.date}
  modifiedTime={post.lastmod}
  jsonLd={[
    organization(),
    website(),
    blogPosting(post, absolute(ogImage)),
    breadcrumbs([
      [m.crumbs.home, '/'],
      [m.crumbs.journal, '/blog'],
      [post.topicLabel, post.topicHref],
      [post.title, post.href]
    ])
  ]}
/>

<main class="post" id="main">
  <article>
    <header class="post-head">
      <nav class="crumbs" aria-label={m.crumbs.label}>
        {#if blogEntry.from === 'home'}
          <!-- Arrived from the homepage's journal strip: back returns to the
               homepage itself, not the journal list. history.back() replays
               the saved scroll position, so they land exactly where they
               were. A fresh load inferred home from the referrer but has no
               in-site history to replay, so it links instead. -->
          {#if blogEntry.viaSpa}
            <button class="crumb-back" type="button" onclick={() => history.back()}>← {m.crumbs.back}</button>
          {:else}
            <a href="/">← {m.crumbs.home}</a>
          {/if}
        {:else}
          <a href="/blog">← {m.crumbs.journal}</a>
          <span aria-hidden="true">/</span>
          <a href={post.topicHref}>{post.topicLabel}</a>
        {/if}
      </nav>

      <h1 class="heading-1 post-title">{post.title}</h1>
      <p class="lead post-standfirst">{post.description}</p>

      <p class="post-meta">
        <time datetime={post.date}>{formatDate(post.date)}</time>
        {#if post.updated}
          <span aria-hidden="true">·</span>
          <span>{m.post.updated(formatDate(post.updated))}</span>
        {/if}
        <span aria-hidden="true">·</span>
        <span>{formatReadingTime(post.readingMinutes)}</span>
        {#if data.author}
          <span aria-hidden="true">·</span>
          <span>{data.author.name}</span>
        {/if}
      </p>
    </header>

    {#if cover}
      <!-- The ceremony frame from components.css: clay corner, hairline
           border, tinted ground. Eager and high priority because on a post
           with a cover this is always the LCP element. -->
      <div class="entry-media post-cover">
        <figure class="entry-media-frame">
          <picture>
            <source type="image/avif" srcset={cover.avif} sizes="(min-width: 1000px) 900px, 100vw" />
            <source type="image/webp" srcset={cover.webp} sizes="(min-width: 1000px) 900px, 100vw" />
            <img
              src={cover.fallback}
              alt={cover.alt}
              width={cover.width}
              height={cover.height}
              fetchpriority="high"
              decoding="async"
              style="background-image:url({cover.lqip});background-size:cover"
            />
          </picture>
        </figure>
      </div>
    {/if}

    <div class="post-body" class:has-toc={showToc}>
      {#if showToc}
        <nav class="toc" aria-label={m.post.toc}>
          <p class="toc-title eyebrow">{m.post.toc}</p>
          <ul role="list">
            {#each data.headings as heading (heading.id)}
              <li class:active={activeId === heading.id}>
                <a href="#{heading.id}">{heading.text}</a>
              </li>
            {/each}
          </ul>
        </nav>
      {/if}

      <!-- Built by unified at prerender time in +page.server.ts. The markdown
           toolchain never reaches the browser. -->
      <div class="prose">{@html data.html}</div>
    </div>

    <footer class="post-foot">
      {#if data.cta}
        <!-- Rendered only when the destination is a route that exists.
             ctaFor() returns null otherwise; a dead call to action is worse
             than none. -->
        <aside class="cta-card">
          <p class="cta-blurb">{data.cta.blurb}</p>
          <a class="cta-link" href={data.cta.href}>{data.cta.label} →</a>
        </aside>
      {/if}

      <p class="foot-topic">
        {m.post.filedUnder} <a href={post.topicHref}>{post.topicLabel}</a>.
        {#if post.tags.length > 0}
          <span class="tags">{post.tags.join(' · ')}</span>
        {/if}
      </p>

      {#if data.author?.bio}
        <p class="foot-author">{data.author.bio}</p>
      {/if}
    </footer>
  </article>

  {#if data.related.length > 0}
    <section class="related" aria-labelledby="related-heading">
      <h2 id="related-heading" class="heading-4 related-title">{m.post.readNext}</h2>
      <ul class="related-grid" role="list">
        {#each data.related as related (related.slug)}
          <li class="related-item"><JournalCard post={related} /></li>
        {/each}
      </ul>
    </section>
  {/if}
</main>

<style>
  .post {
    max-width: 1440px;
    margin-inline: auto;
    /* Tighter top padding than the token — the navbar already provides air. */
    padding: clamp(24px, 4vh, 48px) var(--page-x) var(--page-bottom);
  }

  .post-head {
    max-width: min(1040px, 100%);
    margin-inline: auto;
  }

  .crumbs {
    display: flex;
    align-items: center;
    gap: var(--spacing-s-2);
    font-size: var(--text-xs);
    font-weight: var(--weight-med);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--text-3);
  }

  .crumbs a {
    color: inherit;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color var(--duration-quick) var(--ease);
  }

  .crumbs a:hover {
    border-bottom-color: var(--clay);
  }

  /* The history-back variant for home entrants: a button dressed exactly
   * like the breadcrumb links. */
  .crumb-back {
    color: inherit;
    background: none;
    border: none;
    border-bottom: 1px solid transparent;
    padding: 0;
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    cursor: pointer;
    transition: border-color var(--duration-quick) var(--ease);
  }

  .crumb-back:hover {
    border-bottom-color: var(--clay);
  }

  .crumb-back:focus-visible {
    outline: 2px solid var(--ring-focus);
    outline-offset: 2px;
  }

  .post-title {
    margin: var(--spacing-s-4) 0 var(--spacing-s-5);
    font-size: min(var(--text-h1), 10vw);
    text-wrap: balance;
  }

  .post-standfirst {
    margin: 0 0 var(--spacing-s-5);
  }

  .post-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-s-2);
    margin: 0;
    padding-top: var(--spacing-s-4);
    border-top: 1px solid var(--border-subtle);
    font-size: var(--text-sm);
    color: var(--text-3);
  }

  .post-cover {
    max-width: 1100px;
    margin: clamp(32px, 5vh, 56px) auto 0;
  }

  .post-cover :global(.entry-media-frame) {
    aspect-ratio: auto;
  }

  .post-cover picture,
  .post-cover img {
    display: block;
    width: 100%;
    height: auto;
  }

  .post-body {
    margin-top: clamp(40px, 6vh, 64px);
  }

  /* The rail sits beside the column only when there is room for both without
     squeezing the measure. Below that it is simply not rendered as a rail —
     the outline still precedes the text, which is where it is useful anyway. */
  .post-body.has-toc {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--spacing-s-7);
  }

  /* Three columns, not two: an empty left gutter the same width as the rail
     keeps the reading column centred on the page, so it stays aligned with the
     title and the footer above and below it. A two-column grid would shove the
     prose left by half the rail's width and break that line. */
  @media (min-width: 1280px) {
    .post-body.has-toc {
      /* Equal fractional gutters, so the middle column lands on exactly the
         same axis as .post-head and .post-foot above and below it. Fixed
         gutter widths cannot do this: they force the measure to shrink to
         whatever is left, which slides the prose off the title's line. */
      grid-template-columns: 1fr min(1040px, 100%) 1fr;
      align-items: start;
      gap: 0;
    }
    .post-body.has-toc :global(.prose) {
      grid-column: 2;
    }
    .post-body.has-toc .toc {
      grid-column: 3;
      grid-row: 1;
      margin-left: var(--spacing-s-6);
      /* Desktop: vertical sidebar, not horizontal bar */
      position: sticky;
      top: calc(60px + var(--spacing-s-5));
      background: transparent;
      border-bottom: none;
      border-left: 1px solid var(--border-subtle);
      padding: 0 0 0 var(--spacing-s-4);
      margin-bottom: 0;
    }
    .post-body.has-toc .toc ul {
      flex-direction: column;
      gap: var(--spacing-s-2);
    }
    .post-body.has-toc .toc a {
      font-size: var(--text-sm);
      border-bottom: none;
      border-left: 2px solid transparent;
      padding-left: var(--spacing-s-3);
      padding-bottom: 0;
      margin-left: calc(-1 * var(--spacing-s-3));
    }
    .post-body.has-toc .toc li.active a {
      border-left-color: var(--clay);
      border-bottom-color: transparent;
    }
  }

  .toc {
    /* Mobile: sticky horizontal bar at top */
    position: sticky;
    top: 60px;
    z-index: 10;
    background: var(--surface-1);
    padding: var(--spacing-s-3) 0;
    margin-bottom: var(--spacing-s-4);
    border-bottom: 1px solid var(--border-subtle);
  }

  .toc-title {
    margin: 0 0 var(--spacing-s-2);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-3);
  }

  .toc ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-s-2) var(--spacing-s-4);
  }

  .toc li {
    position: relative;
  }

  .toc a {
    font-size: var(--text-xs);
    line-height: var(--leading-snug);
    color: var(--text-3);
    text-decoration: none;
    transition: color var(--duration-quick) var(--ease);
    padding-bottom: 2px;
    border-bottom: 2px solid transparent;
  }

  .toc a:hover {
    color: var(--text);
  }

  .toc li.active a {
    color: var(--text);
    border-bottom-color: var(--clay);
  }

  .post-foot {
    max-width: min(1040px, 100%);
    margin: clamp(48px, 8vh, 80px) auto 0;
  }

  .cta-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s-3);
    padding: var(--spacing-s-6);
    background: var(--surface-2);
    border: 1px solid var(--border-strong);
    border-left: 2px solid var(--clay);
    border-radius: var(--radius);
  }

  .cta-blurb {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-lead);
    font-weight: var(--weight-light);
    line-height: var(--leading-snug);
    color: var(--text);
  }

  .cta-link {
    font-size: var(--text-sm);
    font-weight: var(--weight-med);
    color: var(--text);
    text-decoration: underline;
    text-underline-offset: 0.2em;
    text-decoration-color: var(--border-strong);
    transition: text-decoration-color var(--duration-quick) var(--ease);
  }

  .cta-link:hover {
    text-decoration-color: var(--clay);
  }

  .foot-topic {
    margin: var(--spacing-s-6) 0 0;
    padding-top: var(--spacing-s-5);
    border-top: 1px solid var(--border-subtle);
    font-size: var(--text-sm);
    color: var(--text-3);
  }

  .foot-topic a {
    color: var(--text-2);
    text-decoration: underline;
    text-underline-offset: 0.2em;
    text-decoration-color: var(--border-strong);
  }

  .tags {
    display: block;
    margin-top: var(--spacing-s-2);
  }

  .foot-author {
    margin: var(--spacing-s-3) 0 0;
    font-size: var(--text-sm);
    color: var(--text-3);
  }

  .related {
    margin-top: clamp(64px, 10vh, 112px);
    padding-top: clamp(32px, 5vh, 48px);
    border-top: 1px solid var(--border-subtle);
  }

  .related-title {
    margin: 0 0 var(--spacing-s-6);
    font-weight: var(--weight-light);
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--spacing-s-6);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .related-item {
    min-width: 0;
    display: flex;
  }

  .related-item :global(.journal-card) {
    background: var(--surface-2);
    border-color: var(--border-strong);
  }

  @media (max-width: 900px) {
    .related-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-s-5);
    }
  }
</style>
