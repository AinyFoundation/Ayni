<script lang="ts">
  /**
   * IconLink — an anchor wrapping one hand-drawn glyph.
   *
   * Extracted after the third independent hand-roll of this exact markup
   * (hero corner, footer, now the offerings action row) — see `social.ts`'s
   * header comment for why path data carries no stroke settings: each
   * consumer supplies its own `<svg>` wrapper so every glyph is guaranteed
   * the same weight. This component IS that wrapper, shared.
   *
   * Deliberately un-opinionated about layout and hover — callers pass their
   * own `class` (`.social-link`, `.social-chip`, a future `.action-link`)
   * for sizing/position/hover, exactly as the two pre-existing consumers
   * already styled themselves independently. `target`/`rel` are plain
   * pass-through props rather than an `external` default, so refactoring the
   * two existing consumers onto this component changes no behaviour.
   */
  let {
    href,
    label,
    path,
    class: className = '',
    target,
    rel
  }: {
    href: string;
    label: string;
    path: string;
    class?: string;
    target?: string;
    rel?: string;
  } = $props();
</script>

<a {href} class={className} aria-label={label} {target} {rel}>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {@html path}
  </svg>
</a>
