# ADR 0001: Single SvelteKit App Wrapped by Tauri 2

**Status:** Accepted · **Date:** 2026-06-26

## Context

Ayni is a community-scale project with one team, one server, and eight product surfaces that share the same auth, data layer, and theme.

## Decision

One SvelteKit application wrapped by Tauri 2. All eight surfaces are SvelteKit route groups within one app. Same code ships to web, desktop, iOS, Android.

## Alternatives considered

- **Electron** — mature, Chromium-based. Rejected: bundles ~96 MB and 2× the RAM of Tauri for the same workload; pulls in Chromium twice (we already need a WebView on the OS).
- **Capacitor 8** — strong on mobile, web-first. Rejected: no first-class desktop story; would force a second toolchain for desktop surfaces.
- **Pure PWA** — zero install friction. Rejected: no native APIs needed today, but the planned mesh transport and local-Pi coordination (see [ADR 0002](./0002-sovereign-connectivity-tiers.md)) require host-side code that Web sandboxes cannot run.
- **Three native apps** — best per-platform fidelity. Rejected for an 8-surface, 1-team project; cost is linear in surfaces, not in team size.

## Consequences

- Mobile-first design is structural (one app), not policy
- One `package.json`, one build pipeline, one release
- Tauri 2 mobile is GA for Android and iOS — both are first-class targets

## Reversibility

Supersede this ADR if any of: (a) Tauri 2 mobile ships a regression that blocks a core surface, (b) Tauri's maintenance cadence visibly drops below Electron's for two consecutive quarters, or (c) a sovereign-tier requirement emerges that the WebView sandbox cannot satisfy even with Tauri plugins.

## Sources

- [Tauri 2.0 stable release notes (Oct 2024)](https://v2.tauri.app/blog/tauri-20/) — mobile GA, supported platforms
- [Tauri 2.9.6 (Dec 2025)](https://tech-insider.org/tauri-tutorial-cross-platform-rust-app-2026/) — bundle-size and RAM comparison vs Electron
- [Electron 42 release notes (2026)](https://www.electronjs.org/blog) — current Chromium/Node baseline used in the comparison
- [Capacitor 8 announcement (2025)](https://ionic.io/blog/announcing-capacitor-8) — current Capacitor baseline, desktop scope
- [SvelteKit docs](https://kit.svelte.dev/docs)

## Plan

[`docs/research/single-app-architecture/research.md`](../../docs/research/single-app-architecture/research.md)
