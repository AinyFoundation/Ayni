/**
 * The post frontmatter contract.
 *
 * One validator, two consumers: the build (via `list.ts`, which refuses to
 * publish an invalid post) and `scripts/blog-check.mjs` (which fails CI and
 * tells the author what to fix). Plain JS with JSDoc so bare node can import
 * it without a build step.
 *
 * Errors block. Warnings are advice — the split is deliberate: a 200-char
 * description gets truncated in results, which is real damage, while a
 * 90-char one merely wastes space Google would have given you.
 */

import { isTopicSlug, TOPIC_SLUGS } from '../../content/topics.js';
import { isAuthorKey, DEFAULT_AUTHOR } from '../../content/authors.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Description bounds. Above MAX search results truncate; below MIN is wasted space. */
export const DESCRIPTION_MIN = 110;
export const DESCRIPTION_MAX = 160;
/** Titles longer than this get cut off in results. */
export const TITLE_MAX = 60;

/**
 * @typedef {object} Frontmatter
 * @property {string} title
 * @property {string} description
 * @property {string} date
 * @property {string} [updated]
 * @property {string} topic
 * @property {string[]} tags
 * @property {string} [cover]
 * @property {string} [coverAlt]
 * @property {string} author
 * @property {boolean} draft
 * @property {string} [cta]
 */

/**
 * @typedef {object} ValidationResult
 * @property {string[]} errors    Block publication.
 * @property {string[]} warnings  Worth fixing, do not block.
 */

/**
 * YAML turns an unquoted `2026-08-05` into a Date, and a quoted one into a
 * string. Authors should not have to know that, so both land here as the same
 * `YYYY-MM-DD` string. Dates parse as UTC midnight, so slicing the ISO string
 * cannot shift the day.
 *
 * @param {unknown} value
 * @returns {string|undefined}
 */
function asDateString(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

/**
 * Fill defaults so downstream code never branches on absent optional fields.
 * Does not validate — call {@link validateFrontmatter} for that.
 *
 * @param {Record<string, unknown>} raw  Whatever gray-matter parsed.
 * @returns {Frontmatter}
 */
export function normalizeFrontmatter(raw) {
  const data = raw ?? {};
  return {
    title: typeof data.title === 'string' ? data.title.trim() : '',
    description: typeof data.description === 'string' ? data.description.trim() : '',
    date: asDateString(data.date) ?? '',
    updated: asDateString(data.updated),
    topic: typeof data.topic === 'string' ? data.topic.trim() : '',
    tags: Array.isArray(data.tags) ? data.tags.filter((t) => typeof t === 'string' && t.trim()) : [],
    cover: typeof data.cover === 'string' && data.cover.trim() ? data.cover.trim() : undefined,
    coverAlt: typeof data.coverAlt === 'string' ? data.coverAlt.trim() : undefined,
    author: typeof data.author === 'string' && data.author.trim() ? data.author.trim() : DEFAULT_AUTHOR,
    draft: data.draft === true,
    cta: typeof data.cta === 'string' && data.cta.trim() ? data.cta.trim() : undefined
  };
}

/**
 * @param {Frontmatter} fm      Normalized frontmatter.
 * @param {string} slug         Post directory name.
 * @param {string[]} [siblingFiles]  Filenames colocated with index.md, for cover checking.
 * @returns {ValidationResult}
 */
export function validateFrontmatter(fm, slug, siblingFiles) {
  /** @type {string[]} */ const errors = [];
  /** @type {string[]} */ const warnings = [];

  if (!SLUG_RE.test(slug)) {
    errors.push(`slug "${slug}" must be lowercase kebab-case (a-z, 0-9, single hyphens)`);
  }

  if (!fm.title) errors.push('title is required');
  else if (fm.title.length > TITLE_MAX) {
    warnings.push(`title is ${fm.title.length} chars; results cut off past ${TITLE_MAX}`);
  }

  if (!fm.description) {
    errors.push('description is required (it is the meta description and the feed summary)');
  } else if (fm.description.length > DESCRIPTION_MAX) {
    errors.push(
      `description is ${fm.description.length} chars; results truncate past ${DESCRIPTION_MAX}`
    );
  } else if (fm.description.length < DESCRIPTION_MIN) {
    warnings.push(
      `description is ${fm.description.length} chars; ${DESCRIPTION_MIN}-${DESCRIPTION_MAX} uses the space search gives you`
    );
  }

  if (!DATE_RE.test(fm.date) || Number.isNaN(Date.parse(fm.date))) {
    errors.push(`date "${fm.date}" must be a real date in YYYY-MM-DD form`);
  }
  if (fm.updated !== undefined) {
    if (!DATE_RE.test(fm.updated) || Number.isNaN(Date.parse(fm.updated))) {
      errors.push(`updated "${fm.updated}" must be a real date in YYYY-MM-DD form`);
    } else if (Date.parse(fm.updated) < Date.parse(fm.date)) {
      errors.push(`updated (${fm.updated}) is before date (${fm.date})`);
    }
  }

  if (!isTopicSlug(fm.topic)) {
    errors.push(`topic "${fm.topic}" is not a cluster; expected one of ${TOPIC_SLUGS.join(', ')}`);
  }

  if (!isAuthorKey(fm.author)) {
    errors.push(`author "${fm.author}" is not in src/content/authors.js`);
  }

  if (fm.tags.length === 0) {
    warnings.push('no tags; related-post matching has nothing to work with');
  }

  if (fm.cover) {
    if (fm.cover.includes('/')) {
      errors.push(`cover "${fm.cover}" must be a bare filename colocated with index.md`);
    } else if (siblingFiles && !siblingFiles.includes(fm.cover)) {
      errors.push(`cover "${fm.cover}" does not exist in the post folder`);
    }
    if (!fm.coverAlt) {
      errors.push('coverAlt is required whenever cover is set (accessibility, and it is indexed)');
    }
  } else {
    warnings.push('no cover image; the post has no Open Graph image and no card thumbnail');
  }

  if (fm.cta !== undefined && !fm.cta.startsWith('/')) {
    errors.push(`cta "${fm.cta}" must be a site-relative path starting with /`);
  }

  return { errors, warnings };
}

/** Words per minute used for the reading-time estimate. */
const WPM = 200;

/**
 * @param {string} markdown  Post body, frontmatter already stripped.
 * @returns {number} whole minutes, never less than 1.
 */
export function readingMinutes(markdown) {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WPM));
}
