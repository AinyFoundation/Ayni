/**
 * Ayni — image warming
 *
 * Fetch AND decode a photograph before the frame that has to show it.
 *
 * The bug this exists for: a section's photograph appearing for the first
 * time blanks for a frame, or visibly resolves, because the browser only
 * started work on it at the moment it became visible. Two different shapes
 * of the same problem:
 *
 *   1. IN THE DOM, not yet loaded — every `loading="lazy"` image below the
 *      fold. The browser does start these early, but by a threshold it
 *      chooses (Chromium ~1250px, WebKit far tighter), and lazy loading only
 *      covers the FETCH. Decode still lands on the frame that paints it,
 *      which is precisely the blank frame.
 *
 *   2. NOT IN THE DOM AT ALL — the book's spreads. Only the current spread
 *      is mounted, so the next photograph's first byte is requested at the
 *      instant the page turn lands on it. No lazy-loading threshold can help
 *      here; nothing is observing an element that does not exist.
 *
 * Both are answered by doing the work one viewport early and, crucially, by
 * calling `decode()` — the fetch is the cheap half.
 *
 * House discipline, same as scrollDriver.ts: ONE shared IntersectionObserver
 * for all of case 1, callbacks off the scroll path, and everything deduped so
 * repeat calls are free.
 */

/** How far ahead to start work: one full viewport, i.e. roughly one section. */
const AHEAD = '100% 0px';

/** Warmed already — keyed by the exact srcset (or src) string. */
const warmed = new Set<string>();

/**
 * Held so the decoded bitmaps are not immediately collectable. Small by
 * construction: only photographs a section is about to show. Nothing here
 * is ever removed, which is correct — a photograph warmed once should stay
 * warm for the life of the page.
 */
const held = new Set<HTMLImageElement>();

export interface WarmSource {
  src: string;
  srcset?: string;
  /** MUST match the rendered `<img sizes>` exactly, or the browser picks a
   * different srcset candidate here than it will there and the warm-up
   * fetches a file the page never asks for. */
  sizes?: string;
}

/**
 * Fetch and decode one photograph now. Safe to call repeatedly — the second
 * call for the same source is a Set lookup.
 */
export function warmImage(source: WarmSource): void {
  if (typeof window === 'undefined') return;
  const key = source.srcset || source.src;
  if (!key || warmed.has(key)) return;
  warmed.add(key);

  const img = new Image();
  // sizes BEFORE srcset: the candidate is chosen when srcset is set, and a
  // sizes assigned afterwards would arrive too late to inform that choice.
  if (source.sizes) img.sizes = source.sizes;
  if (source.srcset) img.srcset = source.srcset;
  img.src = source.src;
  held.add(img);
  // The half that matters. A rejected decode is harmless — it just means the
  // paint-time decode still has to happen, which is where we started.
  img.decode?.().catch(() => {});
}

/** Warm several at once. */
export function warmImages(sources: WarmSource[]): void {
  for (const s of sources) warmImage(s);
}

/* ── The shared observer ─────────────────────────────────────────────── */

type ApproachEntry = { el: Element; run: () => void };

let observer: IntersectionObserver | null = null;
const pending = new Map<Element, ApproachEntry>();

function ensureObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const hit = pending.get(entry.target);
        if (!hit) continue;
        // One-way: warming twice buys nothing, and leaving the element
        // observed would keep firing this for the rest of the page's life.
        pending.delete(entry.target);
        observer?.unobserve(entry.target);
        hit.run();
      }
    },
    { rootMargin: AHEAD }
  );
  return observer;
}

/**
 * Run `cb` once, when `el` comes within a viewport of the screen. Fires
 * immediately where IntersectionObserver is missing — warming early is
 * always safe, and the alternative is never warming at all.
 */
export function onApproach(el: Element, cb: () => void): () => void {
  const io = ensureObserver();
  if (!io) {
    cb();
    return () => {};
  }
  pending.set(el, { el, run: cb });
  io.observe(el);
  return () => {
    if (pending.delete(el)) io.unobserve(el);
  };
}

/**
 * Svelte action form of `onApproach`, for warming a component's own
 * off-DOM photographs (the book's other spreads).
 */
export function warmOnApproach(node: HTMLElement, sources: WarmSource[]) {
  let stop = onApproach(node, () => warmImages(sources));
  return {
    update(next: WarmSource[]) {
      stop();
      stop = onApproach(node, () => warmImages(next));
    },
    destroy() {
      stop();
    },
  };
}

/* ── Case 1: the lazy images already on the page ─────────────────────── */

/**
 * Bring every `loading="lazy"` image on the page forward to "fetched and
 * decoded a viewport early". Call once, from the page's `onMount` — by then
 * every child component has rendered, so one query finds them all. Returns
 * the cleanup function.
 *
 * Deliberately NOT a per-component action: one query and one observer beats
 * a wiring change in every section that happens to hold a photograph, and
 * new sections get this for free.
 */
export function bindImageWarming(root: ParentNode = document): () => void {
  if (typeof window === 'undefined') return () => {};

  const stops: Array<() => void> = [];
  for (const img of root.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')) {
    stops.push(
      onApproach(img, () => {
        // Flipping the attribute is what releases the fetch; decode() is
        // what stops the first paint from being the blank one.
        img.loading = 'eager';
        img.decode?.().catch(() => {});
      })
    );
  }

  return () => {
    for (const stop of stops) stop();
  };
}
