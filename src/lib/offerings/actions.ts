/**
 * The contact actions on an offering's page: WhatsApp, map, Instagram, email.
 *
 * Structure lives here; WORDS live in `offerings.actions`. Typing the key as
 * `keyof Messages['offerings']['actions']` is what keeps the two halves
 * honest — an action with no label, or a label no action points at, is a
 * compile error. Same contract `$lib/social.ts` uses for the social marks,
 * and the Instagram glyph is imported from there rather than redrawn, so the
 * camera in this row and the one in the footer cannot drift apart.
 *
 * Drawn, not fetched: outline glyphs on a 24px grid, no icon font, no sprite
 * sheet, no CDN. Stroke settings stay off the path data — `IconLink` puts
 * them on its own `<svg>` so every glyph carries identical weight.
 *
 * Every builder returns null when its channel is not configured, so a surface
 * renders nothing rather than a dead button. That is the same resolve-or-null
 * idiom `$lib/blog/cta.ts` uses for post CTAs, and it matters more here: a
 * WhatsApp button that opens an empty chat looks like the sanctuary ignored
 * you, which is worse than no button at all.
 */
import type { Messages } from '$lib/i18n/types';
import { MARK_PATHS } from '$lib/social';
import { CONTACT_EMAIL, MAPS_URL, SOCIAL_URLS, WHATSAPP_NUMBER, whatsappUrl } from '$lib/config';
import type { OfferingSummary } from './types';

export type OfferingAction = {
  href: string;
  /** Which message in `offerings.actions` names this link. */
  key: keyof Messages['offerings']['actions'];
  /** Path data only. `IconLink` carries fill/stroke. */
  path: string;
  /** Outbound links open in a new tab; a mailto: must not. */
  external: boolean;
};

const PATHS = {
  /** Speech bubble with the tail bottom-left, a handset inside. */
  whatsapp: `<path d="M12 2.9a9.1 9.1 0 0 0-7.9 13.6l-1.2 4.6 4.7-1.2A9.1 9.1 0 1 0 12 2.9Z" />
             <path d="M9.1 8.4c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .6.4l.6 1.5c.1.2 0 .4-.1.5l-.5.6c-.1.2-.2.3 0 .5a5.6 5.6 0 0 0 2.6 2.3c.2.1.3 0 .5-.1l.5-.6c.2-.2.3-.2.5-.1l1.5.7c.3.2.3.3.3.6v.5c0 .3-.1.5-.5.7-.9.4-2.2.3-4-.7a10 10 0 0 1-3.6-4c-.9-1.6-.9-2.7-.6-3.4Z" />`,
  /** Map pin. Matches the drop shape the "Open in Google Maps" link implies. */
  maps: `<path d="M12 21.4s6.75-5.4 6.75-10.6a6.75 6.75 0 1 0-13.5 0c0 5.2 6.75 10.6 6.75 10.6Z" />
         <circle cx="12" cy="10.6" r="2.6" />`,
  instagram: MARK_PATHS.instagram,
  /** Envelope: body plus the fold, drawn as one open chevron. */
  email: `<rect x="2.75" y="4.75" width="18.5" height="14.5" rx="2.5" />
          <path d="M3.6 6.6 12 12.9l8.4-6.3" />`
} as const;

/**
 * The actions available for one offering, in the order they should render.
 *
 * Per-offering `whatsapp` / `instagram` frontmatter overrides the site-wide
 * default, so a guest teacher's own channel can take the enquiry for their
 * own retreat without every other offering following it.
 *
 * The WhatsApp message is prefilled with the offering's title. The reader can
 * edit it before sending; it exists so the sanctuary knows which offering the
 * question is about without a round trip.
 */
export function actionsFor(
  offering: OfferingSummary,
  whatsappMessage: string
): OfferingAction[] {
  const actions: OfferingAction[] = [];

  const chat = whatsappUrl(offering.whatsapp ?? WHATSAPP_NUMBER, whatsappMessage);
  if (chat) actions.push({ key: 'whatsapp', href: chat, path: PATHS.whatsapp, external: true });

  actions.push({ key: 'maps', href: MAPS_URL, path: PATHS.maps, external: true });

  const instagram = offering.instagram ?? SOCIAL_URLS.instagram;
  /* `'#'` is the placeholder both profile URLs still hold in config.ts. A
   * link to "#" is a link to this very page, which reads as a broken button;
   * skip it until the real handle lands. */
  if (instagram && instagram !== '#') {
    actions.push({ key: 'instagram', href: instagram, path: PATHS.instagram, external: true });
  }

  actions.push({
    key: 'email',
    href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(offering.title)}`,
    path: PATHS.email,
    external: false
  });

  return actions;
}
