---
owns:
  - infra/nix/hosts/**
  - infra/nix/modules/**
  - src/routes/(pwa)/**
  - infra/meshtastic-module/**
status: chosen
---

# Mesh and Local Network

> **Decision (2026-07-02):** **Meshtastic + custom Ayni Meshtastic module + NixOS + Colmena.** The Tier 3 mesh backbone runs Meshtastic firmware (GPL-3.0) on commodity LoRa hardware. Ayni ships a custom Meshtastic module that packs/unpacks Yjs CRDT updates into Meshtastic mesh messages. See [ADR 0004](../../docs/adr/0004-yjs-hyperswarm-tauri.md) for the binding Tier 1/2/3 architecture; this document is the canonical record for Tier 3 transport, hardware, deployment, and recovery.

## Scope

**In:** Tier 2 LAN, Tier 3 mesh backbone, NixOS modules per node type, LoRa hardware procurement and configuration, solar + battery sizing for Calca valley, mesh topology for mountainous terrain, Meshtastic module development, recovery story.

**Out:** Internet procurement (Tier 1 overlay), backend DB decisions (see [`../backend-stack/research.md`](../backend-stack/research.md)), auth (see [`../self-sovereign-identity/research.md`](../self-sovereign-identity/research.md)), native mobile apps (PWA only).

## Active constraints

**Hard:**
- Must function fully without internet (Tier 2 → Tier 3 → Tier 4 degradation per [ADR 0002](../../docs/adr/0002-sovereign-connectivity-tiers.md))
- Community-owned and operated — no third-party cloud dependency for core function
- Physical deployment in Calca, Perú (Sacred Valley, ~3,000m altitude, mountainous terrain)
- Solar-powered with self-maintenance capability
- All hosts provisioned from a single Nix flake
- All dependencies must be Apache 2.0, MIT, GPL-2.0, GPL-3.0, or LGPL. No FSL. No custom "no AI training" clauses (this is why Reticulum is rejected — see below).
- The mesh layer is the Tier 3 implementation; the chosen [backend option](../backend-stack/research.md) defines what change-sets actually travel over the mesh.

**Soft:**
- Low per-node cost (community budget)
- Commodity hardware over proprietary radios
- Minimal ongoing operational burden
- Hardware should be available for purchase or shipment to Perú

**Stop if:** Dependency requires cloud sign-up · hardware > $300/community node or $150/relay · LoRa illegal/infeasible in Perú.

## Why Meshtastic, not Reticulum

The original draft of this document named Reticulum as the Tier 3 backbone. Reticulum was re-evaluated and rejected on license grounds:

- **Reticulum License** (custom, MIT-like with restrictions) includes: *"The Software shall not be used, directly or indirectly, in the creation of an artificial intelligence, machine learning or language model training dataset."*
- Ayni plans to train models on its own codebase. Reticulum's source code would be in that training set. Reticulum is therefore incompatible with the project's AI roadmap.
- The Reticulum *Protocol* is dedicated to the Public Domain (2016), but only the reference implementation is licensed — and that license is the restrictive one.

**Meshtastic** ([github.com/meshtastic/firmware](https://github.com/meshtastic/firmware)) is the replacement:
- **License:** GPL-3.0. OSI-approved open-source. No AI training restriction. Compatible with Ayni's Apache-2.0 stack as a separate firmware process.
- **Maturity:** 7.9k stars, 262 releases, active community. v2.7.26 (June 2026).
- **Hardware:** ESP32, nRF52, RP2040/RP2350, Linux-native (`meshtasticd` daemon). Most LoRa dev boards (Heltec, TTGO, RAK, LilyGo) supported.
- **Topology:** Multi-hop mesh with stores-and-forward. Delay-tolerant (suitable for Tier 3 semantics).
- **NixOS:** Meshtastic ships its own `flake.nix`. Composes cleanly with the project's Colmena-managed fleet.
- **Architecture fit:** Meshtastic firmware runs on the LoRa radio. Ayni's app talks to the radio via Meshtastic's protobuf API. Ayni's source code never statically links with Meshtastic — the GPL-3.0 firewall is process boundary, not file boundary.

**Trade-offs accepted:** Meshtastic is chat-focused and lacks Reticulum's full networking stack (no Fernet encryption at the radio layer, no 500-byte MTU guarantee, no per-packet X25519 ECDH). The custom Ayni Meshtastic module covers encryption and fragmentation above the radio layer; Yjs handles CRDT merge.

## Node types

All provisioned from the same Nix flake. Three types, no fourth:

| Type | Hardware | Role | Solar |
|---|---|---|---|
| **A — Community Center Pi** | Raspberry Pi 4 (4GB) + RAK WisBlock meshtastic node + 10W solar + 12V/7Ah battery + WiFi AP | Tier 2 WiFi AP, Hyperswarm entry point, Meshtastic gateway, local app server, auth | ~5W continuous, 7Ah gives ~14h autonomy without sun |
| **B — Hilltop Relay** | Raspberry Pi Zero 2 W + Heltec LoRa 32 v3 + 20W solar + 12V/12Ah battery | Tier 3 mesh relay only. No WiFi. No app server. Pure CRDT-change-set forwarder. | ~2W continuous, 12Ah gives ~60h autonomy |
| **C — Pure LoRa Repeater** | Heltec LoRa 32 v3 standalone (no Pi, runs Meshtastic firmware directly) + 10W solar + 18650 cell | Tier 3 store-and-forward when no Pi is justified. Lower cost, lower capability. | <1W, 18650 gives ~30 days standby |

**Type D (Intelligence Node)** was in the previous draft. Removed: an "AI agent for security audit" is a software feature, not a hardware node type. If/when Ayni ships local AI agents, they run on Type A nodes alongside the app server. No dedicated hardware.

### LoRa hardware — 915 MHz Perú

Perú allocates the 902–928 MHz ISM band. MTC (Ministerio de Transportes y Comunicaciones) requires:
- Maximum 1W (30 dBm) conducted power on 915 MHz
- Duty cycle ≤ 10% in any 1-hour window
- No encryption restrictions (AES-256 is legal)

Recommended boards:
- **RAK3172** (STM32WL inside, very low power, 14 dBm max — requires external PA for 1W)
- **Heltec LoRa 32 v3** (ESP32 + SX1262, 21 dBm built-in, good community support)
- **RAK WisBlock Meshtastic Starter Kit** (RAK4631 core + RAK19003 base + RAK1910 GPS) — purpose-built for Meshtastic

Default: **Heltec LoRa 32 v3** for Type B and Type C. **RAK WisBlock** for Type A where GPS adds value.

### Yjs over Meshtastic — how the bytes actually flow

Yjs updates are binary blobs. Typical sizes:
- Single character insertion: ~10–20 bytes
- Text paragraph edit: ~50–200 bytes
- Full document sync: kilobytes (one-shot only)

Meshtastic mesh packets carry text or arbitrary protobuf payloads. Practical limits per hop:
- Single packet: up to ~200 bytes of application data (after Meshtastic framing + encryption)
- Multi-packet fragmentation: Meshtastic supports this for larger messages, but at 50 kbps effective throughput, each packet is ~40–50 ms time-on-air at SF9
- Total throughput at SF9/125kHz: ~1–2 KB/min practical at 1km line-of-sight

**Encoding strategy:**
1. Yjs update → gzip/zstd compression (typically 60–80% reduction) → bytes
2. If < 200 bytes: single Meshtastic message
3. If > 200 bytes: chunk into 200-byte fragments, send as numbered Meshtastic messages, reassemble at receiver
4. Receiver applies Yjs update to local document; CRDT merge happens locally

This is implemented in the **Ayni Meshtastic module** (`infra/meshtastic-module/`) — a custom Meshtastic module that runs inside the Meshtastic firmware and exposes a Yjs-sync interface to Ayni's app via the Meshtastic protobuf API.

### Bandwidth budget — realistic numbers

At 915 MHz, SF9/125kHz (default Meshtastic setting for low-latency):
- ~1.5 KB/min effective throughput per hop at 1km line-of-sight
- At 5km with two hops (relay): ~0.5 KB/min
- Mountainous terrain with no line-of-sight: relies on intermediate relays every 1–2km

**Implication for the data model:** Ayni cannot assume Tier 3 sync is real-time. The CRDT layer must tolerate multi-hour delays between sync windows. This is already true of Yjs (eventual consistency), but the UX must communicate "this update will reach your collaborator when their radio comes online."

## Architecture

| Tier | Transport | CRDT layer | Sync server |
|---|---|---|---|
| 1 — Internet | Hyperswarm (DHT) → Noise socket | Yjs over Hyperswarm sync protocol | None (peer-to-peer) |
| 2 — LAN | Hyperswarm local discovery → Noise socket | Yjs over Hyperswarm | None (peer-to-peer) |
| 3 — Mesh | Meshtastic mesh → custom Ayni module | Yjs binary → gzip → Meshtastic messages | None (peer-to-peer) |
| 4 — Device | None (offline) | Yjs in-browser Tauri WebView | None |

The Hyperswarm layer (Tiers 1/2) and the Meshtastic layer (Tier 3) are independent. A node running both can bridge — when a phone sends a Yjs update over Hyperswarm to a Pi node, the Pi can forward it over Meshtastic to a hilltop relay that delivers it to another Pi with no internet.

## Mesh topology for Calca valley

Sacred Valley terrain: deep river valley, villages at 2,800–3,500m, ridges up to 4,500m. Line-of-sight is the limiting factor.

**Initial deployment (calibration phase):**
- 1× Type A at Calca community center (2,920m, on ridge)
- 2× Type B on intermediate ridges (3,400m, 3,800m)
- 1× Type C at the lowest-elevation household in coverage area
- Goal: prove the topology before scaling to all community nodes

**Scaling rule:** Each new Type B placement requires a line-of-sight survey (visual or GPS-based). Ayni does not ship a Type B to a site without proof of sightline to the nearest existing node.

## Recovery story

All nodes are NixOS + Colmena-managed. A dead Pi is recovered by:
1. Flash NixOS minimal image to SD card (one-time per Pi model)
2. Network boot or USB tether for `colmena apply`
3. Pi re-joins the mesh with identical configuration as before

**Meshtastic radios are flashed independently** via the standard Meshtastic flasher. The radio's Meshtastic firmware is versioned in the Nix flake (`infra/nix/modules/meshtastic-firmware-version.nix`) and a Type B/C rebuild includes reflashing the radio.

**No proprietary vendor lock-in.** All software is open-source. All hardware is commodity. If the project disappears tomorrow, the radios keep running Meshtastic and the Pis keep running NixOS.

## Operating principles

- **Discovery is physical.** Tier 3 requires proximity to a relay or another user. By design.
- **The radio is the security perimeter.** Yjs updates over Meshtastic are encrypted by Meshtastic's AES-256 channel. End-to-end encryption is added by the Ayni module (X25519 + Fernet, similar to Reticulum's stack) for payload confidentiality.
- **NixOS + Colmena for all hosts.** A dead Pi is recovered by flashing NixOS + `colmena apply` — identical state guaranteed.
- **The mesh layer is replaceable.** If Meshtastic becomes unmaintained or blocked, the Ayni module interface can be ported to raw LoRa or another mesh stack. The Yjs CRDT layer is unaffected.

## Open questions

1. **Perú 915 MHz licensing:** confirm exact frequency allocation, power limits, and duty cycle rules with MTC before procurement. (Still open.)
2. **Physical security for hilltop relays** (anti-theft, community adoption). (Still open.)
3. **First-install PWA flow** when a phone has never been online. (Still open.)
4. **Tier 3 UX onboarding:** how to teach non-technical users the four tiers. (Still open.)
5. **Meshtastic module development effort:** estimate the engineering cost of the custom Yjs-over-Meshtastic module. **NEW.** Placeholder: 4–6 weeks of focused Rust/embedded work.
6. **RAK vs Heltec procurement:** Heltec boards are cheaper and easier to source in Lima; RAK has better GPS and lower power but longer lead times. **NEW.**

## Related

- [ADR 0004: Yjs + Hyperswarm + Meshtastic + Tauri 2](../../docs/adr/0004-yjs-hyperswarm-tauri.md) — **binding contract**
- [ADR 0002: Sovereign Connectivity Tiers](../../docs/adr/0002-sovereign-connectivity-tiers.md)
- [`backend-stack/research.md`](../backend-stack/research.md) — Tier 1/2 transport and CRDT choice
- [`sovereign-connectivity-tiers/research.md`](../sovereign-connectivity-tiers/research.md)
- [`self-sovereign-identity/research.md`](../self-sovereign-identity/research.md)
- [Meshtastic firmware (GPL-3.0)](https://github.com/meshtastic/firmware)
- [Reticulum (rejected — custom license with no-AI-training clause)](https://github.com/markqvist/Reticulum)