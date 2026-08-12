<script lang="ts">
  /**
   * NavContent — the header's mark and links.
   *
   * Rendered TWICE by +layout.svelte (once in the black navbar, once in the
   * white one that clips over it), so nothing here may own state: two live
   * copies exist at all times and only one is visible. +layout.svelte marks
   * the white copy aria-hidden and inert, so the duplication stays purely
   * visual — one set of links and one button in the accessibility tree.
   *
   * The phone menu is split across that seam on purpose. The TOGGLE is here,
   * because being inside a navbar is what lets it inherit `currentColor` and
   * so be three bare lines rather than a chip carrying its own contrast. The
   * PANEL cannot be here — it would be duplicated and clipped to the 60px
   * header — so it lives in MobileMenu.svelte, rendered once. The two halves
   * share state through $lib/menu.svelte and links through $lib/nav.
   */
  import { page } from '$app/state';
  import { NAV_LINKS as navLinks } from '$lib/nav';
  import { menu } from '$lib/menu.svelte';
  import { languageMenu } from '$lib/language.svelte';
  import { DEFAULT_LOCALE, LOCALES, LANGUAGE_SHORT, splitLocale, t } from '$lib/i18n';

  /* Derived, not a plain const: the locale is a property of the URL, so once
   * Phase 3 reads it from `page` this line follows the navigation instead of
   * freezing whichever catalog was current when the module first ran. */
  const m = $derived(t(DEFAULT_LOCALE).chrome);

  /** Which language is showing, for the trigger's short label. */
  const currentLocale = $derived(splitLocale(page.url.pathname).locale);
</script>

<a href="/" class="logo-link" aria-label={m.aria.homeLink}>
  <!-- Reading the catalog put this component in runes mode, where `<slot>` is
       deprecated in favour of `{@render}`. The migration cannot happen here
       alone: +layout.svelte fills this slot twice with `<img slot="logo">`,
       and snippet props and slot fills are not interchangeable. Both sides
       move together or neither does, so the warning is muted rather than
       half-answered. -->
  <!-- svelte-ignore slot_element_deprecated -->
  <slot name="logo" />
</a>

