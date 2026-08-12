---
name: scrape-google-reviews
description: Scrape Google Maps reviews for Ayni Sanctuary using Playwright. Downloads reviewer profile photos and outputs a JSON file for the VoicesSection. Auto-installs dependencies if missing. Use when updating the reviews/testimonials on the website.
---

# Scrape Google Reviews

Scrapes Google Maps reviews for Ayni Sanctuary using a headless browser (Playwright). Downloads reviewer profile photos and outputs structured JSON for the VoicesSection component.

## Prerequisites

- Node.js 18+ (already required by the project)
- Playwright and Chromium are project-local dependencies

## Auto-Install

If Playwright or Chromium is not installed, run:

```bash
npm run scrape:reviews:install
```

Or let the scraper handle it — it will prompt you if dependencies are missing.

## Usage

```bash
# Scrape reviews and download profile photos
npm run scrape:reviews

# Or directly:
node scripts/scrape-reviews.mjs
```

## What It Does

1. Launches a headless Chromium browser via Playwright
2. Navigates to Google Maps via search (not direct URL — avoids anti-bot detection)
3. Opens the reviews tab and scrolls to load all reviews
4. Extracts reviews by finding share buttons (`[aria-label*="Share"][aria-label*="review"]`)
5. Walks up DOM from each share button to find review text (`.wiI7pd`), rating (`.kvMYJc`), date (`.rsqaWe`)
6. Finds reviewer avatar images from `lh3.googleusercontent.com/a-/` (36x36, upscaled to 200x200)
7. Downloads all avatars to `static/images/avatars/*.webp`
8. Outputs `src/lib/data/reviews.json` with `avatarLocal` paths

## Output Format

```json
{
  "scrapedAt": "2026-08-07T22:00:00Z",
  "placeName": "Ayni Sanctuary",
  "totalReviews": 14,
  "reviews": [
    {
      "id": "abc123",
      "name": "John Doe",
      "avatarLocal": "/images/avatars/abc123.webp",
      "rating": 5,
      "text": "Amazing experience...",
      "date": "2 months ago",
      "isoDate": "2026-06-07",
      "isLocalGuide": false,
      "selected": false
    }
  ]
}
```

## After Scraping

1. Review `src/lib/data/reviews.json`
2. Set `"selected": true` on the 3 best reviews (one row on desktop)
3. Run `npm run build` to rebuild the site

## Configuration

Place ID and search query are in `src/lib/config.ts`:

```typescript
export const GOOGLE_MAPS_PLACE_ID = '0x916ddf0d7a0bf135:0x784dd14a03cbf0a9';
export const REVIEWS_SEARCH_QUERY = 'Ayni Sanctuary Calca Peru';
```

## Limitations

- Google may block automated access; the scraper uses stealth techniques (user-agent, anti-webdriver)
- If blocked, Google shows "limited view" with no reviews — retry in a few minutes
- DOM selectors may break if Google updates Maps; update `scripts/scrape-reviews.mjs` if this happens
- Avatar images use Google's CDN URLs which expire — re-run to refresh them
- Only reviews visible on the page are captured; Google may paginate
- Reviews are public data; display with attribution to Google Maps

## Replicating

The scraper is self-contained in `scripts/scrape-reviews.mjs`. To adapt for another business:

1. Update `REVIEWS_SEARCH_QUERY` in `src/lib/config.ts`
2. Update the place URL in the scraper if needed
3. The review extraction logic (share button → walk up → find text) is Google Maps-specific but stable
