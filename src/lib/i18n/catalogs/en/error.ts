/**
 * Error pages — what the site shows when SvelteKit's `error()` fires or a
 * static host hands back 404.
 *
 * English is the source of record — see `chrome.ts` for why these files
 * carry no type annotation. `Messages` is derived from this catalog, so
 * annotating would be circular.
 *
 * One block per status, addressed by the same key SvelteKit publishes on
 * `page.status`. Anything outside the named set falls through to
 * `default`, which is the page the framework shows for an unhandled
 * exception during render — defensive copy rather than aspirational.
 *
 * The page itself is one component, one layout, one set of exits: the
 * "actions" block ships here verbatim and the component renders the
 * list as its navigation. The site never puts a button on an error page
 * that does not work; copying the footer's five doors keeps the two in
 * lockstep.
 *
 * Title is a function rather than a literal because the prefix is a
 * status code, which a translation may want to spell out or hide —
 * "404 · Ayni" reads cleanly in English; a language that puts the
 * status at the end renders the same function with the words reordered.
 */

const error = {
  /** Status → copy. Status is the number SvelteKit publishes on
   * `page.status`; the keys below cover the four HTTP statuses the
   * framework can raise plus a generic fallback. */
  pages: {
    /** `error(404, ...)` — the blog `[slug]` route and any other
     * prerendered route whose `load` cannot resolve. */
    404: {
      eyebrow: 'Not found',
      title: 'This page is not here.',
      lead: 'The link may be old, the URL may have a typo, or the page may have moved. The valley is still here, and so are we.'
    },
    /** `error(403, ...)` — kept on the page even though the site does
     * not raise it today: a future wing landing behind a gate should
     * not need to grow the error domain to render correctly. */
    403: {
      eyebrow: 'Off the path',
      title: 'This way is not open.',
      lead: 'Some pages are kept quieter than others. If you arrived here by link, write to us and we will walk you to the right one.'
    },
    /** `error(500, ...)` — the only 5xx a static site can raise today
     * is a SvelteKit-side failure during render. */
    500: {
      eyebrow: 'Something broke',
      title: 'A piece on our end failed.',
      lead: 'We have been told, and we are looking. Try again in a moment, or read the journal while the valley settles.'
    },
    /** `error(503, ...)` — also defensive today; a future maintenance
     * window or rate-limited endpoint should land here. */
    503: {
      eyebrow: 'We are away',
      title: 'The site is being tended to.',
      lead: 'A short maintenance window — try again shortly, or stay for the journal.'
    },
    /** Any status the framework raises that is not in the table above,
     * and the page SvelteKit shows for an unhandled exception during
     * render. Two sentences, no jargon, no apology wall. */
    default: {
      eyebrow: 'Something is off',
      title: 'We could not load this page.',
      lead: 'Try again, head home, or write to us. We read every message.'
    }
  },

  /** The exits every error page exposes. The five destinations mirror
   * `SiteFooter`'s link list — the error page is the footer with the
   * page above it removed, so the two render the same doors and any
   * future addition lands in one place by editing both. Each entry is
   * its own record so the label can move in translation independently
   * of the path it lives at. */
  actions: {
    home: { label: 'Return home', href: '/' },
    offerings: { label: 'See offerings', href: '/#offerings' },
    retreats: { label: 'Find a retreat', href: '/#retreats' },
    journal: { label: 'Read the journal', href: '/blog' },
    contact: { label: 'Write to us', href: '/#contact' }
  },

  /** Page-level metadata. `path` is the URL the visitor actually
   * requested, which the component reads off `page.url` so the
   * canonical is the URL they asked for rather than the site's root. */
  meta: {
    /** `<title>` suffix — the prefix is the status code, set per page
     * in the component because the order matters in translation. */
    suffix: 'Ayni',
    /** Eyebrow the search engine sees in the description. Same value
     * for every status; not a per-status string. */
    noindexHint: 'The requested page could not be found.'
  },

  /** Accessible name for the list of exits. */
  actionsLabel: 'Ways back'
};

export default error;