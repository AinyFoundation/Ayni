import { error } from '@sveltejs/kit';
import { getPost, listSlugs, relatedPosts } from '$lib/blog/list';
import { renderPost } from '$lib/blog/render.server';
import { ogImageFor, toCard, toCards } from '$lib/blog/cards.server';
import { ctaFor } from '$lib/blog/cta';
import { AUTHOR_BY_KEY } from '$content/authors.js';
import type { EntryGenerator, PageServerLoad } from './$types';

/**
 * Tell the prerenderer which posts exist. Without this it would only find the
 * ones linked from a crawled page, so an unlinked post would silently never
 * be built.
 */
export const entries: EntryGenerator = () => listSlugs().map((slug) => ({ slug }));

export const load: PageServerLoad = async ({ params }) => {
  const post = getPost(params.slug);
  if (!post) error(404, `No such post: ${params.slug}`);

  const { html, headings } = await renderPost(post.body, params.slug);

  return {
    post: toCard(post.summary),
    html,
    /** The rail only earns its space on a post with real structure. */
    headings: headings.filter((h) => h.depth === 2),
    author: AUTHOR_BY_KEY.get(post.summary.author) ?? null,
    cta: ctaFor(post.summary),
    related: toCards(relatedPosts(post.summary)),
    ogImage: ogImageFor(post.summary)
  };
};
