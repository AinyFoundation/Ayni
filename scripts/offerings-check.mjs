#!/usr/bin/env node
/**
 * Offering contract checker.
 *
 * Deliberately much smaller than `blog-check.mjs`. That script does two jobs
 * — validate the file, and enforce prose voice rules — because a post is
 * mostly prose. An offering is mostly fields, so the voice half does not
 * apply: there are no banned phrases, no opener patterns, no sentence-pacing
 * heuristic here, and adding them would be enforcing an essay's rules on a
 * listing.
 *
 * What it does check, that blog cannot: that the cover photograph actually
 * exists at every size the card will request. Blog derivatives are generated
 * by `scripts/blog-images.mjs` at build time, so a missing one is impossible;
 * offering covers are produced by hand with `scripts/images.sh`, so a missing
 * one is very possible and would ship a broken image.
 *
 * Plain node, no test framework, matching blog-check.mjs.
 * Errors exit 1; warnings print and pass.
 *
 * Usage: npm run offerings:check [-- <slug>]
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import {
  normalizeOfferingFrontmatter,
  validateOfferingFrontmatter
} from '../src/lib/offerings/schema.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'src/content/offerings');
const IMAGE_DIR = path.join(ROOT, 'static/images/offerings');

/** Every derivative `OfferingCard`'s srcset names. All three must exist. */
const IMAGE_WIDTHS = ['-768', '-1280', ''];

/**
 * @param {string} slug
 * @returns {{errors: string[], warnings: string[]}}
 */
function checkOffering(slug) {
  /** @type {string[]} */ const errors = [];
  /** @type {string[]} */ const warnings = [];

  const file = path.join(CONTENT_DIR, slug, 'index.md');
  if (!existsSync(file)) {
    return { errors: [`no index.md in ${slug}/`], warnings };
  }

  const { data, content } = matter(readFileSync(file, 'utf8'));
  const fm = normalizeOfferingFrontmatter(data);

  const result = validateOfferingFrontmatter(fm, slug);
  errors.push(...result.errors);
  warnings.push(...result.warnings);

  /* The cover derivatives. `images.sh` writes all three or none, so a partial
   * set usually means it was run with the wrong output directory. */
  for (const width of IMAGE_WIDTHS) {
    const image = path.join(IMAGE_DIR, `${slug}${width}.webp`);
    if (!existsSync(image)) {
      errors.push(
        `missing cover derivative ${path.relative(ROOT, image)} — run: scripts/images.sh <photo> ${slug} static/images/offerings`
      );
    }
  }

  /* An offering's body is not rendered anywhere — every field the page shows
   * is frontmatter. Prose below the frontmatter would therefore be written,
   * saved, and silently never displayed, which is worth catching. */
  if (content.trim().length > 0) {
    warnings.push(
      'body text below the frontmatter is never rendered — put the words in `description`'
    );
  }

  return { errors, warnings };
}

/* ── run ────────────────────────────────────────────────────────────── */

const only = process.argv[2];

if (!existsSync(CONTENT_DIR)) {
  console.log('[offerings-check] no offerings yet');
  process.exit(0);
}

const slugs = readdirSync(CONTENT_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((slug) => !only || slug === only);

if (only && slugs.length === 0) {
  console.error(`[offerings-check] no such offering: ${only}`);
  process.exit(1);
}

let failed = 0;
for (const slug of slugs) {
  const { errors, warnings } = checkOffering(slug);
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`ok    ${slug}`);
    continue;
  }
  console.log(`${errors.length ? 'FAIL' : 'warn'}  ${slug}`);
  for (const error of errors) console.log(`        error: ${error}`);
  for (const warning of warnings) console.log(`        warn:  ${warning}`);
  if (errors.length) failed += 1;
}

console.log(`\n[offerings-check] ${slugs.length} offering(s), ${failed} failing`);
process.exit(failed > 0 ? 1 : 0);
