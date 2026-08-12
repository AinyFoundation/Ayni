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

/**
 * Dev-only motion override.
 *
 * The site always respects the OS "reduce motion" setting for real
 * visitors. While tuning motion, `?motion=1` in the URL forces animations
 * on — persisted to localStorage so it survives navigation; `?motion=0`
 * clears it. Parsed at module scope (before any component onMount) so the
 * very first render already knows. The matching `html.motion-forced`
 * class (toggled in +layout.svelte) lifts the reduced-motion CSS gates
 * in animations.css and the components.
 */
const MOTION_FORCE_KEY = 'ayni-force-motion';

if (typeof window !== 'undefined') {
  try {
    const override = new URLSearchParams(window.location.search).get('motion');
    if (override === '0') localStorage.removeItem(MOTION_FORCE_KEY);
    else if (override !== null) localStorage.setItem(MOTION_FORCE_KEY, '1');
  } catch {
    /* localStorage can throw in exotic privacy modes — the override just
     * doesn't persist; motionSuppressed still reads the OS setting. */
  }
}

export function motionForced(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(MOTION_FORCE_KEY) === '1';
  } catch {
    return false;
  }
}

/** True when animations should be suppressed: the OS asks for reduced
 * motion AND the dev override is not active. */
export function motionSuppressed(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches && !motionForced();
}

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
 * Tuned (from an earlier easeIn=0.3/power=2 version) so the ease-out tail
 * settles sooner instead of dragging: the entry ramp now claims a bit more
 * of the curve (easeIn 0.3→0.34) and the ease-out itself is steeper
 * (power 2→2.6), so progress reaches its high-90s well before p=1. Must
 * stay in sync with --ease-hero's sampled linear() in animations.css,
 * which CSS scroll-driven-animation browsers use instead of this JS path.
 */
function easeInOutCustom(t: number): number {
  const easeIn = 0.34;
  if (t < easeIn) {
    return (t / easeIn) * (t / easeIn) * 0.5;
  }
  const adjusted = (t - easeIn) / (1 - easeIn);
  return 0.5 + 0.5 * (1 - Math.pow(1 - adjusted, 2.6));
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

export interface SectionScrollState {
  /** Linear scrub progress 0 → 1 across the scrollable distance
   * (container height − viewport). Listeners shape their own curves. */
  p: number;
  /** Container top relative to the viewport top, in px (positive =
   * below the fold, negative = scrolled past). Lets sticky sections
   * derive their pin position without per-frame layout reads. */
  topY: number;
  /** Cached container height, px. Re-read on resize only. */
  height: number;
  /** Cached viewport height, px. */
  viewportH: number;
}

export type SectionScrollListener = (state: SectionScrollState) => void;

/**
 * Bind a scrub to any tall sticky-pin container — same discipline as the
 * hero driver (one passive listener, rAF-coalesced, geometry cached on
 * bind/resize, epsilon write-skipping) but self-contained per section, so
 * pinned sections outside the hero strip don't share the hero's easing or
 * its singleton state. The listener also receives the container's viewport
 * position (`topY`) so it keeps firing while the section enters/exits the
 * viewport even when `p` is clamped at 0 or 1 — needed for effects tied to
 * the pin's edges, like the navbar takeover. Frames where neither `p` nor
 * the (viewport-clamped) position moved are skipped entirely.
 * Call from `onMount`; returns the cleanup function.
 */
export function bindSectionScroll(
  container: HTMLElement,
  listener: SectionScrollListener
): () => void {
  if (typeof window === 'undefined') return () => {};

  let top = 0;
  let height = 1;
  let viewportH = 1;
  let scrollable = 1;
  let lastP = -1;
  let lastTopY = Infinity;
  let raf = false;

  const measure = (): void => {
    top = container.getBoundingClientRect().top + window.scrollY;
    height = container.offsetHeight;
    viewportH = window.innerHeight;
    scrollable = Math.max(1, height - viewportH);
  };

  const frame = (): void => {
    raf = false;
    const y = window.scrollY;
    const p = clamp01((y - top) / scrollable);
    const topY = top - y;
    // Position quantized to whole px and clamped to "near the viewport" —
    // scrolling far away from the section changes neither value, so those
    // frames cost nothing.
    const q = Math.round(Math.min(viewportH * 2, Math.max(-(height + viewportH), topY)));
    if (Math.abs(p - lastP) < 0.0004 && q === lastTopY) return;
    lastP = p;
    lastTopY = q;
    listener({ p, topY, height, viewportH });
  };

  const request = (): void => {
    if (raf) return;
    raf = true;
    requestAnimationFrame(frame);
  };

  const onSectionResize = (): void => {
    measure();
    request();
  };

  measure();
  frame(); // sync immediately — covers reloads that restore scroll position

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', onSectionResize);
  // Content above the section can reflow after bind (font swaps, lazy
  // images) and silently move the container — watch the document body so
  // cached geometry follows. Observer callbacks run off the scroll path.
  const ro =
    typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onSectionResize) : null;
  ro?.observe(document.body);

  return () => {
    window.removeEventListener('scroll', request);
    window.removeEventListener('resize', onSectionResize);
    ro?.disconnect();
  };
}

