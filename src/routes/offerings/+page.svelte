<script lang="ts">
  /**
   * The offerings index.
   *
   * Two controls, deliberately not three: a category filter and an
   * upcoming/past toggle. No free-text search and no pagination — both were
   * built for the journal, where the corpus grows without bound. A handful of
   * offerings per category does not need either, and shipping them anyway
   * would be machinery with nothing to do.
   */
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import OfferingCard from '$lib/components/OfferingCard.svelte';
  import { isPastNow, startClock } from '$lib/offerings/clock.svelte';
  import Seo from '$lib/seo/Seo.svelte';
  import { breadcrumbs, itemList, organization, website } from '$lib/seo/jsonld';
  import { t, DEFAULT_LOCALE } from '$lib/i18n';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  /* $derived, not a plain const: the locale is a property of the URL and
   * becomes dynamic in Phase 3, at which point this recomputes on its own. */
  const m = $derived(t(DEFAULT_LOCALE).offerings);

  // ── URL-driven state ──────────────────────────────────────────
  //
  // Every read is guarded by `browser`. This route is PRERENDERED, and
  // SvelteKit throws on `url.searchParams` during prerendering rather than
  // returning empty — a prerendered route is ONE file served for every query
  // string, so a build-time answer to "what is ?category=" could only ever be
  // wrong. The prerendered HTML is therefore the unfiltered upcoming list,
  // which is what a crawler and a no-JS reader should get; the filter applies
  // on the client, where the query string actually exists. Same reasoning,
  // and the same hard-won bug, as `/blog` — see its header comment.

  const params = browser ? page.url.searchParams : new URLSearchParams();

  /** Active category filter, synced with ?category=. Empty means all. */
  let activeCategory = $state(params.get('category') ?? '');

  /** Which side of today to show, synced with ?when=. Defaults to upcoming. */
  let when: 'upcoming' | 'past' = $state(params.get('when') === 'past' ? 'past' : 'upcoming');

  function updateUrl() {
    const next = new URLSearchParams();
    if (activeCategory) next.set('category', activeCategory);
    if (when === 'past') next.set('when', 'past');

    const qs = next.toString();
    goto(qs ? `/offerings?${qs}` : '/offerings', {
      replaceState: true,
      keepFocus: true,
      noScroll: true
    });
  }

  function selectCategory(slug: string) {
    activeCategory = slug;
    updateUrl();
  }

  function selectWhen(value: 'upcoming' | 'past') {
    when = value;
    updateUrl();
  }

  /* Hand the site its clock. Idempotent — the homepage scroller calls this
   * too. Until it runs, `isPastNow` returns the build-time answer the server
   * already rendered, so hydration matches and this is a correction rather
   * than a flash. Without it, an offering that finished after the last deploy
   * would still be sorted and counted as upcoming. */
  onMount(startClock);

  /**
   * Past offerings run newest-first and upcoming ones soonest-first. Both mean
   * "nearest to now first" — the list is sorted ascending by date at build
   * time, so only the past half is reversed.
   *
   * Partitioned on `isPastNow`, never the baked `isPast`, so the boundary
   * follows the reader's clock. `$derived` picks the correction up on the
   * frame after mount.
   */
  const visible = $derived.by(() => {
    const filtered = data.offerings.filter((offering) => {
      if (activeCategory && offering.category !== activeCategory) return false;
      return when === 'past' ? isPastNow(offering) : !isPastNow(offering);
    });
    return when === 'past' ? filtered.slice().reverse() : filtered;
  });

  /** Which empty state applies — the three say genuinely different things. */
  const emptyMessage = $derived(
    data.offerings.length === 0
      ? m.index.empty
      : when === 'past'
        ? m.index.emptyPast
        : m.index.emptyUpcoming
  );

  /* Effects never run during SSR, so this one needs no `browser` guard. It
   * resyncs local state when the URL changes underneath us — back/forward. */
  $effect(() => {
    const current = page.url.searchParams;
    activeCategory = current.get('category') ?? '';
    when = current.get('when') === 'past' ? 'past' : 'upcoming';
  });
</script>

<Seo
  title={m.meta.title}
  description={m.meta.description}
  path="/offerings"
  image={data.offerings[0]?.cover.src}
  jsonLd={[
    organization(),
    website(),
    itemList(data.offerings, m.meta.title),
    breadcrumbs([
      [m.detail.crumbs.home, '/'],
      [m.detail.crumbs.offerings, '/offerings']
    ])
  ]}
