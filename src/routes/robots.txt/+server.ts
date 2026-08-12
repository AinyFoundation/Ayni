import { absolute } from '$lib/seo/site';
import type { RequestHandler } from './$types';

/**
 * robots.txt.
 *
 * Open to everything, including AI crawlers. That is a deliberate choice, not
 * an oversight: the point of these notes is to be found and cited, and the
 * content is published to be read. Blocking GPTBot or ClaudeBot here would
 * remove the site from exactly the surfaces that now decide what gets shown.
 *
 * No `llms.txt` is served. As of 2026 the major AI crawlers skip it and parse
 * HTML directly — see docs/research/blog-system/research.md.
 */
export const prerender = true;

export const GET: RequestHandler = async () => {
  const body = `User-agent: *
Allow: /

Sitemap: ${absolute('/sitemap.xml')}
`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
};
