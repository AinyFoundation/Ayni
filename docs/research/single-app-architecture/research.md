---
owns:
  - src-tauri/**
  - src/routes/**
  - src/app.html
  - svelte.config.js
  - vite.config.*
  - package.json
  - tsconfig.json
  - .github/workflows/docs-suggest.yml
  - .github/workflows/oss-gate.yml
status: active
---

# Single-App Architecture

> **Flexibility** — this plan owns the app shell (SvelteKit + Tauri 2), mobile-first design rules, and the tier-aware data abstraction interface. The concrete sync library chosen for each tier defers to [`backend-stack/research.md`](../backend-stack/research.md).
>
> **Living document.** This plan is exploratory and will change as research, constraints, and decisions evolve. Flexibility is preserved on purpose. For the current backend decision, see [`backend-stack/research.md`](../backend-stack/research.md). For other in-flight decisions, follow cross-links rather than re-deriving.

## Decision

One SvelteKit app wrapped by Tauri 2. All surfaces are SvelteKit route groups within one app. Same code ships to web, desktop (Win/macOS/Linux), iOS, Android.

## Why

- Mobile-first design is structural (one app), not policy
- One `package.json`, one build pipeline, one release
- Tauri mobile bundle is ~10MB
- Same auth, same data abstraction, same theme across all surfaces
- One tier-detection module decides which transport each write uses at runtime

## Repo topology

The "single app" decision above is scoped to the **8 Ayni Collective surfaces**. It does **not** commit Ayni to a single repo across the product line.

**The repo topology rule:** one repo per product. Inside Ayni Collective: one SvelteKit app with route groups. Cross-product sharing happens via published SDKs — never via monorepo workspace links.

| Repo | Language | Status |
|------|----------|--------|
| `ayni-collective/` | SvelteKit + Tauri 2 (TS) | Active (this repo) |
| `aynidb/` | Rust + UniFFI | Reference (see [`aynidb-exploration/research.md`](../aynidb-exploration/research.md)) |
| `aynidb-{ts,swift,kotlin}-sdk/` | TS / Swift / Kotlin | Generated, published from `aynidb/` |
| `ayni-<surface>-standalone/` (forum, energy, ...) | SvelteKit | Reserved — only created when a route group graduates to a standalone product |

Atomic cross-product refactors happen through codegen + versioned SDKs: AyniDB changes a query API → regenerates `@aynidb/client@0.4.0` → Collective app bumps the dependency → fixes call sites in one PR. This is the pattern Supabase, Stripe, Linear, Vercel, and Cloudflare all use.

## When to reconsider monorepo

The default "one repo per product" holds until **all four** trigger conditions are met simultaneously. Any one being false means monorepo is premature. Do not adopt monorepo against the trend of the triggers — wait for evidence, not vibes.

| # | Trigger | Observable | Threshold | Today |
|---|---------|------------|-----------|-------|
| 1 | Multiple shipped products in similar languages | Count of products with active releases sharing > 20% of the dependency manifest (excluding standard tooling like TypeScript, prettier, eslint) | ≥ 3 | **1** (Ayni Collective only; AyniDB is reference) |
| 2 | Platform team exists to own the monorepo | Org has ≥ 1 FTE whose primary responsibility is monorepo tooling, not product code | ≥ 1 FTE | **0** (1-team project, no platform role) |
| 3 | Frequent atomic cross-product refactors | Merged PRs in the last 90 days that intentionally touch ≥ 2 product repos to keep them in lockstep | ≥ 1/week sustained over a quarter | **0** (only one product) |
| 4 | Selective CI savings exceed tooling maintenance cost | CI minutes saved/week via monorepo caching vs. monorepo-tooling eng-hours/week × loaded rate | Savings ≥ tooling cost over a quarter | **n/a** (no CI yet; project is pre-scaffold) |

**Each trigger explained:**

**Trigger 1 — multiple products in similar languages.** Monorepo tools (turborepo, nx, bazel) only pay off when there is substantial shared TS/JS surface to coordinate. A monorepo with one Rust crate and one TS app is a tarpit — neither toolchain wins. "Similar languages" means a shared primary build system: TS-only, Rust-only, or TS + Rust with both integrated into one task graph. Mixed TS + Rust + Swift in equal measure does not qualify.

**Trigger 2 — platform team ownership.** Monorepo tooling ages poorly without active maintenance — nx versions break, turborepo task graphs rot, bazel rules lag, dependency upgrades need graph-wide reasoning. Without an owner, the toolchain becomes a liability. If you cannot name a person whose job is the monorepo itself, do not adopt one.

**Trigger 3 — frequent atomic cross-product refactors.** This is the single biggest pain monorepo solves: "I changed API X, now I must bump version in 4 repos and wait for downstream PRs in series." If you do not feel that pain at least weekly over a quarter, monorepo buys you nothing. SDK version pins + codegen handle monthly or rarer refactors fine.

**Trigger 4 — selective CI savings.** Monorepo's headline win is "don't rebuild what didn't change." If your PR pipelines already finish in < 10 minutes for changed-only paths via path filters + remote cache, monorepo adds no value. If a monorepo would save > 50% CI compute but cost 0.5 FTE to maintain, that is a net loss for a small team. Measure both sides.

### Anti-triggers (do NOT monorepo even if all four fire)

These override the triggers — if any are true, monorepo is wrong regardless:

- **Mixed primary languages with no unified build system.** TS + Rust + Swift in equal measure. Monorepo tooling for this combo is immature (Cargo workspaces and pnpm workspaces coexist awkwardly; no shared task graph; SDKs end up being the only sane boundary).
- **Different release cadences are a feature, not a bug.** Example: a security-critical database must never bundle a marketing-website update. Monorepo forces atomic releases that defeat this separation.
- **Different license posture across products.** Example: one Apache 2.0, one AGPL, one source-available. Monorepo blurs license boundaries in ways that legal teams reliably flag.
- **Cross-cutting auth or identity boundary.** Example: one product uses BetterAuth + Veramo, another uses a different auth stack. Monorepo encourages drift; pin via SDK instead.

### Re-evaluation cadence

Every 6 months, walk through the four triggers. If any flipped to true, raise it for discussion — do not auto-monorepo. If all four are true and no anti-trigger applies, write a proposal (new ADR or amendment to this plan) and migrate incrementally:

1. Extract one shared package from `src/lib/shared/` into a workspace.
2. Import it from the Collective app via workspace link.
3. Run for a quarter. Measure: build time delta, PR coordination friction delta, on-call burden delta.
4. If the metrics support it, expand. If not, revert and document why.

### How to overturn this rule

This is a load-bearing principle, not absolute. To reverse it:

1. Produce concrete evidence that all four triggers are met (numbers, not vibes — link to CI dashboards, PR statistics, org chart).
2. Confirm no anti-trigger applies.
3. Write a new ADR superseding the topology portion of this plan. ADR 0001's "single app + Tauri 2" decision stays in scope; only the cross-product repo boundary is reconsidered.
4. Migrate incrementally (per the steps above).

Until all four triggers fire: ship repos, pin SDK versions, codegen what would be shared types.

## Constraints

**Hard:**
- Single SvelteKit app. Route groups for surface boundaries.
- Single `package.json`. No workspaces.
- Tauri 2 wraps the app for desktop + mobile.
- Mobile-first: 360×640 minimum viewport, touch targets ≥ 44×44 px, no hover-only interactions.
- Apache-2.0 or compatible license for all dependencies.
- All four connectivity tiers (per [ADR 0002](../../docs/adr/0002-sovereign-connectivity-tiers.md)) must work from the same app shell.

**Soft:**
- Svelte 5 Runes for state
- Feature-Sliced Design adapted for SvelteKit
- The chosen backend client lives in `src/lib/<chosen-stack>/`. The data abstraction in `src/lib/data/` is the only API the rest of the app uses.

## Mobile-first rules

| Rule | Implementation |
|------|----------------|
| Touch targets ≥ 44×44 px | Component-level vitest assertion |
| No hover-only interactions | All actions have visible tap targets |
| Min viewport 360×640 | Layout uses `min()` / `clamp()` |
| Bottom navigation (not top) | `<BottomNav />` is primary nav |
| No `position: fixed` on iOS Safari | Use sticky + safe-area-inset |
| Offline-first | Per chosen path in [`backend-stack/research.md`](../backend-stack/research.md) |
| Tier-aware | Tier detection module chooses transport per write |
| Test on iOS WKWebView + Android WebView | Both before declaring mobile-ready |

## File map

```
ayni-collective/
├── src/
│   ├── routes/
│   │   ├── (web)/         # Public-facing website
│   │   ├── (forum)/       # Community forum
│   │   ├── (lms)/         # Learning management
│   │   ├── (tokens)/      # Token economy
│   │   ├── (energy)/      # Energy dashboard
│   │   ├── (game)/        # Game bridge
│   │   ├── (booking)/     # Retreat booking
│   │   └── (pwa)/         # Local-first PWA surface
│   └── lib/
│       ├── data/          # Tier-aware data abstraction (only API the app calls)
│       ├── tier-detect/   # Connectivity tier detection
│       ├── auth/          # BetterAuth + Veramo + did:webvh bridge
│       ├── secrets/       # sops-nix bootstrap + secrets handling
│       ├── event-bus/     # Internal pub/sub
│       ├── ui/            # Shared components (mobile-first)
│       ├── domain/        # Domain logic per surface
│       ├── backend/       # Chosen backend client (per backend-stack/research.md)
│       │   ├── online/    # Tier 1-2 reactive client
│       │   ├── mesh/      # Tier 3 change-set emitter
│       │   └── device/    # Tier 4 local reactive client
│       └── tauri/         # Tauri plugin wrappers
├── src-tauri/             # Tauri shell (Rust, < 500 LOC expected)
├── static/
├── tests/                 # Vitest
├── e2e/                   # Playwright
└── ...
```

The exact `src/lib/<backend>/` folder is decided when [`backend-stack/research.md`](../backend-stack/research.md) chooses an option. The data abstraction contract is fixed.

## Tauri plugin inventory

| Capability | Plugin |
|------------|--------|
| Push notifications (Tier 1 only) | `@tauri-apps/plugin-notification` |
| Biometric auth | `@tauri-apps/plugin-biometric` |
| File system | `@tauri-apps/plugin-fs` |
| Camera | `@tauri-apps/plugin-camera` |
| Haptics | `@tauri-apps/plugin-haptics` |
| App lifecycle | `@tauri-apps/plugin-app` |
| OS info | `@tauri-apps/plugin-os` |
| Tier 3 mesh transport (per chosen backend) | custom Tauri command or native plugin |

## Data abstraction (the contract)

App code never calls the backend library directly. It calls `src/lib/data/`:

```typescript
// src/lib/data/index.ts (interface; concrete impl per chosen backend)
export async function write<T>(table: string, value: T): Promise<void> {
  const tier = await detectTier();
  switch (tier) {
    case 1:
    case 2:
      return onlineClient.write(table, value);
    case 3:
      return meshClient.queueChangeSet(table, value);
    case 4:
      return localClient.insert(table, value);
  }
}
```

Reads use the same abstraction via `subscribe()` returning an `Observable`. The [Outage Narrative](../sovereign-connectivity-tiers/research.md) is the canonical test for this abstraction.

## Auth integration

BetterAuth session cookie handles Tiers 1 and 2. Verifiable Presentation + cached DID document handles Tiers 3 and 4. See [`self-sovereign-identity/research.md`](../self-sovereign-identity/research.md) for the full design.

## Implementation order

1. `npx sv create . --template minimal --types ts`
2. `pnpm install --save-dev @tauri-apps/cli && pnpm tauri init`
3. `pnpm tauri ios init && pnpm tauri android init`
4. Install the chosen backend's client library (per [`backend-stack/research.md`](../backend-stack/research.md))
5. Build the tier detection module and data abstraction
6. Build the Tier 3 and Tier 4 adapters for the chosen backend
7. Implement mobile-first design system
8. Build `(web)` route group first
9. Verify on Android emulator before adding more surfaces
10. Verify on iOS simulator before declaring v1 mobile-ready

## Open questions

1. Should the web build also work as a pure PWA (installable in browser, no Tauri required)?
2. Reticulum on mobile: phone-as-relay requires a connected LoRa peripheral. Confirm hardware path.

## Related

- [ADR 0001: Single App + Tauri 2](../../docs/adr/0001-single-app-tauri.md)
- [ADR 0002: Sovereign Connectivity Tiers](../../docs/adr/0002-sovereign-connectivity-tiers.md)
- [`backend-stack/research.md`](../backend-stack/research.md)
- [`sovereign-connectivity-tiers/research.md`](../sovereign-connectivity-tiers/research.md)
- [`self-sovereign-identity/research.md`](../self-sovereign-identity/research.md)
- [`mesh-network/research.md`](../mesh-network/research.md)