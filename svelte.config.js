import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Routes the site links to but has not built yet.
 *
 * Before SSR was enabled the prerenderer had no rendered HTML to crawl, so
 * these dead links were invisible. They were always shipping. Until the
 * pages exist they are warnings, not build failures — but anything NOT on
 * this list is a genuine regression and still fails the build.
 *
 * Remove entries as the routes land. `blog-check.mjs` enforces the same
 * rule for blog CTA destinations, which must never ship a 404.
 *
 * `/community` and `/stay` came off this list in the offerings pass: nothing
 * linked to `/community` at all any more, and `/stay`'s only referrer was
 * `RetreatsSection.svelte`, which was orphaned and has been deleted. An
 * allowlist entry with no referrer is not harmless — it silently permits a
 * dead link the day someone adds one back.
 */
const PLANNED_ROUTES = new Set([
  '/wings',
  '/about',
  '/sanctuary'
]);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess()],
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: '404.html',
      precompress: true
    }),
    prerender: {
      /**
       * A blog with no posts, or an offerings list with nothing scheduled,
       * are both normal states rather than build failures: neither
       * /blog/[slug] nor /offerings/[slug] has anything to enumerate until
       * the first file lands in its content folder. Any OTHER unseen
       * prerenderable route is still a real problem and still reported.
       */
      handleUnseenRoutes: ({ routes }) => {
        const empty = new Set(['/blog/[slug]', '/offerings/[slug]']);
        const unexpected = routes.filter((route) => !empty.has(route));
        if (unexpected.length > 0) {
          throw new Error(`Prerenderable routes never crawled: ${unexpected.join(', ')}`);
        }
        for (const route of routes) {
          console.warn(`[prerender] nothing to build yet for ${route}`);
        }
      },
      handleHttpError: ({ path, referrer, message }) => {
        const route = path.split('#')[0];
        if (PLANNED_ROUTES.has(route)) {
          console.warn(`[prerender] not built yet: ${path} (linked from ${referrer})`);
          return;
        }
        throw new Error(message);
      }
    },
    alias: {
      $design: 'src/design',
      $features: 'src/features',
      $kernel: 'src/kernel',
      $content: 'src/content'
    }
  }
};

export default config;
