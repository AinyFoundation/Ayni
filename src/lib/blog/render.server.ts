/**
 * Markdown to HTML, at build time only.
 *
 * The `.server` suffix is load-bearing: SvelteKit refuses to import this from
 * anywhere that could reach the browser, which is how the whole unified stack
 * stays out of the client bundle. Posts are prerendered, so this runs in node
 * during `vite build` and never again.
 *
 * Deliberately NOT supported: raw HTML inside markdown. Enabling it costs
 * `rehype-raw`, opens an injection surface, and lets posts drift away from
 * being portable plain text. Markdown only.
 *
 * See `docs/research/blog-system/research.md` for why this is unified rather
 * than mdsvex.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { toString as hastToString } from 'hast-util-to-string';
import type { Element, Root } from 'hast';
import type { Heading, ImageVariants, RenderedPost } from './types';

/* ── image manifest ─────────────────────────────────────────────────── */

type ManifestEntry = ImageVariants & { hash: string };
type Manifest = Record<string, ManifestEntry>;

const MANIFEST_PATH = path.join(process.cwd(), '.blog-images.json');

let manifestCache: Manifest | null = null;

/**
 * Derivatives written by `scripts/blog-images.mjs`.
 *
 * Missing or unreadable is survivable, not fatal: the renderer falls back to a
 * plain `<img>` and warns, so a post still builds when someone runs `vite build`
 * without the prebuild step.
 */
function manifest(): Manifest {
  if (manifestCache) return manifestCache;
  if (!existsSync(MANIFEST_PATH)) {
    console.warn('[blog] .blog-images.json missing — run `npm run blog:images`');
    manifestCache = {};
    return manifestCache;
  }
  try {
    manifestCache = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
  } catch (error) {
    console.warn(`[blog] .blog-images.json unreadable: ${(error as Error).message}`);
    manifestCache = {};
  }
  return manifestCache;
}

/** Variants for an image colocated with a post, or null if it was never processed. */
export function imageVariants(slug: string, filename: string): ImageVariants | null {
  return manifest()[`${slug}/${filename}`] ?? null;
}

/* ── image rewriting ────────────────────────────────────────────────── */

const el = (tagName: string, properties: Record<string, unknown>, children: Element[] = []) =>
  ({ type: 'element', tagName, properties, children }) as unknown as Element;

/**
 * Build the `<picture>` for one image.
 *
 * Every part of this exists for a measurable reason: `width`/`height` reserve
 * the box so nothing shifts (CLS), AVIF and WebP cut transfer, the LQIP paints
 * something immediately, and the JPEG `<img>` is what old clients and social
 * scrapers actually fetch.
 */
function pictureFor(variants: ImageVariants, alt: string): Element {
  const sizes = '(min-width: 768px) 68ch, 100vw';
  return el('picture', { className: ['prose-picture'] }, [
    el('source', { type: 'image/avif', srcSet: variants.avif, sizes }),
    el('source', { type: 'image/webp', srcSet: variants.webp, sizes }),
    el('img', {
      src: variants.fallback,
      srcSet: variants.jpg,
      sizes,
      alt,
      width: variants.width,
      height: variants.height,
      loading: 'lazy',
      decoding: 'async',
      style: `background-image:url(${variants.lqip});background-size:cover`
    })
  ]);
}

/**
 * Replace every markdown image with a responsive `<picture>`, and promote
 * image-only paragraphs to `<figure>` so captions are marked up honestly
 * rather than as a stray paragraph.
 *
 * A markdown title (`![alt](cover.jpg "the caption")`) becomes the figcaption.
 */
