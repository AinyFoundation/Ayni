#!/usr/bin/env node

/**
 * scrape-reviews.mjs — Use Google Maps search to find and scrape reviews.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const AVATARS_DIR = join(ROOT, 'static/images/avatars');
const REVIEWS_OUTPUT = join(ROOT, 'src/lib/data/reviews.json');

async function main() {
  const { chromium } = await import('playwright');
  
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 }
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  try {
    // Go to Google Maps homepage first
    console.log('🗺️  Going to Google Maps...');
    await page.goto('https://www.google.com/maps', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // Try to accept cookies
    await page.locator('button:has-text("Accept all")').click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Search for the place
    console.log('🔍 Searching for Ayni Sanctuary...');
    const searchInput = page.locator('#searchboxinput');
    
    // Check if search input exists
    const hasSearch = await searchInput.count();
    console.log('Search input found:', hasSearch > 0);
    
    if (hasSearch > 0) {
      await searchInput.fill('Ayni Sanctuary Calca Peru');
      await searchInput.press('Enter');
      await page.waitForTimeout(5000);
      
      // Click on the first result
      console.log('📍 Clicking on result...');
      await page.locator('.NrDZNb').first().click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(5000);
    } else {
      console.log('No search input found, trying direct navigation...');
      await page.goto('https://www.google.com/maps/search/Ayni+Sanctuary+Calca+Peru', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
      
      // Click on the place
      await page.locator('h1').first().click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(5000);
    }
    
    // Now look for Reviews
    console.log('📝 Looking for Reviews...');
    
    // Check all text content
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('Page has "Reviews":', pageText.includes('Reviews'));
    console.log('Page has "review":', pageText.includes('review'));
    
    // Try to click Reviews tab
    const reviewsTab = page.locator('button:has-text("Reviews"), [role="tab"]:has-text("Reviews")');
    const tabCount = await reviewsTab.count();
    console.log('Reviews tabs found:', tabCount);
    
    if (tabCount > 0) {
      await reviewsTab.first().click({ timeout: 5000 });
      console.log('Clicked Reviews tab');
      await page.waitForTimeout(3000);
    }
    
    // Scroll to load reviews
    console.log('📜 Scrolling...');
    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, 500);
        document.querySelectorAll('.m6QErb').forEach(c => {
          if (c.scrollHeight > c.clientHeight) c.scrollTop = c.scrollHeight;
        });
      });
      await page.waitForTimeout(800);
    }
    
    // Extract reviews
    console.log('📊 Extracting reviews...');
    const reviews = await page.evaluate(() => {
      const results = [];
      
      // Find by share buttons
      const shareBtns = document.querySelectorAll('[aria-label*="Share"][aria-label*="review"]');
      
      for (const btn of shareBtns) {
        const label = btn.getAttribute('aria-label') || '';
        const nameMatch = label.match(/Share (.+)'s review/);
        const name = nameMatch ? nameMatch[1] : 'Unknown';
        
        let container = btn;
        for (let i = 0; i < 15; i++) {
          container = container.parentElement;
          if (!container) break;
          
          const textEl = container.querySelector('.wiI7pd, .Jlozfb');
          if (textEl) {
            const text = textEl.textContent?.trim() || '';
            
            // Get avatar - look for any img with googleusercontent.com
            // Reviewer avatars typically have a specific URL pattern
            const allImgs = container.querySelectorAll('img');
            let avatarUrl = '';
            for (const img of allImgs) {
              const src = img.getAttribute('src') || '';
              // Reviewer avatars are usually small (40-100px) and from googleusercontent.com
              if (src.includes('googleusercontent.com') && 
                  !src.includes('w408') && !src.includes('w800') && 
                  (src.includes('=s40') || src.includes('=s100') || src.includes('photo') || img.width < 150)) {
                avatarUrl = src;
                break;
              }
            }
            
            // If still no avatar, try the NBa7we class (Google's avatar class)
            if (!avatarUrl) {
              const avatarEl = container.querySelector('.NBa7we, .RZ66Rb img');
              if (avatarEl) {
                avatarUrl = avatarEl.getAttribute('src') || '';
              }
            }
            
            const starsEl = container.querySelector('.kvMYJc');
            const starsLabel = starsEl?.getAttribute('aria-label') || '';
            const ratingMatch = starsLabel.match(/(\d)/);
            const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;
            const dateEl = container.querySelector('.rsqaWe');
            const date = dateEl?.textContent?.trim() || '';
            
            if (!results.find(r => r.name === name && r.text === text)) {
              results.push({ name, text, avatarUrl, rating, date });
            }
            break;
          }
        }
      }
      
      return results;
    });

    console.log(`\n✅ Found ${reviews.length} reviews\n`);
    console.log('Avatar URLs found:', reviews.filter(r => r.avatarUrl).length);

    // Download avatars
    if (!existsSync(AVATARS_DIR)) mkdirSync(AVATARS_DIR, { recursive: true });

    for (const review of reviews) {
      if (review.avatarUrl && review.avatarUrl.includes('googleusercontent.com')) {
        const filename = `${review.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.webp`;
        const localPath = join(AVATARS_DIR, filename);
        try {
          const resp = await fetch(review.avatarUrl);
          if (resp.ok) {
            writeFileSync(localPath, Buffer.from(await resp.arrayBuffer()));
            review.avatarLocal = `/images/avatars/${filename}`;
            console.log(`📸 ${review.name} → ${filename}`);
          }
        } catch {}
        await new Promise(r => setTimeout(r, 500));
      }
      if (!review.avatarLocal) review.avatarLocal = '/images/avatars/placeholder.svg';
    }

    // Write output
    writeFileSync(REVIEWS_OUTPUT, JSON.stringify({
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
    }, null, 2));

    console.log(`\n💾 Saved to ${REVIEWS_OUTPUT}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

main();
