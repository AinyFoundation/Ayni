<script lang="ts">
  /**
   * ReviewPopup — a <dialog> showing all Google Maps reviews.
   *
   * Follows the BookSection precedent: native <dialog> with showModal(),
   * focus trapping, Esc-to-close, and inert background — all free from the
   * platform. The dialog is opened by the "View all reviews" button in
   * VoicesSection.
   */

  import { t, DEFAULT_LOCALE } from '$lib/i18n';

  /* $derived, not a plain const: the locale is a property of the URL and
   * becomes dynamic in Phase 3, at which point this recomputes on its own.
   * `localGuide` is read from the parent section's own keys rather than
   * duplicated here — it is the same badge on the same person. */
  const voices = $derived(t(DEFAULT_LOCALE).home.voices);
  const m = $derived(voices.popup);

  type Review = {
    id: string;
    name: string;
    avatarLocal: string;
    rating: number;
    text: string;
    date: string;
    isLocalGuide: boolean;
    selected?: boolean;
  };

  let { reviews = [], open = $bindable(false) }: { reviews: Review[]; open: boolean } = $props();

  let dialogEl: HTMLDialogElement;
  let savedScrollY = 0;

  // Sync open state with dialog and lock body scroll.
  // showModal() makes the background inert (no focus/click) but does NOT
  // prevent scroll — touch and wheel events still reach the document.
  //
  // overflow:hidden alone does not work on iOS Safari — the page still
  // bounces and scrolls. position:fixed on <body> is the reliable fix:
  // it pins the body to the viewport so no scroll gesture can move it.
  // The scroll position is saved and restored so the page lands where
  // the user left off.
  function lockScroll() {
    savedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    window.scrollTo(0, savedScrollY);
  }

  $effect(() => {
    if (!dialogEl) return;
    if (open && !dialogEl.open) {
      dialogEl.showModal();
      lockScroll();
    } else if (!open && dialogEl.open) {
      dialogEl.close();
      unlockScroll();
    }
  });

  // Close handler — sets open=false, which the $effect picks up to
  // call dialog.close() and unlock scroll.  NOT wired to onclose:
  // the native onclose fires AFTER the dialog closes, creating a
  // re-entrant race with the $effect that prevents reopening.
  function handleClose() {
    open = false;
    unlockScroll();
  }

  // Intercept the browser's native Esc handling.  The `cancel` event
  // fires BEFORE the dialog closes, so we can preventDefault() and
  // route through handleClose → $effect → dialog.close() cleanly.
  function handleCancel(e: Event) {
    e.preventDefault();
    handleClose();
  }

  // Backdrop click to close
  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialogEl) {
      handleClose();
    }
  }

  // Star rendering
  function stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
</script>

<dialog
  bind:this={dialogEl}
  class="review-dialog"
  onclick={handleBackdropClick}
  oncancel={handleCancel}
  aria-labelledby="review-popup-title"
