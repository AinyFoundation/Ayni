/**
 * Offering categories — the open-ended taxonomy behind /offerings.
 *
 * Unlike blog's `topics.js` clusters (closed, SEO-driven), this list is
 * expected to grow: ceremonies/retreats/events are the three the collective
 * runs today, but "any other category" is explicitly in scope. Adding one is
 * a single entry here, not a schema change — `category` in offering
 * frontmatter is validated against this list, nothing else references it.
 *
 * `hue` keys into the wing-hue semantic tokens in tokens.css (`--clay`,
 * `--gold`, etc.) — kept as the bare token name, not a color value, so a
 * category's accent always tracks the design system. Ceremonies/retreats/
 * events reuse the exact hues `OfferingsSection`'s pinned scroller already
 * assigns them, so the homepage teaser and the real listing agree by
 * construction.
 *
 * Plain JS with JSDoc, not TypeScript — `scripts/offerings-check.mjs` runs
 * under bare Node with no build step and must validate against the same
 * list the app renders from. Same reasoning as `topics.js`/`authors.js`.
 */

/**
 * @typedef {object} OfferingCategory
 * @property {string} slug
 * @property {string} label      Short form, used on tags and filter chips.
 * @property {string} singular   One of them, for "Next ceremony" / "Last retreat".
 * @property {string} hue        Bare token name, e.g. "clay" for var(--clay).
 */

/**
 * `singular` exists because the Next/Last badge names ONE offering, and
 * "Next Ceremonies" is not a phrase. It is stored rather than derived: English
 * plurals are irregular often enough that stripping an "s" is a bug waiting
 * for the first category that ends in one.
 *
 * Phase-3 note, recorded not solved: Spanish needs gender agreement on the
 * badge (*próximo retiro* but *próxima ceremonia*), which the catalog's
 * `(label) => …` function cannot produce from the noun alone. That needs
 * either a gender field here or the whole phrase per category in the catalog;
 * the decision belongs to whoever adds the first Spanish catalog.
 *
 * @type {OfferingCategory[]}
 */
export const OFFERING_CATEGORIES = [
  { slug: 'retreats', label: 'Retreats', singular: 'retreat', hue: 'clay' },
  { slug: 'ceremonies', label: 'Ceremonies', singular: 'ceremony', hue: 'gold' },
  { slug: 'events', label: 'Events', singular: 'event', hue: 'sage' }
];

/** @type {Map<string, OfferingCategory>} */
export const OFFERING_CATEGORY_BY_SLUG = new Map(OFFERING_CATEGORIES.map((c) => [c.slug, c]));

/** Every valid category slug, for validation and prerender `entries()`. */
export const OFFERING_CATEGORY_SLUGS = OFFERING_CATEGORIES.map((c) => c.slug);

/**
 * @param {unknown} value
 * @returns {boolean} true when `value` names a known category.
 */
export function isOfferingCategorySlug(value) {
  return typeof value === 'string' && OFFERING_CATEGORY_BY_SLUG.has(value);
}
