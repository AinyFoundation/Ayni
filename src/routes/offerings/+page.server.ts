import { listOfferings } from '$lib/offerings/list';
import { OFFERING_CATEGORIES } from '$content/offeringCategories.js';
import type { PageServerLoad } from './$types';

export const prerender = true;

/**
 * Every published offering, plus the category list with live counts.
 *
 * The whole list ships and the client filters it. That is the same shape the
 * blog index uses, and for the same reason: this route is prerendered to ONE
 * file, so a server-side filter could only ever answer for one query string.
 *
 * Counts are computed here rather than in the component because the component
 * only ever sees the filtered subset, and a chip that reports how many things
 * it would reveal has to count the unfiltered set.
 */
export const load: PageServerLoad = async () => {
  const offerings = listOfferings();

  return {
    offerings,
    categories: OFFERING_CATEGORIES.map((category) => ({
      ...category,
      count: offerings.filter((offering) => offering.category === category.slug).length
    }))
  };
};
