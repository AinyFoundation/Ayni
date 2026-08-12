---
slug: google-maps-reviews-scraper
status: draft
created: 2026-08-07
last-updated: 2026-08-07
sources: 12
---

# Google Maps Reviews Scraper — Skill + UI

The VoicesSection currently ships three placeholder testimonials. The user wants to pull real reviews from the Ayni Sanctuary Google Maps listing (~14 reviews), curate the 4 best, show reviewer profile pictures, and add a "View all reviews" popup. This research covers: (a) how to programmatically fetch Google Maps reviews, (b) how to build this as a reusable pi skill, and (c) the UI component changes needed.

**Explicitly out of scope:** real-time review syncing, review analytics/dashboard, Trustpilot or other non-Google sources, review moderation workflows, schema.org/Review JSON-LD (deferred per existing VoicesSection integrity rules until quotes are real and consented).

## Constraints carried forward

- **Local-first.** The scraper runs on-demand (build time or manual invocation), not in the render path. Scraped data is stored as static files in the repo. The published page makes zero network calls for reviews.
- **Sovereignty first.** No external service in the render path of the published site. The scraper may use external APIs/services at build time, but the output is static.
- **Open-source only.** Scraper tools must be Apache-2.0 or compatible.
- **Static adapter.** `adapter-static` prerenders everything. Reviews must be pre-scraped and baked into the build.
- **Integrity.** Reviews are claims by real people. The scraper must not fabricate, modify, or selectively quote reviews. Profile pictures must be the actual Google profile photos, not stock images. Consent handling is a human decision (not automated).
- **Existing VoicesSection pattern.** Typed `Testimonial[]` behind a `SEAM` comment. The skill should output data that fits this shape or a superset of it.

## Landscape

### Approach 1: Google Places API (Official)

The official Google Maps Platform offers a Places API with a "Place Details" endpoint that returns reviews.

**How it works:**
- Text Search to find the place by name → get `place_id`
- Place Details with `FieldMask=reviews` to fetch reviews
- Each review includes: `authorAttribution` (name, photoUri, profileUri), `rating`, `text`, `relativePublishTimeDescription`, `publishTime`

**Pros:**
- Official, stable API from Google
- Structured JSON response
- Includes profile photo URLs (`photoUri` in `authorAttribution`)
- No anti-detection needed

**Cons:**
- Requires a Google Cloud API key (costs money)
- Pricing: $17/1000 requests (Text Search) + $17/1000 (Place Details) = ~$0.034 per full scrape
- Reviews are paginated (max 5 per request, need multiple calls for 14 reviews)
- Google's ToS may restrict storing/republishing review content
- Requires billing enabled on Google Cloud project

**Verdict:** Works but introduces a paid dependency and Google Cloud account. Overkill for a one-time scrape of 14 reviews.

### Approach 2: Playwright Browser Automation

Scrape Google Maps directly using a headless browser that renders the page like a real user.

**How it works:**
- Launch headless Chromium/Firefox via Playwright
- Navigate to Google Maps, search for the place
- Click "Reviews" tab, scroll to load all reviews
- Extract review text, ratings, dates, reviewer names, and profile photo URLs from the DOM
- Download profile photos to `static/images/avatars/`

**Pros:**
- Free (no API key, no paid service)
- Gets exactly what a user sees on the page
- Profile photos are accessible via `lh3.googleusercontent.com` URLs
- Can be run on-demand with no infrastructure
- Open-source tools available (`google-reviews-scraper-pro`, custom scripts)

**Cons:**
- Fragile: Google changes their DOM structure frequently, breaking selectors
- Anti-bot detection: Google may serve CAPTCHAs or rate-limit
- Needs Playwright installed on the machine (~300MB browser binaries)
- Slower than API calls (browser startup + page rendering)
- May violate Google's ToS (automated access)

**Key libraries:**
- `playwright` (npm/pip) — browser automation
- `playwright-stealth` or `rebrowser-playwright` — anti-detection patches
- `google-reviews-scraper-pro` (GitHub, Node.js) — maintained wrapper with incremental scraping, MongoDB support, anti-detection

**Profile photo URLs:** Google Maps reviewer profile photos are served from `lh3.googleusercontent.com/` with URLs like:
```
https://lh3.googleusercontent.com/a-/ALV-UjV...=s40-c-c0x00000000-cc-rp-mo-ba3/photo.jpg
```
These are publicly accessible and can be downloaded with a simple HTTP GET.

**Verdict:** Best fit for this project. Free, no external service dependency at runtime, and the skill can be run manually whenever reviews need updating.

### Approach 3: Third-Party Scraping APIs (SerpApi, Outscraper, SearchApi)

Paid services that handle the scraping infrastructure and return structured JSON.

