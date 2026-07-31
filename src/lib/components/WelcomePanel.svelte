<script lang="ts">
  /**
   * WelcomePanel — Homepage Section 2
   *
   * Scroll-scrubbed reveal — frame-locked to the hero's scroll progress.
   * Every element maps a window of eased progress p (0→1) to a local
   * 0→1 reveal and writes opacity / transform / stroke-dashoffset
   * directly: scroll down advances the choreography, scroll back
   * reverses it by exactly the same amount. No triggers, no time-based
   * transitions — the value at any moment is a pure function of scroll
   * position, driven by the shared rAF-coalesced hero driver.
   *
   * Windows sit in the arrival half of the slide (panel 2 is fully on
   * screen at p = 1), so the section animates while it comes in and is
   * settled just before it lands.
   *
   * Entrances: terrace lines draw on via stroke-dashoffset in their
   * natural LEFT → RIGHT direction, windows pinned to end at p = 1 —
   * that keeps the pen tip on screen for its entire traverse (it walks
   * from the panel's left edge to the screen's right edge exactly as
   * the panel lands), tips staggered top → bottom at constant pen
   * speed — the terraces settle 6vw against the slide (parallax depth), the
   * image container slides in FROM THE RIGHT — same leftward motion as
   * the hero panel's slide, arriving late — the copy fades up with
   * varied travel, the spectrum bars ripple in via scaleX, and a
   * hand-drawn rainbow band (the seven wing hues, kept translucent)
   * sweeps in beneath the closing line like a brush pass.
   */
  import { onMount } from 'svelte';
  import { subscribeHeroScroll } from '$lib/scrollDriver';

  const greetings = [
    { qu: "Allin p'unchaw", en: 'good day' },
    { qu: 'Haykuykuy', en: 'come in' },
    { qu: 'Urpillay sonqollay', en: 'gratitude' },
    { qu: 'Rimaykullayki', en: 'hello' },
    { qu: 'Napaykullayki', en: 'I greet you' },
    { qu: 'Hamuy', en: 'welcome' },
    { qu: 'Añay', en: 'thank you' },
  ];
  let greeting = $state(greetings[0]);

  /* Individual DOM refs — no array-index bind:this (Svelte 5 compat) */
  let elGreeting: HTMLElement;
  let elSpectrum: HTMLElement;
  let elTitle: HTMLElement;
  let elBody1: HTMLElement;
  let elBody2: HTMLElement;
  let elClosing: HTMLElement;
  let elDoorGlow: SVGSVGElement;
  let elLocation: HTMLElement;
  let elImage: HTMLElement;
  let elTerraces: HTMLElement;
  let elLine1: SVGPathElement;
  let elLine2: SVGPathElement;
  let elLine3: SVGPathElement;

  /** Spectrum bar <i> elements — collected on mount (no bind:this in each). */
  let bars: HTMLElement[] = [];
  /** Image slide distance in px — ~8vw, clamped so mobile stays composed. */
  let imgTx = 110;

  function map01(v: number, lo: number, hi: number): number {
    if (v <= lo) return 0;
    if (v >= hi) return 1;
    return (v - lo) / (hi - lo);
  }

  /** easeOutCubic — smooth deceleration at the end of each reveal */
  function easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /* Write-skipping — every animator caches its last quantized value and
   * only touches the DOM when it changes. Outside an element's window the
   * value is clamped, so already-settled (or not-yet-started) elements
   * cost zero style writes per frame. Same epsilon philosophy as the
   * driver itself. */
  const lastValue = new Map<Element, number>();

  function commit(el: Element, value: number, apply: (v: number) => void): void {
    const q = Math.round(value * 1000) / 1000;
    if (lastValue.get(el) === q) return;
    lastValue.set(el, q);
    apply(q);
  }

  function fadeUp(el: HTMLElement | undefined, local: number, maxTy: number): void {
    if (!el) return;
    commit(el, easeOut(local), (e) => {
      el.style.opacity = String(e);
      el.style.transform = e >= 1 ? '' : `translateY(${((1 - e) * maxTy).toFixed(2)}px)`;
    });
  }

  /** Image entrance — the WHOLE container travels as one: it starts
   * offset out toward the right (parked past the panel's clipped edge,
   * where it waits while the panel arrives) and settles leftward into
   * its column — the same leftward motion as the hero panel's slide,
   * late and slow (window 0.64–1.00: it lands exactly as the panel
   * does). No fade — the side entrance is the reveal. */
  function scrubImage(el: HTMLElement | undefined, local: number): void {
    if (!el) return;
    commit(el, easeOut(local), (e) => {
      el.style.transform = e >= 1 ? '' : `translateX(${((1 - e) * imgTx).toFixed(1)}px)`;
    });
  }

  /** Lines draw in path direction (left → right) with LINEAR progress —
   * constant pen speed. Every window is pinned to end at p = 1: the tip
   * then traverses from the panel's left edge to the screen's right edge
   * exactly as the panel lands, staying visible the whole way. (Drawing
   * against the path direction read as "in reverse"; windows ending
   * early sent the tip off-screen before the draw finished.) */
  function drawLine(path: SVGPathElement | undefined, local: number): void {
    if (!path) return;
    commit(path, local, (e) => {
      path.style.strokeDashoffset = String(1 - e);
    });
  }

  /** Door rainbow — sweeps in left→right like a brush pass under the
   * closing text, trailing the words' fade-up (window 0.78–0.95). The
   * negative insets keep the rotated, hand-drawn edges fully covered. */
  function sweepIn(el: Element | undefined, local: number): void {
    if (!el) return;
    commit(el, easeOut(local), (e) => {
      (el as HTMLElement | SVGSVGElement).style.clipPath =
        e >= 1 ? 'none' : `inset(-15% ${((1 - e) * 130).toFixed(2)}% -15% -15%)`;
    });
  }

  /** Spectrum bars grow from the left edge, windows offset ~0.015p each,
   * so the seven hues ripple as the scroll sweeps through them. */
  function growBars(p: number): void {
    for (let i = 0; i < bars.length; i++) {
      commit(bars[i], easeOut(map01(p, 0.58 + i * 0.015, 0.70 + i * 0.015)), (e) => {
        bars[i].style.transform = e >= 1 ? '' : `scaleX(${e.toFixed(4)})`;
      });
    }
  }

  /**
   * Choreography — windows in eased hero progress p, all scrubbed:
   *
   *   0.40–0.95  terraces settle 6vw against the slide (parallax depth)
   *   0.30–1.00  terrace lines draw LEFT → RIGHT, tips staggered 0.08p
   *              apart (top → bottom); all three windows end at p = 1,
   *              so each tip — starting while the panel is still a
   *              sliver — finishes its traverse across the screen
   *              exactly as the panel lands, none ever racing off-screen
   *   0.55–0.92  copy cascade: greeting → spectrum → title → bodies →
   *              closing → location (~0.04p apart, varied travel)
   *   0.64–1.00  image container slides in from the right, settling
   *              leftward into its column exactly as the panel lands
   *   0.78–0.95  door rainbow sweeps in beneath the closing line
   *
   * Everything reaches its rest value by p ≈ 0.92 — a beat of stillness
   * before the panel lands at p = 1.
   */
  function animate(p: number): void {
    if (elTerraces) {
      commit(elTerraces, easeOut(map01(p, 0.40, 0.95)), (e) => {
        elTerraces.style.transform = e >= 1 ? '' : `translateX(${((1 - e) * 6).toFixed(3)}vw)`;
      });
    }

    drawLine(elLine1, map01(p, 0.30, 1.0));
    drawLine(elLine2, map01(p, 0.38, 1.0));
    drawLine(elLine3, map01(p, 0.46, 1.0));

    scrubImage(elImage, map01(p, 0.64, 1.0));

    fadeUp(elGreeting, map01(p, 0.55, 0.72), 16);
    growBars(p);
    fadeUp(elTitle,    map01(p, 0.61, 0.79), 28);
    fadeUp(elBody1,    map01(p, 0.65, 0.82), 22);
    fadeUp(elBody2,    map01(p, 0.69, 0.86), 22);
    fadeUp(elClosing,  map01(p, 0.73, 0.89), 18);
    sweepIn(elDoorGlow, map01(p, 0.78, 0.95));
    fadeUp(elLocation, map01(p, 0.77, 0.92), 12);
  }

  onMount(() => {
    greeting = greetings[Math.floor(Math.random() * greetings.length)];
    bars = Array.from(elSpectrum.querySelectorAll('i'));
    imgTx = Math.round(Math.min(140, Math.max(48, window.innerWidth * 0.08)));

    animate(0); // frame zero: fully hidden, then the scroll drives
    return subscribeHeroScroll(animate);
  });
