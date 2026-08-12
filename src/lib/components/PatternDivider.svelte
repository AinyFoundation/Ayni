<script lang="ts">
  /**
   * PatternDivider — a woven section seam.
   *
   * A horizontal band of the Andean stepped snake (q'enqo / greca
   * stepped-fret family, from Sacred Valley textile borders): each unit
   * is ONE continuous square-wave stroke that starts at the bottom and
   * goes up, down, up, down; the next unit repeats it mirrored
   * VERTICALLY in the alternate color — ink snake, then gold snake — on
   * a clay field between bold ink rails. Adapted to the design tokens:
   * the SVG fills use var(--color-*) directly, so the band follows the
   * palette. Static by design (an earlier infinite-drift marquee was
   * removed per user direction).
   *
   * Navbar takeover: the band is dark, so while it sits under the sticky
   * header it claims its slice of the header strip (full width) through
   * publishNavRegion — the layout composes it with the hero clip and any
   * other claimant (e.g. the offerings image handing over directly above).
   *
   * Purely decorative: aria-hidden, no layout role beyond its height.
   */
  import { onMount } from 'svelte';
  import { bindSectionScroll, publishNavRegion, HEADER_H } from '$lib/scrollDriver';

  /** Unique per instance — pattern ids resolve document-wide and the nav
   * region registry is keyed per claimant. `$props.id()` (not Math.random)
   * because the id is SSR-stable: the server writes it into <pattern id>
   * and the client re-renders the matching url(#…). A random id desyncs
   * across hydration and the band silently stops painting. */
  const instanceId = $props.id();
  const uid = `snake-${instanceId}`;

  let dividerEl: HTMLElement;

  onMount(() => {
    const unbind = bindSectionScroll(dividerEl, ({ topY, height }) => {
      const top = Math.max(0, topY);
      const bottom = Math.min(HEADER_H, topY + height);
      publishNavRegion(
        uid,
        bottom - top < 1
          ? null
          : { top: Math.round(top), bottom: Math.round(bottom), width: 'full' }
      );
    });
    return () => {
      publishNavRegion(uid, null);
      unbind();
    };
  });
</script>

<div class="pattern-divider" aria-hidden="true" bind:this={dividerEl}>
  <svg class="pattern-track" height="32" role="presentation" focusable="false">
    <defs>
      <!-- One seamless 112×32 tile of the stepped snake (q'enqo / greca
           family). Each unit is ONE continuous square-wave stroke, 5px
           thick on a low 20px field with wide 13px steps: it starts at
           the BOTTOM, goes up, down, up, and down again — four verticals
           joined alternately by top/bottom connectors. The next unit
           repeats it MIRRORED VERTICALLY (starts at the top), in the
           alternate color — ink snake, then gold snake, on the clay
           field — with a 12px rest between units. -->
      <pattern id={uid} width="112" height="32" patternUnits="userSpaceOnUse">
        <rect width="112" height="32" fill="var(--color-clay)" />
        <!-- ink unit: bottom-start · up · down · up · down -->
        <g fill="var(--color-ink)" transform="translate(6 6)">
          <rect x="0" y="0" width="5" height="20" />
          <rect x="5" y="0" width="8" height="5" />
          <rect x="13" y="0" width="5" height="20" />
          <rect x="18" y="15" width="8" height="5" />
          <rect x="26" y="0" width="5" height="20" />
          <rect x="31" y="0" width="8" height="5" />
          <rect x="39" y="0" width="5" height="20" />
        </g>
        <!-- gold unit: same stroke mirrored vertically (top-start) -->
        <g fill="var(--color-gold)" transform="translate(62 6)">
          <rect x="0" y="0" width="5" height="20" />
          <rect x="5" y="15" width="8" height="5" />
          <rect x="13" y="0" width="5" height="20" />
          <rect x="18" y="0" width="8" height="5" />
          <rect x="26" y="0" width="5" height="20" />
          <rect x="31" y="15" width="8" height="5" />
          <rect x="39" y="0" width="5" height="20" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="32" fill="url(#{uid})" />
  </svg>
</div>

<style>
  .pattern-divider {
    overflow: hidden;
    line-height: 0;
    border-top: 4px solid var(--color-ink);
    border-bottom: 4px solid var(--color-ink);
    background: var(--color-clay);
  }

  .pattern-track {
    width: 100%;
    display: block;
  }
</style>