**SerpApi:**
- Endpoint: `https://serpapi.com/search?engine=google_maps_reviews&data_id=<place_id>`
- Returns: reviews with `user.name`, `user.thumbnail`, `rating`, `snippet`, `date`, `iso_date`
- Free tier: 100 searches/month
- Pricing: $50/month for 5,000 searches

**Outscraper:**
- Endpoint: `GET /api/v1/google-maps-reviews`
- Returns: similar structured data with reviewer photos
- Free tier: limited credits for new users

**Pros:**
- Structured JSON, no DOM parsing
- Handles anti-detection server-side
- Reliable and maintained

**Cons:**
- Paid service (ongoing cost)
- External dependency — if the service goes down, the skill breaks
- Violates sovereignty principle if used in a build pipeline that depends on it
- Overkill for 14 reviews

**Verdict:** Rejected. Paid external dependency contradicts sovereignty principle. Playwright is free and sufficient.

## Recommendation

### Build a pi skill: `scrape-google-reviews`

A skill that uses Playwright to scrape Google Maps reviews, download profile photos, and output a JSON file that the VoicesSection can consume.

#### Skill structure

```
.agents/skills/scrape-google-reviews/
├── SKILL.md                    # Skill instructions
├── scripts/
│   ├── scrape.mjs              # Main scraper (Node.js + Playwright)
│   └── download-avatars.mjs    # Download profile photos to static/
└── package.json                # playwright dependency
```

#### Scraper approach (`scrape.mjs`)

```javascript
// Pseudocode — the actual implementation will differ
import { chromium } from 'playwright';

// 1. Launch browser with stealth patches
// 2. Navigate to Google Maps
// 3. Search for "Ayni Sanctuary Calca Peru"
// 4. Click the place result
// 5. Click "Reviews" tab
// 6. Sort by "Most relevant" or "Newest"
// 7. Scroll the review container to load all reviews
// 8. Extract from each review element:
//    - Reviewer name (from the profile link text)
//    - Profile photo URL (from the img src)
//    - Star rating (from the aria-label or star elements)
//    - Review text (from the review snippet)
//    - Date (from the timestamp)
//    - Review URL (from the share/link button)
// 9. Download profile photos to static/images/avatars/
// 10. Write reviews.json to src/lib/data/reviews.json
```

#### Output format

The scraper outputs a JSON file that extends the existing `Testimonial` type:

```typescript
// src/lib/data/reviews.json
type ScrapedReview = {
  id: string;                    // Google review ID
  name: string;                  // Reviewer display name
  avatarUrl: string;             // Local path: /images/avatars/<id>.webp
  rating: number;                // 1-5 stars
  text: string;                  // Full review text
  date: string;                  // "2 months ago" or ISO date
  isoDate: string;               // ISO 8601 for sorting
  profileUrl: string;            // Google Maps contributor profile URL
  isLocalGuide: boolean;         // Local Guide badge
  reviewCount: number;           // How many reviews this person has made
};
```

#### Skill workflow

1. **Run the skill:** `/skill:scrape-google-reviews` or manually `node scripts/scrape.mjs`
2. **Skill scrapes reviews** from Google Maps for the configured place
3. **Skill downloads profile photos** to `static/images/avatars/`
4. **Skill outputs** `src/lib/data/reviews.json`
5. **Human curates:** Reviews are marked with a `selected: boolean` field; the human reviews and picks 4
6. **VoicesSection reads** from `reviews.json` at build time (import or `+page.server.ts` load)

#### Configuration

Add to `src/lib/config.ts`:

```typescript
export const GOOGLE_MAPS_PLACE_ID = 'ChIJ...'; // Ayni Sanctuary's place ID
export const REVIEWS_PLACE_NAME = 'Ayni Sanctuary Calca Peru';
```

The place ID can be found from the Google Maps URL or via the Places API Text Search.

### UI Changes

#### VoicesSection updates

1. **Replace placeholder array** with data from `reviews.json`
2. **Show real profile photos** instead of SVG silhouettes
3. **Add star ratings** (the existing code deliberately omits them for placeholders; real reviews have real ratings)
4. **Add "View all reviews" button** that opens a dialog

#### ReviewPopup component (new)

A `<dialog>`-based popup (following the BookSection precedent) showing all scraped reviews:

```svelte
<!-- ReviewPopup.svelte -->
<dialog bind:this={dialogEl}>
  <div class="review-popup">
    <h2>What people say</h2>
    <div class="reviews-list">
      {#each reviews as review}
        <article class="review-full">
          <img src={review.avatarUrl} alt="" />
          <div class="review-meta">
            <span class="review-name">{review.name}</span>
            <span class="review-date">{review.date}</span>
          </div>
          <div class="review-stars">{/* star rating */}</div>
          <p>{review.text}</p>
        </article>
      {/each}
    </div>
    <button onclick={() => dialogEl.close()}>Close</button>
  </div>
</dialog>
```

#### VoicesSection changes

