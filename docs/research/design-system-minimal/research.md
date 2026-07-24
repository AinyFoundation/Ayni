---
owns: []
slug: design-system-minimal
status: draft
created: 2026-07-01
last-updated: 2026-07-01
sources: 6
---

# Minimal Design System — Ayni Rainbow Conventions

The current `docs/design/website-design-system.md` is a 1600-line SvelteKit implementation spec with hardcoded earth-tone colors (clay/sage/gold). Ayni's identity is rainbow — seven wings, seven colors, full spectrum. This research defines minimal, framework-agnostic design conventions that centralize all visual decisions as CSS custom properties. No hardcoded values anywhere. An HTML visualization file serves as the living reference.

## Constraints carried forward

- **Local-first.** Design system must work offline. Self-hosted fonts, no external CDN dependencies for core tokens.
- **Sovereignty first.** No dependency on Figma, design tools, or external services to maintain the system.
- **Open-source only.** All tools/fonts/dependencies must be Apache 2.0 or compatible.
- **Framework-agnostic.** Tokens are CSS custom properties. Any framework (Svelte, React, vanilla) can consume them.
- **Rainbow identity.** Ayni is not one color. Seven wings = seven spectrum colors. The design system must accommodate multi-color branding without visual chaos.
- **Centralized.** Single source of truth. No hardcoded color, spacing, or typography values in component code.

## What the current system gets wrong

| Problem | Detail |
|---------|--------|
| **Wrong color identity** | Earth tones (clay/sage/gold) — not rainbow. Ayni is full spectrum. |
| **Bloated scope** | 1600 lines including Svelte components, service workers, PWA config. That's implementation, not conventions. |
| **No token layering** | Colors are flat CSS variables. No primitives → semantic → component hierarchy. |
| **Framework-coupled** | Svelte 5 runes, `$props()`, `import.meta.glob`. Other surfaces can't use it. |
| **Missing rainbow structure** | No guidance on how to use 7+ colors without visual competition. |

## Research findings

### 1. Token Architecture (Three-Tier Model)

The W3C Design Tokens Specification (2025.10 stable) and industry practice converge on three tiers:

| Tier | Purpose | Example |
|------|---------|---------|
| **Primitive** | Raw values — the palette | `--color-red-500: #ef4444` |
| **Semantic** | Purpose-driven aliases | `--color-action-primary: var(--color-red-500)` |
| **Component** | Scoped to UI elements | `--button-bg: var(--color-action-primary)` |

**Why this matters:** Components never reference primitives directly. When the brand changes, you update semantic tokens — every component follows. Dark mode, theming, and wing-specific palettes all work by reassigning semantic tokens.

**Cascade control via `@layer`:**

```css
@layer primitives, semantic, themes, components;
```

This gives explicit specificity order without fighting specificity wars.

### 2. Rainbow Color System

Research on rainbow/multi-color branding reveals critical constraints:

| Rule | Reasoning |
|------|-----------|
| **Don't use all colors equally** | Creates visual competition without hierarchy. Eye fatigue. |
| **Establish a dominant** | One color anchors the brand. Others accent. |
| **Warm-cool balance** | Rainbow palettes need intentional warm→cool transitions. |
| **Neutral base is essential** | 60-70% of surfaces should be neutral. Color is punctuation, not wallpaper. |
| **Accessibility: never rainbow-on-rainbow** | Text must be on neutral backgrounds. Color backgrounds are for large surfaces, cards, accents. |

**Ayni's approach:** Seven wing colors as the spectrum. Neutral base (warm gray/stone) for all text-heavy surfaces. Each wing gets its own color token that maps to semantic purpose when that wing's section is active.

### 3. HTML Living Style Guide Structure

A design system visualization page should have these sections (from living style guide research):

| Section | What it shows |
|---------|---------------|
| **Color Palette** | All primitive swatches with hex values, semantic mappings |
| **Typography** | Font specimens, type scale, weight variations |
| **Spacing** | Visual spacing scale with pixel equivalents |
| **Buttons** | All variants, sizes, states (hover, disabled, focus) |
| **Cards** | Container patterns with content examples |
| **Forms** | Input fields, labels, validation states |
| **Icons/Dividers** | Decorative elements |
| **Wing Colors** | The seven spectrum colors mapped to wings |

### 4. Minimal Token Set

Based on research, the minimum viable token set for Ayni:

