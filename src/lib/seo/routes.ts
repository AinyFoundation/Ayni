/**
 * What pages this build actually produces.
 *
 * Two consumers care: the sitemap, which must never advertise a URL that
 * 404s, and the post CTA resolver, which must never link to one. Both read
 * the same glob, so neither can drift from the filesystem the way a
 * hand-maintained list would.
 */

/** Static route paths, e.g. `/`, `/blog`. Dynamic routes are excluded. */
const ALL_ROUTES: string[] = Object.keys(import.meta.glob('/src/routes/**/+page.svelte')).map(
  (file) => {
    const route = file.replace('/src/routes', '').replace('/+page.svelte', '');
    // Route groups like /(site)/ are organisational, not part of the URL.
    return route.replace(/\/\([^)]+\)/g, '') || '/';
  }
);

const STATIC_ROUTES = ALL_ROUTES.filter((route) => !route.includes('['));
const DYNAMIC_ROUTES = ALL_ROUTES.filter((route) => route.includes('['));

/** Every static page, sorted, for the sitemap to start from. */
export const staticRoutes = (): string[] => [...STATIC_ROUTES].sort();

/**
 * True when `href` points at a page this build produced. Hash and query are
 * ignored — `/sanctuary#stay` is a question about `/sanctuary`.
 */
export function routeExists(href: string): boolean {
  const path = href.split('#')[0].split('?')[0].replace(/(.)\/$/, '$1');
  if (STATIC_ROUTES.includes(path)) return true;
  return DYNAMIC_ROUTES.some((route) =>
    new RegExp(`^${route.replace(/\[[^\]]+\]/g, '[^/]+')}$`).test(path)
  );
}
