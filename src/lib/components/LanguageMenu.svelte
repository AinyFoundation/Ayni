<script lang="ts">
  /**
   * The language switcher's PANEL, rendered once by `+layout.svelte`.
   *
   * The trigger is in NavContent; see `$lib/language.svelte.ts` for why the
   * two halves are split across that seam.
   *
   * The options are real `<a href>` links, not buttons, and that is a
   * requirement rather than a preference: switching language is navigation to
   * a different URL, so the list must be crawlable and must work with no
   * JavaScript. (The `hreflang` attribute on them is advisory only — search
   * engines read the `<link rel="alternate">` tags `Seo.svelte` emits, never
   * anchors — but it is correct markup and costs nothing.)
   *
   * Rendering nothing while the site has one language is deliberate: a
   * dropdown whose list is a single item its reader is already on is furniture
   * with no purpose. It appears by itself the moment `LOCALES` widens.
   */
  import { page } from '$app/state';
  import { languageMenu } from '$lib/language.svelte';
  import {
    LOCALES,
    LANGUAGE_NAMES,
    HTML_LANG,
    href,
    splitLocale,
    type Locale
  } from '$lib/i18n';

  const current = $derived(splitLocale(page.url.pathname).locale);
  /** The path without its locale, so each link offers THIS page in that
   *  language rather than dropping the reader on the homepage. */
  const bare = $derived(splitLocale(page.url.pathname).path);

  let panelEl = $state<HTMLDivElement>();
  /** Right offset from the viewport edge, measured from the trigger. */
  let rightPx = $state(24);

  const close = () => (languageMenu.open = false);

  /**
   * Hang the panel off the trigger.
   *
   * Living outside the header buys the panel its freedom from the 60px clip,
   * but it also costs the automatic positioning a child would have had — so
   * the alignment has to be measured. Right edges are matched rather than left
   * ones because the trigger is the last thing in the nav row, so its right
   * edge is the one a reader's eye is already on.
   *
   * The trigger is queried rather than passed: it is rendered inside
   * NavContent, twice, and this component is a sibling of both navbars. DOM
   * order puts the black (interactive) copy first, which is the one to
   * measure — the white copy is `inert` and clipped.
   */
  function positionPanel() {
    const trigger = document.querySelector<HTMLElement>('.language-trigger');
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    // Clamped so a narrow window cannot push the panel off-screen.
    rightPx = Math.max(16, Math.round(window.innerWidth - rect.right));
  }

  $effect(() => {
    if (!languageMenu.open) return;

    positionPanel();
    window.addEventListener('resize', positionPanel);

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element;
      // The trigger toggles itself; closing here too would fight it.
      if (target.closest('.language-trigger')) return;
      if (panelEl && !panelEl.contains(target)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        document.querySelector<HTMLElement>('.language-trigger')?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  });
</script>

{#if LOCALES.length > 1 && languageMenu.open}
  <div class="language-panel-wrap" bind:this={panelEl} style="--panel-right: {rightPx}px">
    <ul class="dropdown-panel language-panel">
      {#each LOCALES as locale (locale)}
        {@const isCurrent = locale === (current as Locale)}
        <li>
          <a
            class="dropdown-option"
            href={href(bare, locale)}
            hreflang={HTML_LANG[locale]}
            lang={HTML_LANG[locale]}
            aria-current={isCurrent ? 'true' : undefined}
            onclick={close}
          >
            <span>{LANGUAGE_NAMES[locale]}</span>
            {#if isCurrent}<span class="dropdown-mark" aria-hidden="true"></span>{/if}
          </a>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  /*
    Fixed, not absolute: this element is a sibling of the navbars rather than a
    child of the trigger, so it is positioned against the viewport and pinned
    just under the 60px header. That is the price of living outside the header
    — and the reason it can be seen at all, since inside it would be clipped.
  */
  .language-panel-wrap {
    position: fixed;
    top: 60px;
    right: var(--panel-right, 24px);
    /* Above the header (z-index 5) so it is not cut off by it. */
    z-index: 20;
  }

  .language-panel {
    min-width: 11rem;
  }
</style>
