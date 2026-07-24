<script lang="ts">
  /**
   * WelcomePanel — Homepage Section 2
   *
   * Scroll-triggered reveal, treated like keyframes. The shared hero driver
   * reports eased progress p (0→1) across the slide; when p crosses
   * REVEAL_AT the root gets `.is-in` and CSS transitions carry every
   * element to a guaranteed end state — staggered, per-element entrances,
   * zero per-frame style writes, so there is nothing that can half-trigger.
   * Below HIDE_AT the class drops and the section re-arms: scroll back in
   * and it plays again. The driver is used for discrete state only, exactly
   * as scrollDriver.ts intends.
   *
   * Entrances: terrace lines draw on (stroke-dashoffset, staggered top →
   * bottom), the terraces settle 6vw against the slide (parallax), the
   * image counters in FROM THE LEFT against the rightward scroll, the copy
   * fades up with varied travel, spectrum bars ripple in via scaleX.
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

  /** Eased p at which the section reveals — the panel is ~half on screen
   * and the copy column is coming into view. Hysteresis (HIDE_AT <
   * REVEAL_AT) stops the class flickering at the boundary.
   *
   * These are $state toggled only on threshold crossings (a couple of
   * writes per section pass — never per frame). The class: directives in
   * the markup keep Svelte's CSS pruning from dropping the reveal rules,
   * which it would do for classes added via classList at runtime. */
  const REVEAL_AT = 0.55;
  const HIDE_AT = 0.47;
  let armed = $state(false);
  let revealed = $state(false);

  function onProgress(p: number): void {
    if (!revealed && p >= REVEAL_AT) revealed = true;
    else if (revealed && p < HIDE_AT) revealed = false;
  }

  onMount(() => {
    greeting = greetings[Math.floor(Math.random() * greetings.length)];

    // Arm the hidden keyframe states only once JS is live — the base
    // stylesheet is fully visible, so content is never held hostage by a
    // script error or a no-JS environment.
    armed = true;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Global reduced-motion CSS zeroes the transitions → instant show.
      revealed = true;
      return;
    }

    return subscribeHeroScroll(onProgress);
  });
</script>

