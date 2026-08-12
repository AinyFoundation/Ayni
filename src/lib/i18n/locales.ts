/**
 * The locale registry. One place, one list.
 *
 * Widening `LOCALES` is the forcing function for the whole system: every
 * `Record<Locale, …>` in the codebase stops compiling until the new language
 * is complete. That is deliberate — it turns "add a language" from a hunt
 * through the codebase into a list of compiler errors to work down.
 *
 * See `docs/research/i18n-system/research.md` for why the default locale
 * lives at the root (`/`) while every other locale is a path prefix
 * (`/es/…`): Google recommends a distinct URL per language and advises
 * against switching language by cookie or browser setting.
 */

/** The language served at the root of the site, and the `x-default` target. */
export const DEFAULT_LOCALE = 'en';

/**
 * Every language this build ships.
 *
 * Phase 3 widens this to `['en', 'es']`. Until then the site is monolingual
 * and every locale-aware branch below collapses to a no-op.
 */
export const LOCALES = ['en'] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * Locales that carry a URL prefix. The default locale is served bare, so it
 * is never in this list.
 */
export const PREFIXED_LOCALES: readonly Locale[] = LOCALES.filter(
  (locale) => locale !== DEFAULT_LOCALE
);

/** Narrowing guard for untrusted input — route params, storage, `navigator`. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * BCP-47 tags for `<html lang>`, `Content-Language` and `Intl`.
 *
 * Kept separate from the URL segment on purpose: the URL should stay short
 * (`/es/`), while the language signal that crawlers and screen readers read
 * benefits from being specific.
 */
export const HTML_LANG: Record<Locale, string> = {
  en: 'en'
};

/** Open Graph wants an underscored territory form, not a BCP-47 tag. */
export const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US'
};

/**
 * What each language calls ITSELF.
 *
 * Endonyms, and deliberately not part of the message catalogs: a reader
 * looking for Spanish is looking for the word "Español", whatever language
 * the page around it happens to be in. Translating these would hide the
 * option from the only person who needs it.
 */
export const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English'
};

/**
 * The short form for the header, where there is no room for the endonym.
 *
 * Uppercased in CSS rather than here so the string stays a language tag.
 */
export const LANGUAGE_SHORT: Record<Locale, string> = {
  en: 'en'
};
