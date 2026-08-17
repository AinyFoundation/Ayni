/**
 * The offering index.
 *
 * Reads every `src/content/offerings/<slug>/index.md` at build time, parses
 * frontmatter, and returns metadata only — there is no body to render, so
 * unlike blog's `list.ts` this never needs a paired `render.server.ts`.
 *
 * Invalid frontmatter throws rather than silently dropping the entry, same
 * reasoning as blog: a listing that vanishes without saying why is the worst
 * failure mode for a folder-driven system.
 */

import matter from 'gray-matter';
import { normalizeOfferingFrontmatter, validateOfferingFrontmatter } from './schema.js';
import { OFFERING_CATEGORY_BY_SLUG } from '../../content/offeringCategories.js';
import type { OfferingSummary, OfferingCoverImage } from './types';

/** Raw sources, inlined at build. Keys look like /src/content/offerings/<slug>/index.md */
const SOURCES = import.meta.glob('/src/content/offerings/*/index.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

/**
 * The build's own date, and the ONLY thing `isPast` below can be measured
 * against here — there is no reader and no browser at build time. It is a
 * starting value, not the truth: `clock.svelte.ts` recomputes against the
 * reader's clock as soon as the page mounts. See the note on
 * `OfferingSummary.isPast`.
 */
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const slugFromPath = (path: string): string => path.split('/').at(-2) ?? '';

/** Cover image, resolved purely from the slug — see schema.js's header comment. */
function coverFor(slug: string, width: number, height: number, alt: string): OfferingCoverImage {
  return {
    src: `/images/offerings/${slug}.webp`,
    srcset: `/images/offerings/${slug}-768.webp 768w, /images/offerings/${slug}-1280.webp 1280w, /images/offerings/${slug}.webp ${width}w`,
    width,
    height,
    alt
  };
}

/** @throws if frontmatter is invalid, naming the file and every problem. */
function parse(path: string, source: string): OfferingSummary {
  const { data } = matter(source);
  const slug = slugFromPath(path);
  const fm = normalizeOfferingFrontmatter(data as Record<string, unknown>);

  const { errors } = validateOfferingFrontmatter(fm, slug);
  if (errors.length > 0) {
    throw new Error(`Invalid frontmatter in ${path}:\n  - ${errors.join('\n  - ')}`);
  }

  const category = OFFERING_CATEGORY_BY_SLUG.get(fm.category);
  // Unreachable once validateOfferingFrontmatter has passed — category is
  // checked there. Guarded anyway so a future validator change fails loudly
  // here instead of silently reading undefined.
  if (!category) throw new Error(`Invalid frontmatter in ${path}:\n  - category "${fm.category}" not found`);

  return {
    ...fm,
    slug,
    href: `/offerings/${slug}`,
    isPast: (fm.dateEnd ?? fm.dateStart) < BUILD_DATE,
    cover: coverFor(slug, fm.coverWidth, fm.coverHeight, fm.coverAlt),
    categoryLabel: category.label,
    categorySingular: category.singular,
    categoryHue: category.hue
  };
}

/** Ascending by start date (soonest/oldest first), ties broken by slug. */
const byDate = (a: OfferingSummary, b: OfferingSummary): number =>
  Date.parse(a.dateStart) - Date.parse(b.dateStart) || a.slug.localeCompare(b.slug);

/** Published offerings, ascending by date. Drafts are excluded everywhere. */
export function listOfferings(): OfferingSummary[] {
  return Object.entries(SOURCES)
    .map(([path, source]) => parse(path, source))
    .filter((offering) => !offering.draft)
    .sort(byDate);
}

/** Published offerings in one category, ascending by date. */
export function listOfferingsByCategory(category: string): OfferingSummary[] {
  return listOfferings().filter((offering) => offering.category === category);
}

/** @returns null when no such published offering exists, so routes can 404 cleanly. */
export function getOffering(slug: string): OfferingSummary | null {
  const path = `/src/content/offerings/${slug}/index.md`;
  const source = SOURCES[path];
  if (source === undefined) return null;

  const parsed = parse(path, source);
  return parsed.draft ? null : parsed;
}

/** Every published slug — feeds the prerenderer's `entries()`. */
export function listOfferingSlugs(): string[] {
  return listOfferings().map((offering) => offering.slug);
}
