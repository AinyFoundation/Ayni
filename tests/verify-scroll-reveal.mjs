/**
 * Ayni — Section 2 scroll-scrub verification (Playwright).
 *
 * Usage: node tests/verify-scroll-reveal.mjs [baseUrl]
 * Default target: the paseo preview server (npm run dev -- --host --port 3006).
 *
 * Playwright resolves from the shared bioma install — this repo keeps zero
 * test dependencies (AGENTS.md dep posture).
 *
 * The section is SCRUBBED, not triggered: every value is a pure function
 * of scroll position. That makes the assertions deterministic — no timing
 * races — and reversibility is the core property under test.
 *
 * Covers:
 *   1. reduced-motion ON, no override → everything at rest (accessible)
 *   2. reduced-motion ON + ?motion=1  → scrub: hidden at top, exact
 *      mid-window values at exact scroll positions, settled at p=1,
 *      and values REVERSE when scrolling back
 *   3. ?motion=1 persists in localStorage across reloads; ?motion=0 clears
 *   4. no reduced-motion → normal scrub path
 */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire('/opt/projects/bioma/node_modules/');
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://100.89.116.9:3006';

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}\n    ${e.message.split('\n')[0]}`);
  }
}

/** Raw scroll fraction t (0–1 of the hero container's scrollable distance).
 * Eased p follows easeInOutCustom: p(0.358)≈0.58 · p(0.458)≈0.70 · p(1)=1. */
async function scrollToT(page, t) {
  await page.evaluate((tt) => {
    const c = document.querySelector('.scroll-container');
    window.scrollTo(0, tt * (c.offsetHeight - window.innerHeight));
  }, t);
  // one scroll event + rAF coalesce + emit — values are position-based,
  // so a short settle is all that's needed (no transition durations).
  await page.waitForTimeout(200);
}

async function state(page) {
  return page.evaluate(() => {
    const cs = (s) => getComputedStyle(document.querySelector(s));
    return {
      titleO: parseFloat(cs('.welcome-title').opacity),
      locO: parseFloat(cs('.location-strip').opacity),
      imgT: cs('.welcome-image').transform,
      doorClip: cs('.door-glow').clipPath,
      dash0: parseFloat(cs('.terraces path').strokeDashoffset),
      hud: document.querySelector('.scroll-debug')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
    };
  });
}

/** translateX px from a computed matrix(...) — null when not a pure translate. */
function matX(t) {
  const m = /^matrix\(1, 0, 0, 1, ([-\d.]+), 0\)$/.exec(t);
  return m ? +m[1] : null;
}

const browser = await chromium.launch();

try {
  // ── 1. reduced-motion ON, no override → rest state ──
  console.log('\n[1] reduced-motion ON, no override');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?debug=1`, { waitUntil: 'networkidle' });
    const s = await state(page);
    await test('HUD present on ?debug', () => assert.ok(s.hud, 'no HUD found'));
    await test('HUD flags REDUCED-MOTION', () => assert.match(s.hud, /REDUCED-MOTION ⚠/));
    await test('everything visible at rest (title 1, lines drawn)', () => {
      assert.equal(s.titleO, 1);
      assert.equal(s.dash0, 0);
    });
    await ctx.close();
  }

  // ── 2. reduced-motion ON + ?motion=1 → the scrub itself ──
  console.log('\n[2] reduced-motion ON + ?motion=1 (scrub)');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?debug=1&motion=1`, { waitUntil: 'networkidle' });

    let s = await state(page);
    await test('HUD shows FORCED ON', () => assert.match(s.hud, /FORCED ON/));
    await test('frame zero: hidden (title 0, lines 1, image parked RIGHT — no fade)', () => {
      assert.equal(s.titleO, 0);
      assert.equal(s.dash0, 1);
      const x = matX(s.imgT);
      assert.ok(x !== null && x >= 40, `container should start offset right, got ${s.imgT}`);
      assert.match(s.doorClip, /130%/, `door rainbow should be swept shut, got ${s.doorClip}`);
    });

    // p ≈ 0.58 — line1 (0.50–1.00) mid-draw; title (0.61) and image (0.64) not started.
    // Left→right draws use positive dashoffset (1 hidden → 0 drawn).
    await scrollToT(page, 0.358);
    s = await state(page);
    await test('p≈0.58: line1 mid-draw (0.05 < dash < 0.95)', () => assert.ok(s.dash0 > 0.05 && s.dash0 < 0.95, `dash0=${s.dash0}`));
    await test('p≈0.53: title still hidden (window opens at 0.61)', () => assert.equal(s.titleO, 0));
    await test('p≈0.53: image still parked (window opens at 0.64)', () => {
      const x = matX(s.imgT);
      assert.ok(x !== null && x > 100, `should still be fully offset, got ${s.imgT}`);
    });

    // p ≈ 0.70 — title local 0.5 → easeOut 0.875; image local ≈0.167 → ~42% through its slide
    await scrollToT(page, 0.458);
    s = await state(page);
    await test('p≈0.70: title at deterministic mid-value (~0.875)', () =>
      assert.ok(s.titleO > 0.8 && s.titleO < 0.95, `titleO=${s.titleO}`));
    await test('p≈0.70: container mid-slide from the right (0 < x < 110)', () => {
      const x = matX(s.imgT);
      assert.ok(x !== null && x > 0 && x < 110, `imgT=${s.imgT}`);
    });

    // p ≈ 0.86 — door rainbow (0.78–0.95) mid-sweep
    await scrollToT(page, 0.63);
    s = await state(page);
    await test('p≈0.86: door rainbow mid-sweep (clip partially open)', () => {
      const m = /inset\(-?[\d.]+% ([\d.]+)%/.exec(s.doorClip);
      assert.ok(m && +m[1] > 1 && +m[1] < 60, `doorClip=${s.doorClip}`);
    });

    // p = 1 — everything at rest
    await scrollToT(page, 1);
    s = await state(page);
    await test('p=1: settled (title 1, container at rest, lines drawn)', () => {
      assert.equal(s.titleO, 1);
      assert.equal(s.imgT, 'none');
      assert.equal(s.doorClip, 'none');
      assert.equal(s.dash0, 0);
      assert.equal(s.locO, 1);
    });

    // THE scrub property: scroll back → values reverse to the same position
    await scrollToT(page, 0.458);
    s = await state(page);
    await test('scroll BACK to p≈0.70: title reverses to ~0.875', () =>
      assert.ok(s.titleO > 0.8 && s.titleO < 0.95, `titleO=${s.titleO}`));
    await test('scroll BACK to p≈0.70: container slides back toward the right', () => {
      const x = matX(s.imgT);
      assert.ok(x !== null && x > 0 && x < 110, `imgT=${s.imgT}`);
    });
    await scrollToT(page, 0.05); // p ≈ 0.014 — below every window (line 1 opens at 0.02)
    s = await state(page);
    await test('scroll back to p≈0.01: fully hidden again', () => {
      assert.equal(s.titleO, 0);
      assert.equal(s.dash0, 1);
      assert.match(s.doorClip, /130%/, `door rainbow should sweep shut again, got ${s.doorClip}`);
    });
    await ctx.close();
  }

  // ── 3. persistence + clear ──
  console.log('\n[3] localStorage persistence / ?motion=0 clears');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?debug=1&motion=1`, { waitUntil: 'networkidle' });
    await page.goto(`${BASE}/?debug=1`, { waitUntil: 'networkidle' });
    let s = await state(page);
    await test('override persists without ?motion param (scrub active)', () => {
      assert.equal(s.titleO, 0, 'should be hidden at top = scrubbing');
      assert.match(s.hud, /FORCED ON/);
    });
    await page.goto(`${BASE}/?debug=1&motion=0`, { waitUntil: 'networkidle' });
    s = await state(page);
    await test('?motion=0 clears override (rest state again)', () => {
      assert.equal(s.titleO, 1);
      assert.match(s.hud, /REDUCED-MOTION ⚠/);
    });
    await ctx.close();
  }

  // ── 4. control: no reduced-motion ──
  console.log('\n[4] no reduced-motion (normal scrub)');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?debug=1`, { waitUntil: 'networkidle' });
    let s = await state(page);
    await test('HUD shows motion ok', () => assert.match(s.hud, /motion ok/));
    await test('hidden at top', () => assert.equal(s.titleO, 0));
    await scrollToT(page, 1);
    s = await state(page);
    await test('scrubs to fully revealed by p=1', () => {
      assert.equal(s.titleO, 1);
      assert.equal(s.dash0, 0);
    });
    await ctx.close();
  }
} finally {
  await browser.close();
}

console.log(`\n${failed === 0 ? '✅ ALL PASS' : '❌ FAILURES'}: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
