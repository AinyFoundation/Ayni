/**
 * The translation contract, DERIVED from the English catalog.
 *
 * Why derived rather than hand-written: the two systems this one is modelled
 * on both got this wrong in opposite directions. One hand-maintained a
 * 1,274-line interface that drifted from the catalogs it described (and
 * shipped a latent compile error nobody saw). The other typed only its source
 * language, so a missing key in any OTHER language was silent. Deriving the
 * contract from the source catalog gives the second system's ergonomics with
 * the first system's guarantee, and there is no second file to maintain.
 *
 * What it enforces, verified against TypeScript 5 with `strict`:
 *
 *   - a MISSING key in a translation is `TS2741`
 *   - an EXTRA key is `TS2353` — but ONLY where the object literal is "fresh",
 *     which is why each locale's domain files must be annotated individually
 *     (see below); a barrel composing unannotated consts does NOT catch it
 *   - a function taking MORE parameters than the source is `TS2322`
 *   - a typo at a consumer (`t.chrome.nope`) is `TS2339`
 *
 * What it does NOT enforce: a function taking FEWER parameters. TypeScript
 * allows `() => string` where `(n: number) => string` is expected. That is
 * harmless for interpolation — the argument is simply ignored — but it is not
 * a guarantee, so do not claim it is.
 *
 * HOW TO USE IT, and the one rule that matters:
 *
 *   English domain files are NOT annotated. They are the schema; annotating
 *   them would be circular, since `Messages` is `typeof en`.
 *
 *   Every OTHER locale annotates each domain file individually:
 *
 *       // catalogs/es/chrome.ts
 *       import type { Messages } from '$lib/i18n/types';
 *       const chrome: Messages['chrome'] = { … };
 *       export default chrome;
 *
 *   Annotating the barrel instead of the files is not equivalent and silently
 *   loses extra-key detection.
 */

import type en from './catalogs/en';

/**
 * Maps the English catalog's shape onto a translation's shape: literal
 * strings widen to `string` (a translation is not the same text), functions
 * keep their exact parameter list, and objects recurse.
 */
type Message<T> = T extends (...args: infer A) => string
  ? (...args: A) => string
  : T extends string
    ? string
    : { readonly [K in keyof T]: Message<T[K]> };

export type Messages = Message<typeof en>;
