#!/usr/bin/env node
/**
 * Post contract checker.
 *
 * Two jobs. It stops broken posts reaching the build (frontmatter, missing
 * images, alt text, dead CTA destinations), and it enforces the humanising
 * rules from `.agents/skills/write-blog-post/reference/voice.md` mechanically,
 * so they hold whether a post was written by a person having an off day or by
 * a model drifting back to its defaults.
 *
 * Plain node, no test framework, matching tests/verify-scroll-reveal.mjs.
 * Errors exit 1; warnings print and pass.
 *
 * Usage: npm run blog:check [-- <slug>]
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { normalizeFrontmatter, validateFrontmatter } from '../src/lib/blog/schema.js';
import { TOPIC_BY_SLUG } from '../src/content/topics.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'src/content/blog');
const ROUTES_DIR = path.join(ROOT, 'src/routes');

/* ── voice rules ────────────────────────────────────────────────────── */

/**
 * Words and phrases that read as machine-assembled. The list is short on
 * purpose: it targets the tells that survive into 2026 rather than every word
 * a detector has ever flagged.
 */
const BANNED_PHRASES = [
  'delve',
  'tapestry',
  'pivotal',
  'moreover',
  'furthermore',
  'in conclusion',
  "it's worth noting",
  'it is worth noting',
  'testament to',
  'navigate the landscape',
  'unlock the',
  'elevate your',
  'seamless',
  'robust',
  'leverage',
  "in today's world",
  'not only',
  'a myriad of',
  'when it comes to',
  'dive into',
  'game changer',
  'ever-evolving',
  'landscape of'
];

/** Openers that announce the article instead of starting it. */
const BANNED_OPENERS = [
  /^in this (post|article|piece)/i,
  /^(this|the following) (post|article|piece) (will|explores|examines)/i,
  /^have you ever/i,
  /^imagine (a|an|the|you)/i
];

/* ── helpers ────────────────────────────────────────────────────────── */

/** Drop code, where prose rules and link rules both stop applying. */
function withoutCode(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
}

/**
 * What a reader actually reads: code gone, image markup gone, link syntax
 * flattened to its text. Used for the voice rules only — link checks run
 * against {@link withoutCode}, because this deliberately discards the URLs.
 */
function proseOnly(markdown) {
  return withoutCode(markdown)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
}

/** Static route paths this repo defines, read straight off the filesystem. */
function staticRoutes(dir = ROUTES_DIR, prefix = '') {
  const routes = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const segment = /^\([^)]+\)$/.test(entry.name) ? '' : `/${entry.name}`;
      routes.push(...staticRoutes(path.join(dir, entry.name), prefix + segment));
    } else if (entry.name === '+page.svelte') {
      routes.push(prefix || '/');
    }
  }
  return routes;
}

const ROUTES = staticRoutes();

function routeExists(href) {
  const target = href.split('#')[0].split('?')[0].replace(/(.)\/$/, '$1');
  return ROUTES.some((route) => {
    if (route === target) return true;
    if (!route.includes('[')) return false;
    return new RegExp(`^${route.replace(/\[[^\]]+\]/g, '[^/]+')}$`).test(target);
  });
}

/* ── the check ──────────────────────────────────────────────────────── */

/**
 * @param {string} slug
 * @returns {{errors: string[], warnings: string[]}}
 */
