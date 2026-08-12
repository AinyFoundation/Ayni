#!/usr/bin/env node
/**
 * Finds user-facing English text that has not moved into the catalogs yet.
 *
 * Deliberately line- and regex-based, in the same style as `blog-check.mjs`,
 * not an AST walk. The job is to produce a worklist a human reads, and a
 * cheap scanner that a person can predict beats a precise one they cannot.
 *
 * Two modes:
 *   --warn   report and exit 0   (Phase 1: the extraction worklist)
 *   default  report and exit 1   (Phase 2 onward: a hardcoded string fails CI)
 *
 * If this is still noisy once Phase 2 lands, DELETE IT. The typechecker and
 * the `i18n` skill are the real enforcement; this only exists to stop English
 * creeping back into templates after the extraction, and a check nobody
 * trusts is worse than no check.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SCAN_DIRS = ['src/lib/components', 'src/routes'];
const WARN_ONLY = process.argv.includes('--warn');

/**
 * Files exempt from the scan.
 *
 * `ScrollDebug` is a development overlay that never ships to a reader.
 * The i18n directory holds the catalogs themselves.
 */
const EXEMPT_FILES = [/ScrollDebug\.svelte$/, /[/\\]i18n[/\\]/];

/**
 * Text that is not translatable prose.
 *
 * Brand and place names are the same in every language; the ODbL attribution
 * under the map is a licence obligation with required wording; separators and
 * numerals carry no language.
 */
const ALLOW = [
  /^[\s\d\p{P}\p{S}]*$/u, // punctuation, numerals, separators, arrows
  /OpenStreetMap|ODbL|contributors/i,
  /^(RSS|JSON|SVG|HTML|CSS)$/
];

/**
 * Words that are the same in every language.
 *
 * Place and brand names, plus the compass letters and unit abbreviations they
 * sit beside in the location strip and the map caption. A line built only from
 * these has nothing in it to translate — `Calca · Valle Sagrado · 2,928 m` is
 * the same sentence in Spanish — so the check is per-WORD rather than a
 * pattern per phrase. Matching whole phrases meant every new arrangement of
 * the same three nouns needed its own regex, and the ones that did not have
 * one read as untranslated strings.
 */
const PROPER_NOUNS = new Set(
  [
    'ayni',
    'sanctuary',
    'consciousness',
    'collective',
    'calca',
    'perú',
    'peru',
    'valle',
    'sagrado',
    'sacred',
    'valley',
    'cusco',
    'pisac',
    'urubamba',
    'vilcanota',
    'instagram',
    'facebook',
    'google',
    'maps',
    'm', // metres
    'km',
    's', // south
    'w', // west
    'n',
    'e'
  ].map((w) => w.toLowerCase())
);

/** True when every word in the text is a proper noun, unit, or compass point. */
function isProperNounsOnly(text) {
  const words = text.match(/\p{L}+/gu);
  if (!words) return false;
  return words.every((w) => PROPER_NOUNS.has(w.toLowerCase()));
}

const TRANSLATABLE_ATTRS = ['aria-label', 'alt', 'title', 'placeholder'];

/**
 * Separators are markup, not language.
 *
 * A brand name is exempt, but `Ayni Consciousness Collective ·` did not match
 * the anchored brand pattern because of the trailing interpunct the footer
 * draws between it and the next item. Reporting that as an untranslated string
 * leaves an author two bad options — translate a proper noun, or reshape the
 * markup to satisfy the scanner — so the separator is stripped before the
 * comparison instead.
 */
const SEPARATORS = /^[\s·|—–\-/•,]+|[\s·|—–\-/•,]+$/g;

const isAllowed = (text) => {
  const bare = text.trim().replace(SEPARATORS, '');
  return bare === '' || isProperNounsOnly(bare) || ALLOW.some((re) => re.test(bare));
};

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.svelte')) out.push(full);
  }
  return out;
}

/** Strip what is not template markup, keeping line numbers intact. */
function templateOnly(source) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return source
    .replace(/<script[\s\S]*?<\/script>/g, blank)
    .replace(/<style[\s\S]*?<\/style>/g, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    // A command or an identifier is not prose. `npm run scrape:reviews` inside
    // <code> must stay in the template — the sentence AROUND it is what gets
    // translated, and it already is.
    .replace(/<code[\s\S]*?<\/code>/g, blank)
    .replace(/<kbd[\s\S]*?<\/kbd>/g, blank)
    .replace(/<pre[\s\S]*?<\/pre>/g, blank);
}

