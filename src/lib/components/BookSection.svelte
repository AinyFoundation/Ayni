<script lang="ts">
  /**
   * BookSection — the sanctuary's book of days.
   *
   * One entry per spread: a photograph on one page, its story on the facing
   * page, and the sides swap every spread so the eye crosses the spine the way
   * it does in a printed book. Entries come in pairs and the sequence loops, so
   * the alternation never breaks at the seam between last and first.
   *
   * The turn is a real turn, not a crossfade. The leaf that moves carries TWO
   * faces, which is the whole trick and the reason this is more than a
   * carousel: its front is the page you are leaving, its back is the page you
   * are arriving at, and the spread underneath already holds the destination.
   * So mid-turn you see the outgoing page edge-on, its reverse swinging into
   * place, and the new facing page waiting beneath — the same three things a
   * real page shows you.
   *
   * Sides are decided by parity of the entry index, not stored per entry, so
   * adding photographs can never desynchronise the alternation.
   *
   * Motion is compositor-only (transform) and driven by a CSS transition
   * rather than a scroll subscription — this section deliberately owns no
   * scroll machinery; the hero's driver stays the only one on the page.
   *
   * SEAM: `entries` below is a static typed array, the same pattern
   * JournalStrip uses. Point it at a real content source and nothing else here
   * changes.
   */
  import { onDestroy } from 'svelte';
  import { navRegion } from '$lib/scrollDriver';
  import { warmImages, onApproach, type WarmSource } from '$lib/imageWarm';
  import { t, DEFAULT_LOCALE } from '$lib/i18n';

  /* $derived, not a plain const: the locale is a property of the URL and
   * becomes dynamic in Phase 3, at which point this recomputes on its own. */
  const m = $derived(t(DEFAULT_LOCALE).home.book);

  type Entry = {
    slug: string;
    src: string;
    srcset: string;
    width: number;
    height: number;
    /** Wing hue token name. Accent only: the folio rule and the plate number. */
    hue: string;
  };

  /**
   * PLACEHOLDER CONTENT — not shippable as-is.
   *
   * Only three photo sets exist in static/images/, none of them of events, so
   * these six spreads re-use them to prove the mechanism. Replace every entry
   * with real photographs run through scripts/images.sh, which writes the
   * {768,1280,full}.webp trio this array expects. Keep the count EVEN so the
   * loop's alternation stays clean. Photographs showing guests need their
   * consent first.
   *
   * The words that face each photograph — its alt text, its title and its
   * story — are in `home.book.entries`, joined to this array by POSITION.
   * Entry k here is entry k there, and `sides()` below decides which page of
   * the spread each falls on from that same k. Replacing a photograph means
   * replacing its catalog entry in the same commit.
   */
  const entries: Entry[] = [
    {
      slug: 'first-light',
      src: '/images/main_sanctuary.webp',
      srcset:
        '/images/main_sanctuary-768.webp 768w, /images/main_sanctuary-1920.webp 1920w, /images/main_sanctuary.webp 2558w',
      width: 2558,
      height: 1439,
      hue: 'clay',
    },
    {
      slug: 'temazcal-door',
      src: '/images/offering-temazcal.webp',
      srcset:
        '/images/offering-temazcal-768.webp 768w, /images/offering-temazcal-1280.webp 1280w, /images/offering-temazcal.webp 1920w',
      width: 1920,
      height: 1280,
      hue: 'amber',
    },
    {
      slug: 'where-you-sleep',
      src: '/images/sanctuary-bungalows.webp',
      srcset:
        '/images/sanctuary-bungalows-768.webp 768w, /images/sanctuary-bungalows-1280.webp 1280w, /images/sanctuary-bungalows.webp 1920w',
      width: 1920,
      height: 1280,
      hue: 'gold',
    },
    {
      slug: 'from-the-terrace',
      src: '/images/main_sanctuary.webp',
      srcset:
        '/images/main_sanctuary-768.webp 768w, /images/main_sanctuary-1920.webp 1920w, /images/main_sanctuary.webp 2558w',
      width: 2558,
      height: 1439,
      hue: 'sage',
    },
    {
      slug: 'fire-keeper',
      src: '/images/offering-temazcal.webp',
      srcset:
        '/images/offering-temazcal-768.webp 768w, /images/offering-temazcal-1280.webp 1280w, /images/offering-temazcal.webp 1920w',
      width: 1920,
      height: 1280,
      hue: 'indigo',
    },
    {
      slug: 'morning-slowly',
      src: '/images/sanctuary-bungalows.webp',
      srcset:
        '/images/sanctuary-bungalows-768.webp 768w, /images/sanctuary-bungalows-1280.webp 1280w, /images/sanctuary-bungalows.webp 1920w',
      width: 1920,
      height: 1280,
      hue: 'plum',
    },
  ];

  /** Published to CSS as `--turn-ms`, so the stylesheet's transition and the
   * setTimeout that lands the turn read the same number by construction. */
  const TURN_MS = 620;
  /**
   * The turn under reduced motion. Not zero, and not skipped: a page turn
   * here is user-initiated — someone clicked a control or a page — so it
   * belongs to the same exception the hero strip already claims (see the
   * long comment in +page.svelte, and animations.css's own header). What
   * reduced motion buys is brevity, not absence: same arc, less of it.
   */
  const TURN_MS_REDUCED = 250;

  /** Whichever of the two the current visitor gets. Read at click time
   * rather than at mount, so toggling the OS setting mid-session lands. */
  let turnMs = $state(TURN_MS);

  const count = entries.length;
  /** Wrapping index — the book has no first or last page, only a loop. */
  const at = (i: number) => entries[((i % count) + count) % count];
  const wrap = (i: number) => ((i % count) + count) % count;

  let index = $state(0);
  let turning: 'next' | 'prev' | null = $state(null);
  let timer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Guards the mobile (untweened) path only. Desktop already serialises turns
   * via `turning`, but mobile's `go()` branch below writes `index` and
   * returns immediately with no animation to occupy that role — nothing
   * stopped a second tap from landing before the browser had painted the
   * first index change, which is what read as a stutter/flash on a quick
   * flip-through. Held until two animation frames have actually painted, not
   * just one: the second frame is what confirms the update layout-settled
   * rather than merely queued.
   */
  let settling = $state(false);

  /**
   * The plate's `sizes`, as a constant because it is now used twice: on the
   * `<img>` below, and to warm the same photograph ahead of time. The two
   * MUST agree — the browser picks a srcset candidate from `sizes`, so a
   * warm-up with a different one fetches a file the page never asks for and
   * the flicker survives, invisibly, with the network cost doubled.
   */
  const PLATE_SIZES = '(max-width: 900px) 92vw, 46vw';

  const warmSource = (e: Entry): WarmSource => ({
    src: e.srcset.split(' ')[0],
    srcset: e.srcset,
    sizes: PLATE_SIZES,
  });

  /** Flipped once the section is within a viewport. Until then the book asks
   * for nothing — whatever is loading above it has the better claim. */
  let nearby = $state(false);

  function warmWhenNear(node: HTMLElement) {
    return { destroy: onApproach(node, () => (nearby = true)) };
  }

  /**
   * Keep the spreads either side of this one fetched AND decoded.
   *
   * Only the current spread is ever in the DOM, so a turn mounts an `<img>`
   * for a photograph the browser has never been asked about — the first byte
   * is requested on the very frame that has to show it. That is the reported
   * flicker: the plate blanks, then visibly resolves. No `loading="lazy"`
   * threshold reaches this, because there is no element to observe until it
   * is already too late.
   *
   * Neighbours rather than the whole array, and re-run on every turn, so this
   * still holds when `entries` stops being six placeholders (see the SEAM
   * note at the top) and both directions stay covered.
   */
  $effect(() => {
    if (!nearby) return;
    warmImages([at(index - 1), at(index), at(index + 1)].map(warmSource));
  });

  type Face = { kind: 'image' | 'text'; entry: Entry; i: number };

  /** Even spreads put the photograph on the left; odd spreads mirror it. */
  function sides(i: number): { left: Face; right: Face } {
    const entry = at(i);
    const imageLeft = wrap(i) % 2 === 0;
    const image: Face = { kind: 'image', entry, i: wrap(i) };
    const text: Face = { kind: 'text', entry, i: wrap(i) };
    return imageLeft ? { left: image, right: text } : { left: text, right: image };
  }

  /* What sits where during a turn. The leaf's box is pinned to the half it
   * STARTS in (`left: 50%` for next, `left: 0` for prev), but the rotation
   * carries it across the spine: a `next` leaf swings over and lands flat on
   * the LEFT half, a `prev` leaf on the RIGHT half. So its faces follow the
   * physics of a real sheet of paper: the front is the page you are leaving
   * (the half it started in), and the back is the page that belongs where it
   * LANDS — the incoming page for the other half. `base` already holds that
   * same page underneath, so at the moment of landing leaf and base are
   * pixel-identical and the swap is invisible.
   *
   * Get the back wrong (point it at the half the leaf started in, as this
   * code once did) and the turn reads fine mid-flight — foreshortening hides
   * what's printed on the sheet — but the instant the leaf flattens out it
   * shows a copy of the page beside it ("duplication on both faces"), and
   * the swap one frame later pops the real page in underneath ("a flash of
   * what's behind"). Both reported symptoms, one cause. */
  const base = $derived.by(() => {
    const here = sides(index);
    if (turning === 'next') return { left: here.left, right: sides(index + 1).right };
    if (turning === 'prev') return { left: sides(index - 1).left, right: here.right };
    return here;
  });

  const leaf = $derived.by(() => {
    if (turning === 'next') return { front: sides(index).right, back: sides(index + 1).left };
    if (turning === 'prev') return { front: sides(index).left, back: sides(index - 1).right };
    return null;
  });

  /**
   * The turn is driven as a `transition`, not a `@keyframes animation`,
   * because `backface-visibility` reliably fails to cull the hidden face
   * for exactly the combination this leaf uses — preserve-3d plus an
   * animated rotateY — well documented across Chromium and Firefox alike,
   * and reproduced here even with every other compositing hint stripped
   * back to nothing. A `transition` triggered by an actual style write
   * doesn't hit it. So the leaf mounts flat (rotateY(0deg)), and once
   * that's had a frame to paint, JS writes the target rotation directly
   * and the CSS transition below carries it the rest of the way.
   */
  let leafEl: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (!leaf || !leafEl) return;
    const el = leafEl;
    const target = turning === 'next' ? 'rotateY(-180deg)' : 'rotateY(180deg)';
    el.style.transform = 'rotateY(0deg)';
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transform = target;
      });
    });
    return () => cancelAnimationFrame(raf);
  });

  /* The spread's words, not its photograph: the only thing the live region
   * below announces is the title. Indexed the same way `at()` indexes the
   * structural array, so the two can never point at different spreads. */
  const current = $derived(m.entries[wrap(index)]);

  /**
   * The 3D turn is spent on desktop only. Below the spread breakpoint there is
   * no facing page to turn toward — the layout is a single column — so turning
   * a leaf would animate a fiction.
   *
   * Reduced motion deliberately does NOT gate here any more. It used to, and
   * the result was a section that looked broken on any machine with the OS
   * accessibility setting on — pages swapped instantly, in every browser on
   * that machine, while the same site turned pages normally on the machine
   * next to it. Reduced motion now shortens the turn instead; see
   * `turnDuration()` and the re-assert in the stylesheet.
   */
  function canTurn() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 901px)').matches;
  }

  /** How long this turn should take, honouring the ?motion=1 dev override
   * the rest of the site uses. Kept a function, not a $derived: matchMedia
   * is a live read and nothing here needs to react to it between clicks. */
  function turnDuration(): number {
    if (document.documentElement.classList.contains('motion-forced')) return TURN_MS;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? TURN_MS_REDUCED
      : TURN_MS;
  }

  function go(dir: 'next' | 'prev') {
    if (turning || settling) return; // one change in flight at a time
    if (!canTurn()) {
      index = wrap(index + (dir === 'next' ? 1 : -1));
      settling = true;
      requestAnimationFrame(() => requestAnimationFrame(() => { settling = false; }));
      return;
    }
    // Before `turning`, so the leaf mounts under the right --turn-ms.
    turnMs = turnDuration();
    turning = dir;
    /* Outlasts the transition deliberately. The rotation only starts once two
     * frames have painted (see the $effect above `leaf`), so it finishes a
     * hair after `turnMs`; unmounting the leaf at exactly `turnMs` used to
     * chop the last few degrees off the turn. The extra margin lets it land
     * fully flat — which is invisible anyway, because by then the leaf shows
     * the same page `base` is about to swap in — and guarantees the swap
     * never happens mid-flight. */
    const ms = turnMs;
    timer = setTimeout(() => {
      index = wrap(index + (dir === 'next' ? 1 : -1));
      turning = null;
      timer = null;
    }, ms + 80);
  }

  /**
   * Clicking a page flips it — but only where "left page" / "right page" is a
   * spatial fact, i.e. the two-column spread. Below 901px the same markup is
   * a single stacked column (photo above story), so a tap there would map an
   * arbitrary DOM position onto "next"/"prev" and just confuse people; the
   * dedicated controls already cover that layout.
   */
  function clickPage(dir: 'next' | 'prev') {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(min-width: 901px)').matches) return;
    go(dir);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go('next');
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go('prev');
    }
  }

  onDestroy(() => {
    if (timer) clearTimeout(timer);
  });
