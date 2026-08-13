#!/usr/bin/env node

/**
 * scrape-reviews.mjs — Use Google Maps search to find and scrape reviews.
 *
 * Read this before editing: the site ships these quotes as real guest
 * testimony, so only the scraped output below should ever reach
 * src/lib/data/reviews.json. Never fabricate or reword reviews here.
 *
 * Search query / place ID mirror src/lib/config.ts (REVIEWS_SEARCH_QUERY,
 * GOOGLE_MAPS_PLACE_ID). The script cannot import that TypeScript module
 * directly, so keep the copy in sync.
 *
 * Google serves Maps in the locale of the requesting IP (here: Spanish), so
 * every selector carries both the English and Spanish form. If Google blocks
 * headless access it returns a "limited view" with no reviews at all; the
 * retry loop below reloads from the Maps homepage until the full page shows.
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const AVATARS_DIR = join(ROOT, 'static/images/avatars');
const REVIEWS_OUTPUT = join(ROOT, 'src/lib/data/reviews.json');

/** Mirror of REVIEWS_SEARCH_QUERY in src/lib/config.ts. */
const SEARCH_QUERY = 'Ayni Sanctuary Calca Peru';

/** How many warm-up → search → check rounds before giving up. */
const MAX_ATTEMPTS = 4;

/** Review card text classes (language-independent). */
const TEXT_SELECTOR = '.wiI7pd, .Jlozfb';

/** Share buttons: English "Share <name>'s review", Spanish "Compartir la
 * opinión de <name>". */
const SHARE_SELECTOR =
  '[aria-label*="Share"][aria-label*="review"], [aria-label*="Compartir la opinión de"]';

/**
 * Warm up on the Maps homepage, then navigate to the search URL. Navigating
 * straight to /maps/search/ frequently returns Google's "limited view" block
 * (no reviews); hitting the homepage first reliably yields the full place page.
 */
