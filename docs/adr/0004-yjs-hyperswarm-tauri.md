# ADR 0004: Yjs + Hyperswarm + Tauri 2

**Status:** Accepted · **Date:** 2026-07-02

## Context

The backend stack decision was open in `docs/research/backend-stack/research.md` ("Decision status: None"). Four options were evaluated; none cleanly satisfied all four [Sovereign Connectivity Tiers](./0002-sovereign-connectivity-tiers.md). During research into [Pear Runtime](https://pears.com) (Holepunch), the underlying **Hyperswarm** P2P networking layer was identified as a transport option that combines with the existing Yjs CRDT choice into a new stack that was not in the original four.

## Decision

Four-layer architecture, each layer a separate concern:

| Layer | Choice | License | Role |
|---|---|---|---|
| **App shell** | Tauri 2 | Apache 2.0 / MIT | Per [ADR 0001](./0001-single-app-tauri.md). Unchanged. |
| **CRDT** | Yjs | MIT | Transport-agnostic CRDT for Tier 3 convergent merge. |
| **Transport (Tier 1/2)** | Hyperswarm | MIT | P2P topic discovery, NAT-traversal, Noise encryption. No server. |
| **Transport (Tier 3)** | Meshtastic + custom Ayni module | GPL-3.0 (Meshtastic) / Apache 2.0 (Ayni module) | Battle-tested LoRa mesh + Yjs sync over it. |

**Tier mapping:**
- **Tier 1 (Internet):** Hyperswarm DHT discovery → direct peer connection → Yjs sync.
- **Tier 2 (LAN):** Hyperswarm local discovery → Yjs sync over Noise-encrypted socket.
- **Tier 3 (Mesh):** Yjs binary updates over Meshtastic mesh (custom Ayni module packs/unpacks Yjs updates into Meshtastic messages).
- **Tier 4 (Device):** Yjs in-browser document. No transport needed. Works offline.

**Why Meshtastic, not Reticulum:** Reticulum is under a custom license with a "no AI training" clause (see [`docs/research/mesh-network/research.md`](../research/mesh-network/research.md)). Meshtastic is GPL-3.0 and has no such restriction, allowing Ayni to train models on its own codebase in the future. Meshtastic runs as a separate firmware process on the LoRa radio hardware; Ayni's app code stays Apache 2.0 because there is no static linking.

## Alternatives considered

Full evaluation lives in `docs/research/backend-stack/research.md` (backend) and `docs/research/mesh-network/research.md` (Tier 3 transport). Summary:

- **Option 1 — Jazz.tools** — rejected: dual-licensed, not Apache 2.0. Violates the project's open-source rule.
- **Option 2 — LiveStore + cr-sqlite** — rejected: 2–4 weeks of custom sync glue, no native P2P between phones (Pi relay required).
- **Option 3 — Convex + Replicate** — rejected: hub-and-spoke model. Two isolated phones cannot sync without a server. Tier 3 requires cr-sqlite as a separate bolt-on.
- **Option 4 — AyniDB (build our own)** — deferred: requires $1M+ and 12–18 months. Revisit if Option 5 fails in production.
- **Tier 3 alternative — Reticulum** — rejected: custom license with "no AI training" clause. Ayni plans to train models on its own codebase; Reticulum cannot be in that dataset.

Pear Runtime as a full app shell was considered and rejected: MVP/experimental, only 9 GitHub stars, and would require abandoning Tauri 2 (ADR 0001).

## Consequences

- Hyperswarm replaces WebSocket as the default transport for Tier 1/2 sync. Removes the need to host a sync server.
- Yjs binary updates remain transport-agnostic. The Tier 3 LoRa adapter is custom but small (~2KB per update).
- No sync server to operate. No exposed sync ports. Attack surface shrinks.
- Hyperswarm's DHT is not optimized for LoRa (Tier 3). The Tier 3 adapter is custom regardless of which transport handles Tier 1/2.

## Reversibility

Supersede this ADR if any of: (a) Hyperswarm's NAT-traversal proves unreliable in real-world P2P deployments, (b) Yjs' binary update format proves too heavy for LoRa transport (would require switching CRDT libraries, not just transport), or (c) a sovereign-tier requirement emerges that pure P2P cannot satisfy.

## Sources

- [Hyperswarm on GitHub](https://github.com/holepunchto/hyperswarm) — MIT, 1.3k stars
- [Pear Runtime on GitHub](https://github.com/holepunchto/pear-runtime) — Apache 2.0 (only relevant for the Hyperswarm insight, not adopted as app shell)
- [Yjs](https://github.com/yjs/yjs) — MIT
- [Meshtastic firmware](https://github.com/meshtastic/firmware) — GPL-3.0, 7.9k stars
- [Reticulum](https://github.com/markqvist/Reticulum) — Reticulum License (custom, with no-AI-training clause; rejected)
- [Backend stack research](../research/backend-stack/research.md)
- [Mesh network research](../research/mesh-network/research.md)