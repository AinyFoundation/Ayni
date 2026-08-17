import { listPosts } from '$lib/blog/list';
import { listOfferings } from '$lib/offerings/list';
import { TOPIC_SLUGS } from '$content/topics.js';
import { absolute } from '$lib/seo/site';
import { staticRoutes } from '$lib/seo/routes';
import { escapeXml } from '$lib/seo/xml';
import type { RequestHandler } from './$types';

/**
 * The sitemap lists only URLs this build produced.
 *
 * Static pages come from the route glob, so pages added later appear here
 * automatically and pages that do not exist never do. A sitemap advertising a
 * 404 is a crawl-budget leak and a trust signal in the wrong direction.
 */
export const prerender = true;

const today = () => new Date().toISOString().slice(0, 10);

export const GET: RequestHandler = async () => {
  const posts = listPosts();
  const offerings = listOfferings();

  const urls: Array<{ path: string; lastmod: string; priority: string }> = [
    ...staticRoutes().map((path) => ({
      path,
      lastmod: path === '/blog' ? (posts[0]?.lastmod ?? today()) : today(),
      priority: path === '/' ? '1.0' : '0.7'
    })),
    /**
     * Pillars that actually hold something. Every cluster is prerendered so a
     * post always has a hub to link back to, but an empty pillar is a page
     * with nothing on it — submitting it spends the same crawl budget the
     * paragraph above is trying to protect.
     */
    ...TOPIC_SLUGS.flatMap((slug) => {
      const newest = posts.find((post) => post.topic === slug);
      return newest
        ? [{ path: `/blog/topic/${slug}`, lastmod: newest.lastmod, priority: '0.6' }]
        : [];
    }),
    ...posts.map((post) => ({ path: post.href, lastmod: post.lastmod, priority: '0.8' })),
    /**
     * Offerings stay listed after their date passes — the pages remain live
     * and useful as a record of what the sanctuary actually runs, so removing
     * them from the sitemap would hide a page that still answers a search.
     * They do drop in priority: what is still ahead is what a reader can act
     * on. `lastmod` is the offering's own end date rather than today, so a
     * finished offering stops claiming freshness it does not have.
     */
    ...offerings.map((offering) => ({
      path: offering.href,
      lastmod: offering.dateEnd ?? offering.dateStart,
      priority: offering.isPast ? '0.4' : '0.8'
    }))
  ];

  const body = urls
    .map(
      ({ path, lastmod, priority }) => `  <url>
    <loc>${escapeXml(absolute(path))}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' }
  });
};
