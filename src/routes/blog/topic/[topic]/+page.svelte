<script lang="ts">
  /**
   * A pillar page.
   *
   * Right now this is an index with a standfirst. That is the structure
   * working — every post in the cluster links here and this links back to all
   * of them, which is what compounds. It becomes a ranking asset the day
   * someone writes real evergreen copy into `intro` in src/content/topics.js.
   */
  import JournalCard from '$lib/components/JournalCard.svelte';
  import Seo from '$lib/seo/Seo.svelte';
  import { breadcrumbs, itemList, organization, website } from '$lib/seo/jsonld';
  import { t, DEFAULT_LOCALE } from '$lib/i18n';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  /**
   * Copy for this page. The topic's own title, intro and label are CONTENT,
   * not interface — they live in src/content/topics.js and stay there.
   */
  const m = $derived(t(DEFAULT_LOCALE).blog);
</script>

<Seo
  title={data.topic.title}
  description={data.topic.description}
  path="/blog/topic/{data.topic.slug}"
  image={data.posts[0]?.coverImage?.fallback}
  jsonLd={[
    organization(),
    website(),
    itemList(data.posts, data.topic.title),
    breadcrumbs([
      [m.crumbs.home, '/'],
      [m.crumbs.journal, '/blog'],
      [data.topic.title, `/blog/topic/${data.topic.slug}`]
    ])
  ]}
/>

<main class="topic-page" id="main">
  <header class="topic-head">
    <nav class="crumbs" aria-label={m.crumbs.label}>
      <a href="/blog">{m.crumbs.journal}</a>
      <span aria-hidden="true">/</span>
      <span>{data.topic.label}</span>
    </nav>

    <h1 class="heading-1 topic-title">{data.topic.title}</h1>
    <p class="lead topic-intro">{data.topic.intro}</p>
  </header>

  {#if data.posts.length > 0}
    <ul class="post-grid" role="list">
      {#each data.posts as post (post.slug)}
        <li class="post-item"><JournalCard {post} /></li>
      {/each}
    </ul>
  {:else}
    <p class="empty">
      {m.topic.empty.before} <a href="/blog">{m.topic.empty.link}</a>
      {m.topic.empty.after}
    </p>
  {/if}
</main>

<style>
  .topic-page {
    max-width: 1200px;
    margin-inline: auto;
    /* Page shell tokens — see tokens.css; every subpage uses the same. */
    padding: var(--page-top) var(--page-x) var(--page-bottom);
  }

  .topic-head {
    max-width: 62ch;
    margin-bottom: clamp(40px, 6vh, 64px);
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

  .topic-title {
    margin: var(--spacing-s-4) 0 var(--spacing-s-5);
    font-size: min(var(--text-h1), 11vw);
  }

  .topic-intro {
    margin: 0;
  }

  .post-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--spacing-s-6);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .post-item {
    min-width: 0;
    display: flex;
  }

  .empty {
    max-width: 48ch;
    color: var(--text-2);
    line-height: var(--leading-loose);
  }

  .empty a {
    color: var(--text);
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  @media (max-width: 1000px) {
    .post-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 700px) {
    .post-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-s-5);
    }
  }
</style>
