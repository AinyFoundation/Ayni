---
owns: []
status: active
---

# Sovereign Connectivity Tiers

> **Flexibility** — this plan is implementation-agnostic by design. It defines only the tier contract (what must happen at each of Tiers 1-4); how each tier is implemented defers to [`backend-stack/research.md`](../backend-stack/research.md).
>
> **Living document.** This plan is exploratory and will change as research, constraints, and decisions evolve. Flexibility is preserved on purpose. For the current backend decision, see [`backend-stack/research.md`](../backend-stack/research.md). For other in-flight decisions, follow cross-links rather than re-deriving.

Implements [ADR 0002: Sovereign Connectivity Tiers](../../docs/adr/0002-sovereign-connectivity-tiers.md). The ADR defines the four-tier contract; this plan provides the canonical test (the Outage Narrative) used to validate every future architectural change.

---

## The four tiers (summary)

| Tier | Network | UX |
|------|---------|-----|
| 1 | Global Internet | Identical to any SaaS |
| 2 | LAN only | Indistinguishable from Tier 1 |
| 3 | Mesh only | Async, no push, ~50 kbps |
| 4 | None | Local reads, drafts queue |

Tier transitions are automatic and invisible to the user. Full definitions in the ADR. Per-option satisfaction (Jazz, LiveStore+cr-sqlite, Convex+Replicate, AyniDB) lives in [`backend-stack/research.md`](../backend-stack/research.md).

---

## The 7 local-first ideals (Ink & Switch, 2019)

The chosen backend should satisfy as many of these as possible. Tier awareness directly serves ideals 3, 4, and 5:

| # | Ideal | How tiers serve it |
|---|-------|---------------------|
| 1 | No spinners | Local-first reads at every tier |
| 2 | Your work is not trapped | Standard SQLite on every device |
| 3 | The network is optional | Tiers 1-4 cover all network conditions |
| 4 | Seamless collaboration | CRDT merge at every tier |
| 5 | The Long Now | SQLite + NixOS + Apache 2.0 / MIT only |
| 6 | Security & privacy by default | Per chosen backend's E2EE posture |
| 7 | You retain ultimate ownership | No vendor lock-in; standard SQL export |

Source: [Ink & Switch — Local-First Software (2019)](https://www.inkandswitch.com/local-first/)

---

## The Outage Narrative (canonical reference test)

The Sacred Valley at 8:00 AM. Global internet has been cut by an undersea cable event. Cell towers, Starlink, fiber — all dead.

### Cast
- **Alice** — phone, in the Community Center Café
- **Bob** — laptop, sitting across from Alice
- **Chris** — tablet, at a farm 2 km up the valley
- **Community Center Pi 4** — solar-powered, authoritative data store + sync
- **Hilltop Relay Pi** — solar + battery, mesh relay node on the ridge

### Phase A — Tier 2 (LAN up, internet down)

The café router still works. The Pi 4 is on solar.

1. Alice opens the app. The sync layer queries the Pi 4 over LAN. Returns in <50ms.
2. Alice posts in the community forum. Optimistic local write. Bob's reactive query updates instantly.
3. They collaborate in real-time, completely unaware the outside world is gone.

### Phase B — Tier 3 (LAN down, mesh up)

A storm knocks out the café router. The Pi 4 is still on, but isolated. The Hilltop Relay is broadcasting LoRa.

1. Alice and Bob's apps detect LAN loss, scan for mesh nodes, attach to the Hilltop Relay.
2. Alice posts a message. Writes to her local SQLite. UI updates instantly.
3. Her phone beams the change-set up to the Relay. Relay persists it.
4. Chris's tablet polls the Relay, receives the change-set, merges it locally, UI updates.
5. Bandwidth: ~50 kbps. Latency: minutes, not milliseconds. No push notifications.

### Phase C — Tier 4 (everything down, off-device)

Alice's phone battery dies at 4 PM. She was drafting a wiki edit.

1. The edit lives in her local SQLite. Never reached the Relay.
2. She charges her phone at a neighbor's house (no network there).
3. She opens the app. Reads everything she previously synced. Drafts queue locally.
4. When she walks back into Relay range (Tier 3), the draft syncs.

### Phase D — The Sync Party (recovery)

Two days later. Power and LAN return.

1. The Pi 4's LAN comes back. Every nearby phone pushes its queued change-sets.
2. The Hilltop Relay Pi flushes its accumulated change-sets to the Pi 4 over LoRa (slow but complete).
3. The authoritative store absorbs all changes. The reactive layer updates every active session.
4. CRDT merge handles any concurrent edits chronologically; flags true conflicts for human review.
5. The system reaches global convergence. No data lost.

---

## Honest constraints (every tier)

- **No push notifications below Tier 1.** Apps only "wake up" on open or proximity.
- **No video, no large files in Tier 3.** LoRa bandwidth is dial-up era.
- **No Tier 3 without physical proximity.** Discovery is physical.
- **No features that require Tier 1** (live outside video, global search) as core functionality.

---

## Validation

The Outage Narrative is replayed as an integration test:
1. Spin up Pi 4 + Relay + 3 simulated devices.
2. Phase A: assert real-time propagation over LAN.
3. Phase B: kill LAN, force Tier 3, assert async propagation via mesh simulation.
4. Phase C: kill network entirely, assert drafts survive.
5. Phase D: restore, assert convergence with zero data loss.

The test must pass identically for whichever backend option is chosen from [`backend-stack/research.md`](../backend-stack/research.md).

---

## Related

- [ADR 0002: Sovereign Connectivity Tiers](../../docs/adr/0002-sovereign-connectivity-tiers.md)
- [`backend-stack/research.md`](../backend-stack/research.md) — which options satisfy which tiers
- [`mesh-network/research.md`](../mesh-network/research.md) — Tier 3 mesh transport details