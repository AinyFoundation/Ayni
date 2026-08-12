import { listPostsWithBodies } from '$lib/blog/list';
import { enclosureFor } from '$lib/blog/cards.server';
import { renderPost } from '$lib/blog/render.server';
import { SITE, absolute } from '$lib/seo/site';
import { cdata, escapeXml, rfc822 } from '$lib/seo/xml';
import type { RequestHandler } from './$types';

/**
 * RSS 2.0.
 *
 * A feed is direct distribution with no algorithm in between, which for a
 * project whose constitution is sovereignty is the ideologically correct
 * channel rather than a legacy checkbox.
 *
 * Full post bodies ride along in `<content:encoded>`: a feed carrying only the
 * description is a notification, and the whole point of the channel is that a
 * subscriber can read without coming back to the site. `<description>` stays
 * the summary, which is what readers show in a list view.
 */
export const prerender = true;

export const GET: RequestHandler = async () => {
  const posts = listPostsWithBodies();
  const updated = posts[0]?.summary.lastmod;

  const items = (
    await Promise.all(
      posts.map(async ({ summary: post, body }) => {
        const url = absolute(post.href);
        const image = enclosureFor(post);
        const { html } = await renderPost(body, post.slug, url);
        return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(post.date)}</pubDate>
      <description>${escapeXml(post.description)}</description>
      <content:encoded>${cdata(html)}</content:encoded>
      <category>${escapeXml(post.topic)}</category>${
        image
          ? `\n      <enclosure url="${absolute(image.url)}" length="${image.bytes}" type="image/jpeg" />`
          : ''
      }
    </item>`;
      })
    )
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE.blogTitle)}</title>
    <link>${absolute('/blog')}</link>
    <description>${escapeXml(SITE.blogDescription)}</description>
    <language>${SITE.locale}</language>
    <atom:link href="${absolute('/rss.xml')}" rel="self" type="application/rss+xml" />${
      updated ? `\n    <lastBuildDate>${rfc822(updated)}</lastBuildDate>` : ''
    }
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' }
  });
};
