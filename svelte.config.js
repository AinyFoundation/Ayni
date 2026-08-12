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
 */
const PLANNED_ROUTES = new Set([
  '/wings',
  '/about',
  '/community',
  '/sanctuary',
  '/stay'
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
       * A blog with no posts yet is a normal state, not a build failure:
       * /blog/[slug] has nothing to enumerate until the first file lands in
       * src/content/blog. Any OTHER unseen prerenderable route is still a
       * real problem and still reported.
       */
      handleUnseenRoutes: ({ routes }) => {
        const unexpected = routes.filter((route) => route !== '/blog/[slug]');
        if (unexpected.length > 0) {
          throw new Error(`Prerenderable routes never crawled: ${unexpected.join(', ')}`);
        }
        console.warn('[prerender] no blog posts yet — /blog/[slug] has nothing to build');
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