/**
 * Blank everything that is not text a reader sees, leaving newlines so line
 * numbers still point at the right place.
 *
 * Three things have to be tracked at once, and getting any one wrong fills
 * the report with markup nobody can act on:
 *
 *   - tags spread over SEVERAL LINES, so a per-line split cannot work
 *     (`<Seo` and `class="topic-chip"` otherwise read as prose)
 *   - `{…}` expressions, whose contents are code, not copy — and which nest
 *   - `>` INSIDE an expression, because `onclick={() => go()}` would
 *     otherwise close the tag at the arrow and expose the rest as text
 *
 * Quotes are tracked so a `>` inside an attribute value does not close the
 * tag either.
 */
function blankReadableText(source) {
  const out = source.split('');
  let inTag = false;
  let inQuote = '';
  let braces = 0;

  for (let i = 0; i < out.length; i++) {
    const c = out[i];
    const keep = c === '\n';

    if (braces > 0) {
      if (c === '{') braces++;
      else if (c === '}') braces--;
      if (!keep) out[i] = ' ';
      continue;
    }

    if (inTag) {
      if (inQuote) {
        if (c === inQuote) inQuote = '';
      } else if (c === '"' || c === "'") inQuote = c;
      else if (c === '{') braces++;
      else if (c === '>') inTag = false;
      if (!keep) out[i] = ' ';
      continue;
    }

    if (c === '<') {
      inTag = true;
      if (!keep) out[i] = ' ';
    } else if (c === '{') {
      braces++;
      if (!keep) out[i] = ' ';
    }
  }
  return out.join('');
}

const findings = [];

for (const dir of SCAN_DIRS) {
  const abs = path.join(ROOT, dir);
  let files;
  try {
    files = walk(abs);
  } catch {
    continue; // directory not present
  }

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    if (EXEMPT_FILES.some((re) => re.test(rel))) continue;

    const template = templateOnly(readFileSync(file, 'utf8'));
    const markupLines = template.split('\n');
    const textLines = blankReadableText(template).split('\n');

    markupLines.forEach((line, i) => {
      // Translatable attributes with a literal value. Read from the markup,
      // which still has its tags.
      for (const attr of TRANSLATABLE_ATTRS) {
        const m = line.match(new RegExp(`\\b${attr}="([^"{}]+)"`));
        if (m && /\p{L}{2,}/u.test(m[1]) && !isAllowed(m[1])) {
          findings.push({ rel, line: i + 1, kind: attr, text: m[1].trim() });
        }
      }
    });

    textLines.forEach((line, i) => {
      // Bare text nodes. Anything with a `{` is already an expression, which
      // is either a message lookup or a value — not a hardcoded string.
      const text = line.trim();
      if (!text || !/\p{L}{3,}/u.test(text)) return;
      if (isAllowed(text)) return;
      findings.push({ rel, line: i + 1, kind: 'text', text });
    });
  }
}

if (findings.length === 0) {
  console.log('i18n: no hardcoded user-facing strings found');
  process.exit(0);
}

const byFile = new Map();
for (const f of findings) {
  if (!byFile.has(f.rel)) byFile.set(f.rel, []);
  byFile.get(f.rel).push(f);
}

const label = WARN_ONLY ? 'to extract' : 'HARDCODED STRINGS';
console.log(`\ni18n: ${findings.length} strings ${label} in ${byFile.size} files\n`);

for (const [rel, items] of [...byFile].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${rel}  (${items.length})`);
  for (const f of items.slice(0, 40)) {
    const text = f.text.length > 68 ? `${f.text.slice(0, 65)}…` : f.text;
    console.log(`    ${String(f.line).padStart(4)}  ${f.kind.padEnd(10)} ${text}`);
  }
}

if (WARN_ONLY) {
  console.log('\n(warn mode — this is the Phase 2 worklist, not a failure)');
  process.exit(0);
}

console.log('\nMove these into src/lib/i18n/catalogs/en/ and read them through `t`.');
console.log('See .agents/skills/i18n/SKILL.md.');
process.exit(1);