/* ── Navbar takeover channel ──────────────────────────────────────────
 * The layout's white navbar is revealed wherever dark imagery sits under
 * the header (the hero does this with its own clip). Sections whose
 * visuals slide beneath the header publish the REGION of the header strip
 * they cover; `null` releases it. Multiple claimants can overlap the
 * header in the same frame (the pinned offerings image handing over to
 * the pattern divider directly below it), so claims are keyed and the
 * layout composes the union — it stays the only DOM writer, so sources
 * never fight over the style attribute. */

/** Sticky header height, px — matches .site-header in +layout.svelte. */
export const HEADER_H = 60;

export interface NavRegion {
  /** Vertical slice of the header strip to paint white, px from its top.
   * Publishers clamp to [0, HEADER_H] and round to whole px. */
  top: number;
  bottom: number;
  /** Horizontal extent in rounded viewport px. Omitted for full-width
   * bands; the legacy `width` shorthand still works for those and for
   * the half-width claim. Rect claimants (imagery passing under the
   * header) publish explicit left/right so the white layer follows the
   * image's actual shape and position. */
  left?: number;
  right?: number;
  width?: 'full' | 'half';
}

export type NavRegionsListener = (regions: NavRegion[]) => void;

const navRegions = new Map<string, NavRegion>();
const navRegionListeners = new Set<NavRegionsListener>();
let lastRegionsSer = '[]';

function sortedRegions(): NavRegion[] {
  return [...navRegions.values()].sort((a, b) => a.top - b.top);
}

/** Publish (or with `null` release) a claimant's header region. Keys are
 * per-claimant (component instance). Unchanged snapshots are skipped, so
 * per-frame calls are free when static. */
export function publishNavRegion(key: string, region: NavRegion | null): void {
  if (region === null) {
    if (!navRegions.delete(key)) return;
  } else {
    navRegions.set(key, region);
  }
  const sorted = sortedRegions();
  const ser = JSON.stringify(sorted);
  if (ser === lastRegionsSer) return;
  lastRegionsSer = ser;
  for (const l of navRegionListeners) l(sorted);
}

/** Subscribe to the header-region claims (sorted top → bottom). Fires
 * immediately with the current snapshot. Returns the unsubscribe fn. */
