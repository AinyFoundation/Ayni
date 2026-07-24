/**
 * Ayni — Hero Scroll Driver
 *
 * One rAF-coalesced source of truth for the homepage hero's scroll progress.
 *
 * Why this exists (Safari-first performance):
 * - A single passive scroll listener, coalesced to one update per animation
 *   frame. Multiple listeners doing per-event work stall WebKit's scroll
 *   pipeline far more than Chromium's.
 * - Progress is derived from `window.scrollY` against geometry cached on
 *   bind/resize — never a per-frame `getBoundingClientRect()`, which forces
 *   layout when styles are dirty (layout thrashing).
 * - Subscribers write styles directly. No framework re-render per frame.
 * - Frames that change nothing meaningful are skipped (epsilon), so idle
 *   scroll events trigger no style writes and no WebKit re-raster work.
 */

export type ScrollProgressListener = (progress: number) => void;

/**
 * True when the browser can run the hero's continuous motion on the
 * compositor via CSS scroll-driven animations (Safari 26+, Chrome 115+,
 * Firefox). When true, components let the keyframe animations in their
 * stylesheets own the per-frame visuals — zero JS in the scroll→pixels
 * path — and use this driver only for discrete state (the WelcomePanel
 * reveal threshold). When false, the driver below is the fallback and
 * writes styles itself. Mirrors the `@supports (animation-timeline:
 * scroll())` blocks in the components, so the two paths never fight.
 */
export const cssScrollDriven =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('animation-timeline: scroll()');

const listeners = new Set<ScrollProgressListener>();

let container: HTMLElement | null = null;
/** Container position in document coordinates + scrollable distance. Cached. */
let geometry = { top: 0, scrollable: 1 };
/** Last emitted progress. -1 = "nothing emitted yet". */
let lastProgress = -1;
let frameRequested = false;
let windowListenersAttached = false;

/**
 * The hero's easing — shapes how the slide accelerates and settles.
 * Kept verbatim from the original implementation so the motion is unchanged.
 */
function easeInOutCustom(t: number): number {
  const easeIn = 0.3;
  if (t < easeIn) {
    return (t / easeIn) * (t / easeIn) * 0.5;
  }
  const adjusted = (t - easeIn) / (1 - easeIn);
  return 0.5 + 0.5 * (1 - Math.pow(1 - adjusted, 2));
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function currentProgress(): number {
  const raw = clamp01((window.scrollY - geometry.top) / geometry.scrollable);
  return easeInOutCustom(raw);
}

/** Reads layout once — only on bind and resize, never per frame. */
function measure(): void {
  if (!container) return;
  geometry.top = container.getBoundingClientRect().top + window.scrollY;
  geometry.scrollable = Math.max(1, container.offsetHeight - window.innerHeight);
}

function emit(progress: number): void {
  lastProgress = progress;
  for (const listener of listeners) listener(progress);
}

function frame(): void {
  frameRequested = false;
  if (!container) return;
  const progress = currentProgress();
  // ~0.04vw of travel — sub-pixel. Skipping keeps idle scroll events free.
  if (Math.abs(progress - lastProgress) < 0.0004) return;
  emit(progress);
}

function requestFrame(): void {
  if (frameRequested) return;
  frameRequested = true;
  requestAnimationFrame(frame);
}

function onResize(): void {
  // Viewport changes (resize, mobile URL-bar collapse) change both the
  // container's document position and the scrollable distance.
  measure();
  requestFrame();
}

/**
 * Bind the driver to the hero's tall scroll container.
 * Call once from the page's `onMount`. Returns the cleanup function.
 */
export function bindHeroScroll(element: HTMLElement): () => void {
  if (typeof window === 'undefined') return () => {};

  container = element;
  measure();

  if (!windowListenersAttached) {
    windowListenersAttached = true;
    window.addEventListener('scroll', requestFrame, { passive: true });
    window.addEventListener('resize', onResize);
  }

  // Sync subscribers immediately — covers reloads that restore scroll position.
  emit(currentProgress());

  return () => {
    // Note: subscribers (e.g. the navbar clip-path) keep their last value
    // after unbind. Fine today — the hero page is the only (site) route —
    // but if another (site) route is added, reset those styles on navigate.
    container = null;
    lastProgress = -1;
    windowListenersAttached = false;
    window.removeEventListener('scroll', requestFrame);
    window.removeEventListener('resize', onResize);
  };
}

/**
 * Subscribe to hero scroll progress (0 → 1, eased).
 * Fires immediately with the current value when one is known.
 * Returns the unsubscribe function.
 */
export function subscribeHeroScroll(listener: ScrollProgressListener): () => void {
  listeners.add(listener);
  if (lastProgress >= 0) listener(lastProgress);
  return () => {
    listeners.delete(listener);
  };
}