/>

<main class="offerings-page" id="main">
  <header class="offerings-head">
    <p class="eyebrow">{m.index.eyebrow}</p>
    <h1 class="heading-1 offerings-title">{m.index.title}</h1>
    <p class="lead offerings-lead">{m.index.lead}</p>
  </header>

  <div class="controls">
    <!-- `aria-pressed` rather than a radio group: these are buttons that
         change what is listed below, not a form field being answered. -->
    <div class="chips" role="group" aria-label={m.index.filters.label}>
      <button
        type="button"
        class="chip"
        class:is-active={activeCategory === ''}
        aria-pressed={activeCategory === ''}
        onclick={() => selectCategory('')}
      >
        {m.index.filters.all}
      </button>
      {#each data.categories as category (category.slug)}
        <button
          type="button"
          class="chip"
          class:is-active={activeCategory === category.slug}
          aria-pressed={activeCategory === category.slug}
          onclick={() => selectCategory(category.slug)}
        >
          <i class="chip-dot" style="background: var(--{category.hue})" aria-hidden="true"></i>
          {category.label}
          <span class="chip-count">{category.count}</span>
        </button>
      {/each}
    </div>

    <div class="chips" role="group" aria-label={m.index.when.label}>
      <button
        type="button"
        class="chip"
        class:is-active={when === 'upcoming'}
        aria-pressed={when === 'upcoming'}
        onclick={() => selectWhen('upcoming')}
      >
        {m.index.when.upcoming}
      </button>
      <button
        type="button"
        class="chip"
        class:is-active={when === 'past'}
        aria-pressed={when === 'past'}
        onclick={() => selectWhen('past')}
      >
        {m.index.when.past}
      </button>
    </div>
  </div>

  {#if visible.length > 0}
    <ul class="offering-grid" role="list">
      {#each visible as offering (offering.slug)}
        <li class="offering-item"><OfferingCard {offering} /></li>
      {/each}
    </ul>
  {:else}
    <p class="empty">{emptyMessage}</p>
  {/if}
</main>

<style>
  .offerings-page {
    max-width: 1200px;
    margin-inline: auto;
    /* Page shell tokens — see tokens.css; every subpage uses the same. */
    padding: var(--page-top) var(--page-x) var(--page-bottom);
  }

  .offerings-head {
    max-width: 62ch;
    margin-bottom: clamp(32px, 5vh, 52px);
  }

  .offerings-title {
    margin: var(--spacing-s-3) 0 var(--spacing-s-5);
    font-size: min(var(--text-h1), 11vw);
  }

  .offerings-lead {
    margin: 0;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--spacing-s-4);
    margin-bottom: clamp(28px, 4vh, 44px);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-s-2);
  }

  /* A hairline pill on paper — the site's card convention, no shadow. The
   * active one inverts to ink rather than merely thickening its border, so
   * the selected state survives a glance. */
  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-s-2);
    font-family: var(--font-text);
    font-size: var(--text-xs);
    font-weight: var(--weight-med);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--text-2);
    background: var(--surface-1);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-full);
    padding: var(--spacing-s-2) var(--spacing-s-4);
    cursor: pointer;
    transition:
      background var(--duration-quick) var(--ease),
      border-color var(--duration-quick) var(--ease),
      color var(--duration-quick) var(--ease);
  }

  .chip:hover {
    border-color: var(--text);
  }

  .chip:focus-visible {
    outline: 2px solid var(--ring-focus);
    outline-offset: 2px;
  }

  .chip.is-active {
    background: var(--color-ink);
    border-color: var(--color-ink);
    color: var(--color-paper);
  }

  .chip-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--radius-full);
  }

  .chip-count {
    /* The count is context, not the label — one weight down so the category
     * name still reads first. */
    font-weight: var(--weight-book);
    opacity: 0.65;
  }

  @media (pointer: coarse) {
    /* WCAG 2.5.8 floor, keyed to the pointer rather than the viewport —
     * matching the convention in components.css. */
    .chip {
      min-height: 44px;
    }
  }

  .offering-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--spacing-s-6);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .offering-item {
    min-width: 0;
    display: flex;
  }

  .empty {
    max-width: 48ch;
    color: var(--text-2);
    line-height: var(--leading-loose);
  }

  @media (max-width: 1000px) {
    .offering-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 700px) {
    .offering-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-s-5);
    }
  }
</style>
