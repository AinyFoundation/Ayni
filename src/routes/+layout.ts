/**
 * Site-wide page options.
 *
 * `ssr: true` matters more than it looks. With adapter-static, `prerender`
 * alone still writes a file per route — but with SSR off that file is a
 * client-boot shell. The homepage measured 2,529 bytes containing none of
 * its own copy, which means every crawler, and in particular the AI
 * crawlers that parse HTML directly without executing JS, saw an empty
 * document. Rendering is now done at build time and the markup ships.
 *
 * Nothing in the scroll journey needs the browser at module scope:
 * `scrollDriver.ts` guards on `typeof window`/`typeof CSS`, and every
 * component confines DOM access to `onMount`. See
 * `docs/research/blog-system/research.md` for the audit.
 */
export const prerender = true;
export const ssr = true;