export function subscribeNavRegions(listener: NavRegionsListener): () => void {
  navRegionListeners.add(listener);
  listener(sortedRegions());
  return () => {
    navRegionListeners.delete(listener);
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

/* ── Rect claimants ──────────────────────────────────────────────────
 * Any image container that can pass under the sticky header registers
 * here. ONE shared rAF-coalesced pass measures them all on scroll and
 * resize and publishes each element's clamped intersection with the
 * header strip — the same deal the hero and the offerings scroller
 * have, generalised to every photograph on the page. The layout turns
 * the rects into the white-navbar clip, so dark imagery flipping under
 * the header flips the navbar layer over exactly its shape. */
const trackedRects = new Map<string, HTMLElement>();
let rectSeq = 0;
let rectRaf = false;
let rectListenersBound = false;

function measureTracked(): void {
  rectRaf = false;
  const vw = window.innerWidth;
  for (const [key, el] of trackedRects) {
    const r = el.getBoundingClientRect();
    const top = Math.max(0, Math.round(r.top));
    const bottom = Math.min(HEADER_H, Math.round(r.bottom));
    const left = Math.max(0, Math.round(r.left));
    const right = Math.min(vw, Math.round(r.right));
    publishNavRegion(
      key,
      bottom - top < 1 || right - left < 1 ? null : { top, bottom, left, right }
    );
  }
}

function scheduleRectMeasure(): void {
  if (rectRaf) return;
  rectRaf = true;
  requestAnimationFrame(measureTracked);
}

function bindRectListeners(): void {
  if (rectListenersBound || typeof window === 'undefined') return;
  rectListenersBound = true;
  window.addEventListener('scroll', scheduleRectMeasure, { passive: true });
  window.addEventListener('resize', scheduleRectMeasure);
}

/** Svelte action — publish this element's intersection with the header
 * strip as a nav region for as long as it lives. Keyed internally, so
 * any number of images can claim at once (a row of cards publishes a
 * row of rects). */
export function navRegion(el: HTMLElement): { destroy(): void } {
  const key = `rect-${++rectSeq}`;
  bindRectListeners();
  trackedRects.set(key, el);
  scheduleRectMeasure();
  return {
    destroy() {
      trackedRects.delete(key);
      publishNavRegion(key, null);
    },
  };
}

/* ── Navbar background color tracker ────────────────────────────────
 * On scroll, determines which section is under the sticky header and
 * publishes a CSS color string so the layout can match the navbar
 * background to the current section. Sections register via
 * `data-nav-bg` attributes (e.g. `data-nav-bg="#221c14"`).
 *
 * Colour blending: when the navbar spans the boundary between two
 * sections, the colour is linearly interpolated so the transition
 * feels continuous rather than a hard cut. */

type NavbarColorListener = (color: string) => void;

const navbarColorListeners = new Set<NavbarColorListener>();
let lastNavbarColor = '';

/** Parse a CSS color string to [r, g, b]. Supports #hex and named colors. */
function parseColor(c: string): [number, number, number] {
  if (c.startsWith('#')) {
    const hex = c.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  // Named / rgb() fallback — create a temp element to resolve
  if (typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.style.color = c;
    document.body.appendChild(el);
    const computed = getComputedStyle(el).color;
    document.body.removeChild(el);
    const m = computed.match(/\d+/g);
    if (m) return [+m[0], +m[1], +m[2]];
  }
  return [0, 0, 0];
}

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

interface NavBgSection {
  el: HTMLElement;
  color: [number, number, number];
  top: number;
  bottom: number;
}

let navBgSections: NavBgSection[] = [];
let navBgRaf = false;

function measureNavBgSections(): void {
  navBgSections = [];
  const els = document.querySelectorAll<HTMLElement>('[data-nav-bg]');
  for (const el of els) {
    const r = el.getBoundingClientRect();
    navBgSections.push({
      el,
      color: parseColor(el.dataset.navBg ?? '#F1E7D4'),
      top: r.top + window.scrollY,
      bottom: r.bottom + window.scrollY,
    });
  }
}

function frameNavBg(): void {
  navBgRaf = false;
  if (navBgSections.length === 0) return;

  const scrollY = window.scrollY;
  // Navbar occupies 0–HEADER_H in viewport coords. Find sections
  // that overlap this strip.
  const navTop = scrollY;
  const navBottom = scrollY + HEADER_H;  let color = '';

  for (let i = 0; i < navBgSections.length; i++) {
    const s = navBgSections[i];
    if (s.bottom <= navTop) continue; // section is above navbar
    if (s.top >= navBottom) break; // section is below navbar

    const overlap = Math.min(s.bottom, navBottom) - Math.max(s.top, navTop);

    // Check if we're at a boundary between two content sections
    const next = navBgSections[i + 1];
    if (
      next &&
      next.top < navBottom &&
      next.top > navTop
    ) {
      // The navbar spans two sections — blend proportionally
      const nextOverlap = Math.min(next.bottom, navBottom) - next.top;
      const total = overlap + nextOverlap;
      if (total > 0) {
        color = lerpColor(s.color, next.color, nextOverlap / total);
      } else {
        color = `rgb(${s.color.join(',')})`;
      }
      break;
    }

    // Fully within one content section
    color = `rgb(${s.color.join(',')})`;
    break;
  }

  // Only publish when a section is found — don't clear the hero
  // handler's paper colour during the WelcomePanel zone.
  if (color && color !== lastNavbarColor) {
    lastNavbarColor = color;
    for (const l of navbarColorListeners) l(color);
  }
}

function scheduleNavBgFrame(): void {
  if (navBgRaf) return;
  navBgRaf = true;
  requestAnimationFrame(frameNavBg);
}

/** Bind the navbar colour tracker to the page. Measures all
 * `[data-nav-bg]` sections and updates on scroll/resize. Returns cleanup. */
export function bindNavbarColor(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Defer measurement so DOM is ready
  requestAnimationFrame(() => {
    measureNavBgSections();
    frameNavBg();
  });

  window.addEventListener('scroll', scheduleNavBgFrame, { passive: true });
  window.addEventListener('resize', () => {
    measureNavBgSections();
    scheduleNavBgFrame();
  });

  return () => {
    window.removeEventListener('scroll', scheduleNavBgFrame);
    window.removeEventListener('resize', measureNavBgSections);
    navBgSections = [];
  };
}

/** Subscribe to the navbar background colour. Fires immediately
 * if a colour is already known. Returns the unsubscribe fn. */
export function subscribeNavbarColor(
  listener: NavbarColorListener,
): () => void {
  navbarColorListeners.add(listener);
  if (lastNavbarColor) listener(lastNavbarColor);
  return () => {
    navbarColorListeners.delete(listener);
  };
}