</script>

<div class="welcome">
  <div class="terraces" aria-hidden="true" bind:this={elTerraces}>
    <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" fill="none">
      <path bind:this={elLine1} d="M-40 520 H320 V560 H600 V600 H880 V640 H1240" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" />
      <path bind:this={elLine2} d="M-40 600 H260 V640 H540 V680 H820 V720 H1240" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" />
      <path bind:this={elLine3} d="M-40 680 H200 V720 H480 V760 H760 V800 H1240" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" />
    </svg>
  </div>

  <div class="welcome-grid">
    <div class="welcome-copy">
      <p class="greeting" bind:this={elGreeting}>
        <span lang="qu" class="greeting-qu">{greeting.qu}</span>
        <span class="greeting-en">{greeting.en}</span>
      </p>
      <div class="spectrum" aria-hidden="true" bind:this={elSpectrum}>
        <i style="--hue: var(--clay)"></i><i style="--hue: var(--amber)"></i><i style="--hue: var(--gold)"></i><i style="--hue: var(--sage)"></i><i style="--hue: var(--slate)"></i><i style="--hue: var(--indigo)"></i><i style="--hue: var(--plum)"></i>
      </div>
      <h2 class="welcome-title" bind:this={elTitle}>We are happy you're here.</h2>
      <p class="body" bind:this={elBody1}>This valley has welcomed people for generations. We're simply here to share it with you.</p>
      <p class="body" bind:this={elBody2}>Take your time. Breathe the mountain air. Enjoy good food, quiet mornings, and the gentle rhythm of the Sacred Valley.</p>
      <p class="closing" bind:this={elClosing}>
        <svg
          class="door-glow"
          aria-hidden="true"
          viewBox="0 0 320 64"
          preserveAspectRatio="none"
          bind:this={elDoorGlow}
        >
          <defs>
            <linearGradient id="door-rainbow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" style="stop-color: var(--clay)" />
              <stop offset="0.166" style="stop-color: var(--amber)" />
              <stop offset="0.333" style="stop-color: var(--gold)" />
              <stop offset="0.5" style="stop-color: var(--sage)" />
              <stop offset="0.666" style="stop-color: var(--slate)" />
              <stop offset="0.833" style="stop-color: var(--indigo)" />
              <stop offset="1" style="stop-color: var(--plum)" />
            </linearGradient>
          </defs>
          <path
            d="M8 24 C 66 15, 128 32, 178 24 C 228 17, 278 28, 312 21 L 309 51 C 259 60, 199 45, 147 54 C 95 62, 46 47, 12 54 Z"
            fill="url(#door-rainbow)"
          />
        </svg>
        The door is open.
      </p>
      <div class="location-strip" bind:this={elLocation}>
        <span>Calca</span><span class="loc-dot" aria-hidden="true"></span><span>Valle Sagrado</span><span class="loc-dot" aria-hidden="true"></span><span>2,928 m</span>
      </div>
    </div>
    <div class="welcome-image" bind:this={elImage}>
      <figure class="frame">
        <div class="frame-inner">
          <img src="/images/sanctuary-bungalows.webp" srcset="/images/sanctuary-bungalows-768.webp 768w, /images/sanctuary-bungalows-1280.webp 1280w, /images/sanctuary-bungalows.webp 1920w" sizes="(max-width: 900px) 90vw, 45vw" width="1920" height="1280" alt="Adobe bungalows with thatched roofs along a stone path at Ayni Sanctuary, Sacred Valley" loading="lazy" decoding="async" />
        </div>
      </figure>
    </div>
  </div>