<nav class="site-nav" aria-label={m.aria.mainNav}>
  {#each navLinks as link}
    <a href={link.href} class="nav-link" class:secondary={link.secondary}>{m.nav[link.key]}</a>
  {/each}
</nav>

<!--
  The header's right-hand controls.

  Absolutely positioned, exactly like the mark on the left and the link row in
  the middle. That is the whole point: `.header-inner` centres its IN-FLOW
  children, so anything added to the flow shifts the link row off centre. The
  language button first lived inside `.site-nav` and did precisely that —
  widening the centred group and dragging the links leftward. Out of flow, the
  centre cannot be disturbed no matter what is added here.

  Order is deliberate at every width: language, then the menu toggle. On a
  phone that puts the switcher immediately to the LEFT of the three lines,
  which is where a second control belongs when the first one opens a sheet.
-->
<div class="header-actions">
  <!-- The language TRIGGER only. Its panel is rendered once by +layout.svelte
       — see $lib/language.svelte.ts for why the two halves cannot live
       together. Nothing renders while the site has one language. -->
  {#if LOCALES.length > 1}
    <button
      class="dropdown-trigger is-bare language-trigger"
      type="button"
      aria-haspopup="listbox"
      aria-expanded={languageMenu.open}
      aria-label={m.aria.language}
      onclick={() => (languageMenu.open = !languageMenu.open)}
    >
      <svg class="globe" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
      </svg>
      <span>{LANGUAGE_SHORT[currentLocale]}</span>
      <svg class="dropdown-caret" viewBox="0 0 10 6" fill="none" aria-hidden="true">
        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
  {/if}

<!-- The toggle lives here, inside the navbar, so it inherits `currentColor`
     from whichever layer is showing — paper over the dark hero, ink over the
     paper sections — through the same clip trick the links already use. That
     is what lets it be three bare lines instead of a chip: a chip was only
     ever there to carry its own contrast because the button used to sit
     outside both navbars, where it inherited neither.

     It is rendered twice as a result, once per navbar. +layout.svelte marks
     the white copy aria-hidden and inert, so exactly one reaches the
     accessibility tree and pointer events fall through to the black one. -->
<button
  class="menu-toggle"
  type="button"
  aria-expanded={menu.open}
  aria-controls="mobile-menu"
  aria-label={menu.open ? m.menu.close : m.menu.open}
  onclick={() => (menu.open = !menu.open)}
>
  <span class="bars" class:is-open={menu.open} aria-hidden="true">
    <i></i><i></i><i></i>
  </span>
  </button>
</div>

<style>
  .logo-link {
    position: absolute;
    top: 4px;
    left: var(--spacing-s-4);
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    flex-shrink: 0;
  }

  .site-nav {
    display: flex;
    align-items: center;
    gap: var(--spacing-s-4);
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .nav-link {
    font-family: var(--font-text);
    font-size: var(--text-sm);
    font-weight: var(--weight-med);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    text-decoration: none;
    padding: var(--spacing-s-1) 0;
    position: relative;
  }

  .nav-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 1px;
    background: var(--color-gold);
    transition: width var(--duration-normal) var(--ease);
  }

  .nav-link:hover::after {
    width: 100%;
  }

  /* currentColor, not the ink ring: the same markup renders black on the black
   * navbar and paper-white on the white one. */
  .nav-link:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  /* ── Phone menu toggle: three lines and nothing else ────────────────
   * No background, no border, no chip. The 44px box is padding around the
   * mark, not a visible shape, so the target stays thumb-sized while only
   * the lines are drawn. */
  /* Out of the flow, like the mark and the link row — see the markup comment.
     Anything placed here can never move the centred links. */
  .header-actions {
    position: absolute;
    right: var(--spacing-s-4);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: var(--spacing-s-2);
  }

  .menu-toggle {
    display: none;
    align-items: center;
    justify-content: center;
    width: var(--spacing-s-7);
    height: var(--spacing-s-7);
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
  }

  /* Gold, not currentColor — the one place on this header where that is wrong.
   * The toggle exists in both navbars, and only the BLACK copy can take focus
   * (the white one is inert), so over the hero its ink ring would be drawn
   * underneath paper-coloured lines: a black rectangle around a white mark.
   * Gold is legible on ink and on paper alike, and is already the header's
   * accent in the link underline. */
  .menu-toggle:focus-visible {
    outline: 2px solid var(--color-gold);
    outline-offset: 2px;
    border-radius: var(--radius);
  }

  .bars {
    position: relative;
    display: block;
    width: 22px;
    height: 14px;
  }

  .bars i {
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    /* currentColor is the whole point — see the markup comment. No shadow:
     * the paper-over-ink clip is what carries these lines against the
     * photograph, and the site's standing rule is hairlines, not shadows. */
    background: currentColor;
    border-radius: var(--radius-full);
    transition:
      transform var(--duration-quick) var(--ease),
      opacity var(--duration-quick) var(--ease);
  }

  /* Stroke settings live on the <svg> so every path carries identical weight
     — the same discipline the hero's social marks needed after one of them
     was drawn as a detached tick. */
  .globe {
    flex: none;
    width: 16px;
    height: 16px;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    fill: none;
  }

  .bars i:nth-child(1) { top: 0; }
  .bars i:nth-child(2) { top: 50%; transform: translateY(-50%); }
  .bars i:nth-child(3) { bottom: 0; }

  /* Open reads as a state of the same three rules, not a different icon. */
  .bars.is-open i:nth-child(1) { top: 50%; transform: translateY(-50%) rotate(45deg); }
  .bars.is-open i:nth-child(2) { opacity: 0; }
  .bars.is-open i:nth-child(3) { bottom: auto; top: 50%; transform: translateY(-50%) rotate(-45deg); }

  @media (prefers-reduced-motion: reduce) {
    :global(html:not(.motion-forced)) .bars i {
      transition: none;
    }
  }

  /* Both boxes are absolutely positioned against the navbar, so nothing keeps
   * them apart: the centred links slide left as the viewport narrows and land
   * on top of the wordmark (they overlap outright below ~700px, illegibly so at
   * 390px). Below the tablet breakpoint, put both back in the header's flex row
   * — mark left, links right — where the layout cannot collide by construction. */
  @media (max-width: 768px) {
    /* Back into the header's flex row, where the mark and the toggle cannot
     * collide by construction. No overflow crop any more: the layout now
     * swaps in the standalone icon (see +layout.svelte) instead of cropping
     * the wide lockup, so there is nothing to hide. */
    .logo-link {
      position: static;
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      margin-left: var(--spacing-s-4);
      /* The artwork is deliberately taller than the header (its own padding),
       * so pin the LINK to the header's height. Otherwise the tap area would
       * inherit the full 100px and hang 20px over the hero below, swallowing
       * taps meant for the page. Overflow stays visible — the part that spills
       * is transparent. */
      height: 60px;
    }

    /* Five uppercase words cannot be both legible and thumb-sized in a 60px
     * header on a phone. Below this width the row gives way to MobileMenu's
     * button, and the links move into its panel where each one gets a full
     * row. */
    .site-nav {
      display: none;
    }

    /* With the link row gone, the header's `justify-content: center` would
     * centre the lone mark. Claim the leftover space so it stays on the left,
     * where the way home belongs. */
    .logo-link {
      margin-right: auto;
    }

    .menu-toggle {
      display: inline-flex;
    }
  }

</style>