<div class="welcome" class:is-armed={armed} class:is-in={revealed}>
  <div class="terraces" aria-hidden="true">
    <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" fill="none">
      <path d="M-40 520 H320 V560 H600 V600 H880 V640 H1240" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" />
      <path d="M-40 600 H260 V640 H540 V680 H820 V720 H1240" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" />
      <path d="M-40 680 H200 V720 H480 V760 H760 V800 H1240" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" />
    </svg>
  </div>

  <div class="welcome-grid">
    <div class="welcome-copy">
      <p class="greeting">
        <span lang="qu" class="greeting-qu">{greeting.qu}</span>
        <span class="greeting-en">— {greeting.en}</span>
      </p>
      <div class="spectrum" aria-hidden="true">
        <i style="--hue: var(--clay)"></i><i style="--hue: var(--amber)"></i><i style="--hue: var(--gold)"></i><i style="--hue: var(--sage)"></i><i style="--hue: var(--slate)"></i><i style="--hue: var(--indigo)"></i><i style="--hue: var(--plum)"></i>
      </div>
      <h2 class="welcome-title">There's a rhythm here<br />that the city forgot.</h2>
      <p class="body">Mornings that ask nothing of you.<br />A table set with what the land gave that week.<br />Mountains that have been patient for millennia.</p>
      <p class="body">This is <strong>ayni</strong> — not a word you look up, but a way of being that finds you when you stop looking.</p>
      <p class="closing">The door is open.<br />The valley is patient.</p>
      <div class="location-strip">
        <span>Calca</span><span class="loc-dot" aria-hidden="true"></span><span>Valle Sagrado</span><span class="loc-dot" aria-hidden="true"></span><span>2,928 m</span>
      </div>
    </div>
    <div class="welcome-image">
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
   * stroke-dashoffset="1" is only a pre-CSS guard; armed CSS below
   * re-hides them for the reveal. No-JS environments see full lines. */
  .terraces path { stroke-dashoffset: 0; }
  .welcome-grid { position: relative; z-index: 1; width: 100%; max-width: 1440px; margin-inline: auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.85fr); gap: clamp(40px, 5vw, 96px); align-items: stretch; flex: 1; min-height: 0; }
  .welcome-image { display: flex; align-items: flex-end; justify-content: flex-end; padding-bottom: 6vh; will-change: transform, opacity; }
  /* Bars grow from the left edge (reveal below) */
  .spectrum i { transform-origin: left center; }
  .greeting, .spectrum, .welcome-title, .body, .closing, .location-strip { will-change: transform, opacity; }
  .greeting { display: flex; align-items: baseline; gap: var(--spacing-s-2); font-size: var(--text-sm); letter-spacing: var(--tracking-wider); text-transform: uppercase; }
  .greeting-qu { font-family: var(--font-display); font-size: var(--text-body); font-weight: var(--weight-book); letter-spacing: var(--tracking-norm); text-transform: none; color: var(--clay); }
  .greeting-en { color: var(--text-3); font-weight: var(--weight-med); }
  .spectrum { display: flex; gap: var(--spacing-s-1); margin-top: var(--spacing-s-4); }
  .spectrum i { width: 20px; height: 3px; background: var(--hue); border-radius: 2px; }
  .welcome-title { font-family: var(--font-display); font-size: clamp(2.2rem, 3.8vw, var(--text-h1)); font-weight: var(--weight-light); line-height: var(--leading-tight); letter-spacing: var(--tracking-display); color: var(--text); margin-top: var(--spacing-s-5); }
  .body { font-size: var(--text-lead); line-height: var(--leading-loose); color: var(--text-2); max-width: 42ch; margin-top: var(--spacing-s-5); }
  .body strong { font-weight: var(--weight-semi); color: var(--clay); }
  .closing { font-family: var(--font-display); font-size: clamp(1.2rem, 1.6vw, var(--text-h3)); font-weight: var(--weight-book); line-height: var(--leading-snug); color: var(--text); margin-top: var(--spacing-s-6); }
  .location-strip { display: flex; align-items: center; gap: var(--spacing-s-3); margin-top: var(--spacing-s-6); font-size: var(--text-xs); font-weight: var(--weight-med); letter-spacing: var(--tracking-wider); text-transform: uppercase; color: var(--text-3); }
  .loc-dot { width: 4px; height: 4px; border-radius: var(--radius-full); background: var(--clay); opacity: 0.6; }
  .frame { margin: 0; width: 100%; }
  .frame-inner { border: 1.5px solid var(--clay); border-radius: var(--radius); overflow: hidden; background: var(--clay-t); aspect-ratio: 4 / 3; }
  .frame-inner img { display: block; width: 100%; height: 100%; object-fit: cover; }

  /* ── Scroll-triggered reveal — keyframe-like states ──
   * .is-armed      JS is live; elements hold their hidden start state.
   * .is-armed.is-in  Threshold crossed; transitions run to the end state.
   * Enter transitions are long + staggered (delays live on the .is-in
   * rules); exits fall back to the armed rules — short, simultaneous —
   * so scrolling away re-arms quickly and re-entry replays cleanly. */
  .is-armed .greeting        { opacity: 0; transform: translateY(14px); transition: opacity .45s var(--ease), transform .45s var(--ease); }
  .is-armed .welcome-title   { opacity: 0; transform: translateY(26px); transition: opacity .45s var(--ease), transform .45s var(--ease); }
  .is-armed .body            { opacity: 0; transform: translateY(20px); transition: opacity .45s var(--ease), transform .45s var(--ease); }
  .is-armed .closing         { opacity: 0; transform: translateY(16px); transition: opacity .45s var(--ease), transform .45s var(--ease); }
  .is-armed .location-strip  { opacity: 0; transform: translateY(10px); transition: opacity .45s var(--ease), transform .45s var(--ease); }
  .is-armed .welcome-image   { opacity: 0; transform: translateX(-8vw); transition: opacity .35s var(--ease), transform .45s var(--ease); }
  .is-armed .spectrum i      { transform: scaleX(0); transition: transform .35s var(--ease); }
  .is-armed .terraces        { transform: translateX(6vw); transition: transform .5s var(--ease); }
  .is-armed .terraces path   { stroke-dashoffset: 1; transition: stroke-dashoffset .45s var(--ease); }

  .is-armed.is-in .greeting        { opacity: 1; transform: none; transition: opacity .7s var(--ease) .05s, transform .7s var(--ease) .05s; }
  .is-armed.is-in .welcome-title   { opacity: 1; transform: none; transition: opacity .8s var(--ease) .12s, transform .8s var(--ease) .12s; }
  .is-armed.is-in .body            { opacity: 1; transform: none; transition: opacity .7s var(--ease) .22s, transform .7s var(--ease) .22s; }
  .is-armed.is-in .body + .body    { transition-delay: .30s; }
  .is-armed.is-in .closing         { opacity: 1; transform: none; transition: opacity .7s var(--ease) .38s, transform .7s var(--ease) .38s; }
  .is-armed.is-in .location-strip  { opacity: 1; transform: none; transition: opacity .6s var(--ease) .46s, transform .6s var(--ease) .46s; }
  /* Image: opacity lands fast, the from-left travel gets the long run */
  .is-armed.is-in .welcome-image   { opacity: 1; transform: none; transition: opacity .5s var(--ease) .08s, transform 1.1s var(--ease) .08s; }
  .is-armed.is-in .spectrum i      { transform: none; transition: transform .6s var(--ease); }
  .is-armed.is-in .spectrum i:nth-child(1) { transition-delay: .20s; }
  .is-armed.is-in .spectrum i:nth-child(2) { transition-delay: .25s; }
  .is-armed.is-in .spectrum i:nth-child(3) { transition-delay: .30s; }
  .is-armed.is-in .spectrum i:nth-child(4) { transition-delay: .35s; }
  .is-armed.is-in .spectrum i:nth-child(5) { transition-delay: .40s; }
  .is-armed.is-in .spectrum i:nth-child(6) { transition-delay: .45s; }
  .is-armed.is-in .spectrum i:nth-child(7) { transition-delay: .50s; }
  .is-armed.is-in .terraces        { transform: none; transition: transform 1.6s var(--ease); }
  .is-armed.is-in .terraces path   { stroke-dashoffset: 0; transition: stroke-dashoffset 1.3s var(--ease); }
  .is-armed.is-in .terraces path:nth-of-type(2) { transition-delay: .18s; }
  .is-armed.is-in .terraces path:nth-of-type(3) { transition-delay: .36s; }

  @media (max-width: 900px) {
    .welcome { overflow-y: auto; padding-top: 88px; }
    .welcome-grid { grid-template-columns: 1fr; gap: var(--spacing-s-7); padding-block: var(--spacing-s-4) var(--spacing-s-7); }
    .welcome-image { padding-bottom: 0; overflow: hidden; } /* clip the from-left slide */
    .frame-inner { aspect-ratio: 16 / 9; }
  }
  @media (max-height: 700px) { .welcome { padding-top: 72px; } }

  @media (prefers-reduced-motion: reduce) {
    .greeting, .spectrum, .spectrum i, .welcome-title, .body, .closing, .location-strip, .welcome-image { opacity: 1 !important; transform: none !important; will-change: auto; }
    .terraces { transform: none !important; will-change: auto; }
    .terraces svg path { stroke-dashoffset: 0 !important; }
  }
</style>
