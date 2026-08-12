/**
 * Where a post sends a reader who wants more, and whether that place exists.
 *
 * The destinations in `src/content/topics.js` are aspirational: `/sanctuary`,
 * `/wings/energy` and `/about` are linked from the site's own navigation and
 * none of them have a route yet. Shipping a call to action that 404s is worse
 * than shipping none — it wastes the click and it teaches crawlers the site is
 * broken. So every destination is checked against the routes that actually
 * exist at build time, and an unresolvable one yields null.
 *
 * `scripts/blog-check.mjs` enforces the same rule at author time, so the skill
 * finds out before the build does.
 */

import { TOPIC_BY_SLUG } from '../../content/topics.js';
import { routeExists } from '$lib/seo/routes';
import type { PostSummary } from './types';

export type Cta = {
  href: string;
  label: string;
  blurb: string;
};

/**
 * The end-of-post call to action for a post: its `cta` frontmatter override if
 * it has one, otherwise its cluster's default.
 *
 * @returns null when the destination does not exist yet, or when the post's
 *          topic is unknown. Callers render nothing rather than a dead link.
 */
export function ctaFor(post: PostSummary): Cta | null {
  const topic = TOPIC_BY_SLUG.get(post.topic);
  if (!topic) return null;

  const href = post.cta ?? topic.cta.href;
  if (!routeExists(href)) return null;

  return { href, label: topic.cta.label, blurb: topic.cta.blurb };
}
