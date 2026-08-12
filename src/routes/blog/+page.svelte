<script lang="ts">
  import { page } from '$app/state';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import JournalCard from '$lib/components/JournalCard.svelte';
  import Seo from '$lib/seo/Seo.svelte';
  import { blog, breadcrumbs, itemList, organization, website } from '$lib/seo/jsonld';
  import { t, DEFAULT_LOCALE } from '$lib/i18n';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  /**
   * Copy for this page. `$derived` rather than a plain const so it re-reads
   * when the locale stops being a constant in Phase 3; named `m` because
   * `blog` is already the JSON-LD builder above and `t` is shadowed below.
   */
  const m = $derived(t(DEFAULT_LOCALE).blog);

  // ── URL-driven state ──────────────────────────────────────────
  // Reads from and writes to URL search params so filtered views
  // are shareable and back-button works.
  //
  // Every read is guarded by `browser`. This route is PRERENDERED, and
  // SvelteKit throws on `url.searchParams` during prerendering rather than
  // returning empty — deliberately, because a prerendered route is ONE file
  // served for every query string, so a build-time answer to "what is ?q="
  // could only ever be wrong. The unguarded reads failed the whole build with
  // "Cannot access url.searchParams on a page with prerendering enabled".
  //
  // Guarding costs nothing: the prerendered HTML is the unfiltered list, which
  // is exactly what a crawler (and a reader with no JS) should get, and the
  // filter applies on the client where the query string actually exists.

  const POSTS_PER_PAGE = 12;

  /** The query string, or nothing at all while prerendering. */
  const params = browser ? page.url.searchParams : new URLSearchParams();

  /** Current search query, synced with ?q= */
  let searchQuery = $state(params.get('q') ?? '');

  /** Current page number, synced with ?page= */
  let currentPage = $state(Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1));

  /** Active topic filter, synced with ?topic= */
  let activeTopic = $state(params.get('topic') ?? '');

  // Debounce timer for search input
  let searchTimer: ReturnType<typeof setTimeout>;

  /** Update URL params without full navigation. */
  function updateUrl() {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (activeTopic) params.set('topic', activeTopic);
    if (currentPage > 1) params.set('page', String(currentPage));

    const qs = params.toString();
    const newUrl = qs ? `/blog?${qs}` : '/blog';

    // Replace state so back-button works, but don't trigger a reload
    goto(newUrl, { replaceState: true, keepFocus: true, noScroll: true });
  }

  /** Handle search input with debounce. */
  function handleSearch(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    searchQuery = value;
    currentPage = 1; // Reset to page 1 on new search
    clearTimeout(searchTimer);
    searchTimer = setTimeout(updateUrl, 200);
  }

  /** Toggle topic filter. */
  function toggleTopic(slug: string) {
    activeTopic = activeTopic === slug ? '' : slug;
    currentPage = 1;
    updateUrl();
  }

  /** Navigate to a specific page. */
  function goToPage(pageNum: number) {
    currentPage = pageNum;
    updateUrl();
    // Scroll to top of results
    document.getElementById('post-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Clear all filters. */
  function clearFilters() {
    searchQuery = '';
    activeTopic = '';
    currentPage = 1;
    updateUrl();
  }

  // ── Derived filtered results ──────────────────────────────────

  let filteredPosts = $derived.by(() => {
    let posts = data.posts;

    // Filter by topic
    if (activeTopic) {
      posts = posts.filter((p) => p.topic === activeTopic);
    }

    // Filter by search query (match against title, description, topic)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      posts = posts.filter((p) => {
        const searchable = [
          p.title,
          p.description,
          p.topicLabel,
        ]
          .join(' ')
          .toLowerCase();
        return searchable.includes(query);
      });
    }

    return posts;
  });

  let totalPages = $derived(Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE)));

  // Clamp current page
  let safePage = $derived(Math.min(currentPage, totalPages));

  let paginatedPosts = $derived(
    filteredPosts.slice((safePage - 1) * POSTS_PER_PAGE, safePage * POSTS_PER_PAGE)
  );

  /** Page numbers to show in pagination (with ellipsis). */
  let pageNumbers = $derived.by(() => {
    const pages: (number | '...')[] = [];
    const total = totalPages;
    const current = safePage;

    if (total <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      // Always show first and last
      pages.push(1);

      if (current > 3) pages.push('...');

      // Show 2 pages around current
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (current < total - 2) pages.push('...');

      pages.push(total);
    }

    return pages;
  });

  /** Whether any filter is active. */
  let hasFilters = $derived(searchQuery.trim() !== '' || activeTopic !== '');

  // Sync state when URL changes externally (back/forward buttons)
  $effect(() => {
    const q = page.url.searchParams.get('q') ?? '';
    const t = page.url.searchParams.get('topic') ?? '';
    const p = parseInt(page.url.searchParams.get('page') ?? '1', 10) || 1;

    if (q !== searchQuery) searchQuery = q;
    if (t !== activeTopic) activeTopic = t;
    if (p !== currentPage) currentPage = p;
  });
