/**
 * Structured data builders.
 *
 * JSON-LD is the only format Google recommends, and in 2026 its job widened
 * past rich snippets: it is a large part of how AI Overviews, ChatGPT and
 * Perplexity decide whether a page is worth citing. See
 * `docs/research/blog-system/research.md` § Structured data.
 *
 * Every builder returns a plain object. `Seo.svelte` serialises them.
 */

import { AUTHOR_BY_KEY } from '../../content/authors.js';
import { TOPIC_BY_SLUG } from '../../content/topics.js';
import type { PostSummary } from '$lib/blog/types';
import { SITE, absolute } from './site';

type JsonLd = Record<string, unknown>;

/** The publisher node, referenced by every BlogPosting. */
export function organization(): JsonLd {
  return {
    '@type': 'Organization',
    '@id': `${SITE.origin}/#organization`,
    name: SITE.name,
    alternateName: SITE.shortName,
    url: SITE.origin,
    description: SITE.description,
    logo: {
      '@type': 'ImageObject',
      url: absolute('/images/branding/logo-icon.svg')
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Calca',
      addressRegion: 'Cusco',
      addressCountry: 'PE'
    }
  };
}

export function website(): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': `${SITE.origin}/#website`,
    name: SITE.name,
    url: SITE.origin,
    description: SITE.description,
    inLanguage: SITE.locale,
    publisher: { '@id': `${SITE.origin}/#organization` }
  };
}

/**
 * Author node. Schema.org accepts a Person or an Organization here; the
 * collective writing about its own place is honestly an Organization, and
 * naming real contributors later is a genuine E-E-A-T improvement.
 */
function author(key: string): JsonLd {
  const entry = AUTHOR_BY_KEY.get(key);
  if (!entry) return { '@type': 'Organization', name: SITE.name, url: SITE.origin };
  return {
    '@type': entry.type,
    name: entry.name,
    ...(entry.bio ? { description: entry.bio } : {}),
    ...(entry.sameAs?.length ? { sameAs: entry.sameAs } : {})
  };
}

export function blogPosting(post: PostSummary, imageUrl: string): JsonLd {
  return {
    '@type': 'BlogPosting',
    '@id': `${absolute(post.href)}#post`,
    headline: post.title,
    description: post.description,
    image: imageUrl,
    datePublished: post.date,
    dateModified: post.lastmod,
    inLanguage: SITE.locale,
    keywords: post.tags.join(', '),
    articleSection: TOPIC_BY_SLUG.get(post.topic)?.title ?? post.topic,
    wordCount: post.readingMinutes * 200,
    author: author(post.author),
    publisher: { '@id': `${SITE.origin}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absolute(post.href) },
    isPartOf: { '@id': `${SITE.origin}/blog#blog` }
  };
}

export function blog(posts: PostSummary[]): JsonLd {
  return {
    '@type': 'Blog',
    '@id': `${SITE.origin}/blog#blog`,
    name: SITE.blogTitle,
    description: SITE.blogDescription,
    url: absolute('/blog'),
    inLanguage: SITE.locale,
    publisher: { '@id': `${SITE.origin}/#organization` },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      '@id': `${absolute(post.href)}#post`,
      headline: post.title,
      url: absolute(post.href),
      datePublished: post.date
    }))
  };
}

/** Ordered list of posts, for an index or a pillar page. */
export function itemList(posts: PostSummary[], name: string): JsonLd {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: posts.length,
    itemListElement: posts.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absolute(post.href),
      name: post.title
    }))
  };
}

/**
 * @param trail ordered crumbs, root first, each `[label, site-relative path]`.
 */
export function breadcrumbs(trail: Array<[string, string]>): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: absolute(path)
    }))
  };
}

/** Wrap builders into the single graph document that goes in the page head. */
export function graph(nodes: JsonLd[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
}
