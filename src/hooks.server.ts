/**
 * Server hooks. Today there is exactly one job: stamp `<html lang>`.
 *
 * This runs during PRERENDERING, which is the only reason the approach works
 * on a fully static build. Prerendering is not a separate code path — it
 * drives the normal server pipeline (`server.respond()`), so `handle` and its
 * `transformPageChunk` execute once per emitted file and every page in
 * `build/` ships with the right language already in its markup. Nothing is
 * fixed up in the browser, which matters because `lang` is read by crawlers
 * and screen readers that never run scripts.
 *
 * Why `lang` is worth the hook at all: it is the language signal Bing
 * actually reads (it largely ignores hreflang), it drives screen-reader
 * pronunciation and `:lang()` selectors, and it is what tells a browser
 * whether to offer translation. Both reference systems for this project
 * hardcoded `lang="en"` site-wide and served it to Spanish readers — an
 * easy thing to get wrong precisely because nothing visibly breaks.
 */

import type { Handle } from '@sveltejs/kit';
import { HTML_LANG, splitLocale } from '$lib/i18n';

export const handle: Handle = ({ event, resolve }) => {
  const { locale } = splitLocale(event.url.pathname);

  return resolve(event, {
    /**
     * `%lang%` is a custom placeholder in `app.html`. SvelteKit requires
     * `%sveltekit.head%` and `%sveltekit.body%` and leaves anything else
     * alone, so it survives untouched until this replacement. It sits in the
     * opening `<html>` tag, which is always in the first chunk — chunks split
     * at `%sveltekit.head%` and later boundaries.
     */
    transformPageChunk: ({ html }) => html.replace('%lang%', HTML_LANG[locale])
  });
};
