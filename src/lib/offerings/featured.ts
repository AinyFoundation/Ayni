/**
 * Which single offering a category leads with.
 *
 * The rule, in the user's words: the next one if there is one, otherwise the
 * last one that happened. So a category always shows its most relevant date
 * in either direction, and the badge says which direction that is.
 *
 * Pure functions over an already-sorted list. The date comparison is passed
 * in rather than read here, because the answer has to come from the reader's
 * browser clock (see `clock.svelte.ts`) and a module that reaches for the
 * clock itself could not be called during SSR.
 */
import type { OfferingSummary } from './types';
import { endsOn } from './clock.svelte';

/** Which side of today the featured offering sits on. */
export type FeaturedState = 'next' | 'last';

export type Featured = {
  offering: OfferingSummary;
  state: FeaturedState;
};

/**
 * The offering a category leads with, or null when it has none at all.
 *
 * Null is a real outcome and callers must render nothing for it — no
 * skeleton, no "coming soon" card. Every category is in that state until the
 * first offering is published.
 *
 * @param offerings  Every published offering, ascending by start date.
 * @param category   Category slug to pick from.
 * @param isPast     Predicate — pass `isPastNow` so the answer tracks the
 *                   reader's clock rather than the build's.
 */
export function featuredFor(
  offerings: OfferingSummary[],
  category: string,
  isPast: (offering: OfferingSummary) => boolean
): Featured | null {
  const mine = offerings.filter((offering) => offering.category === category);
  if (mine.length === 0) return null;

  /* `mine` is ascending by start date, so the FIRST not-yet-past entry is the
   * soonest upcoming one. */
  const next = mine.find((offering) => !isPast(offering));
  if (next) return { offering: next, state: 'next' };

  /* Nothing ahead — fall back to the most recent thing behind. Compared on
   * the day it ENDS, not the day it started, so a retreat that ran across a
   * month boundary is ranked by when it actually finished. */
  const last = mine.reduce((newest, offering) =>
    endsOn(offering) > endsOn(newest) ? offering : newest
  );
  return { offering: last, state: 'last' };
}
