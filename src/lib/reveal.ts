/**
 * Ayni — scroll reveal action
 *
 * The only observer for the vertical (non-scrubbed) part of the page. The
 * horizontal hero has its own rAF-coalesced driver (see scrollDriver.ts);
 * everything BELOW the sticky strip reveals via this one shared
 * IntersectionObserver action, wired to the declarative [data-reveal] /
 * [data-stagger] utilities in src/design/animations.css.
 *
 * Usage on the outer element of any vertical section:
 *   <section use:reveal>...</section>
 *
 * Behaviour: the action observes the SECTION node as a single trigger. When
 * the section crosses the threshold, the section itself plus every
 * [data-reveal] / [data-stagger] descendant are revealed together (the
 * CSS stagger delays + transition already produce the layered cascade).
 *
 * Why section-as-trigger and not per-child: a section taller than the
 * viewport (mobile) can leave individual deep children below the
 * intersection forever — they never hit the threshold and stay opacity:0.
 * Revealing the whole subtree on section entry makes reveal correct for any
 * section height, on any screen, with zero scroll-boundary edge cases.
 *
 * Reveal is one-way (adds `.revealed`, then stops observing) so re-scrolling
 * never re-hides settled content — the same philosophy as scrollDriver.ts.
 *
 * Reduced motion: animations.css zeroes the transition duration under
 * (prefers-reduced-motion: reduce) unless html.motion-forced is set; the
 * `.revealed` class still applies but the change is instantaneous, so content
 * is never hidden behind a never-firing animation. No special-casing needed.
 */

type RevealOptions = {
  /** Fraction of the SECTION that must be visible before revealing. */
  threshold?: number;
  /** Root margin so reveal begins a touch before the section fully enters. */
  rootMargin?: string;
};

const DEFAULT_THRESHOLD = 0.15;
const DEFAULT_ROOT_MARGIN = '0px 0px -10% 0px';
const REVEAL_SELECTOR = '[data-reveal], [data-stagger]';

/**
 * Svelte 5 action. Observes the node; on first intersection, reveals the node
 * and every revealable descendant, then disconnects (one-way).
 */
export function reveal(node: HTMLElement, options: RevealOptions = {}) {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const rootMargin = options.rootMargin ?? DEFAULT_ROOT_MARGIN;

  // SSR / no-IO safety: reveal immediately rather than risk blank content.
  if (typeof IntersectionObserver === 'undefined') {
    revealSubtree(node);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        revealSubtree(node);
        io.disconnect();
        break;
      }
    },
    { threshold, rootMargin }
  );

  io.observe(node);

  return {
    destroy() {
      // Never strand hidden content: reveal everything on teardown so a
      // destroyed / hot-reloaded section never leaves elements at opacity:0.
      revealSubtree(node);
      io.disconnect();
    },
  };
}

/** Add `.revealed` to the node (if revealable) and every revealable child. */
function revealSubtree(root: HTMLElement) {
  if (root.hasAttribute('data-reveal') || root.hasAttribute('data-stagger')) {
    root.classList.add('revealed');
  }
  root.querySelectorAll(REVEAL_SELECTOR).forEach((el) => el.classList.add('revealed'));
}