>
  <div class="review-popup">
    <header class="review-popup-header">
      <h2 id="review-popup-title" class="heading-3">{m.title}</h2>
      <p class="review-popup-subtitle">
        {m.subtitle(reviews.length)}
      </p>
      <button class="review-popup-close" onclick={handleClose} aria-label={m.close}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </header>

    <div class="review-popup-list">
      {#each reviews as review (review.id)}
        <article class="review-full">
          <div class="review-full-header">
            <img
              class="review-full-avatar"
              src={review.avatarLocal}
              alt=""
              width="48"
              height="48"
              loading="lazy"
            />
            <div class="review-full-meta">
              <span class="review-full-name">{review.name}</span>
              <span class="review-full-date">
                {review.date}
                {#if review.isLocalGuide}
                  <span class="review-full-badge">{voices.localGuide}</span>
                {/if}
              </span>
            </div>
            <div class="review-full-rating" aria-label={m.rating(review.rating)}>
              <span class="review-stars">{stars(review.rating)}</span>
            </div>
          </div>
          {#if review.text}
            <p class="review-full-text">{review.text}</p>
          {/if}
        </article>
      {/each}
    </div>

    <footer class="review-popup-footer">
      <a
        href="https://maps.app.goo.gl/SNWAihxUcXg1GvhY8"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-secondary"
      >
        {m.viewOnMaps}
      </a>
    </footer>
  </div>
</dialog>

<style>
  .review-dialog {
    /* The global reset zeroes the UA dialog's margin:auto centering, so
     * the modal would stick to the top-left corner. inset + margin auto
     * restore true centring on both axes. */
    position: fixed;
    inset: 0;
    margin: auto;
    width: calc(100vw - 48px);
    max-width: 680px;
    height: fit-content;
    max-height: 85vh;
    padding: 0;
    border: none;
    border-radius: var(--radius);
    background: var(--surface-1);
    color: var(--text);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    z-index: 1000;
  }

  .review-dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .review-popup {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 85vh;
  }

  .review-popup-header {
    position: relative;
    padding: var(--spacing-s-5) var(--spacing-s-5) var(--spacing-s-3);
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }

  .review-popup-subtitle {
    font-size: var(--text-sm);
    color: var(--text-3);
    margin: var(--spacing-s-1) 0 0;
  }

  .review-popup-close {
    position: absolute;
    top: var(--spacing-s-3);
    right: var(--spacing-s-3);
    width: 36px;
    height: 36px;
    padding: 0;
    border: none;
    border-radius: var(--radius-full);
    background: var(--surface-2);
    color: var(--text-2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--duration-quick) var(--ease);
  }

  .review-popup-close:hover {
    background: var(--border-subtle);
  }

  .review-popup-close svg {
    width: 18px;
    height: 18px;
  }

  .review-popup-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-s-4) var(--spacing-s-5);
  }

  .review-full {
    padding: var(--spacing-s-4) 0;
    border-bottom: 1px solid var(--border-subtle);
  }

  .review-full:last-child {
    border-bottom: none;
  }

  .review-full-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-s-3);
  }

  .review-full-avatar {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-full);
    object-fit: cover;
    flex-shrink: 0;
    background: var(--surface-2);
  }

  .review-full-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .review-full-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-med);
    color: var(--text);
  }

  .review-full-date {
    font-size: var(--text-xs);
    color: var(--text-3);
    display: flex;
    align-items: center;
    gap: var(--spacing-s-2);
  }

  .review-full-badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--surface-2);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .review-full-rating {
    flex-shrink: 0;
  }

  .review-stars {
    font-size: var(--text-sm);
    color: var(--gold);
    letter-spacing: 1px;
  }

  .review-full-text {
    margin: var(--spacing-s-3) 0 0;
    font-size: var(--text-sm);
    line-height: var(--leading-norm);
    color: var(--text-2);
  }

  .review-popup-footer {
    padding: var(--spacing-s-3) var(--spacing-s-5);
    border-top: 1px solid var(--border-subtle);
    flex-shrink: 0;
    display: flex;
    justify-content: center;
  }

  @media (max-width: 600px) {
    .review-dialog {
      max-width: 100%;
      width: 100%;
      /* Extend into the safe area so the dialog background covers the
       * transparent Safari bottom bar — without this, the site bleeds
       * through behind it. */
      height: calc(100svh + env(safe-area-inset-bottom, 0px));
      max-height: calc(100svh + env(safe-area-inset-bottom, 0px));
      border-radius: 0;
    }

    .review-popup {
      /* Content stays within the visible viewport; the extra dialog height
       * is just background covering the safe area. */
      max-height: 100svh;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }

    /* `env(safe-area-inset-top, …)` resolves to 0px on every phone WITHOUT a
     * notch — the fallback only applies where the variable is unsupported, not
     * where it is zero — so the old rule silently deleted the header's top
     * padding and jammed the title against the edge. Keep the padding and ADD
     * the inset. */
    .review-popup-header {
      padding-top: calc(var(--spacing-s-5) + env(safe-area-inset-top, 0px));
    }
  }
</style>
