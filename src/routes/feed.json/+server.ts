import { listPostsWithBodies } from '$lib/blog/list';
import { ogImageFor } from '$lib/blog/cards.server';
import { renderPost } from '$lib/blog/render.server';
import { AUTHOR_BY_KEY } from '$content/authors.js';
import { SITE, absolute } from '$lib/seo/site';
import { rfc3339 } from '$lib/seo/xml';
import type { RequestHandler } from './$types';

/** JSON Feed 1.1 — https://jsonfeed.org/version/1.1 */
export const prerender = true;

export const GET: RequestHandler = async () => {
  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: SITE.blogTitle,
    home_page_url: absolute('/blog'),
    feed_url: absolute('/feed.json'),
    description: SITE.blogDescription,
    language: SITE.locale,
    items: await Promise.all(
      listPostsWithBodies().map(async ({ summary: post, body }) => {
        const url = absolute(post.href);
        const image = ogImageFor(post);
        const author = AUTHOR_BY_KEY.get(post.author);
        const { html } = await renderPost(body, post.slug, url);
        return {
          id: url,
          url,
          title: post.title,
          summary: post.description,
          /**
           * The body, not the description. A reader picks one of content_html
           * and content_text, so shipping the summary as content_text would
           * hand plain-text readers the stub this replaces.
           */
          content_html: html,
          date_published: rfc3339(post.date),
          date_modified: rfc3339(post.lastmod),
          tags: [post.topic, ...post.tags],
          ...(image ? { image: absolute(image) } : {}),
          ...(author ? { authors: [{ name: author.name }] } : {})
        };
      })
    )
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: { 'content-type': 'application/feed+json; charset=utf-8' }
  });
};
