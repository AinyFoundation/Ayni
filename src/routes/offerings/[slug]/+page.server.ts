import { error } from '@sveltejs/kit';
import { getOffering, listOfferingSlugs, listOfferings } from '$lib/offerings/list';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

/**
 * How the prerenderer discovers every offering. Without this it only builds
 * the pages something links to, and an offering not yet on the index (or
 * reachable only through a filter the crawler never applies) would silently
 * never build.
 */
export const entries: EntryGenerator = () => listOfferingSlugs().map((slug) => ({ slug }));

export const load: PageServerLoad = async ({ params }) => {
  const offering = getOffering(params.slug);
  if (!offering) error(404, `No offering at /offerings/${params.slug}`);

  /**
   * Three more from the same category to close the page — the reader who
   * missed this date is exactly the reader who wants the next one. Upcoming
   * only: suggesting something already past would be a dead end.
   *
   * Build-time `isPast` is the right call HERE, unlike everywhere else: this
   * runs at build with no browser to ask, and the only way to be wrong is to
   * suggest an offering that finished since the last deploy — which the card
   * itself then marks "Past" from the reader's clock anyway. Filtering the
   * whole category client-side would mean shipping it just to hide most of it.
   */
  const related = listOfferings()
    .filter((other) => other.slug !== offering.slug)
    .filter((other) => other.category === offering.category && !other.isPast)
    .slice(0, 3);

  return { offering, related };
};