</script>

<Seo
  title={m.index.meta.title}
  description={m.index.meta.description}
  path="/blog"
  jsonLd={[
    organization(),
    website(),
    blog(data.posts),
    itemList(data.posts, m.index.meta.title),
    breadcrumbs([
      [m.crumbs.home, '/'],
      [m.crumbs.journal, '/blog']
    ])
  ]}
/>

<main class="blog-index" id="main">
  <header class="index-head">
    <h1 class="heading-1 index-title">{m.index.title}</h1>
    <p class="lead index-lead">{m.index.lead}</p>

    <!-- Search input -->
    <div class="search-row">
      <div class="search-field">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          class="search-input"
          placeholder={m.index.search.placeholder}
          value={searchQuery}
          oninput={handleSearch}
          aria-label={m.index.search.label}
        />
        {#if searchQuery}
          <button class="search-clear" onclick={() => { searchQuery = ''; currentPage = 1; updateUrl(); }} aria-label={m.index.search.clear}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </div>
    </div>

    <!-- Topic chips -->
    {#if data.topics.length > 0}
      <nav class="topics" aria-label={m.index.topicsLabel}>
        {#each data.topics as topic (topic.slug)}
          <button
            class="topic-chip"
            class:active={activeTopic === topic.slug}
            onclick={() => toggleTopic(topic.slug)}
          >
            {topic.label}
            <span class="count">{topic.count}</span>
          </button>
        {/each}
        {#if hasFilters}
          <button class="topic-chip topic-clear" onclick={clearFilters}>
            {m.index.clearFilters}
          </button>
        {/if}
      </nav>
    {/if}
  </header>

  <!-- Results count -->
  {#if hasFilters}
    <p class="results-count">{m.index.resultsCount(filteredPosts.length)}</p>
  {/if}

  <!-- Post grid -->
  {#if paginatedPosts.length > 0}
    <ul class="post-grid" id="post-grid" role="list">
      {#each paginatedPosts as post (post.slug)}
        <li class="post-item"><JournalCard {post} /></li>
      {/each}
    </ul>
  {:else}
    <p class="empty">
      {#if hasFilters}
        {m.index.noMatches.before}
        <button class="link-button" onclick={clearFilters}>{m.index.noMatches.action}</button>.
      {:else}
        {m.index.empty}
      {/if}
    </p>
  {/if}

  <!-- Pagination -->
  {#if totalPages > 1}
    <nav class="pagination" aria-label={m.index.pagination.label}>
      <button
        class="page-btn page-prev"
        disabled={safePage <= 1}
        onclick={() => goToPage(safePage - 1)}
        aria-label={m.index.pagination.prevLabel}
      >
        ← {m.index.pagination.prev}
      </button>

      <div class="page-numbers">
        {#each pageNumbers as pageNum}
          {#if pageNum === '...'}
            <span class="page-ellipsis">…</span>
          {:else}
            <button
              class="page-num"
              class:active={pageNum === safePage}
              onclick={() => goToPage(pageNum)}
              aria-label={m.index.pagination.pageLabel(pageNum)}
              aria-current={pageNum === safePage ? 'page' : undefined}
            >
              {pageNum}
            </button>
          {/if}
        {/each}
      </div>

      <button
        class="page-btn page-next"
        disabled={safePage >= totalPages}
        onclick={() => goToPage(safePage + 1)}
        aria-label={m.index.pagination.nextLabel}
      >
        {m.index.pagination.next} →
      </button>
    </nav>
  {/if}
</main>

<style>
  .blog-index {
    max-width: 1200px;
    margin-inline: auto;
    /* Tighter top padding than the token — the navbar already provides air. */
    padding: clamp(24px, 4vh, 48px) var(--page-x) var(--page-bottom);
  }

  .index-head {
    max-width: 62ch;
    margin-bottom: clamp(28px, 4vh, 44px);
  }

  .index-title {
    margin: 0 0 var(--spacing-s-4);
    font-size: min(var(--text-h1), 11vw);
  }

  /* Kept quiet on purpose: one step below the title in size and weight,
   * not a second headline. */
  .index-lead {
    margin: 0;
    max-width: 52ch;
    font-size: var(--text-body);
    line-height: var(--leading-norm);
  }

  /* ── Search ────────────────────────────────────────────────── */

  .search-row {
    margin-top: var(--spacing-s-5);
  }

  .search-field {
    position: relative;
    max-width: 400px;
  }

  .search-icon {
    position: absolute;
    left: var(--spacing-s-3);
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: var(--text-3);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: var(--spacing-s-2) var(--spacing-s-4) var(--spacing-s-2) calc(var(--spacing-s-3) + 18px + var(--spacing-s-2));
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: var(--surface-2);
    color: var(--text);
    font-family: var(--font-text);
    font-size: var(--text-sm);
    line-height: var(--leading-norm);
    transition: border-color var(--duration-quick) var(--ease);
  }

  .search-input::placeholder {
    color: var(--text-3);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--clay);
  }

  .search-input::-webkit-search-cancel-button {
    display: none;
  }

  .search-clear {
    position: absolute;
    right: var(--spacing-s-2);
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: var(--radius-full);
    background: var(--surface-1);
    color: var(--text-3);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color var(--duration-quick) var(--ease);
  }

  .search-clear:hover {
    color: var(--text);
  }

  .search-clear svg {
    width: 14px;
    height: 14px;
  }

  /* ── Topics ────────────────────────────────────────────────── */

  .topics {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-s-3);
    margin-top: var(--spacing-s-5);
  }

  .topic-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-s-2);
    padding: var(--spacing-s-2) var(--spacing-s-4);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-full);
    font-family: var(--font-text);
    font-size: var(--text-sm);
    font-weight: var(--weight-med);
    color: var(--text-2);
    background: transparent;
    cursor: pointer;
    transition: border-color var(--duration-quick) var(--ease),
      color var(--duration-quick) var(--ease),
      background var(--duration-quick) var(--ease);
  }

  .topic-chip:hover {
    border-color: var(--clay);
    color: var(--text);
  }

  .topic-chip.active {
    border-color: var(--clay);
    background: var(--clay);
    color: var(--color-paper);
  }

  .topic-chip.active .count {
    color: var(--color-paper);
    opacity: 0.7;
  }

  .topic-clear {
    border-style: dashed;
    color: var(--text-3);
  }

  .topic-clear:hover {
    color: var(--text);
    border-color: var(--text-3);
  }

  .count {
    font-size: var(--text-xs);
    color: var(--text-3);
  }

  /* ── Results ────────────────────────────────────────────────── */

  .results-count {
    margin: 0 0 var(--spacing-s-4);
    font-size: var(--text-sm);
    color: var(--text-3);
  }

  /* ── Post grid ──────────────────────────────────────────────── */

  .post-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    /* Gutter matched to the landing strip, which shares these exact cards. */
    gap: var(--spacing-s-4);
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

  .link-button {
    background: none;
    border: none;
    padding: 0;
    color: var(--clay);
    font: inherit;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .link-button:hover {
    color: var(--text);
  }

  /* ── Pagination ─────────────────────────────────────────────── */

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-s-2);
    margin-top: var(--spacing-s-7);
    padding-top: var(--spacing-s-5);
    border-top: 1px solid var(--border-subtle);
  }

  .page-btn {
    padding: var(--spacing-s-2) var(--spacing-s-4);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-2);
    font-family: var(--font-text);
    font-size: var(--text-sm);
    font-weight: var(--weight-med);
    cursor: pointer;
    transition: border-color var(--duration-quick) var(--ease),
      color var(--duration-quick) var(--ease);
  }

  .page-btn:hover:not(:disabled) {
    border-color: var(--clay);
    color: var(--text);
  }

  .page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .page-numbers {
    display: flex;
    align-items: center;
    gap: var(--spacing-s-1);
  }

  .page-num {
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-2);
    font-family: var(--font-text);
    font-size: var(--text-sm);
    font-weight: var(--weight-med);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color var(--duration-quick) var(--ease),
      color var(--duration-quick) var(--ease),
      background var(--duration-quick) var(--ease);
  }

  .page-num:hover {
    border-color: var(--border-strong);
    color: var(--text);
  }

  .page-num.active {
    border-color: var(--clay);
    background: var(--clay);
    color: var(--color-paper);
  }

  .page-ellipsis {
    width: 24px;
    text-align: center;
    color: var(--text-3);
    font-size: var(--text-sm);
  }

  /* ── Responsive ─────────────────────────────────────────────── */

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

    .search-field {
      max-width: 100%;
    }

    .pagination {
      gap: var(--spacing-s-1);
    }

    .page-btn {
      padding: var(--spacing-s-2) var(--spacing-s-3);
      font-size: var(--text-xs);
    }

    .page-num {
      width: 32px;
      height: 32px;
      font-size: var(--text-xs);
    }
  }
</style>
