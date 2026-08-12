#!/usr/bin/env node
/**
 * Blog image derivatives.
 *
 * Reads every image colocated with a post (`src/content/blog/<slug>/*.jpg`),
 * emits AVIF + WebP + JPEG at a fixed width ladder into `static/_blog/`, and
 * records the results in `.blog-images.json` for the markdown renderer to
 * resolve against.
 *
 * Runs from npm `prebuild` and `predev`, so authors never invoke it. Adding
 * an image mid-`dev` needs a dev-server restart; a Vite plugin would fix that
 * and is not worth the code.
 *
 * Why sharp directly and not vite-imagetools: imagetools v11 declares
 * `peerDependencies.vite >= 8` and this project is on vite 6. See
 * `docs/research/blog-system/research.md` § Image pipeline.
 *
 * What this buys, in ranking terms: intrinsic width/height on every image
 * drives CLS to zero, and AVIF/WebP cut transfer 30-70% against JPEG, which
 * is what pulls LCP under the 2.5s threshold.
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'src/content/blog');
const OUT_DIR = path.join(ROOT, 'static/_blog');
const MANIFEST = path.join(ROOT, '.blog-images.json');

const WIDTHS = [480, 768, 1280, 1920];
const SOURCE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

/** Quality per format. AVIF wins enough on size to run leaner than WebP. */
const QUALITY = { avif: 55, webp: 76, jpeg: 82 };

/** Blur-up placeholder width. Small enough to inline, big enough to read as the image. */
const LQIP_WIDTH = 24;

/**
 * Derivative widths for a source: the ladder, clipped to the source width so
 * nothing is ever upscaled, plus the source width itself when it is smaller
 * than the first rung.
 * @param {number} sourceWidth
 * @returns {number[]}
 */
function widthsFor(sourceWidth) {
  const fitting = WIDTHS.filter((w) => w <= sourceWidth);
  return fitting.length > 0 ? fitting : [sourceWidth];
}

/** @param {Buffer} buffer */
const hashOf = (buffer) => createHash('sha256').update(buffer).digest('hex').slice(0, 16);

/**
 * Every post directory that exists. Returns [] when the blog has no content
 * yet, which is the normal state before the first post is written.
 * @returns {Promise<string[]>}
 */
async function postDirs() {
  if (!existsSync(CONTENT_DIR)) return [];
  const entries = await readdir(CONTENT_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

/**
 * Encode one source image into every format and width.
 *
 * sharp drops EXIF unless `withMetadata()` is called, so the outputs carry no
 * GPS coordinates or camera serials. That is a privacy property worth stating
 * rather than relying on as a side effect.
 *
 * @param {Buffer} buffer
 * @param {string} slug
 * @param {string} name   Source filename without extension.
 * @returns {Promise<{width:number,height:number,avif:string,webp:string,jpg:string,fallback:string,fallbackBytes:number,lqip:string}>}
 */
async function encode(buffer, slug, name) {
  const image = sharp(buffer, { failOn: 'error' });
  const meta = await image.metadata();
  if (!meta.width || !meta.height) {
    throw new Error(`could not read dimensions for ${slug}/${name}`);
  }

  const widths = widthsFor(meta.width);
  const dir = path.join(OUT_DIR, slug);
  await mkdir(dir, { recursive: true });

  /** @type {Record<'avif'|'webp'|'jpg', string[]>} */
  const srcsets = { avif: [], webp: [], jpg: [] };

  /** Bytes of the widest JPEG. RSS <enclosure> requires a length attribute. */
  let fallbackBytes = 0;

  for (const width of widths) {
    const resized = sharp(buffer).resize({ width, withoutEnlargement: true });
    const [, , jpeg] = await Promise.all([
      resized.clone().avif({ quality: QUALITY.avif }).toFile(path.join(dir, `${name}-${width}.avif`)),
      resized.clone().webp({ quality: QUALITY.webp }).toFile(path.join(dir, `${name}-${width}.webp`)),
      resized.clone().jpeg({ quality: QUALITY.jpeg, mozjpeg: true }).toFile(path.join(dir, `${name}-${width}.jpg`))
    ]);
    fallbackBytes = jpeg.size;
    for (const ext of /** @type {const} */ (['avif', 'webp', 'jpg'])) {
      srcsets[ext].push(`/_blog/${slug}/${name}-${width}.${ext} ${width}w`);
    }
  }

  const lqipBuffer = await sharp(buffer)
    .resize({ width: LQIP_WIDTH })
    .webp({ quality: 40 })
    .toBuffer();

  const widest = widths.at(-1);
  return {
    width: meta.width,
    height: meta.height,
    avif: srcsets.avif.join(', '),
    webp: srcsets.webp.join(', '),
    jpg: srcsets.jpg.join(', '),
    // JPEG, deliberately: social scrapers and older clients still choke on
    // AVIF, and this doubles as the Open Graph image.
    fallback: `/_blog/${slug}/${name}-${widest}.jpg`,
    fallbackBytes,
    lqip: `data:image/webp;base64,${lqipBuffer.toString('base64')}`
  };
}

async function main() {
  /** @type {Record<string, {hash:string} & Awaited<ReturnType<typeof encode>>>} */
  let manifest = {};
  if (existsSync(MANIFEST)) {
    try {
      manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
    } catch (error) {
      // A corrupt cache is not fatal; rebuilding everything is correct and cheap.
      console.warn(`[blog-images] ignoring unreadable ${path.basename(MANIFEST)}: ${error.message}`);
    }
  }

  /** @type {Record<string, unknown>} */
  const next = {};
  let processed = 0;
  let cached = 0;

  for (const slug of await postDirs()) {
    const dir = path.join(CONTENT_DIR, slug);
    const files = (await readdir(dir)).filter((f) => SOURCE_EXT.has(path.extname(f).toLowerCase()));

    for (const file of files) {
      const key = `${slug}/${file}`;
      const buffer = await readFile(path.join(dir, file));
      const hash = hashOf(buffer);
      const name = path.basename(file, path.extname(file));

      const previous = manifest[key];
      if (previous?.hash === hash && existsSync(path.join(ROOT, 'static', previous.fallback))) {
        next[key] = previous;
        cached += 1;
        continue;
      }

      next[key] = { hash, ...(await encode(buffer, slug, name)) };
      processed += 1;
    }
  }

  await writeFile(MANIFEST, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`[blog-images] ${processed} processed, ${cached} cached`);
}

main().catch((error) => {
  console.error(`[blog-images] ${error.message}`);
  process.exit(1);
});
