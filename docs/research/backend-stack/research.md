---
owns: []
status: chosen
---

# Backend Stack

> **Decision (2026-07-02):** Option 5 — **Yjs (CRDT) + Hyperswarm (P2P transport) + Tauri 2 (app shell)**. See [ADR 0004](../../docs/adr/0004-yjs-hyperswarm-tauri.md) for the binding contract. This file is now the canonical record; other plans stop deferring to it.

---

## Hard constraint

The chosen stack **must** satisfy the four [Sovereign Connectivity Tiers](../../docs/adr/0002-sovereign-connectivity-tiers.md) defined in ADR 0002. Tier 3 (mesh between isolated LANs with no server) is the discriminator — the options below differ mainly in how they handle it.

---

## Option format

Each option is documented in the same shape so they can be compared apples-to-apples:

- **What** — one-line summary of the technology and approach
- **Why** — rationale for inclusion as an option
- **Pros** — strengths, ideally with evidence
- **Cons** — weaknesses and risks, honestly stated
- **Difficulty** — Low / Medium / High / Research-grade, with what makes it hard
- **Best when** — concrete conditions where this option wins
- **Detail** — link to reference doc (if any)

---

## Option 1 — Jazz.tools

- **What:** All-in-one local-first framework. CoValues (encrypted CRDTs) for data, auth, sync, and collaboration. Native P2P via libp2p. Native E2EE.
- **Why:** Smallest stack. Most philosophically aligned with the project's sovereignty goals. If Jazz succeeds, the backend "just happens" — frontend code only.
- **Pros:**
  - Native E2EE — server never sees plaintext. The hybrid E2EE pattern is unnecessary.
  - Native P2P between phones via libp2p. Two isolated phones sync directly over LAN/WiFi Direct without a server.
  - Single dependency for reactivity + sync + auth + collaboration.
- **Cons:**
  - v2 is public alpha (single-vendor bet). No proven track record at scale yet.
  - LoRa transport requires a custom Reticulum adapter — not out-of-the-box.
