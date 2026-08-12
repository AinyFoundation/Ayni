/**
 * Ayni — build-time configuration.
 *
 * Values are inlined by Vite at build time, so the published bundle is fully
 * static: there is no runtime config fetch and nothing to reach for offline.
 *
 * Why `import.meta.env.VITE_*` and not `$env/static/public`: SvelteKit's static
 * module fails the BUILD when a declared variable is unset, and unset is the
 * normal state here until the collective runs its own endpoint. Vite's
 * `import.meta.env` simply yields `undefined`, which is exactly the "not
 * configured yet" signal ContactSection needs. `$env/dynamic/public` is not an
 * option either: it is unavailable during prerendering, and adapter-static
 * prerenders every route.
 *
 * To point the contact form at a real inbox, set this at build time:
 *
 *   VITE_CONTACT_ENDPOINT=https://<your-host>/contact npm run build
 *
 * It must be an endpoint the collective itself hosts. Routing form submissions
 * through a third-party form service would put an external dependency in the
 * request path of a core feature, which the sovereignty rule forbids.
 */

/** Where the contact form posts. Empty string = not configured; the form then
 * degrades to a mailto: compose, which needs no server at all. */
export const CONTACT_ENDPOINT: string = import.meta.env.VITE_CONTACT_ENDPOINT ?? '';

/**
 * PLACEHOLDER — replace with the sanctuary's real inbox.
 *
 * Deliberately a reserved `.example` domain (RFC 2606) so it cannot resolve to
 * a real third party's mailbox while it sits unset.
 */
export const CONTACT_EMAIL = 'hola@ayni.example';

/**
 * PLACEHOLDER — replace with the collective's real profile URLs.
 *
 * `#` and not an invented handle: a guessed URL sends visitors to somebody
 * else's account, which is worse than a link that goes nowhere. Both the hero
 * corner and the footer read these, so filling them in here lights up every
 * surface at once.
 *
 * An outbound link is not a dependency — the page renders and reads with no
 * network — so linking off-site does not touch the sovereignty rule.
 */
export const SOCIAL_URLS = {
  instagram: '#',
  facebook: '#'
};

/** Where the sanctuary is. Shared by the map caption and the footer so the
 * location is stated once. */
export const LOCATION = {
  town: 'Calca',
  region: 'Valle Sagrado',
  country: 'Perú',
  /** Matches WelcomePanel's location strip. OpenStreetMap's node says 2932 m;
   * the site has always printed 2,928 m, so that figure is kept until someone
   * decides which is right. Change it here and every surface follows. */
  elevation: '2,928 m',
  lat: -13.3216818,
  lon: -71.9560084,
};

/** Outbound link to Google Maps. An outbound link is not a dependency — the
 * page renders and reads with no network — and Google is deliberately never
 * the SOURCE of the drawn map (see ValleyMap.svelte). */
export const MAPS_URL =
  'https://maps.app.goo.gl/SNWAihxUcXg1GvhY8';

/** Google Maps place data for the review scraper. The hex ID is extracted
 * from the Maps URL; the search query is what the scraper types into Maps. */
export const GOOGLE_MAPS_PLACE_ID =
  '0x916ddf0d7a0bf135:0x784dd14a03cbf0a9';
export const REVIEWS_SEARCH_QUERY = 'Ayni Sanctuary Calca Peru';