async function navigateToPlace(page) {
  // hl=en pins the interface language to English. Without it Google serves
  // Maps in the locale of the requesting IP (here: Spanish) and, worse,
  // auto-translates every review into that language.
  await page.goto('https://www.google.com/maps?hl=en', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
  await page
    .locator('button:has-text("Accept all"), button:has-text("Aceptar todo")')
    .first()
    .click({ timeout: 3000 })
    .catch(() => {});
  await page.waitForTimeout(1000);

  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(SEARCH_QUERY)}?hl=en`;
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);

  // If the search returned a result list instead of redirecting to the place
  // page, click the first result.
  if (!page.url().includes('/maps/place/')) {
    await page
      .locator('a[href*="/maps/place/"], .NrDZNb')
      .first()
      .click({ timeout: 8000 })
      .catch(() => {});
    await page.waitForTimeout(4000);
  }
}

async function main() {
  const { chromium } = await import('playwright');

  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' }
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  try {
    // Load the place page, retrying around Google's intermittent "limited view".
    let loaded = false;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`\n🔄 Attempt ${attempt}/${MAX_ATTEMPTS}`);
      await navigateToPlace(page);
      const cardCount = await page.evaluate(
        (sel) => document.querySelectorAll(sel).length,
        TEXT_SELECTOR
      );
      console.log('Place page:', page.url());
      console.log('Review cards visible:', cardCount);
      if (cardCount > 0) {
        loaded = true;
        break;
      }
      console.log('⚠️  Google served a limited view (no reviews) — waiting and retrying...');
      await page.waitForTimeout(8000);
    }

    if (!loaded) {
      console.error('❌ Could not load reviews — Google blocked the request or changed the page layout.');
      console.error('   src/lib/data/reviews.json and static/images/avatars were left untouched.');
      console.error('   Retry in a few minutes.');
      process.exitCode = 1;
      return;
    }

    // Open the Reviews tab so the full review list renders (Spanish "Opiniones"
    // with English "Reviews" fallback).
    console.log('📝 Opening Reviews tab...');
    const reviewsTab = page
      .locator(
        '[role="tab"]:has-text("Reviews"), [role="tab"]:has-text("Opiniones"), button:has-text("Reviews"), button:has-text("Opiniones"), button:has-text("Más opiniones"), button:has-text("More reviews")'
      )
      .first();
    const tabCount = await reviewsTab.count();
    console.log('Reviews tabs found:', tabCount);
    if (tabCount > 0) {
      await reviewsTab.click({ timeout: 5000 });
      console.log('Clicked Reviews tab');
      await page.waitForTimeout(3000);
    }

    // Scroll to load reviews. The reviews list is an inner scroll container
    // (.m6QErb); pin it to the bottom each round so Google lazy-loads the next
    // batch, and report progress so a stall is visible.
    console.log('📜 Scrolling...');
    for (let i = 0; i < 25; i++) {
      await page.evaluate(() => {
        document.querySelectorAll('.m6QErb').forEach((c) => {
          if (c.scrollHeight > c.clientHeight) c.scrollTop = c.scrollHeight;
        });
      });
      await page.waitForTimeout(700);
      if (i % 5 === 4) {
        const shares = await page.evaluate(
          (sel) => document.querySelectorAll(sel).length,
          SHARE_SELECTOR
        );
        console.log(`  ...${i + 1}/25 rounds, share buttons visible: ${shares}`);
      }
    }

    // Extract reviews.
    console.log('📊 Extracting reviews...');
    const reviews = await page.evaluate(({ textSelector, shareSelector }) => {
      const results = [];
      const shareBtns = document.querySelectorAll(shareSelector);

      for (const btn of shareBtns) {
        const label = btn.getAttribute('aria-label') || '';
        const nameMatch =
          label.match(/Share (.+)'s review/) || label.match(/Compartir(?: la opinión de)? (.+)$/);
        const name = nameMatch ? nameMatch[1].trim() : 'Unknown';

        // Walk up from the share button to the review card. Guard against
        // matching a page-level ancestor (e.g. the place's own Share button)
        // that merely contains other reviews: a real review card holds exactly
        // one share button and one rating.
        let container = btn;
        let textEl = null;
        for (let i = 0; i < 15; i++) {
          container = container.parentElement;
          if (!container) break;
          const candidate = container.querySelector(textSelector);
          if (!candidate) continue;
          const shares = container.querySelectorAll(shareSelector);
          const ratings = container.querySelectorAll('.kvMYJc');
          if (shares.length !== 1 || ratings.length !== 1) continue;
          textEl = candidate;
          break;
        }
        if (!textEl) continue;

        const text = textEl.textContent?.trim() || '';

        // Avatar — walk up from the share button and find the nearest avatar image.
        let avatarUrl = '';
        let parent = btn;
        for (let j = 0; j < 10; j++) {
          parent = parent.parentElement;
          if (!parent) break;
          const avatarImg = parent.querySelector('img[src*="googleusercontent.com/a-"]');
          if (avatarImg) {
            // High-res version: upscale the 36x36 thumbnail to 200x200.
            const src = avatarImg.getAttribute('src') || '';
            avatarUrl = src
              .replace(/=w\d+-h\d+/, '=w200-h200')
              .replace(/=s\d+(-c)?/, '=s200-c');
            break;
          }
        }

        const starsEl = container.querySelector('.kvMYJc');
        const starsLabel = starsEl?.getAttribute('aria-label') || '';
        const ratingMatch = starsLabel.match(/(\d)/);
        const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;
        const dateEl = container.querySelector('.rsqaWe');
        const date = dateEl?.textContent?.trim() || '';

        if (!results.find((r) => r.name === name && r.text === text)) {
          results.push({ name, text, avatarUrl, rating, date });
        }
      }

      return results;
    }, { textSelector: TEXT_SELECTOR, shareSelector: SHARE_SELECTOR });

    console.log(`\n✅ Found ${reviews.length} reviews\n`);
    console.log('Avatar URLs found:', reviews.filter((r) => r.avatarUrl).length);

    // Safety guard: never overwrite good data with an empty scrape.
    if (reviews.length === 0) {
      console.error('❌ No reviews extracted — Google likely changed the page layout.');
      console.error('   src/lib/data/reviews.json and static/images/avatars were left untouched.');
      process.exitCode = 1;
      return;
    }

    // Download avatars.
    if (!existsSync(AVATARS_DIR)) mkdirSync(AVATARS_DIR, { recursive: true });

    // Track hashes to detect Google's default avatar (same image for users without profile photos)
    const avatarHashes = new Map(); // hash → first filename that produced it

    for (const review of reviews) {
      if (review.avatarUrl && review.avatarUrl.includes('googleusercontent.com')) {
        const filename = `${review.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.webp`;
        const localPath = join(AVATARS_DIR, filename);
        try {
          const resp = await fetch(review.avatarUrl);
          if (resp.ok) {
            const buffer = Buffer.from(await resp.arrayBuffer());
            // Hash the image to detect duplicates (Google's default avatar)
            const { createHash } = await import('node:crypto');
            const hash = createHash('md5').update(buffer).digest('hex');

            if (avatarHashes.has(hash)) {
              // Duplicate detected — this is Google's default avatar, use placeholder
              console.log(`⚠️  ${review.name} → duplicate of ${avatarHashes.get(hash)}, using placeholder`);
              review.avatarLocal = '/images/avatars/placeholder.svg';
            } else {
              writeFileSync(localPath, buffer);
              review.avatarLocal = `/images/avatars/${filename}`;
              avatarHashes.set(hash, filename);
              console.log(`📸 ${review.name} → ${filename}`);
            }
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 500));
      }
      if (!review.avatarLocal) review.avatarLocal = '/images/avatars/placeholder.svg';
    }

    // Clean up orphaned avatar files that are no longer referenced
    const referencedAvatars = new Set(
      reviews.map((r) => r.avatarLocal).filter((l) => l.startsWith('/images/avatars/')).map((l) => l.split('/').pop())
    );
    if (existsSync(AVATARS_DIR)) {
      for (const file of readdirSync(AVATARS_DIR)) {
        if (file.endsWith('.webp') && !referencedAvatars.has(file)) {
          const filePath = join(AVATARS_DIR, file);
          unlinkSync(filePath);
          console.log(`🗑️  Removed orphaned avatar: ${file}`);
        }
      }
    }

    // Write output
    writeFileSync(
      REVIEWS_OUTPUT,
      JSON.stringify(
        {
          scrapedAt: new Date().toISOString(),
          placeName: 'Ayni Sanctuary',
          totalReviews: reviews.length,
          reviews: reviews.map((r, i) => ({
            id: `review-${i}-${Date.now()}`,
            name: r.name,
            avatarLocal: r.avatarLocal || '/images/avatars/placeholder.svg',
            rating: r.rating,
            text: r.text,
            date: r.date,
            isLocalGuide: false,
            selected: false
          }))
        },
        null,
        2
      )
    );

    console.log(`\n💾 Saved to ${REVIEWS_OUTPUT}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
