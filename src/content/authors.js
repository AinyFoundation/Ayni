/**
 * Post authorship.
 *
 * Feeds the byline and the `author` node of BlogPosting JSON-LD. Schema.org
 * accepts either a Person or an Organization there, and the honest default
 * for a collective writing about its own place is the Organization.
 *
 * E-E-A-T rewards named people with traceable expertise, so adding real
 * contributors here is a genuine ranking improvement, not bookkeeping. Add
 * one entry per person, set `type: 'Person'`, and fill `sameAs` with real
 * profile URLs. Do not invent them.
 *
 * Plain JS with JSDoc for the same reason as topics.js: `blog-check.mjs`
 * validates the `author` key under bare node.
 */

/**
 * @typedef {object} Author
 * @property {string} key                 Frontmatter `author:` value.
 * @property {'Person'|'Organization'} type
 * @property {string} name
 * @property {string} [role]              Shown next to the byline.
 * @property {string} [bio]               One sentence, used on the post footer.
 * @property {string[]} [sameAs]          Profile URLs for JSON-LD.
 */

/** @type {Author[]} */
export const AUTHORS = [
  {
    key: 'ayni',
    type: 'Organization',
    name: 'Ayni Sanctuary',
    role: 'Calca, Sacred Valley',
    bio: 'Notes from the people living and working at Ayni Sanctuary in Calca, Perú.',
    sameAs: []
  }
];

/** @type {Map<string, Author>} */
export const AUTHOR_BY_KEY = new Map(AUTHORS.map((a) => [a.key, a]));

/** The `author:` value a post gets when the skill has nothing better. */
export const DEFAULT_AUTHOR = 'ayni';

/**
 * @param {unknown} value
 * @returns {boolean} true when `value` names a known author.
 */
export function isAuthorKey(value) {
  return typeof value === 'string' && AUTHOR_BY_KEY.has(value);
}
