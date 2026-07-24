---
owns: []
status: reference
---

# AyniDB — Theoretical Exploration

> **Disposition:** Reference documentation. Option 4 of [`backend-stack/research.md`](../backend-stack/research.md). No current funding, no team, no decision — exists so the option is on the table when conditions change. See the Decision section for the three triggers that would justify reactivating it.
>
> **Flexibility** — Option 4 of [`backend-stack/research.md`](../backend-stack/research.md). Update that file when the option-set changes; this document is a supporting reference, not a parallel source of truth.
>
> **Living document.** This plan is exploratory. Everything here can change as research, constraints, and decisions evolve. Flexibility is preserved on purpose. If AyniDB is ever built, treat this as a starting point to be questioned, not a spec to be followed.

---

## Premise

Every backend option currently under evaluation in [`backend-stack/research.md`](../backend-stack/research.md) forces a tradeoff at Tier 3 (mesh between isolated LANs with no server), at E2EE, or at maturity. AyniDB would be the tier-aware local-first store that owns none of those tradeoffs — by composing proven primitives, not reinventing them.

**Repo boundary:** AyniDB ships in its own repository (`aynidb/`). The SvelteKit Collective app consumes AyniDB exclusively via the published TS SDK (`@aynidb/client`) — never via workspace link or shared package. Repo topology rules live in [`single-app-architecture/research.md`](../single-app-architecture/research.md) § "Repo topology" / "When to reconsider monorepo."

---

## Thesis

**Compose proven primitives (SQLite + cr-sqlite + Reticulum + libsodium + a CRDT text engine). Build the layer that owns what no one else has shipped: the tier-aware sync protocol that survives every failure mode from Tier 1 to Tier 4, with native E2EE and native LoRa transport.**

The unique IP is the tier-aware protocol, the E2EE integration, and the LoRa adapter. Everything else is composed from battle-tested primitives.

---

## What we don't build (the anti-tarpit)

| Don't build | Compose instead |
|------------|-----------------|
| Storage engine from scratch (Turso is still years-in-beta on partial Rust rewrite) | SQLite |
| CRDT implementation from scratch | cr-sqlite + Automerge/Yjs |
| Mesh transport from scratch | Reticulum |
| Crypto from scratch | libsodium |

What we build: tier-aware sync, E2EE integration, LoRa adapter, reactive query layer, cron, SDKs.

---

## Architecture (Rust core)

```
┌──────────────────────────────────────────────────────────────┐
│ Public API (Rust binary + UniFFI FFI)                        │
├──────────────────────────────────────────────────────────────┤
│ • Tier-aware sync protocol        ← THE IP                   │
│ • Reactive query engine over SQLite                         │
│ • Cron job scheduler                                           │
│ • E2EE integration layer (schema-aware)                      │
│ • Pluggable transports: HTTPS / Reticulum / BLE / WS         │
├──────────────────────────────────────────────────────────────┤
│ Composed primitives (proven, Apache 2.0 / MIT)               │
│ • SQLite (storage)                                            │
│ • cr-sqlite (CRDT merge for Tier 3)                          │
│ • Automerge 3 / Yjs (collaborative documents)                │
│ • Reticulum (Tier 3 mesh)                                     │
│ • libsodium (encryption)                                      │
├──────────────────────────────────────────────────────────────┤
│ SDKs                                                           │
│ • TypeScript (SvelteKit-friendly)                            │
│ • Swift (iOS) via UniFFI                                      │
│ • Kotlin (Android) via UniFFI                                 │
└──────────────────────────────────────────────────────────────┘
```

**Why Rust:** correctness, no GC pauses, single static binary for Pi deployment, UniFFI for Swift/Kotlin.

---

## What ships (v0.1)

| Component | What it does |
|-----------|--------------|
| **Tier-aware router** | Detects Tier 1/2/3/4. Picks transport per write. Queues when offline. Flushes on reconnect. |
| **Sync protocol** | Message format, ordering, delivery. Sits on cr-sqlite for CRDT correctness. |
| **E2EE layer** | Schema-aware encryption via libsodium. Per-row keys derived via HKDF from user DID key. |
| **Reticulum adapter** | Wraps sync messages in Reticulum packets for Tier 3. |
| **Reactive query layer** | Subscriptions over local SQLite. **The hardest part.** Invalidation triggered by cr-sqlite change-sets. |
| **Cron scheduler** | Persistent jobs stored in SQLite. Restart-survival. |
| **Reference server binary** | Pi-side daemon. Tier-aware sync node + HTTP API. |
| **TS / Swift / Kotlin SDKs** | SvelteKit + iOS + Android via UniFFI. |
| **NixOS modules** | Per-node-type deployments. Same Colmena + sops-nix stack as the rest of the project. |

