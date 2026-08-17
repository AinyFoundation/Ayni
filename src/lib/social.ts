/**
 * The collective's social marks, in one place.
 *
 * Two surfaces render these and they must never drift apart: the hero corner
 * (`+page.svelte`) and the footer's bottom right (`SiteFooter.svelte`). The
 * geometry lived inline in the hero until the footer needed it too, at which
 * point a copy would have been two drawings of the same logo free to diverge —
 * the same reason `$lib/nav` exists.
 *
 * Drawn, not fetched: outline glyphs on a 24px grid, no icon font, no sprite
 * sheet, no CDN. Stroke settings are deliberately NOT in the path data — each
 * consumer puts them on its own `<svg>`, so every mark is guaranteed the same
 * weight and a surface can set its own.
 *
 * STRUCTURE lives here; WORDS live in `chrome.social`. Typing the key as
 * `keyof Messages['chrome']['social']` is what keeps the two halves honest — a
 * mark with no label, or a label no mark points at, is a compile error.
 */
import type { Messages } from '$lib/i18n/types';
import { SOCIAL_URLS } from '$lib/config';

export type SocialMark = {
  href: string;
  /** Which message in `chrome.social` names this link. */
  key: keyof Messages['chrome']['social'];
  /** Path data only. The consumer's `<svg>` carries fill/stroke. */
  path: string;
};

/**
 * The geometry itself, keyed by mark.
 *
 * Split out from `SOCIAL_MARKS` so a surface that needs one of these glyphs
 * WITHOUT its social-profile href can reach the drawing directly — the
 * offerings action row links Instagram beside WhatsApp and a map pin, which
 * is a different list with different hrefs but must not become a second,
 * free-to-diverge copy of the same "f" and camera. One drawing, two lists.
 */
export const MARK_PATHS = {
  instagram: `<rect x="2.75" y="2.75" width="18.5" height="18.5" rx="5.5" />
           <circle cx="12" cy="12" r="4.6" />
           <circle cx="17.3" cy="6.7" r="1.15" fill="currentColor" stroke="none" />`,
  /* A real "f": stem, shoulder, crossbar. An earlier attempt drew the
   * shoulder as a detached tick and read as a stray mark, not a letter. */
  facebook: `<rect x="2.75" y="2.75" width="18.5" height="18.5" rx="5.5" />
           <path d="M14.4 21.25V10.6a2.6 2.6 0 0 1 2.6-2.6h1.35" />
           <path d="M10.9 13.6h6.2" />`
} as const;

export const SOCIAL_MARKS: SocialMark[] = [
  { key: 'instagram', href: SOCIAL_URLS.instagram, path: MARK_PATHS.instagram },
  { key: 'facebook', href: SOCIAL_URLS.facebook, path: MARK_PATHS.facebook }
];