function checkPost(slug) {
  const dir = path.join(CONTENT_DIR, slug);
  const file = path.join(dir, 'index.md');
  const errors = [];
  const warnings = [];

  if (!existsSync(file)) {
    return { errors: [`${slug}/index.md is missing`], warnings };
  }

  const siblings = readdirSync(dir).filter((f) => statSync(path.join(dir, f)).isFile());
  const { data, content } = matter(readFileSync(file, 'utf8'));
  const fm = normalizeFrontmatter(data);

  const schema = validateFrontmatter(fm, slug, siblings);
  errors.push(...schema.errors);
  warnings.push(...schema.warnings);

  const body = withoutCode(content);
  const prose = proseOnly(content);

  // Em and en dashes. The user's standing rule, and stricter than the
  // evidence requires, which costs nothing.
  const dashes = (prose.match(/[—–]/g) ?? []).length;
  if (dashes > 0) {
    errors.push(`${dashes} em/en dash(es); use commas, full stops or parentheses`);
  }

  const lowered = prose.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lowered.includes(phrase)) errors.push(`banned phrase: "${phrase}"`);
  }

  const firstLine = prose.trim().split('\n').find((l) => l.trim()) ?? '';
  for (const pattern of BANNED_OPENERS) {
    if (pattern.test(firstLine.trim())) {
      errors.push(`opener announces the article instead of starting it: "${firstLine.trim().slice(0, 60)}"`);
    }
  }

  // Every markdown image needs alt text. Non-negotiable: it is what a screen
  // reader announces and what an image search indexes.
  for (const match of content.matchAll(/!\[([^\]]*)\]\(([^)\s]+)/g)) {
    const [, alt, src] = match;
    if (!alt.trim()) errors.push(`image "${src}" has no alt text`);
    if (!src.includes('/') && !src.startsWith('http') && !siblings.includes(src)) {
      errors.push(`image "${src}" is referenced but not in the post folder`);
    }
  }

  // Heading order. Skipping a level breaks the document outline that both
  // assistive tech and AI extractors read structure from.
  let previousDepth = 1;
  for (const match of content.matchAll(/^(#{1,6})\s+(.+)$/gm)) {
    const depth = match[1].length;
    if (depth === 1) errors.push(`"${match[2]}" is an h1; the post title is the only h1`);
    else if (depth > previousDepth + 1) {
      errors.push(`heading "${match[2]}" jumps from h${previousDepth} to h${depth}`);
    }
    previousDepth = depth;
  }

  // CTA destination must resolve. A dead call to action wastes the click and
  // teaches crawlers the site is broken.
  const topic = TOPIC_BY_SLUG.get(fm.topic);
  const ctaHref = fm.cta ?? topic?.cta.href;
  if (fm.cta && !routeExists(fm.cta)) {
    errors.push(`cta "${fm.cta}" does not resolve to a route in src/routes`);
  } else if (ctaHref && !routeExists(ctaHref)) {
    warnings.push(`topic CTA "${ctaHref}" has no route yet, so no CTA will render`);
  }

  // Internal links in the body must resolve too.
  for (const match of body.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    // Endpoints like /rss.xml are +server.ts, not +page.svelte, so exempt
    // anything with a file extension.
    const href = match[1];
    if (/\.[a-z0-9]+$/i.test(href)) continue;
    if (!routeExists(href)) errors.push(`internal link "${href}" does not resolve to a route`);
  }

  // Pacing. Uniform sentence length is the structural tell that survived once
  // em dashes stopped being one.
  const sentences = prose
    .replace(/^[#>\-*].*$/gm, '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
  if (sentences.length >= 6) {
    const shortest = Math.min(...sentences.map((s) => s.split(/\s+/).length));
    if (shortest > 8) {
      warnings.push('no short sentence anywhere; uniform pacing is the giveaway');
    }
  }

  // Promotion budget. More than two outbound links to the main site inside one
  // post stops reading as a note and starts reading as an ad.
  const siteLinks = [...body.matchAll(/\]\((\/[^)\s]*)\)/g)]
    .map((m) => m[1])
    .filter((href) => !href.startsWith('/blog') && !/\.[a-z0-9]+$/i.test(href));
  if (siteLinks.length > 2) {
    warnings.push(`${siteLinks.length} in-body links to the main site; keep it to one or two`);
  }

  return { errors, warnings };
}

/* ── run ────────────────────────────────────────────────────────────── */

const only = process.argv[2];

if (!existsSync(CONTENT_DIR)) {
  console.log('[blog-check] no posts yet');
  process.exit(0);
}

const slugs = readdirSync(CONTENT_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((slug) => !only || slug === only);

if (only && slugs.length === 0) {
  console.error(`[blog-check] no such post: ${only}`);
  process.exit(1);
}

let failed = 0;
for (const slug of slugs) {
  const { errors, warnings } = checkPost(slug);
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`ok    ${slug}`);
    continue;
  }
  console.log(`${errors.length ? 'FAIL' : 'warn'}  ${slug}`);
  for (const error of errors) console.log(`        error: ${error}`);
  for (const warning of warnings) console.log(`        warn:  ${warning}`);
  if (errors.length) failed += 1;
}

console.log(`\n[blog-check] ${slugs.length} post(s), ${failed} failing`);
process.exit(failed > 0 ? 1 : 0);