- **Difficulty:** Low (write frontend, backend "just happens"). High risk if Jazz's roadmap stalls or if migration is needed.
- **Best when:** The team is willing to bet on a single alpha-stage vendor in exchange for the smallest possible stack and best sovereignty posture.
- **Detail:** [jazz.tools](https://jazz.tools/)

---

## Option 2 — LiveStore + cr-sqlite

- **What:** Event-sourced reactive SQLite (LiveStore) on the client. cr-sqlite (CRDT SQLite extension) on the Pi nodes. Reticulum over LoRa for Tier 3 mesh.
- **Why:** Own the data layer end-to-end with proven primitives. Tier 3 is native — no custom adapter needed. No vendor risk beyond SQLite itself.
- **Pros:**
  - Composable, rock-solid SQLite foundation. SQLite is 25+ years mature, public domain.
  - Mesh survival native via cr-sqlite change-sets over Reticulum.
  - No proprietary runtime. No single-vendor bet.
  - All primitives are Apache 2.0 or MIT.
- **Cons:**
  - You write the LiveStore ↔ cr-sqlite ↔ Reticulum sync glue (~2-4 weeks of engineering).
  - E2EE is a manual hybrid pattern: metadata plaintext so the server can route, sensitive content client-encrypted before leaving the device.
  - No native P2P between phones — sync goes through the Pi relay.
- **Difficulty:** Medium. More glue code than Options 1 or 3, but each piece is well-understood and the primitives are battle-tested.
- **Best when:** The team values no-vendor-lock-in and is willing to own a thin sync layer. Best fit when Tier 3 must be native to the data layer, not a bolt-on.
- **Detail:** [livestore.dev](https://livestore.dev/), [cr-sqlite](https://github.com/vlcn-io/cr-sqlite)

---

## Option 3 — Convex + Replicate

- **What:** Convex (self-hosted reactive backend) with the Replicate component (Apache 2.0, Trestle Inc) for local-first client sync via Yjs CRDTs.
- **Why:** Lowest risk on DX and maturity. Ships fastest. Production-grade Convex infrastructure plus a 2026-mature local-first layer.
- **Pros:**
  - Most mature DX in the category. Convex exabyte-scale infrastructure. Replicate ships with a working SvelteKit example.
  - 2026 Replicate component adds genuine local-first: Yjs CRDTs + client-side SQLite (OPFS on web, op-sqlite on RN) + offline writes with automatic rollback on server rejection.
  - Experimental WebAuthn PRF encryption for at-rest protection.
- **Cons:**
  - **Hub-and-spoke.** Two isolated phones cannot sync directly without Convex. Tier 3 requires a separate cr-sqlite layer as a bolt-on.
  - E2EE is experimental (WebAuthn PRF) plus the hybrid E2EE pattern for sensitive content. Server still sees CRDT deltas.
  - Two-vendor dependency (Convex + Replicate). Both maintained by small teams.
  - Less control over merge behavior — CRDT logic lives in Yjs, not in our schema.
- **Difficulty:** Low-medium. Core stack is mature; Tier 3 adapter is the only meaningful custom code.
- **Best when:** The team wants to ship fastest and values DX over sovereignty purity. Acceptable to add cr-sqlite as a separate Tier 3 layer rather than demand it be native.
- **Detail:** [convex.dev/sync](https://www.convex.dev/sync), [Replicate on GitHub](https://github.com/trestleinc/replicate)

---

## Option 4 — AyniDB (build our own)

- **What:** Compose proven primitives (SQLite + cr-sqlite + Reticulum-rs + libsodium-rs + Automerge/Yjs) and build the tier-aware sync protocol layer in Rust as an Apache 2.0 product. Optional standalone build; Ayni Collective would be the first deployment.
- **Why:** Fills the gap none of Options 1-3 fill: native Tier 3 + native E2EE + native LoRa + mature + open-source + owned by us. Real product thesis in a market (sovereign infrastructure for disconnected communities) none of the existing options serve.
- **Pros:**
  - Owns none of the tradeoffs of Options 1-3. Native Tier 3, native E2EE, native LoRa transport.
  - Apache 2.0. Self-funded via services + hardware + support model, not SaaS.
  - Tier-aware sync protocol is genuinely novel IP — no existing tool combines tier-awareness + native E2EE + native LoRa.
  - Deployment cost amortizes across many communities (managed deployments, hardware kits, training).
- **Cons:**
  - Requires $1M+ and 12-18 months of Rust engineering with no team currently committed.
  - Risk of building a "general-purpose database" tarpit. The plan explicitly avoids this by composing primitives rather than writing a storage engine from scratch.
  - No existing production deployments. The first deployment (Ayni Collective) carries all the validation risk.
- **Difficulty:** High. Build + maintain + support. Requires explicit decision to activate. Worth it only if a real customer signal or funding event triggers it.
- **Best when:** The project is funded with the resources to build it AND the three existing paths prove inadequate to a real-world deployment failure.
- **Detail:** [AyniDB exploration](../../docs/research/aynidb-exploration/research.md)

---

## Tier-by-tier comparison

| Tier | Opt 1: Jazz | Opt 2: LiveStore+cr-sqlite | Opt 3: Convex+Replicate | Opt 4: AyniDB | Opt 5: **Yjs+Hyperswarm** (chosen) |
|------|-------------|----------------------------|--------------------------|---------------|-----------------------------------|
| 1 (Internet) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 (LAN) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 (Mesh) | ⚠️ adapter | ✅ native | ⚠️ cr-sqlite layer | ✅ native | ⚠️ custom LoRa adapter |
| 4 (Device) | ✅ | ✅ | ✅ | ✅ | ✅ |

License check: Option 1 (Jazz) is dual-licensed / source-available, **not** Apache 2.0 or MIT. It fails the project's open-source rule and is rejected on license alone. Options 2, 3, 4, and 5 are all Apache 2.0 / MIT. Option 3 (Convex self-host) is alpha-stage but licensed permissively.

---

## Decision

**Option 5 — Yjs + Hyperswarm + Tauri 2.** See [ADR 0004](../../docs/adr/0004-yjs-hyperswarm-tauri.md).

### Why not Option 1 (Jazz)

Dual-licensed / source-available. Violates the project's "Apache 2.0 or compatible" rule. Otherwise the most philosophically aligned option (native E2EE, native P2P, smallest stack). Reconsider only if Jazz moves to Apache 2.0.

### Why not Option 2 (LiveStore + cr-sqlite)

2–4 weeks of custom sync glue. No native P2P between phones — sync always goes through a Pi relay. Strongest on Tier 3 (native via cr-sqlite change-sets over Reticulum) but the engineering tax is higher than Option 5.

### Why not Option 3 (Convex + Replicate)

Hub-and-spoke. Two isolated phones cannot sync without Convex reachable. Tier 3 requires cr-sqlite as a separate bolt-on layer. Best DX in the category, weakest sovereignty.

### Why not Option 4 (AyniDB)

Requires $1M+ and 12–18 months of Rust engineering with no team currently committed. The thesis is sound (native Tier 3 + native E2EE + native LoRa + owned IP) but execution risk dominates. Revisit if Option 5 fails in production.

### Why Option 5

- **Yjs CRDTs are transport-agnostic.** The same binary updates work over Hyperswarm (Tier 1/2), Meshtastic (Tier 3), and offline (Tier 4).
- **Hyperswarm eliminates the sync server.** DHT-based discovery, NAT-traversal, Noise encryption — no reachable host required for peers to find each other.
- **Meshtastic for Tier 3.** Battle-tested LoRa mesh (7.9k stars, GPL-3.0). Reticulum was an option but its custom license blocks future AI training on Ayni's codebase.
- **Tauri 2 stays (ADR 0001).** App shell is unchanged; this decision only affects the data and transport layers.

---

## Out-of-scope

- Storage binding specifics (`rusqlite` vs `libsql`) — decide at implementation start
- Per-surface CRDT engine (Yjs vs Automerge vs Loro) — **decided: Yjs** (see ADR 0004). Revisit per surface only if a specific editor's needs demand it.
- E2EE field-level policy details — defer to `self-sovereign-identity/research.md`
- Auth provider specifics (BetterAuth vs did:webvh) — defer to `self-sovereign-identity/research.md`

---

## Related

- [ADR 0004: Yjs + Hyperswarm + Tauri 2](../../docs/adr/0004-yjs-hyperswarm-tauri.md) — **binding contract**
- [ADR 0002: Sovereign Connectivity Tiers](../../docs/adr/0002-sovereign-connectivity-tiers.md)
- [ADR 0001: Single SvelteKit App Wrapped by Tauri 2](../../docs/adr/0001-single-app-tauri.md)
- [AyniDB exploration — Option 4 detail](../aynidb-exploration/research.md)
- [Sovereign Connectivity Tiers plan](../sovereign-connectivity-tiers/research.md)
