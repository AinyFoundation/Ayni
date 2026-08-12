import type { Frontmatter } from './schema.js';

export type { Frontmatter };

/**
 * A post as everything outside the renderer sees it: frontmatter plus the
 * things derived from where the file sits and how long it is. No HTML — the
 * body only ever exists inside a server load, so the markdown toolchain
 * never reaches the client bundle.
 */
export type PostSummary = Frontmatter & {
  /** Directory name under src/content/blog. */
  slug: string;
  /** Site-relative URL. */
  href: string;
  /** Whole minutes at 200wpm, never less than 1. */
  readingMinutes: number;
  /** `updated ?? date` — what sitemap lastmod and dateModified both want. */
  lastmod: string;
};

/** One entry in a post's table of contents. */
export type Heading = {
  depth: 2 | 3;
  id: string;
  text: string;
};

/** A processed image, as the build manifest records it. */
export type ImageVariants = {
  width: number;
  height: number;
  /** srcset strings, ready to drop into <source>. */
  avif: string;
  webp: string;
  /** JPEG srcset, for the <img> itself — the ladder clients without AVIF read. */
  jpg: string;
  /** Widest rendered file, used as the <img> src fallback and the OG image. */
  fallback: string;
  /** Byte size of `fallback`. RSS <enclosure> requires a length attribute. */
  fallbackBytes: number;
  /** Inline base64 blur-up, painted while the real file arrives. */
  lqip: string;
};

/** A post's cover, resolved: every derivative plus the alt text to render it with. */
export type ResolvedImage = ImageVariants & { alt: string };

/**
 * A summary with its cover and cluster resolved — what card components receive.
 *
 * Built by `cards.server.ts`, but declared here on purpose: the components that
 * consume it run in the browser. A type living in a `.server` module survives
 * only while every consumer writes `import type`, because the keyword is erased
 * before SvelteKit's illegal-import guard ever sees the specifier. Drop the
 * `type` once and the whole unified + sharp toolchain is dragged into the client
 * bundle, and the error names the import rather than the mistake.
 */
export type PostCard = PostSummary & {
  /** null when the post ships no cover, or when derivatives are missing. */
  coverImage: ResolvedImage | null;
  /** Human label for the cluster, e.g. "Farm & Food". */
  topicLabel: string;
  /** Pillar page for the cluster. */
  topicHref: string;
};

export type RenderedPost = {
  /** Body HTML. Built at prerender time, never in the browser. */
  html: string;
  /** h2/h3 outline, for the table of contents rail. */
  headings: Heading[];
};