</div>

<style>
  .welcome {
    position: absolute; inset: 0; display: flex; overflow: hidden;
    background: radial-gradient(130% 100% at 85% 15%, var(--clay-t) 0%, transparent 60%), var(--surface-1);
    padding: clamp(80px, 10vh, 120px) clamp(24px, 5vw, 80px) clamp(32px, 4vh, 56px);
  }
  .terraces { position: absolute; inset: 0; pointer-events: none; will-change: transform; }
  .terraces svg { position: absolute; left: -4%; bottom: -6%; width: 108%; height: 60%; stroke: var(--clay); stroke-width: 1; opacity: 0.18; }
  /* Base stylesheet draws the lines — the presentation attribute
   * stroke-dashoffset="1" is only a pre-CSS guard. No-JS environments
   * see full lines; the scrub hides them again from animate(0). */
  .terraces path { stroke-dashoffset: 0; }
  .welcome-grid { position: relative; z-index: 1; width: 100%; max-width: 1440px; margin-inline: auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.85fr); gap: clamp(40px, 5vw, 96px); align-items: stretch; flex: 1; min-height: 0; }
  .welcome-image { display: flex; align-items: flex-end; justify-content: flex-end; padding-bottom: 6vh; will-change: transform; }
  /* Bars grow from the left edge (see growBars) */
  .spectrum i { transform-origin: left center; }
  .greeting, .spectrum, .welcome-title, .body, .closing, .location-strip { will-change: transform, opacity; }
  .greeting { display: flex; align-items: baseline; gap: var(--spacing-s-2); font-size: var(--text-sm); letter-spacing: var(--tracking-wider); text-transform: uppercase; }
  .greeting-qu { font-family: var(--font-display); font-size: var(--text-body); font-weight: var(--weight-book); letter-spacing: var(--tracking-norm); text-transform: none; color: var(--clay); }
  .greeting-en { color: var(--text-3); font-weight: var(--weight-med); }
  .spectrum { display: flex; gap: var(--spacing-s-1); margin-top: var(--spacing-s-4); }
  .spectrum i { width: 20px; height: 3px; background: var(--hue); border-radius: 2px; }
  /* Single-line title: sized by vw with a firm cap so the line always
   * fits its column, nowrap so it never breaks mid-sentence. */
  .welcome-title { font-family: var(--font-display); font-size: clamp(1.4rem, 3.1vw, 3.4rem); font-weight: var(--weight-light); line-height: var(--leading-tight); letter-spacing: var(--tracking-display); color: var(--text); margin-top: var(--spacing-s-5); white-space: nowrap; }
  .body { font-size: var(--text-lead); line-height: var(--leading-loose); color: var(--text-2); max-width: 42ch; margin-top: var(--spacing-s-5); }
  .closing { position: relative; display: inline-block; font-family: var(--font-display); font-size: clamp(1.2rem, 1.6vw, var(--text-h3)); font-weight: var(--weight-book); line-height: var(--leading-snug); color: var(--text); margin-top: var(--spacing-s-6); }
  /* Hand-drawn rainbow band behind the closing line — the seven wing
   * hues at low opacity, tilted a touch so it reads as a brush stroke,
   * not a box. Revealed by the scrub (see sweepIn). */
  .door-glow { position: absolute; left: -5%; top: 6%; width: 110%; height: 88%; z-index: -1; opacity: 0.25; transform: rotate(-1.2deg); pointer-events: none; will-change: clip-path; }
  .location-strip { display: flex; align-items: center; gap: var(--spacing-s-3); margin-top: var(--spacing-s-6); font-size: var(--text-xs); font-weight: var(--weight-med); letter-spacing: var(--tracking-wider); text-transform: uppercase; color: var(--text-3); }
  .loc-dot { width: 4px; height: 4px; border-radius: var(--radius-full); background: var(--clay); opacity: 0.6; }
  .frame { margin: 0; width: 100%; }
  .frame-inner { border: 1.5px solid var(--clay); border-radius: var(--radius); overflow: hidden; background: var(--clay-t); aspect-ratio: 4 / 3; }
  .frame-inner img { display: block; width: 100%; height: 100%; object-fit: cover; }

  @media (max-width: 900px) {
    .welcome { overflow-y: auto; overflow-x: hidden; padding-top: 88px; } /* x-hidden clips the from-right slide */
    .welcome-grid { grid-template-columns: 1fr; gap: var(--spacing-s-7); padding-block: var(--spacing-s-4) var(--spacing-s-7); }
    .welcome-image { padding-bottom: 0; }
    .frame-inner { aspect-ratio: 16 / 9; }
  }
  @media (max-height: 700px) { .welcome { padding-top: 72px; } }

</style>