- Grid shows 4 selected reviews (curated from the full set)
- Each card shows: profile photo, name, origin/context, star rating, quote
- A "Read all reviews →" button at the bottom opens the ReviewPopup
- The button links to the Google Maps reviews page as a fallback

### Anti-Detection Strategy

Google Maps aggressively detects automated access. The scraper needs:

1. **Playwright Stealth** — patches `navigator.webdriver`, canvas fingerprint, etc.
2. **Realistic viewport** — match common screen resolutions
3. **Random delays** — 2-5 second pauses between actions
4. **User-agent rotation** — use real Chrome user-agent strings
5. **Cookie persistence** — optionally save session to avoid re-detection
6. **Retry logic** — if blocked, wait and retry with different parameters

If Playwright scraping proves unreliable (Google blocks it consistently), fallback options:
- **SerpApi free tier** (100/month is plenty for on-demand updates)
- **Manual extraction** — user copies reviews from browser, skill parses the text
- **Google Places API** — if the project gets a Google Cloud account for other reasons

### Profile Photo Handling

Google profile photos are served from `lh3.googleusercontent.com`. The URLs are stable and publicly accessible. The scraper should:

1. Extract the `src` attribute from each reviewer's `<img>` element
2. Modify the URL to request a specific size: replace `=s40-c-...` with `=s200-c-c0x00000000-cc-rp-mo-ba3/photo.jpg` for higher resolution
3. Download to `static/images/avatars/<reviewer-id>.webp` (convert to WebP for consistency with existing images)
4. The VoicesSection references these local files, not the Google URLs

### Data Freshness

The skill is designed for on-demand invocation, not automated scheduling:

- Run manually when the user wants to update reviews
- The `reviews.json` file is committed to the repo
- A timestamp field tracks when reviews were last scraped
- The VoicesSection shows a "Last updated: <date>" note (optional)

## Risks

| Risk | Mitigation |
|---|---|
| Google blocks Playwright scraping | Stealth plugins + retry logic; fallback to SerpApi free tier or manual extraction |
| DOM selectors break when Google updates Maps | Maintain a selector config object; skill reports errors clearly |
| Profile photo URLs change format | Download photos at scrape time; local files are stable |
| Review content copyright concerns | Reviews are public data; display with attribution to Google Maps; link to original |
| 14 reviews may not have 4 strong ones | Show fewer if needed; quality over quantity |
| Place ID changes | Config-driven; update `config.ts` if the place is relisted |

## Open questions

1. **Place ID for Ayni Sanctuary** — needs to be discovered. Can be found from the Google Maps URL or via a Text Search API call.
2. **Consent handling** — the existing VoicesSection integrity rules require consent before publishing real names/photos. The skill scrapes the data; the human curates and obtains consent.
3. **Google ToS compliance** — automated scraping may violate Google's Terms of Service. The skill is for internal use (scraping your own business's reviews), which is lower risk but not zero risk.
4. **Star rating display** — the current VoicesSection deliberately omits star ratings for placeholders. Should real reviews show stars? (Recommendation: yes, with the rating as a visual accent, not the focus.)

## Sources

### Code

- `src/lib/components/VoicesSection.svelte` — current placeholder implementation, typed Testimonial[] pattern
- `src/lib/config.ts` — build-time configuration pattern, MAPS_URL constant
- `src/lib/components/BookSection.svelte` — `<dialog>` precedent for the review popup
- `docs/research/sanctuary-gallery-voices-contact/research.md` — canonical source for Voices design decisions

### Web

- `https://github.com/georgekhananaev/google-reviews-scraper-pro` — maintained Node.js Google Maps review scraper with anti-detection (fetched 2026-08-07)
- `https://serpapi.com/google-maps-reviews-api` — SerpApi Google Maps Reviews API documentation, response format with user thumbnails (fetched 2026-08-07)
- `https://outscraper.com/google-maps-reviews-api/` — Outscraper Google Maps Reviews API, free tier option (fetched 2026-08-07)
- `https://dev.to/agenthustler/google-maps-scraping-extract-places-reviews-and-business-hours-in-2026-cfp` — 2026 scraping landscape overview (fetched 2026-08-07)
- `https://dev.to/hasdata_com/simple-google-maps-scraper-using-playwright-e72` — Playwright scraping tutorial with code examples (fetched 2026-08-07)
- `https://developers.google.com/maps/documentation/places/web-service/text-search` — Google Places API Text Search documentation (fetched 2026-08-07)
- `https://github.com/prashant7738/GoogleMap-Review-Scrapper` — Playwright-based Google Maps review scraper with stealth (fetched 2026-08-07)

## Decisions and revisions

- **2026-08-07 — initial.** Research completed. Recommended approach: Playwright-based pi skill (`scrape-google-reviews`) that scrapes Google Maps, downloads profile photos, outputs JSON. UI: VoicesSection updated with real data + "View all reviews" dialog. Fallback: SerpApi free tier if Playwright scraping is blocked.
