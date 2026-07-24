# ADR 0002: Sovereign Connectivity Tiers

**Status:** Accepted · **Date:** 2026-06-27

## Context

Ayni must survive the Sacred Valley rainy season, solar brownouts, and — in the extreme — a total global internet outage. Users physically present in the mesh must remain able to coordinate locally even when no external connectivity exists, and must seamlessly reconnect when it returns.

This is not an offline feature. It is the primary architectural constraint that determines every other technical decision in the stack.

## The Four Tiers

The system explicitly degrades through four tiers. Each is a fully supported mode, not a failure state.

### Tier 1 — Global Internet Up
Users everywhere. HTTPS + WebSockets + APNs/FCM. Device → chosen sync layer → central Pi → other devices. Identical to any modern SaaS. (Specific implementation per [`backend-stack/research.md`](../../docs/research/backend-stack/research.md).)

### Tier 2 — Global Internet Down, Local LAN Up
Users physically in the Sacred Valley within WiFi range of a community-center Pi node. Local WiFi / Ethernet only. Device → chosen sync layer → local Pi → other LAN devices. Real-time collaboration still works inside the building.

### Tier 3 — Local LAN Down, Mesh Up
Users within Reticulum/LoRa range of a hilltop relay or another mesh participant. Reticulum/LoRa/WiFi Direct/Bluetooth. Device → local SQLite → change-set over mesh → relay → other devices. ~50 kbps. Async, not real-time. No push notifications. (Specific implementation per [`backend-stack/research.md`](../../docs/research/backend-stack/research.md) — CRDT merge mechanism is chosen per path.)

### Tier 4 — Total Isolation
Device only. No network. Local SQLite. UI fully reactive against local data. Drafts queue locally and sync on reconnection.

## Decision

1. The system **must** explicitly recognize and document all four tiers.
2. Tier transitions **must** be automatic and invisible to the user. No "online mode" toggle.
3. No data may be lost across tier transitions. Whichever CRDT/sync engine is selected (per [`backend-stack/research.md`](../../docs/research/backend-stack/research.md)) **MUST** guarantee convergent merge regardless of which tiers were active when changes were made. This is a constraint on the engine choice, not a claim about the engine already chosen.
4. Push notifications are Tier 1 only. This is a documented constraint, communicated honestly to users.
5. Tier 3 discovery is physical. You must be physically near a relay or another user. This is a feature, not a bug.

## Consequences

- Every technical decision is justified by which tier it serves.
- Tier 3 UX differs visibly from Tier 1. Onboarding must teach this honestly.
- Features requiring Tier 1 (live video with outsiders, global search, push) are explicitly out of scope as core functionality.
- The "Alice in the café → Bob sees it instantly → Chris gets it 2km away via LoRa → everything reconciles when power returns" scenario becomes the canonical reference test for all future architectural changes.

## Supersedes

- [`docs/research/backend-stack/research.md`](../../docs/research/backend-stack/research.md) — its ratification of Convex violated Tier 3 (no true P2P).
- [`docs/research/mesh-network/research.md`](../../docs/research/mesh-network/research.md) — defined transport, not the UX contract.

## Sources

- Research session 2026-06-27 (Zero, cr-sqlite, Automerge, InstantDB, RxDB, Ditto evaluation)
- [`docs/research/backend-stack/research.md`](../../docs/research/backend-stack/research.md) — current three-path evaluation (Rule 3 is a constraint on its outcome)
- [`docs/research/aynidb-exploration/research.md`](../../docs/research/aynidb-exploration/research.md) — theoretical in-house alternative
- [localfirst.foundation](https://localfirst.foundation)
- [CRDT & local-first engines in 2026 — Yjs, Automerge 3, Loro, Replicache, Zero, Liveblocks](https://www.youngju.dev/blog/culture/2026-05-15-crdt-local-first-engines-2026-yjs-automerge-loro-replicache-liveblocks-deep-dive.en) (May 2026) — production readiness of the engines named in Rule 3
- [Local-first software landscape — what's actually shipping in 2026](https://emne.com/e/curator/the-local-first-software-landscape-whats-actually-shipping-in-2026/) — corroborating snapshot of Yjs/Automerge maturity

## Plan

[`docs/research/sovereign-connectivity-tiers/research.md`](../../docs/research/sovereign-connectivity-tiers/research.md)