Specific tools chosen per component (e.g., which Rust SQLite binding, which cron crate) is deferred to implementation start.

---

## Out of scope (for v0.1)

- **Buckets / object storage** — MinIO (Apache 2.0) on the same Pi nodes. AyniDB holds metadata + encrypted pointers; MinIO holds bytes. E2EE at bucket layer via libsodium.
- **Auth** — BetterAuth handles identity. AyniDB has session-level access control only.
- **Automatic operations / self-cleaning** — AyniDB exposes cron + vacuum + log rotation as operations. App schedules policy. Right boundary: policy in the app, mechanics in the DB.
- **Multi-region replication beyond mesh** — tier-aware router is the natural future home.

---

## Business thesis

**Position:** "The database that survives the failure of everything else." Not a Convex competitor.

**Market:** No existing product serves the scenario where internet is permanently down for weeks and the server is on solar power. That market includes:

- NGOs and humanitarian orgs in conflict / disaster zones
- Research stations (Antarctic, deep ocean, jungle)
- Rural healthcare and education
- Off-grid communities, indigenous sovereignty projects
- Defense and tactical edge, journalists in hostile regions

**Revenue model — services + hardware + support, not SaaS:**

| Stream | Realistic price |
|--------|----------------|
| Managed deployment | $200-2000/mo per community |
| Implementation consulting | $5-50k per deployment |
| Hardware kits (pre-flashed Pi + batteries + LoRa + AyniDB) | $500-2000 per kit |
| Training | $500-2000 per person |
| Enterprise tier | $10-100k/year |

**Open-source posture:** Apache 2.0. The product is the services, hardware, and expertise around AyniDB. The code is the trust mechanism that makes the services credible.

---

## Cost reality

| Outcome | Realistic at $1M? |
|---------|-------------------|
| AyniDB v0.1 in Rust powering the Ayni Collective, Apache 2.0 | **Yes** — 12-18 months, 3-5 senior Rust engineers in mixed-cost geography |
| General-purpose Convex competitor | **No** — not at $1M, not in 2 years |
| Niche win in "sovereign infrastructure" | **Yes** — this is the actual thesis |

Team cost benchmarks (2026): Latin America (Perú) senior Rust $80-150k fully loaded · Eastern Europe $100-180k · US/EU $250-350k.

What $1M does NOT buy: a from-scratch storage engine, custom CRDT, custom mesh protocol. Any of those would consume the entire budget and ship nothing usable.

---

## Decision

**None right now.** The active backend decision is between Options 1-3 in [`backend-stack/research.md`](../backend-stack/research.md). AyniDB has no current funding, no team, no decision.

When to revisit:

1. Ayni Collective is funded with the resources to build AyniDB.
2. The three existing options all prove inadequate to a real-world deployment failure.
3. The sovereign-infrastructure market signal is strong enough to justify the build.

Until then, the Ayni project uses one of the existing options.

---

## Related

- [ADR 0002: Sovereign Connectivity Tiers](../../docs/adr/0002-sovereign-connectivity-tiers.md) — the tier contract AyniDB would natively satisfy
- [`backend-stack/research.md`](../backend-stack/research.md) — the active decision space
- [`sovereign-connectivity-tiers/research.md`](../sovereign-connectivity-tiers/research.md) — the Outage Narrative AyniDB would make natively survivable
---

## Decisions and revisions

- **2026-06-27** — Initial v1 draft. Thesis: compose primitives (SQLite + cr-sqlite + Reticulum + libsodium), build the tier-aware protocol layer that no one else has shipped.
- **2026-06-27** — v2 added: explicit Reticulum-rs (no `rnsd` subprocess), Automerge default, `tokio-cron-scheduler`, E2EE field policy resolved (schema-declared), team cost benchmarks by region, FOSDEM 2026 citation.
- **2026-06-27** — Promoted from `plans/to-do/aynidb-exploration/` to `docs/plans/aynidb-exploration/`. Status changed from `draft` to `reference` (no current funding, no team, no decision).
- **2026-06-28** — Migration to single-file discipline. v1.md + v2.md + research.md consolidated into this single `plan.md`. Audit trail preserved inline.