**Primitives (raw values):**
- Colors: 7 spectrum hues × 10 shades each (50-950) + neutrals (50-950)
- Spacing: 4px base unit, scale from 0 to 128px
- Typography: 2 font families, modular scale (1.25 ratio)
- Border radius: 4 values (none, sm, md, lg, full)
- Shadows: 4 levels (none, sm, md, lg)
- Motion: 4 durations + 3 easing curves

**Semantic (purpose aliases):**
- Surface: primary, secondary, tertiary, inverse
- Text: primary, secondary, muted, inverse, accent
- Border: subtle, strong, focus
- Action: primary, primary-hover, secondary, secondary-hover
- Wing: one per wing (chakra-pata, yachay-wasi, etc.)

**Component tokens:**
- Only when a component needs to deviate from semantic defaults
- Button padding, card radius, input border — all reference semantic tokens

## Recommendation

### Restructure `docs/design/website-design-system.md`

Replace the 1600-line implementation spec with a focused conventions document (~200 lines):

1. **Design principles** (5 bullets — keep the good parts: reciprocal, layered, earthed, precise, living)
2. **Token architecture** (three-tier model, file structure)
3. **Color system** (rainbow spectrum + neutrals + semantic mappings)
4. **Typography** (2 fonts, scale, usage rules)
5. **Spacing** (scale + semantic aliases)
6. **Motion** (durations + easing)
7. **Component guidelines** (naming, composition, token-only styling)
8. **Accessibility** (contrast rules, focus, reduced motion)

### Create `design-system.html`

A single HTML file that:
- Imports the token CSS
- Displays every token visually (color swatches, type specimens, spacing blocks)
- Shows component examples (buttons, cards, forms)
- Is framework-agnostic — pure HTML/CSS, no build step
- Serves as the living reference for all surfaces

### Token file structure

```
design/
├── tokens.css          # Import orchestration with @layer
├── primitives/
│   ├── colors.css      # Raw spectrum + neutrals
│   ├── spacing.css     # 4px base scale
│   ├── typography.css  # Font stacks + scale
│   ├── borders.css     # Radius + shadows
│   └── motion.css      # Durations + easing
├── semantic/
│   ├── colors.css      # Surface, text, border, action, wing aliases
│   ├── spacing.css     # Semantic spacing (gap, pad, section)
│   └── typography.css  # Display, body, caption aliases
└── themes/
    ├── light.css       # Light mode semantic mappings
    └── dark.css        # Dark mode semantic mappings
```

## Open questions

1. **Wing color assignment.** Which spectrum hue maps to which wing? This is a design decision, not a research question. The seven colors need to be chosen and assigned.
2. **Font selection.** The current system uses Cormorant Garamond (display) + Inter (body). These are good choices but need confirmation — the rainbow identity may want a different display font personality.
3. **Dark mode priority.** Is dark mode a Day 1 requirement or a Phase 2 feature? The token architecture supports it either way, but it affects the initial HTML visualization.

## Sources

### Code

- `docs/design/website-design-system.md` — current design system (1615 lines) — 2026-07-01 — the bloated system being replaced.

### Web

- `https://socialanimal.dev/blog/vanilla-css-design-tokens-without-tailwind-2026/` — Vanilla CSS Design Tokens Without Tailwind — 2026-07-01 — primary source for three-tier token architecture and `@layer` cascade control.
- `https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/` — W3C Design Tokens Specification first stable version — 2026-07-01 — confirms three-tier model as industry standard.
- `https://www.designyourway.net/blog/rainbow-color-palettes/` — Rainbow Color Palettes for Joyful Designs — 2026-07-01 — rainbow palette structure, accessibility rules, warm-cool balance.
- `https://handoff.design/design-handoff/living-style-guide.html` — Creating a Living Style Guide — 2026-07-01 — HTML visualization structure and key elements.
- `https://playground.halfaccessible.com/blog/building-a-design-system-colors-cards-components` — Building a Design System guide — 2026-07-01 — design system checklist and component patterns.
- `https://www.realtimecolors.com/` — Realtime Colors tool — 2026-07-01 — guidance: 3-6 colors max across a platform, more creates complications.

## Decisions and revisions

- **2026-07-01** — Initial research. Identified current system as bloated (1600 lines, wrong colors, framework-coupled). Recommended three-tier token architecture, rainbow color system, HTML visualization file, and minimal conventions document.
