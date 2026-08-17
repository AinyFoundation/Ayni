/**
 * The site's clock, for deciding what has already happened.
 *
 * There is no runtime server to ask — this is a prerendered static site — so
 * "is this offering past?" cannot be answered once at build and stay true.
 * `list.ts` computes an `isPast` when the site builds, and the moment the
 * build is a day old that flag lies: a finished ceremony keeps its upcoming
 * badge and its upcoming sort position until somebody redeploys.
 *
 * So the comparison runs in the browser, against the reader's own clock.
 *
 * The sequence matters for hydration. `today` starts EMPTY, and while it is
 * empty every helper here falls back to the build-time `isPast` — which is
 * exactly what the server rendered, so the first client render is identical
 * and there is no mismatch. `startClock()` then fills it in `onMount`, and
 * everything reading these helpers through `$derived` recomputes on the next
 * frame with the real date.
 *
 * One module-scope `$state` shared by every surface, matching the convention
 * `menu.svelte.ts` and `blogNav.svelte.ts` already set. Two surfaces read it
 * (the homepage scroller's Next/Last card and the offerings index's
 * upcoming/past partition), and they must never disagree about where the
 * boundary falls.
 */
import type { OfferingSummary } from './types';

/** `YYYY-MM-DD` in the reader's own timezone, empty before `startClock()`. */
export const clock = $state({ today: '' });

/**
 * Local calendar date as `YYYY-MM-DD`.
 *
 * Deliberately NOT `toISOString().slice(0, 10)`, which converts to UTC first
 * and therefore reports tomorrow's date for anyone east of Greenwich late in
 * the evening — and yesterday's for Peru (UTC-5) early in the morning, which
 * is the timezone that actually matters here. An offering is scheduled
 * against a wall calendar, so the comparison has to use the reader's wall
 * calendar too.
 */
function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Start the clock. Idempotent and safe to call from every consumer's
 * `onMount` — the first call wins and the rest are no-ops, so a page holding
 * both the scroller and the index does not fight itself.
 */
export function startClock(): void {
  if (typeof window === 'undefined') return;
  if (clock.today) return;
  clock.today = localToday();
}

/**
 * The last day an offering occupies: its end date when it runs several days,
 * otherwise its start. An offering is "past" only once that day is over, so a
 * retreat is still upcoming on its final morning.
 */
export function endsOn(offering: OfferingSummary): string {
  return offering.dateEnd ?? offering.dateStart;
}

/**
 * Has this offering finished?
 *
 * Falls back to the build-time flag until the clock starts — see the header
 * comment; that fallback is what keeps server and first client render equal.
 */
export function isPastNow(offering: OfferingSummary): boolean {
  return clock.today ? endsOn(offering) < clock.today : offering.isPast;
}
