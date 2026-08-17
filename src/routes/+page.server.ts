import { listPosts } from '$lib/blog/list';
import { toCards } from '$lib/blog/cards.server';
import { listOfferings } from '$lib/offerings/list';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PageServerLoad } from './$types';

/**
 * The homepage journal strip shows the three newest posts,
 * and the voices section shows Google Maps reviews.
 *
 * Server load, not universal, so `list.ts` and everything it pulls in stays
 * out of the client bundle. The page is prerendered, so this runs once at
 * build and the result is baked into the HTML — no request, no waterfall.
 */
export const load: PageServerLoad = async () => {
  // Load reviews from scraped data
  let reviews = [];
  try {
    const reviewsPath = join(process.cwd(), 'src/lib/data/reviews.json');
    const raw = readFileSync(reviewsPath, 'utf-8');
    const data = JSON.parse(raw);
    reviews = data.reviews ?? [];
  } catch {
    // reviews.json may not exist yet; ship empty array
  }

  return {
    latestPosts: toCards(listPosts().slice(0, 3)),
    reviews,
    /**
     * Every published offering, for the scroller's per-category Next/Last
     * card. The whole list rather than three pre-picked entries, because the
     * pick depends on the READER'S clock — a build-time choice would be
     * stale the day after it was made. Metadata only, and there are a handful
     * of these, so the prerendered payload cost is small.
     */
    offerings: listOfferings(),
  };
};
