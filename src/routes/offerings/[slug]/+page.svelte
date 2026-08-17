<script lang="ts">
  /**
   * One offering.
   *
   * Everything a reader needs to decide and then act: the photograph, when it
   * is, where it is, what it asks, and one row of ways to reach us. No booking
   * flow — the collective answers messages itself, and a form that pretends to
   * hold a place it cannot hold would be worse than a conversation.
   */
  import OfferingCard from '$lib/components/OfferingCard.svelte';
  import IconLink from '$lib/components/IconLink.svelte';
  import Seo from '$lib/seo/Seo.svelte';
  import { breadcrumbs, event, organization, website } from '$lib/seo/jsonld';
  import { absolute } from '$lib/seo/site';
  import { formatDateRange } from '$lib/offerings/format';
  import { isPastNow, startClock } from '$lib/offerings/clock.svelte';
  import { actionsFor } from '$lib/offerings/actions';
  import { LOCATION } from '$lib/config';
  import { t, DEFAULT_LOCALE } from '$lib/i18n';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  /* The reader's clock — see clock.svelte.ts. Idempotent across surfaces. */
  onMount(startClock);

  /* $derived, not a plain const: the locale is a property of the URL and
   * becomes dynamic in Phase 3, at which point this recomputes on its own. */
  const m = $derived(t(DEFAULT_LOCALE).offerings);

  const offering = $derived(data.offering);
  const dates = $derived(formatDateRange(offering.dateStart, offering.dateEnd));
  const where = $derived(offering.location ?? `${LOCATION.town} · ${LOCATION.region}`);
  const actions = $derived(actionsFor(offering, m.whatsappMessage(offering.title)));
</script>

<Seo
  title={offering.title}
  description={offering.description}
  path={offering.href}
  image={offering.cover.src}
  imageAlt={offering.cover.alt}
  jsonLd={[
    organization(),
    website(),
    event(offering, absolute(offering.cover.src)),
    breadcrumbs([
      [m.detail.crumbs.home, '/'],
      [m.detail.crumbs.offerings, '/offerings'],
      [offering.title, offering.href]
    ])
  ]}
/>

<main class="offering-page" id="main">
  <nav class="crumbs" aria-label={m.detail.crumbs.label}>
    <a href="/offerings">{m.detail.crumbs.offerings}</a>
    <span aria-hidden="true">/</span>
    <span>{offering.categoryLabel}</span>
  </nav>

  <article class="offering">
    <header class="offering-head">
      <p class="offering-tags">
        <span class="tag">
          <i class="tag-dot" style="background: var(--{offering.categoryHue})" aria-hidden="true"></i>
          {offering.categoryLabel}
        </span>
        {#if isPastNow(offering)}
          <span class="tag is-past">{m.card.past}</span>
        {/if}
      </p>

      <h1 class="heading-1 offering-title">{offering.title}</h1>
      <p class="lead offering-lead">{offering.description}</p>
    </header>

    <figure class="entry-media offering-figure">
      <div class="entry-media-frame">
        <img
          src={offering.cover.src}
          srcset={offering.cover.srcset}
          sizes="(min-width: 1000px) 720px, 100vw"
          width={offering.cover.width}
          height={offering.cover.height}
          alt={offering.cover.alt}
          decoding="async"
        />
      </div>
    </figure>

    <!-- The facts, as a description list: each row is genuinely a term and
         its value, which is what `dl` is for and what a screen reader will
         announce as a pair. -->
    <dl class="facts">
      <div class="fact">
        <dt>{m.detail.when}</dt>
        <dd><time datetime={offering.dateStart}>{dates}</time></dd>
      </div>
      <div class="fact">
        <dt>{m.detail.where}</dt>
        <dd>{where}</dd>
      </div>
      {#if offering.price}
        <div class="fact">
          <dt>{m.detail.price}</dt>
          <dd>{offering.price}</dd>
        </div>
      {/if}
    </dl>

    <section class="actions" aria-labelledby="offering-actions">
      <h2 id="offering-actions" class="heading-4 actions-title">{m.detail.actions}</h2>
      <div class="action-row">
        {#each actions as action (action.key)}
          <IconLink
            href={action.href}
            label={m.actions[action.key]}
            path={action.path}
            class="action-link"
            target={action.external ? '_blank' : undefined}
            rel={action.external ? 'noreferrer noopener' : undefined}
          />
        {/each}
      </div>
    </section>
  </article>

  {#if data.related.length > 0}
    <aside class="related" aria-label={m.detail.crumbs.offerings}>
      <ul class="related-grid" role="list">
        {#each data.related as other (other.slug)}
          <li class="related-item"><OfferingCard offering={other} /></li>
        {/each}
      </ul>
    </aside>
  {/if}
</main>

<style>
  .offering-page {
    max-width: 900px;
    margin-inline: auto;
    /* Page shell tokens — see tokens.css; every subpage uses the same. */
    padding: var(--page-top) var(--page-x) var(--page-bottom);
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

  .offering-head {
    margin: var(--spacing-s-5) 0 var(--spacing-s-7);
  }

  .offering-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-s-2);
    margin: 0 0 var(--spacing-s-4);
  }

  .is-past {
    color: var(--text-3);
  }

  .offering-title {
    margin: 0 0 var(--spacing-s-5);
    font-size: min(var(--text-h1), 11vw);
  }

  .offering-lead {
    margin: 0;
    max-width: 56ch;
  }

  /* The canonical image treatment — clay corner rule over a hairline frame.
   * A 3:2 photograph rather than the frame's default 4:3, matching what
   * scripts/images.sh produces from the collective's own camera. */
  .offering-figure {
    margin: 0 0 var(--spacing-s-7);
  }

  .offering-figure .entry-media-frame {
    aspect-ratio: 3 / 2;
  }

  .offering-figure img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--spacing-s-5);
    margin: 0 0 var(--spacing-s-7);
    padding: var(--spacing-s-5) 0;
    border-top: 1px solid var(--border-subtle);
    border-bottom: 1px solid var(--border-subtle);
  }

  .fact dt {
    font-size: var(--text-xs);
    font-weight: var(--weight-med);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: var(--spacing-s-2);
  }

  .fact dd {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-h4);
    font-weight: var(--weight-light);
    color: var(--text);
  }

  .actions-title {
    margin: 0 0 var(--spacing-s-4);
  }

  .action-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-s-3);
  }

  /* 44×44 hairline squares, the same treatment the footer gives its social
   * chips — these sit side by side and a miss lands on the neighbour.
   *
   * `:global`, scoped under `.action-row`: the anchor is rendered by
   * IconLink, so Svelte's scoping hash on it is the CHILD's and a plain
   * `.action-link` here would match nothing. */
  .action-row :global(.action-link) {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    color: var(--text);
    transition:
      background var(--duration-quick) var(--ease),
      border-color var(--duration-quick) var(--ease),
      color var(--duration-quick) var(--ease);
  }

  .action-row :global(.action-link:hover) {
    border-color: var(--clay);
    color: var(--clay);
  }

  .action-row :global(.action-link:focus-visible) {
    outline: 2px solid var(--ring-focus);
    outline-offset: 2px;
  }

  .action-row :global(.action-link svg) {
    width: 22px;
    height: 22px;
  }

  .related {
    margin-top: clamp(48px, 7vh, 80px);
    padding-top: clamp(32px, 5vh, 48px);
    border-top: 1px solid var(--border-subtle);
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--spacing-s-5);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .related-item {
    min-width: 0;
    display: flex;
  }

  @media (max-width: 700px) {
    .related-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
