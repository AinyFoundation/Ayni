<!--
  The site's error page.

  Rendered by SvelteKit for any `error(status, message)` thrown by a
  `load`, and by the static host's 404 fallback (which boots the app
  and routes to here for any URL not matched by a prerendered file).

  Mounts INSIDE `src/routes/+layout.svelte` — SvelteKit does this for
  free, and it is the right thing: the error page inherits the header
  and footer, so the visitor who hits a broken link still has a
  wordmark, a nav, and exits. The "white navbar clip" is parked HIDDEN
  by the layout for any non-home route, so this page lands in the same
  state as /blog with no extra logic here.

  The page itself is copy-only — no scroll choreography, no reveals,
  no horizontal scrub. An error page is already a moment of friction;
  adding animation to it is the wrong trade.

  See `docs/research/error-pages/research.md` for the design rationale.
-->
<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/seo/Seo.svelte';
  import { t, DEFAULT_LOCALE, stripLocale } from '$lib/i18n';

  /* $derived so the page re-reads the catalog the moment Phase 3 widens
   * `LOCALES` and the layout flips the locale from `page`. */
  const m = $derived(t(DEFAULT_LOCALE).error);

  /* The status SvelteKit published. Falls through to `default` for any
   * status the named table does not cover. */
  const status = $derived(page.status);

  /** `page.status` is `number` in the typed contract; `404` etc. are
   * string keys in the catalog. The narrow guard keeps TS happy and
   * stays literal-typed so the named-stati union below is closed. */
  type NamedStatus = 404 | 403 | 500 | 503;
  function isNamed(s: number): s is NamedStatus {
    return s === 404 || s === 403 || s === 500 || s === 503;
  }

  const copy = $derived(isNamed(status) ? m.pages[status] : m.pages.default);

  /* `<title>` and canonical. The status is the prefix so a screen
   * reader's page-list announcement reads "404, Ayni" rather than
   * "Ayni, 404" — the order is a property of the language, but every
   * supported language today puts the status first. */
  const title = $derived(
    `${status} · ${copy.title} · ${m.meta.suffix}`
  );
  const description = $derived(copy.lead);

  /* The canonical is the URL the visitor ACTUALLY asked for, not the
   * site's root — the page may be wrong but the URL they have is real,
   * and stripping it loses the referrer signal crawlers read. */
  const path = $derived(stripLocale(page.url.pathname));

  /** Action entries, as an array so the template renders them in a
   * single keyed loop. Order matches the footer's link list (the two
   * must agree — see the catalog's `actions` block comment). */
  type Action = (typeof m.actions)[keyof typeof m.actions];
  const actions: readonly Action[] = $derived(Object.values(m.actions));
</script>

<Seo
  {title}
  {description}
  {path}
  noindex
/>

<!-- One section, three slots: eyebrow / heading / lead. The
     `.error-page` wrapper carries the page's own rhythm — the same
     `--page-top/--page-x/--page-bottom` tokens every other page takes
     from `tokens.css`. -->
<section class="error-page" aria-labelledby="error-heading">
  <p class="eyebrow">{copy.eyebrow}</p>
  <h1 id="error-heading" class="heading">{copy.title}</h1>
  <p class="lead">{copy.lead}</p>

  <nav class="actions" aria-label={m.actionsLabel}>
    <ul>
      {#each actions as action (action.href)}
        <li>
          <a class="btn btn-secondary" href={action.href}>{action.label}</a>
        </li>
      {/each}
    </ul>
  </nav>
</section>

<style>
  /* ── Page rhythm ──
   * The site has one page shape, set by `--page-top/--page-x/--page-bottom`
   * in tokens.css. Every other page takes them; the error page does too,
   * so an error landing looks like the site it interrupted. */
  .error-page {
    max-width: 760px;
    margin: 0 auto;
    padding: var(--page-top) var(--page-x) var(--page-bottom);
    text-align: left;
  }

  /* The eyebrow — small label that names the condition. */
  .eyebrow {
    font-family: var(--font-text);
    font-size: var(--text-xs);
    font-weight: var(--weight-med);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    color: var(--text-2);
    margin-bottom: var(--spacing-s-5);
  }

  /* The heading — one line, display type. Fluid via the same scale
   * tokens the rest of the site uses, so an error page on a phone is
   * the same proportion as a working page on a phone. */
  .heading {
    font-family: var(--font-display);
    font-size: var(--text-h2);
    font-weight: var(--weight-book);
    line-height: var(--leading-tight);
    color: var(--text);
    margin-bottom: var(--spacing-s-5);
    /* Long headings wrap. The leading is tight; the body beneath is
     * not, which is the same contrast every other display heading on
     * the site carries. */
    max-width: 18ch;
  }

  /* The lead — body type, two short sentences. Same metrics as
   * `.lede` elsewhere on the site. */
  .lead {
    font-size: var(--text-lead);
    line-height: var(--leading-norm);
    color: var(--text-2);
    max-width: 56ch;
    margin-bottom: var(--spacing-s-7);
  }

  /* ── The exits ──
   * A list of buttons. Wraps on narrow viewports without media
   * queries — `flex-wrap` does it without conditionals. */
  .actions ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-s-3);
  }

  /* Touch targets — the WCAG 2.5.8 floor, keyed to the pointer. Same
   * reasoning as `.btn { min-height: 44px }` in components.css; the
   * error page exposes five exits, and missing one is the worst
   * failure mode for the page. */
  @media (pointer: coarse) {
    .actions :global(.btn) {
      min-height: 44px;
    }
  }
</style>