function rehypeAyniImages(slug: string) {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'img' || !parent || index === undefined) return;

      const src = String(node.properties?.src ?? '');
      const alt = String(node.properties?.alt ?? '');
      const caption = String(node.properties?.title ?? '');

      // Only colocated files go through the pipeline. Absolute paths and
      // remote URLs pass through untouched.
      if (src.includes('/') || src.startsWith('http')) return;

      const variants = imageVariants(slug, src);
      if (!variants) {
        console.warn(`[blog] ${slug}: no derivatives for "${src}" — falling back to plain <img>`);
        return;
      }

      const picture = pictureFor(variants, alt);
      const figure = el('figure', { className: ['prose-figure'] }, [
        picture,
        ...(caption ? [el('figcaption', {}, [{ type: 'text', value: caption } as never])] : [])
      ]);

      // An image alone in a paragraph replaces the paragraph; an inline image
      // is swapped in place so surrounding text survives.
      const parentEl = parent as Element;
      const isSoleChild =
        parentEl.tagName === 'p' &&
        parentEl.children.filter((c) => c.type !== 'text' || c.value.trim()).length === 1;

      if (isSoleChild) Object.assign(parentEl, figure);
      else parent.children[index] = picture;
    });
  };
}

/* ── absolute URLs ──────────────────────────────────────────────────── */

/**
 * Resolve every URL in the tree against `base`.
 *
 * Only the feeds ask for this. A feed reader renders an item outside the page
 * that produced it, so `/_blog/…` and `#a-heading` have no document base and
 * resolve against the reader's own origin instead — broken images, anchors
 * that go nowhere. Values that already carry a scheme, including the data:
 * LQIP, come back from `new URL` unchanged.
 */
function rehypeAbsoluteUrls(base: string) {
  const resolve = (value: string): string => {
    try {
      return new URL(value, base).href;
    } catch {
      return value;
    }
  };

  /** `url descriptor, url descriptor` — only the first token of each pair is a URL. */
  const resolveSrcSet = (value: string): string =>
    value
      .split(',')
      .map((candidate) => {
        const [url, ...descriptor] = candidate.trim().split(/\s+/);
        return [resolve(url), ...descriptor].join(' ');
      })
      .join(', ');

  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      const props = node.properties;
      if (!props) return;
      for (const key of ['src', 'href'] as const) {
        if (typeof props[key] === 'string') props[key] = resolve(props[key]);
      }
      // Always a string here: srcset only ever comes from `pictureFor`, since
      // raw HTML in markdown is not supported.
      if (typeof props.srcSet === 'string') props.srcSet = resolveSrcSet(props.srcSet);
    });
  };
}

/* ── outline ────────────────────────────────────────────────────────── */

/** Collect the h2/h3 outline. Runs after rehype-slug so the ids already exist. */
function rehypeCollectHeadings(into: Heading[]) {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'h2' && node.tagName !== 'h3') return;
      const id = String(node.properties?.id ?? '');
      if (!id) return;
      into.push({ depth: node.tagName === 'h2' ? 2 : 3, id, text: hastToString(node) });
    });
  };
}

/* ── the pipeline ───────────────────────────────────────────────────── */

/**
 * @param markdown  Post body, frontmatter already stripped.
 * @param slug      Post directory name, used to resolve colocated images.
 * @param base      Absolute URL of the post. Feeds pass it so the HTML they
 *                  ship carries no page-relative URLs; pages leave it unset,
 *                  where relative is both correct and shorter.
 * @throws if the markdown is malformed enough that unified gives up.
 */
export async function renderPost(
  markdown: string,
  slug: string,
  base?: string
): Promise<RenderedPost> {
  const headings: Heading[] = [];

  const pipeline = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkSmartypants)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeCollectHeadings, headings)
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      properties: { className: ['heading-anchor'], ariaLabel: 'Link to this section' },
      content: { type: 'text', value: '#' }
    })
    .use(rehypeExternalLinks, { rel: ['noopener'], target: '_blank' })
    .use(rehypeAyniImages, slug);

  if (base) pipeline.use(rehypeAbsoluteUrls, base);

  const file = await pipeline.use(rehypeStringify).process(markdown);

  return { html: String(file), headings };
}
