/**
 * The offering frontmatter contract.
 *
 * Deliberately lighter than blog's `schema.js`: an offering has no long-form
 * body, so there is nothing here for a markdown pipeline to validate — only
 * structured fields. One validator, two consumers: the build (via `list.ts`,
 * which refuses to publish an invalid offering) and `scripts/offerings-check.mjs`
 * (which fails CI and tells the author what to fix). Plain JS with JSDoc so
 * bare node can import it without a build step — same reasoning as blog's.
 *
 * No `cover` field, unlike blog. A blog post folder can hold several images
 * and only one is the cover, so blog needs an explicit field to say which.
 * An offering has no content folder full of images at all — cover photos are
 * processed once by `scripts/images.sh` straight into
 * `static/images/offerings/<slug>-{768,1280}.webp` + `<slug>.webp`, so "the
 * cover" is unambiguous from the offering's own slug. `coverAlt` stays
 * required (accessibility, and it's indexed); `coverWidth`/`coverHeight` stay
 * required too, since without a build manifest (blog's sharp pipeline writes
 * one; `images.sh` does not) nothing else can supply intrinsic dimensions for
 * a layout-stable `<img>`.
 */

import { isOfferingCategorySlug, OFFERING_CATEGORY_SLUGS } from '../../content/offeringCategories.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** `wa.me` phone shape: digits only, country code included, no `+`/spaces/dashes. */
const WHATSAPP_RE = /^[1-9]\d{6,14}$/;

/** Description bounds. A card blurb, not a meta description — shorter than blog's. */
export const DESCRIPTION_MIN = 60;
export const DESCRIPTION_MAX = 200;
export const TITLE_MAX = 60;

/**
 * @typedef {object} OfferingFrontmatter
 * @property {string} title
 * @property {string} category
 * @property {string} dateStart
 * @property {string} [dateEnd]
 * @property {string} [location]
 * @property {string} [price]
 * @property {string} [whatsapp]
 * @property {string} [instagram]
 * @property {string} coverAlt
 * @property {number} coverWidth
 * @property {number} coverHeight
 * @property {string} description
 * @property {boolean} draft
 */

/**
 * @typedef {object} ValidationResult
 * @property {string[]} errors    Block publication.
 * @property {string[]} warnings  Worth fixing, do not block.
 */

/**
 * YAML turns an unquoted `2026-08-05` into a Date, and a quoted one into a
 * string. Both land here as the same `YYYY-MM-DD` string, exactly as blog's
 * `asDateString` does.
 * @param {unknown} value
 * @returns {string|undefined}
 */
function asDateString(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

/**
 * @param {Record<string, unknown>} raw  Whatever gray-matter parsed.
 * @returns {OfferingFrontmatter}
 */
export function normalizeOfferingFrontmatter(raw) {
  const data = raw ?? {};
  return {
    title: typeof data.title === 'string' ? data.title.trim() : '',
    category: typeof data.category === 'string' ? data.category.trim() : '',
    dateStart: asDateString(data.dateStart) ?? '',
    dateEnd: asDateString(data.dateEnd),
    location: typeof data.location === 'string' && data.location.trim() ? data.location.trim() : undefined,
    price: typeof data.price === 'string' && data.price.trim() ? data.price.trim() : undefined,
    whatsapp: typeof data.whatsapp === 'string' && data.whatsapp.trim() ? data.whatsapp.trim() : undefined,
    instagram: typeof data.instagram === 'string' && data.instagram.trim() ? data.instagram.trim() : undefined,
    coverAlt: typeof data.coverAlt === 'string' ? data.coverAlt.trim() : '',
    coverWidth: typeof data.coverWidth === 'number' ? data.coverWidth : 0,
    coverHeight: typeof data.coverHeight === 'number' ? data.coverHeight : 0,
    description: typeof data.description === 'string' ? data.description.trim() : '',
    draft: data.draft === true
  };
}

/**
 * @param {OfferingFrontmatter} fm  Normalized frontmatter.
 * @param {string} slug             Content directory name.
 * @returns {ValidationResult}
 */
export function validateOfferingFrontmatter(fm, slug) {
  /** @type {string[]} */ const errors = [];
  /** @type {string[]} */ const warnings = [];

  if (!SLUG_RE.test(slug)) {
    errors.push(`slug "${slug}" must be lowercase kebab-case (a-z, 0-9, single hyphens)`);
  }

  if (!fm.title) errors.push('title is required');
  else if (fm.title.length > TITLE_MAX) {
    warnings.push(`title is ${fm.title.length} chars; cards truncate past ${TITLE_MAX}`);
  }

  if (!isOfferingCategorySlug(fm.category)) {
    errors.push(
      `category "${fm.category}" is not registered; expected one of ${OFFERING_CATEGORY_SLUGS.join(', ')} (add a new one in src/content/offeringCategories.js)`
    );
  }

  if (!DATE_RE.test(fm.dateStart) || Number.isNaN(Date.parse(fm.dateStart))) {
    errors.push(`dateStart "${fm.dateStart}" must be a real date in YYYY-MM-DD form`);
  }
  if (fm.dateEnd !== undefined) {
    if (!DATE_RE.test(fm.dateEnd) || Number.isNaN(Date.parse(fm.dateEnd))) {
      errors.push(`dateEnd "${fm.dateEnd}" must be a real date in YYYY-MM-DD form`);
    } else if (Date.parse(fm.dateEnd) < Date.parse(fm.dateStart)) {
      errors.push(`dateEnd (${fm.dateEnd}) is before dateStart (${fm.dateStart})`);
    }
  }

  if (fm.whatsapp !== undefined && !WHATSAPP_RE.test(fm.whatsapp)) {
    errors.push(
      `whatsapp "${fm.whatsapp}" must be digits only, country code included, no "+"/spaces/dashes (the wa.me shape)`
    );
  }

  if (fm.instagram !== undefined && !/^https:\/\/(www\.)?instagram\.com\//.test(fm.instagram)) {
    errors.push(`instagram "${fm.instagram}" must be a full https://instagram.com/... URL`);
  }

  if (!fm.coverAlt) errors.push('coverAlt is required (accessibility, and it is indexed)');
  if (!fm.coverWidth || !fm.coverHeight) {
    errors.push(
      'coverWidth and coverHeight are required — read them from the ffprobe output scripts/images.sh prints'
    );
  }

  if (!fm.description) {
    errors.push('description is required (the card blurb)');
  } else if (fm.description.length > DESCRIPTION_MAX) {
    errors.push(`description is ${fm.description.length} chars; cards truncate past ${DESCRIPTION_MAX}`);
  } else if (fm.description.length < DESCRIPTION_MIN) {
    warnings.push(`description is ${fm.description.length} chars; ${DESCRIPTION_MIN}-${DESCRIPTION_MAX} reads better on a card`);
  }

  return { errors, warnings };
}
