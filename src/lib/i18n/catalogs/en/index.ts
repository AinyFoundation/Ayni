/**
 * The English catalog barrel — and, because `Messages` is derived from it,
 * the schema every other language is checked against.
 *
 * Domains are split by SURFACE, not by component: a string used by both the
 * homepage strip and the blog index belongs to `blog`, wherever it renders.
 * Three files is deliberate. The reference implementation this is modelled on
 * split eleven ways for an app several times this size; splitting further
 * before a file actually hurts is cost without benefit.
 *
 * There is no `seo` domain. A page's `<title>` and description are that
 * page's words, so they live with the rest of its copy — `home.seo` and
 * `blog.index.meta`. A separate head-metadata domain was tried and removed:
 * it duplicated the blog title that `blog.ts` already owned, which is the
 * precise failure this system exists to prevent. Genuinely shared head copy
 * (the site name, the feed titles) still lives in `$lib/seo/site.ts` and
 * moves here only when the feeds become locale-aware.
 */

import chrome from './chrome';
import home from './home';
import blog from './blog';
import error from './error';

const en = { chrome, home, blog, error };

export default en;
