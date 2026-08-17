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
import type { OfferingSummary } from '$lib/offerings/types';
import { LOCATION } from '$lib/config';
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

/**
 * Ordered list of anything with a title and a site-relative href — posts on
 * an index or a pillar page, offerings on the offerings index.
 *
 * Typed structurally rather than as `PostSummary[]` so both content types
 * feed it without a second near-identical builder; `PostSummary` and
 * `OfferingSummary` both satisfy it.
 */
export function itemList(items: Array<{ href: string; title: string }>, name: string): JsonLd {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absolute(item.href),
      name: item.title
    }))
  };
}

/**
 * Currency symbols the price parser recognises, mapped to ISO 4217 codes.
 *
 * `price` in offering frontmatter is a DISPLAY string ("S/. 350", "$120",
 * "Free") because that is what a reader should see on the card. Schema.org's
 * `offers.price` wants a bare number beside a `priceCurrency` code, so the
 * two only reconcile when the display string can be read confidently.
 */
const CURRENCY_SYMBOLS: Array<[RegExp, string]> = [
  [/^s\/\.?/i, 'PEN'],
  [/^\$/, 'USD'],
  [/^€/, 'EUR'],
  [/^£/, 'GBP']
];

/**
 * Reads a display price into the numeric pair schema.org needs.
 *
 * @returns null when the string carries no recognisable currency + amount —
 *          "Free", "By donation", "Sliding scale" all land here. Callers then
 *          omit `offers` entirely rather than emit an invalid or invented
 *          node: a malformed required property suppresses the rich result
 *          for the whole page, so shipping nothing is strictly better than
 *          shipping a guess.
 */
function parsePrice(price: string): { price: string; priceCurrency: string } | null {
  const trimmed = price.trim();
  for (const [symbol, code] of CURRENCY_SYMBOLS) {
    if (!symbol.test(trimmed)) continue;
    const amount = trimmed.replace(symbol, '').replace(/[\s,]/g, '');
    if (!/^\d+(\.\d+)?$/.test(amount)) return null;
    return { price: amount, priceCurrency: code };
  }
  return null;
}

/**
 * An offering as a schema.org Event.
 *
 * Required by Google: `name`, `startDate`, `location`. Everything else here
 * is recommended rather than required, and is emitted because pages carrying
 * only the three required fields get materially less prominence in the Events
 * rich result. See `docs/research/offerings-system/research.md` § Sources.
 *
 * `eventStatus` is always `EventScheduled` — a cancelled or rescheduled
 * offering is currently handled by editing or unpublishing the file, not by a
 * status field. If the collective ever needs to announce a cancellation
 * rather than silently remove it, that becomes a frontmatter field and this
 * line reads it.
 */
export function event(offering: OfferingSummary, imageUrl: string): JsonLd {
  const offers = offering.price ? parsePrice(offering.price) : null;

  return {
    '@type': 'Event',
    '@id': `${absolute(offering.href)}#event`,
    name: offering.title,
    description: offering.description,
    image: imageUrl,
    startDate: offering.dateStart,
    ...(offering.dateEnd ? { endDate: offering.dateEnd } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    inLanguage: SITE.locale,
    location: {
      '@type': 'Place',
      name: offering.location ?? `${LOCATION.town}, ${LOCATION.region}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: LOCATION.town,
        addressRegion: 'Cusco',
        addressCountry: 'PE'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: LOCATION.lat,
        longitude: LOCATION.lon
      }
    },
    organizer: { '@id': `${SITE.origin}/#organization` },
    ...(offers
      ? {
          offers: {
            '@type': 'Offer',
            ...offers,
            availability: 'https://schema.org/InStock',
            url: absolute(offering.href)
          }
        }
      : {}),
    mainEntityOfPage: { '@type': 'WebPage', '@id': absolute(offering.href) }
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
