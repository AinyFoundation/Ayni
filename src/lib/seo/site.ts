/**
 * Site-level identity. One constant, one place.
 *
 * Canonical URLs, the sitemap, both feeds and every JSON-LD node derive from
 * `origin`. Getting it wrong does active harm — two hostnames serving the
 * same pages reads as duplicate content — so it is not spread across files.
 *
 * If the domain changes, this is the only line to edit.
 */
export const SITE = {
  origin: 'https://aynicollective.org',
  name: 'Ayni Consciousness Collective',
  shortName: 'Ayni',
  description:
    'A seven-wing sovereign ecosystem rooted in Calca, Sacred Valley, Perú — sanctuary, wellness, energy, art, learning, games and labs.',
  locale: 'en',
  /** 1200x630 JPEG. Social scrapers still mishandle WebP and AVIF. */
  defaultOgImage: '/images/og-default.jpg',
  blogTitle: 'Notes from the Valley',
  blogDescription:
    'Field notes from Ayni Sanctuary in Calca, Perú. Ceremony, the land, food grown where it is eaten, and the rhythms of the Sacred Valley.'
} as const;

/**
 * Absolute URL for a site-relative path. Everything crawlers and feed readers
 * consume must be absolute; relative URLs in a feed or a canonical tag are a
 * silent correctness bug.
 *
 * @param pathname site-relative, e.g. `/blog/some-post`
 */
export function absolute(pathname: string): string {
  return new URL(pathname, SITE.origin).href;
}
