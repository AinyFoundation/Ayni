/**
 * Display helpers shared by cards, the article header and the pillar pages.
 * Client-safe: no node imports, no markdown toolchain.
 */

import { DEFAULT_LOCALE, t, type Locale } from '$lib/i18n';

/**
 * One formatter per locale, built once.
 *
 * Constructing an `Intl.DateTimeFormat` is expensive enough that doing it per
 * call shows up when a page renders a few dozen cards, so they are cached at
 * module scope.
 *
 * Assumes a full-ICU Node in CI. Node ships full ICU by default since v13; a
 * `small-icu` build would silently fall back to English formatting for every
 * non-English locale rather than erroring, which is exactly the kind of
 * failure the post-build check exists to catch.
 */
const FORMATTERS: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
};

/**
 * `2026-08-05` becomes `5 August 2026`.
 *
 * Parsed as UTC on purpose. A bare `new Date('2026-08-05')` is already UTC,
 * but pairing it with a fixed locale keeps prerendered output identical
 * whatever timezone the build machine is in — otherwise the date silently
 * shifts by one depending on where the build ran. Choosing the formatter by
 * LOCALE rather than by machine preserves that guarantee: the same page in
 * the same language formats identically on any machine.
 */
export function formatDate(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  return FORMATTERS[locale].format(new Date(`${iso}T00:00:00Z`));
}

/**
 * `4 min read`.
 *
 * The prose lives in the catalog, not here: word order around the number
 * differs by language (`4 min read` / `4 min de lectura`), which is why it is
 * a function in the catalog rather than a format string with a placeholder.
 * This wrapper stays so callers keep one import for both helpers.
 */
export function formatReadingTime(minutes: number, locale: Locale = DEFAULT_LOCALE): string {
  return t(locale).blog.readingTime(minutes);
}
