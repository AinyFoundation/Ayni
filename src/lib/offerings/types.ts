import type { OfferingFrontmatter } from './schema.js';

export type { OfferingFrontmatter };

/** A resolved cover image — path convention only, no manifest lookup. */
export type OfferingCoverImage = {
  src: string;
  srcset: string;
  width: number;
  height: number;
  alt: string;
};

/**
 * An offering as everything outside the content folder sees it: frontmatter
 * plus what's derived from where the file sits.
 *
 * `isPast` here is the BUILD-time answer, and it is not the one to render
 * with. It exists for two jobs: the sitemap builder, which runs at build with
 * no browser to ask and wants a build-time answer anyway, and as the
 * server-render fallback that keeps hydration matching. Every user-facing
 * "is this past?" goes through `isPastNow()` in `clock.svelte.ts`, which
 * compares against the READER'S clock — otherwise a finished offering keeps
 * its upcoming badge and its upcoming sort position until someone redeploys.
 */
export type OfferingSummary = OfferingFrontmatter & {
  /** Directory name under src/content/offerings. */
  slug: string;
  /** Site-relative URL. */
  href: string;
  /** Build-time only — render through `isPastNow()`, never this directly. */
  isPast: boolean;
  /** Cover image, resolved by naming convention from the slug. */
  cover: OfferingCoverImage;
  /** Human label for the category, e.g. "Ceremonies". */
  categoryLabel: string;
  /** One of them, e.g. "ceremony" — for the "Next ceremony" badge. */
  categorySingular: string;
  /** Wing-hue token name backing the category's accent, e.g. "gold". */
  categoryHue: string;
};
