/**
 * Post summaries with their cover image resolved.
 *
 * Cards need the image derivatives, and those live in the build manifest that
 * only the server can read. Resolving here keeps every card surface — the
 * homepage strip, the blog index, the pillar pages, the related block —
 * fed by one function instead of four near-identical ones.
 */

import { imageVariants } from './render.server';
import { TOPIC_BY_SLUG } from '../../content/topics.js';
import type { PostCard, PostSummary } from './types';

/**
 * The shapes this module produces are declared in `./types` so that client
 * components never name a `.server` module. Re-exported here because that is
 * where callers expect the type of what `toCard` returns to live.
 */
export type { PostCard, ResolvedImage } from './types';

export function toCard(post: PostSummary): PostCard {
  const variants = post.cover ? imageVariants(post.slug, post.cover) : null;

  return {
    ...post,
    coverImage: variants ? { ...variants, alt: post.coverAlt ?? '' } : null,
    topicLabel: TOPIC_BY_SLUG.get(post.topic)?.label ?? post.topic,
    topicHref: `/blog/topic/${post.topic}`
  };
}

export const toCards = (posts: PostSummary[]): PostCard[] => posts.map(toCard);

/**
 * Absolute-ready Open Graph image for a post: its own cover, or null so the
 * caller can fall back to the site default. Always the JPEG derivative —
 * social scrapers still mishandle AVIF and WebP.
 */
export function ogImageFor(post: PostSummary): string | null {
  if (!post.cover) return null;
  return imageVariants(post.slug, post.cover)?.fallback ?? null;
}

/** Cover derivative with its byte size, for the RSS enclosure. */
export function enclosureFor(post: PostSummary): { url: string; bytes: number } | null {
  if (!post.cover) return null;
  const variants = imageVariants(post.slug, post.cover);
  if (!variants) return null;
  return { url: variants.fallback, bytes: variants.fallbackBytes };
}
