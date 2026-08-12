<script lang="ts">
  /**
   * MobileMenu — the phone navigation PANEL, rendered ONCE.
   *
   * The menu is deliberately split in two. The toggle lives in NavContent, so
   * it inherits `currentColor` from whichever navbar layer is showing and can
   * therefore be three bare lines rather than a chip carrying its own
   * contrast. This panel cannot live there: +layout.svelte renders NavContent
   * twice (black navbar, and the white one that clips over it), so a panel in
   * there would exist twice and the white copy would be clipped to the 60px
   * header and never open. The two halves agree through $lib/menu.svelte.
   *
   * The panel is a native <dialog> opened with showModal(). The platform then
   * supplies the four things a nav drawer has to get right and hand-rolled
   * overlays usually get wrong: the focus trap, an inert background, Esc to
   * close, and top-layer stacking — that last one matters more here than
   * anywhere else on the site, because it is what lets the panel escape the
   * clipped, transformed header it is anchored to.
   *
   * Sizing follows the touch-target guidance the rest of this pass was measured
   * against: every control clears the 44px WCAG 2.5.8 floor, with real spacing
   * between rows so a thumb cannot hit two links at once.
   */
  import { NAV_LINKS } from '$lib/nav';
  import { menu } from '$lib/menu.svelte';
  import { DEFAULT_LOCALE, t } from '$lib/i18n';

  /* Derived, not a plain const: the locale is a property of the URL, so once
   * Phase 3 reads it from `page` this line follows the navigation instead of
   * freezing whichever catalog was current when the module first ran. */
  const m = $derived(t(DEFAULT_LOCALE).chrome);


  let dialogEl: HTMLDialogElement;
  let returnFocus: HTMLElement | null = null;

  /* Drive the element from state, and let the element drive state back through
   * its own close event — so Esc, backdrop click and the close button all take
   * the same path out. */
  $effect(() => {
    if (!dialogEl) return;
    if (menu.open && !dialogEl.open) {
      returnFocus = document.activeElement as HTMLElement | null;
      dialogEl.showModal();
    } else if (!menu.open && dialogEl.open) {
      dialogEl.close();
    }
  });

  /* showModal() makes the page inert but not unscrollable. */
  $effect(() => {
    if (!menu.open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  });
</script>

<dialog
  class="menu-panel"
  id="mobile-menu"
  bind:this={dialogEl}
  aria-label={m.menu.label}
  onclose={() => {
    menu.open = false;
    returnFocus?.focus();
  }}
  onclick={(event) => {
    // Only the dialog box itself receives clicks on the backdrop.
    if (event.target === dialogEl) menu.open = false;
  }}
>
  <!-- The sheet starts at the top of the viewport and carries its own close
       control, rather than starting below the header and leaving the toggle
       peeking out. A modal dialog paints in the top layer, above the backdrop
       that dims everything else — so a toggle left behind in the header would
       sit under that dim, greyed and looking disabled while still being the
       obvious thing to press. The head row also replays the logo in its
       navbar position, ink on paper: the header itself sits dimmed under the
       backdrop, so the brand has to live on the sheet to stay visible. -->
  <div class="menu-head">
    <a class="menu-logo" href="/" aria-label={m.aria.homeLink} onclick={() => (menu.open = false)}>
      <img src="/images/branding/logo-horizontal.svg" alt="" />
    </a>
    <button class="menu-close" type="button" aria-label={m.menu.close} onclick={() => (menu.open = false)}>
      <span class="bars is-open" aria-hidden="true"><i></i><i></i><i></i></span>
    </button>
  </div>

  <nav class="menu-nav" aria-label={m.aria.mainNav}>
    <ul role="list">
      {#each NAV_LINKS as link}
        <li>
          <!-- Same-page fragments do not unmount anything, so the panel has to
               close itself or it would stay over the section just jumped to. -->
          <a class="menu-link" href={link.href} onclick={() => (menu.open = false)}>
            {m.nav[link.key]}
          </a>
        </li>
      {/each}
    </ul>
  </nav>

</dialog>

<style>
  /* A sheet under the header, not a centred modal — the header stays visible
   * and the panel reads as an extension of it. */
  .menu-panel {
    margin: 0;
    padding: 0;
    border: none;
    border-bottom: 1px solid var(--border-strong);
    background: var(--surface-1);
    width: 100%;
    max-width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
  }

  /* Same 60px box as the site header, so the close control lands exactly
   * where the toggle was — the button appears to stay put and change state
   * rather than move. */
  .menu-head {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: var(--spacing-s-4);
    border-bottom: 1px solid var(--border-subtle);
  }

  /* Same lockup, same seat as the navbar's phone logo: left edge, ink on
   * paper, the navbar's exact sizing — the sheet replaces the header, so
   * the brand must stay where it was. */
  .menu-logo {
    display: inline-flex;
    align-items: center;
    margin-left: var(--spacing-s-4);
    /* Claim the leftover space so the close control keeps its right seat. */
    margin-right: auto;
    height: 60px;
    text-decoration: none;
  }

  .menu-logo img {
    height: 100px;
    width: auto;
    display: block;
    /* Same numbers as the navbar's phone lockup (+layout.svelte): the ink
     * occupies the middle ~31% of the SVG's height, so the oversized box
     * centres it on the 60px row. */
    margin: -20px 0;
  }

  .menu-logo:focus-visible {
    outline: 2px solid var(--ring-focus);
    outline-offset: 2px;
  }

  /* Bare lines, matching the toggle it replaces. No chip: inside the panel the
   * ground is always paper, so ink needs nothing behind it. */
  .menu-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--spacing-s-7);
    height: var(--spacing-s-7);
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    background: none;
    border: none;
    color: var(--text);
    cursor: pointer;
  }

  .menu-close:focus-visible {
    outline: 2px solid var(--ring-focus);
    outline-offset: 2px;
  }

  /* The toggle's bars live in NavContent's scope, so the cross needs its own
   * copy here. Same geometry, already in the open state. */
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
    background: currentColor;
    border-radius: var(--radius-full);
  }

  .bars i:nth-child(1) { top: 50%; transform: translateY(-50%) rotate(45deg); }
  .bars i:nth-child(2) { opacity: 0; }
  .bars i:nth-child(3) { top: 50%; transform: translateY(-50%) rotate(-45deg); }

  .menu-panel::backdrop {
    background: color-mix(in srgb, var(--color-ink) 55%, transparent);
  }

  .menu-nav ul {
    list-style: none;
    margin: 0;
    padding: var(--spacing-s-3) 0 var(--spacing-s-5);
  }

  .menu-link {
    display: flex;
    align-items: center;
    /* Comfortably past the 44px floor, and the row is the target, not the word. */
    min-height: var(--spacing-s-8);
    padding: 0 var(--spacing-s-6);
    font-family: var(--font-text);
    font-size: var(--text-lead);
    font-weight: var(--weight-med);
    letter-spacing: var(--tracking-wide);
    color: var(--text);
    text-decoration: none;
    border-bottom: 1px solid var(--border-subtle);
  }

  .menu-nav li:last-child .menu-link {
    border-bottom: none;
  }


  .menu-link:active {
    background: var(--surface-2);
  }

  .menu-link:focus-visible {
    outline: 2px solid var(--ring-focus);
    outline-offset: -2px;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(html:not(.motion-forced)) .bars i {
      transition: none;
    }
  }
</style>
