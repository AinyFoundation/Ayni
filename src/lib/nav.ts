/**
 * The site's navigation, in one place.
 *
 * Two components render these links and they must never drift apart: the
 * header row (NavContent, which +layout.svelte renders twice) and the phone
 * menu (MobileMenu, rendered once). Keeping the list here is what lets the
 * phone menu exist at all — see MobileMenu.svelte for why it cannot live
 * inside NavContent.
 *
 * Every destination is a route or a section that exists. The original list
 * (/wings, /about, /community, /sanctuary) pointed at four pages that were
 * never built and 404'd on every click.
 *
 * Hrefs are root-relative, never a bare "#offerings": the header is site-wide
 * and these sections live on the homepage only, so from /blog a bare fragment
 * would resolve to /blog#offerings and go nowhere.
 *
 * STRUCTURE lives here; WORDS live in `chrome.nav`. A link carries the key of
 * its label rather than the label itself, and the consumer resolves it. That
 * split is what lets the list stay a module-scope constant: a label baked in
 * here would be frozen at import time in whatever locale happened to be the
 * default, whereas both consumers already read the catalog per render and can
 * follow the locale when it becomes dynamic. Typing the key as
 * `keyof Messages['chrome']['nav']` is what keeps the two halves honest — a
 * key with no message, or a message no link points at, is a compile error.
 */
import type { Messages } from '$lib/i18n/types';

export type NavLink = {
  href: string;
  /** Which message in `chrome.nav` names this link. */
  key: keyof Messages['chrome']['nav'];
  /** Dropped first when the header row runs out of width. */
  secondary?: boolean;
};

export const NAV_LINKS: NavLink[] = [
  { href: '/', key: 'home' },
  { href: '/#offerings', key: 'offerings' },
  { href: '/#book', key: 'book', secondary: true },
  { href: '/blog', key: 'journal' },
  { href: '/#contact', key: 'visit' },
];
