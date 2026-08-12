/**
 * The post index.
 *
 * Reads every `src/content/blog/<slug>/index.md` at build time, parses
 * frontmatter, and returns metadata only. Never returns body HTML — that
 * costs a markdown pipeline, and this module is called from places (the
 * homepage strip, feeds, the sitemap) that only need titles and dates.
 *
 * Invalid frontmatter throws rather than silently dropping the post. A post
 * that vanishes from the build without saying why is the worst failure mode
 * for a folder-driven blog: the author sees nothing and has no lead.
 */

import matter from 'gray-matter';
import { normalizeFrontmatter, validateFrontmatter, readingMinutes } from './schema.js';
import type { PostSummary } from './types';

/** Raw sources, inlined at build. Keys look like /src/content/blog/<slug>/index.md */
const SOURCES = import.meta.glob('/src/content/blog/*/index.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

const slugFromPath = (path: string): string => path.split('/').at(-2) ?? '';

/**
 * Parse one source file into a summary and its body.
 * @throws if frontmatter is invalid, naming the file and every problem.
 */
function parse(path: string, source: string): { summary: PostSummary; body: string } {
  const { data, content } = matter(source);
  const slug = slugFromPath(path);
  const fm = normalizeFrontmatter(data as Record<string, unknown>);

  const { errors } = validateFrontmatter(fm, slug);
  if (errors.length > 0) {
    throw new Error(`Invalid frontmatter in ${path}:\n  - ${errors.join('\n  - ')}`);
  }

  return {
    summary: {
      ...fm,
      slug,
      href: `/blog/${slug}`,
      readingMinutes: readingMinutes(content),
      lastmod: fm.updated ?? fm.date
    },
    body: content
  };
}

/** Newest first, ties broken by slug so the order is stable across builds. */
const byNewest = (a: PostSummary, b: PostSummary): number =>
  Date.parse(b.date) - Date.parse(a.date) || a.slug.localeCompare(b.slug);

/**
 * Published posts with their markdown bodies, newest first.
 *
 * Only the feeds want this: they render every post in one pass, and asking
 * `getPost` for each slug would parse the whole corpus once per item.
 */
export function listPostsWithBodies(): Array<{ summary: PostSummary; body: string }> {
  return Object.entries(SOURCES)
    .map(([path, source]) => parse(path, source))
    .filter(({ summary }) => !summary.draft)
    .sort((a, b) => byNewest(a.summary, b.summary));
}

/**
 * Published posts, newest first. Drafts are excluded everywhere — index,
 * feeds, sitemap, related, and the homepage strip all read this.
 */
export function listPosts(): PostSummary[] {
  return listPostsWithBodies().map(({ summary }) => summary);
}

/** Published posts in one cluster, newest first. */
export function listPostsByTopic(topic: string): PostSummary[] {
  return listPosts().filter((post) => post.topic === topic);
}

/**
 * One post's summary and raw markdown body.
 * @returns null when no such published post exists, so routes can 404 cleanly.
 */
export function getPost(slug: string): { summary: PostSummary; body: string } | null {
  const path = `/src/content/blog/${slug}/index.md`;
  const source = SOURCES[path];
  if (source === undefined) return null;

  const parsed = parse(path, source);
  return parsed.summary.draft ? null : parsed;
}

/** Every published slug — feeds the prerenderer's `entries()`. */
export function listSlugs(): string[] {
  return listPosts().map((post) => post.slug);
}

/**
 * Posts sharing tags with `post`, best match first, capped at `limit`.
 * Scored by shared-tag count, ties broken by recency (listPosts is already
 * sorted, and Array.prototype.sort is stable).
 */
export function relatedPosts(post: PostSummary, limit = 3): PostSummary[] {
  const tags = new Set(post.tags);
  return listPosts()
    .filter((other) => other.slug !== post.slug)
    .map((other) => ({
      other,
      score:
        other.tags.filter((tag) => tags.has(tag)).length + (other.topic === post.topic ? 1 : 0)
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ other }) => other);
}
