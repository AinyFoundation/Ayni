/**
 * The i18n entry point: message lookup and locale-aware URLs.
 *
 * Consumers want two things and should import both from here:
 *
 *     import { messages, href, stripLocale } from '$lib/i18n';
 *
 * There is no store and no context provider. The locale is a property of the
 * URL, which SvelteKit already gives every component through `page`, so a
 * second copy of that state could only ever disagree with the first.
 */

import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from './locales';
import type { Messages } from './types';
import en from './catalogs/en';

export {
  DEFAULT_LOCALE,
  LOCALES,
  PREFIXED_LOCALES,
  isLocale,
  HTML_LANG,
  OG_LOCALE,
  LANGUAGE_NAMES,
  LANGUAGE_SHORT
} from './locales';
export type { Locale } from './locales';
export type { Messages } from './types';

/**
 * Every catalog, by locale.
 *
 * Widening `LOCALES` breaks this line first, which is the intended way to
 * discover that a language is missing.
 */
export const messages: Record<Locale, Messages> = { en };

/** The catalog for a locale. */
export const t = (locale: Locale): Messages => messages[locale];

/**
 * The locale a pathname belongs to, and that pathname with the locale segment
 * removed.
 *
 * `/es/blog/x` becomes `{ locale: 'es', path: '/blog/x' }`; `/blog/x` becomes
 * `{ locale: 'en', path: '/blog/x' }`. Both forms therefore compare equal
 * once stripped, which is the entire point — see `stripLocale`.
 */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, first = '', ...rest] = pathname.split('/');
  if (isLocale(first) && first !== DEFAULT_LOCALE) {
    return { locale: first, path: `/${rest.join('/')}` };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

/**
 * A pathname with any locale prefix removed.
 *
 * ALWAYS use this before comparing a pathname to a literal. The layout tests
 * `pathname === '/'` to decide whether the hero's scroll-driven navbar clip
 * runs at all, and `startsWith('/blog')` to park the white navbar. Under a
 * locale prefix both go false and the failure is VISUAL and SILENT — the
 * Spanish homepage renders with the wrong navbar state and nothing errors.
 * That is the single highest-risk consequence of prefixing URLs, so the
 * comparison helper ships with the system rather than after it.
 */
export const stripLocale = (pathname: string): string => splitLocale(pathname).path;

/**
 * A site-relative path, addressed in a locale.
 *
 * The fragment is preserved and never prefixed: the navigation links
 * `/#offerings` from every route on purpose (a bare `#offerings` resolves
 * against `/blog` and goes nowhere), so the prefix has to land on the path
 * while the fragment rides along — `/#offerings` in Spanish is `/es#offerings`,
 * not `/es/#offerings` or `/#offerings`.
 */
export function href(path: string, locale: Locale = DEFAULT_LOCALE): string {
  const hash = path.indexOf('#');
  const fragment = hash === -1 ? '' : path.slice(hash);
  const bare = stripLocale(hash === -1 ? path : path.slice(0, hash));

  if (locale === DEFAULT_LOCALE) return `${bare}${fragment}`;
  // `/` in a prefixed locale is `/es`, not `/es/`.
  return bare === '/' ? `/${locale}${fragment}` : `/${locale}${bare}${fragment}`;
}
