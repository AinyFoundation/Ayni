/**
 * Date display for offerings. Client-safe: no node imports.
 *
 * Separate from `$lib/blog/format.ts` on purpose — a post has one date and an
 * offering has a range, and the range collapses in two different ways
 * depending on whether it spans a month boundary. Sharing one module would
 * mean one of the two callers importing helpers it never uses.
 */

import { DEFAULT_LOCALE, t, type Locale } from '$lib/i18n';

/**
 * One formatter set per locale, built once — constructing an
 * `Intl.DateTimeFormat` per call shows up when a page renders a few dozen
 * cards. Same reasoning, and the same full-ICU assumption, as blog's.
 */
const FULL: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
};

/** Day and month, no year — the leading half of a same-year range. */
const DAY_MONTH: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' })
};

/** Day alone — the leading half of a range inside one month. */
const DAY: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-GB', { day: 'numeric' })
};

/**
 * Parsed as UTC on purpose, exactly as `$lib/blog/format.ts` does: a bare
 * `new Date('2026-08-05')` is already UTC, and pairing it with a fixed locale
 * keeps prerendered output identical whatever timezone the build ran in.
 */
const asUtc = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

/** `2026-08-05` becomes `5 August 2026`. */
export function formatDate(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  return FULL[locale].format(asUtc(iso));
}

/**
 * A one-day or multi-day offering as one line.
 *
 * The year is stated once, and the month once when the range does not cross
 * one: `5 – 8 August 2026`, `28 August – 2 September 2026`, `5 August 2026`.
 * Repeating the month and year on both halves is correct but reads as noise
 * on a card, which is where this is used most.
 */
export function formatDateRange(
  start: string,
  end: string | undefined,
  locale: Locale = DEFAULT_LOCALE
): string {
  if (!end || end === start) return formatDate(start, locale);

  const a = asUtc(start);
  const b = asUtc(end);
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  const sameMonth = sameYear && a.getUTCMonth() === b.getUTCMonth();

  const head = sameMonth
    ? DAY[locale].format(a)
    : sameYear
      ? DAY_MONTH[locale].format(a)
      : FULL[locale].format(a);

  return t(locale).offerings.dateRange(head, FULL[locale].format(b));
}
