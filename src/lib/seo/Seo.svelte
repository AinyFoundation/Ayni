<script lang="ts">
  /**
   * The single writer of <head> metadata.
   *
   * Every route renders exactly one of these. Before it existed the layout
   * hardcoded a title that each page then had to fight, and duplicated the
   * charset and viewport tags already present in app.html.
   *
   * Escaping note: JSON-LD goes in via {@html}, so a closing script tag
   * appearing inside a string value would end the block early. Escaping every
   * less-than as < prevents that and stays valid JSON.
   */
  import { SITE, absolute } from './site';
  import {
    DEFAULT_LOCALE,
    HTML_LANG,
    OG_LOCALE,
    PREFIXED_LOCALES,
    href as localeHref,
    type Locale
  } from '$lib/i18n';

  type Props = {
    /** Page title, without the site suffix. */
    title: string;
    description: string;
    /** Site-relative path this page canonically lives at. */
    path: string;
    /** Which language this page is written in. */
    locale?: Locale;
    /**
     * The locales this page actually EXISTS in, itself included.
     *
     * Only real translations belong here. hreflang must be self-referencing
     * and bidirectional or Google ignores the whole cluster, and pointing it
     * at a URL that 404s or serves another language is worse than omitting
     * it. A post with no translation passes nothing and emits nothing.
     */
    alternates?: readonly Locale[];
    /** Site-relative or absolute image URL. Falls back to the site default. */
    image?: string;
    imageAlt?: string;
    type?: 'website' | 'article';
    publishedTime?: string;
    modifiedTime?: string;
    /** Structured-data nodes, already built by $lib/seo/jsonld. */
    jsonLd?: Record<string, unknown>[];
    /** Keep a page out of the index without removing it from the site. */
    noindex?: boolean;
  };

  let {
    title,
    description,
    path,
    locale = DEFAULT_LOCALE,
    alternates = [],
    image = SITE.defaultOgImage,
    imageAlt = SITE.name,
    type = 'website',
    publishedTime,
    modifiedTime,
    jsonLd = [],
    noindex = false
  }: Props = $props();

  const fullTitle = $derived(path === '/' ? SITE.name : `${title} · ${SITE.shortName}`);
  /**
   * Self-canonical, ALWAYS. A translated page must never canonicalise to its
   * English twin: that tells Google the Spanish page is a duplicate and it
   * drops out of the index, taking the hreflang cluster with it.
   */
  const canonical = $derived(absolute(localeHref(path, locale)));
  const imageUrl = $derived(image.startsWith('http') ? image : absolute(image));

  /**
   * hreflang, emitted only when a real translation exists. With one locale
   * this is empty and the head is byte-identical to before.
   *
   * `x-default` points at the default-locale URL, which is what a visitor
   * whose language matches nothing should land on.
   */
  const hreflangs = $derived(
    alternates.length > 1
      ? alternates.map((l) => ({ lang: HTML_LANG[l], url: absolute(localeHref(path, l)) }))
      : []
  );
  const xDefault = $derived(
    hreflangs.length > 0 ? absolute(localeHref(path, DEFAULT_LOCALE)) : ''
  );

  /** Feeds are per-language, so their discovery links follow the page. */
  const feedPath = $derived((name: string) => absolute(localeHref(name, locale)));

  const ldJson = $derived(
    jsonLd.length === 0
      ? ''
      : JSON.stringify({ '@context': 'https://schema.org', '@graph': jsonLd }).replace(/</g, '\\u003c')
  );
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <!--
    No `<meta http-equiv="Content-Language">` here on purpose. It is
    non-conforming in HTML (the spec directs authors to the `lang` attribute
    instead, and Svelte's typed attributes reject it), so the language signal
    for engines that ignore hreflang — Bing chiefly — is `<html lang>`, which
    `hooks.server.ts` now stamps per page. A real `Content-Language` response
    header belongs in the web server's config, not in markup.
  -->
  {#if noindex}
    <meta name="robots" content="noindex, follow" />
  {/if}

  {#each hreflangs as alt (alt.lang)}
    <link rel="alternate" hreflang={alt.lang} href={alt.url} />
  {/each}
  {#if xDefault}
    <link rel="alternate" hreflang="x-default" href={xDefault} />
  {/if}

  <meta property="og:type" content={type} />
  <meta property="og:site_name" content={SITE.name} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={imageUrl} />
  <meta property="og:image:alt" content={imageAlt} />
  <meta property="og:locale" content={OG_LOCALE[locale]} />
  {#if publishedTime}<meta property="article:published_time" content={publishedTime} />{/if}
  {#if modifiedTime}<meta property="article:modified_time" content={modifiedTime} />{/if}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={imageUrl} />

  <link rel="alternate" type="application/rss+xml" title="{SITE.blogTitle} (RSS)" href={feedPath('/rss.xml')} />
  <link rel="alternate" type="application/feed+json" title="{SITE.blogTitle} (JSON)" href={feedPath('/feed.json')} />

  {#if ldJson}
    {@html `<script type="application/ld+json">${ldJson}<\/script>`}
  {/if}
</svelte:head>