</script>

{#snippet face(f: Face)}
  {#if f.kind === 'image'}
    <figure class="plate">
      <img
        use:navRegion
        src={f.entry.srcset.split(' ')[0]}
        srcset={f.entry.srcset}
        sizes={PLATE_SIZES}
        width={f.entry.width}
        height={f.entry.height}
        alt={m.entries[f.i].alt}
        decoding="sync"
      />
    </figure>
  {:else}
    {@const copy = m.entries[f.i]}
    <div class="leaf-text" style="--entry-hue: var(--{f.entry.hue})">
      <p class="eyebrow entry-folio">
        <span class="folio-rule" aria-hidden="true"></span>
        {String(f.i + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
      </p>
      <h3 class="entry-title">{copy.title}</h3>
      <p class="entry-caption">{copy.caption}</p>
    </div>
  {/if}
{/snippet}

<section
  class="book-section"
  id="book"
  data-nav-bg="#EADBC0"
  aria-label={m.label}
  use:warmWhenNear
>
  <div class="book-inner">
    <div class="book-shell" role="group" aria-roledescription={m.roledescription} aria-label={m.label}>
      <div class="book" style="--turn-ms: {turnMs}ms">
        <div class="spread">
          <!-- Pointer-only affordance, deliberately not a button: the real,
               keyboard-reachable controls are below, and giving this div its
               own button role/keydown handler would announce the same
               "next"/"previous" action a second time on every page. -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="book-page book-page-left"
            onclick={() => clickPage('prev')}
          >
            {@render face(base.left)}
          </div>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="book-page book-page-right"
            onclick={() => clickPage('next')}
          >
            {@render face(base.right)}
          </div>

          {#if leaf}
            <div class="leaf leaf-{turning}" bind:this={leafEl} aria-hidden="true">
              <div class="leaf-face leaf-front">{@render face(leaf.front)}</div>
              <div class="leaf-face leaf-back">{@render face(leaf.back)}</div>
            </div>
          {/if}

          <!-- The spine dead last so the crease shadow rides on top of the
               turning leaf too, not just the resting pages: a real book's
               gutter shading stays put while a sheet sweeps through it. With
               the spine under the leaf (as this once was) the opaque sheet
               wiped the shadow away for the whole turn and it popped back at
               landing — the visible disappear/reappear. -->
          <span class="spine" aria-hidden="true"></span>
        </div>
      </div>

      <!-- Arrow keys are bound to the controls rather than to a wrapper: the
           controls are where focus actually lands, and hanging key handlers on
           a non-interactive container is how you end up swallowing arrow keys
           from people who were only trying to scroll. -->
      <div class="book-controls">
        <button
          class="btn btn-secondary btn-sm"
          type="button"
          onclick={() => go('prev')}
          onkeydown={onKeydown}
        >
          {m.previous}
        </button>
        <p class="small book-count" aria-hidden="true">
          {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </p>
        <button
          class="btn btn-secondary btn-sm"
          type="button"
          onclick={() => go('next')}
          onkeydown={onKeydown}
        >
          {m.next}
        </button>
      </div>

      <!-- Sighted readers get the turn; everyone else gets this. -->
      <p class="visually-hidden" aria-live="polite">
        {m.page(index + 1, count, current.title)}
      </p>
    </div>
  </div>
</section>

<style>
  .book-section {
    position: relative;
    z-index: 0;
    /* Every entry's caption is a different length, so the card's total
     * height changes on every turn. Left to itself the browser's scroll
     * anchoring "corrects" for that by silently adjusting scrollY to keep
     * whatever it picked as the anchor node visually still — which fights
     * the fixed-position mobile controls directly above: precisely the
     * element built to NOT move now gets dragged around by the page
     * compensating for the text growing/shrinking below it. */
    overflow-anchor: none;
    /* The odd one out on purpose: Journal, this section and Voices sit back
     * to back, and all three on --surface-1 read as one undifferentiated
     * band. Flipping just this one to --surface-2 (the card sits on
     * --surface-1 in turn, inverted from its siblings) is what breaks that
     * up. */
    background: var(--surface-2);
    /* vw, not vh: the band's air should answer to how wide the column is, not
     * to how tall the phone holding it is. Same 108px on the 1440×900
     * reference, same 120px cap, but 48px instead of 101px on a 390×844
     * screen. */
    padding: clamp(48px, 7.5vw, 120px) clamp(24px, 5vw, 80px);
    /* Cleared for the sticky header when the nav jumps to /#book. */
    scroll-margin-top: 60px;
  }

  .book-inner {
    max-width: 1200px;
    margin-inline: auto;
  }

  /* The perspective lives on an ancestor of the leaf, never on the leaf
   * itself — perspective on the transformed element would scale the whole
   * page instead of foreshortening its rotation. */
  .book {
    perspective: 2200px;
  }

  .spread {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    /* A fixed spread shape is what gives the pages height and keeps the turn
     * from resizing mid-flight as content changes. */
    aspect-ratio: 16 / 9;
    background: var(--surface-1);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    overflow: hidden;
  }

  /* Namespaced deliberately. `.page` is already a global layout helper in
   * components.css (max-width 1100px, 48px padding) — using that name here
   * silently inset every page of the book by 48px on all four sides. */
  .book-page {
    position: relative;
    min-width: 0;
    overflow: hidden;
    background: var(--surface-1);
  }

  /* Desktop only: the two-column spread is the only layout where "left
   * page" / "right page" is a spatial fact a click can mean something about.
   * See clickPage() — the handler itself re-checks the breakpoint, this only
   * signals it. */
  @media (min-width: 901px) {
    .book-page-left,
    .book-page-right {
      cursor: pointer;
    }
  }

  /* The hover hint: a small triangle at the outer bottom corner of whichever
   * page a click would turn, gone on touch where there is no hover to
   * announce it.
   *
   * Two things keep it sitting flush on the card's actual (rounded) corner
   * instead of poking past it:
   *   1. border-*-radius here matches --radius, the same token .spread
   *      clips its own corners with, so the two curves coincide instead of
   *      the sharp triangle tip getting chopped by the ancestor's mask.
   *   2. The hover state scales only — no translateY. transform-origin sits
   *      exactly on that corner, so the tip is the one point that never
   *      moves; drifting it even a few px re-opens the mismatch with
   *      .spread's fixed mask. The "lift" instead comes from the shadow. */
  @media (min-width: 901px) and (hover: hover) and (pointer: fine) {
    .book-page-left::after,
    .book-page-right::after {
      content: '';
      position: absolute;
      bottom: 0;
      width: clamp(28px, 3.4vw, 44px);
      height: clamp(28px, 3.4vw, 44px);
      pointer-events: none;
      opacity: 0;
      transition: opacity var(--duration-quick) var(--ease),
        transform var(--duration-quick) var(--ease),
        filter var(--duration-quick) var(--ease);
    }

    .book-page-left::after {
      left: 0;
      clip-path: polygon(0 100%, 0 30%, 70% 100%);
      transform-origin: bottom left;
      border-bottom-left-radius: var(--radius);
      background: linear-gradient(
        to top right,
        color-mix(in srgb, var(--color-ink) 20%, transparent) 0%,
        transparent 70%
      );
    }

    .book-page-right::after {
      right: 0;
      clip-path: polygon(100% 100%, 100% 30%, 30% 100%);
      transform-origin: bottom right;
      border-bottom-right-radius: var(--radius);
      background: linear-gradient(
        to top left,
        color-mix(in srgb, var(--color-ink) 20%, transparent) 0%,
        transparent 70%
      );
    }

    .book-page-left:hover::after,
    .book-page-right:hover::after {
      opacity: 1;
      transform: scale(1.15);
      filter: drop-shadow(0 2px 4px color-mix(in srgb, var(--color-ink) 35%, transparent));
    }
  }

  /* The gutter: a soft crease at the centre, darkest exactly on the fold. */
  .spine {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: var(--spacing-s-6);
    transform: translateX(-50%);
    /* Above the turning leaf, not just the resting pages — see the markup
     * comment. z-index (not just DOM order) because the leaf's 3D transform
     * promotes it to its own layer, and a browser that depth-sorts that
     * layer against flat siblings must still lose to an explicit 2. */
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--color-ink) 10%, transparent),
      color-mix(in srgb, var(--color-ink) 18%, transparent),
      color-mix(in srgb, var(--color-ink) 10%, transparent),
      transparent
    );
  }

  .plate {
    margin: 0;
    height: 100%;
  }

  .plate img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .leaf-text {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: clamp(var(--spacing-s-6), 4vw, var(--spacing-s-8));
    background: var(--surface-1);
  }

  .entry-folio {
    display: flex;
    align-items: center;
    gap: var(--spacing-s-3);
    margin: 0 0 var(--spacing-s-4);
    color: var(--text-2);
    font-variant-numeric: tabular-nums;
  }

  /* The entry's wing hue, spent here and nowhere else on the spread. */
  .folio-rule {
    width: var(--spacing-s-6);
    height: 2px;
    background: var(--entry-hue);
    flex-shrink: 0;
  }

  /* Kept as an interpolation between two tokens rather than folded into one:
   * a page of the spread is ~46vw, so this heading is sized against its page
   * and not against the viewport the page sits in. Both ends are fluid now,
   * so the 2.6vw middle is the only fixed thing left and it stops mattering
   * below 900px, where the spread collapses and --text-h4 takes over. */
  .entry-title {
    font-family: var(--font-display);
    font-size: clamp(var(--text-h4), 2.6vw, var(--text-h2));
    font-weight: var(--weight-light);
    line-height: var(--leading-tight);
    margin: 0 0 var(--spacing-s-4);
  }

  .entry-caption {
    font-size: var(--text-body);
    color: var(--text-2);
    line-height: var(--leading-loose);
    max-width: 42ch;
    margin: 0;
  }

  /* ── The turning leaf ──────────────────────────────────────────────
   * Half the spread wide, hinged on the spine. preserve-3d is what lets the
   * two faces occupy the same box at different rotations; without it the back
   * face would flatten onto the front and never show.
   *
   * The rotation itself is a `transition`, armed by JS writing `transform`
   * directly (see the $effect above `leaf`), not a `@keyframes animation`.
   * Deliberate: backface-visibility only reliably culls the hidden face when
   * the rotation is driven by an actual style write. */
  .leaf {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;
    transform: rotateY(0deg);
    transform-style: preserve-3d;
    transition: transform var(--turn-ms) cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }

  /* Reduced motion must not zero this one.
   *
   * animations.css blanket-applies `transition-duration: 0s !important` under
   * (prefers-reduced-motion: reduce). For decorative motion that is exactly
   * right. For this leaf it is not: the turn is user-initiated — a click on a
   * control or on a page — and zeroing it snapped the leaf through 180° in a
   * single frame, which read as the section simply having no animation at all
   * on any machine with the OS setting on, in every browser on that machine.
   *
   * Same exception the hero strip already claims in +page.svelte, for the
   * same reason: nothing moves here that the reader did not move themselves.
   * `--turn-ms` is already the shortened 250ms by the time this applies —
   * go() sets it from turnDuration() before the leaf mounts — so honouring
   * the preference happens in the duration, not in the presence of the turn.
   * !important is required only because the blanket rule uses it too. */
  @media (prefers-reduced-motion: reduce) {
    :global(html:not(.motion-forced)) .leaf {
      transition-duration: var(--turn-ms) !important;
      transition-delay: 0s !important;
    }
  }

  .leaf-next {
    left: 50%;
    transform-origin: left center;
  }

  .leaf-prev {
    left: 0;
    transform-origin: right center;
  }

  /* There used to be a third child here, a .leaf-shade span animating its
   * own opacity for a paper-catching-light effect. Don't add one back: an
   * opacity @keyframes running inside this preserve-3d leaf, alongside the
   * rotateY animation, is a documented Chromium/WebKit failure mode for
   * backface-visibility — it stops culling the hidden face, so for a
   * stretch of the turn both leaf-front and leaf-back render at once,
   * which is exactly what read as "duplicated" content mid-flip. If this
   * effect comes back, it needs to live outside .leaf's 3D context (a
   * sibling overlay on .spread, not a child of the rotating element). */
  .leaf-face {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--surface-1);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  /* Pre-rotated so it reads the right way round once the leaf has swung. */
  .leaf-back {
    transform: rotateY(180deg);
  }


  .book-controls {
    display: flex;
    /* The one thing on the page that still pushed a horizontal scrollbar:
     * two buttons and a counter in a nowrap row need ~228px, which a 390px
     * phone at 200% zoom (195 CSS px of layout viewport) does not have. */
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-s-5);
    margin-top: var(--spacing-s-6);
  }

  .book-count {
    margin: 0;
    font-variant-numeric: tabular-nums;
    min-width: 6ch;
    text-align: center;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  /* ── Phone: there is no facing page, so there is no spread ──────────
   * The book becomes one page at a time — photograph, then controls, then
   * its story. `.book` and `.spread` turn to display:contents, which does
   * not remove them, only stops them generating their own box — their
   * children (the two book-page divs) get promoted to be direct flex items
   * of `.book-shell`, sitting alongside `.book-controls` in one flex
   * context. That is what makes `order` below able to slot the controls
   * BETWEEN the photo and the story instead of only before/after the book
   * as a whole.
   *
   * The point of doing this: the photo has a fixed 4/3 aspect ratio, so it
   * is the same height on every entry, but the story's length varies. With
   * controls pinned right after the photo, only the (now-trailing) story
   * grows or shrinks — the controls' position on screen stays put from
   * entry to entry instead of hopping around under a variable-height page,
   * which is what made them hard to keep tapping in the same spot. */
  @media (max-width: 900px) {
    .book-shell {
      display: flex;
      flex-direction: column;
      background: var(--surface-1);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .book,
    .spread {
      display: contents;
    }

    .book-page-left,
    .book-page-right {
      min-height: 0;
    }

    .plate {
      aspect-ratio: 4 / 3;
    }

    .leaf-text {
      padding: var(--spacing-s-6) var(--spacing-s-5);
    }

    .spine,
    .leaf {
      display: none;
    }

    /* The photograph first whichever side its spread would have put it on
     * (or every other entry opens with a wall of text), the controls in
     * their own small band in the middle, the story last. */
    .book-page-left:has(.plate),
    .book-page-right:has(.plate) {
      order: 1;
    }

    .book-controls {
      order: 2;
      /* Its own quiet band — a hairline top and bottom, the section's own
       * --surface-2 showing through against the card's --surface-1, so it
       * reads as a distinct strip rather than a random gap in the story. */
      background: var(--surface-2);
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
      margin-top: 0;
      padding: var(--spacing-s-3) var(--spacing-s-4);
    }

    .book-page-left:has(.leaf-text),
    .book-page-right:has(.leaf-text) {
      order: 3;
    }
  }
</style>
