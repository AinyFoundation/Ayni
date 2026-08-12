/**
 * XML escaping for the feed and the sitemap.
 *
 * Hand-rolled rather than a dependency: five replacements is the whole
 * problem, and an unescaped ampersand in a post title is exactly the kind of
 * thing that makes a feed reader reject the whole document silently.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wrap a block of HTML for `<content:encoded>`.
 *
 * CDATA rather than escaping, because a whole post body escaped entity by
 * entity is unreadable and enormous. The one sequence a CDATA section cannot
 * contain is its own terminator, so `]]>` is split across two sections — the
 * standard trick, and invisible to the parser reassembling the text.
 */
export function cdata(html: string): string {
  return `<![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

/** RFC 822 date, which is what RSS 2.0 requires. `2026-08-05` at UTC midnight. */
export function rfc822(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

/** RFC 3339 date-time, which is what JSON Feed requires. */
export function rfc3339(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toISOString();
}
