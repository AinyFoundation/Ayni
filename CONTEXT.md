# Domain Glossary

> This file grows with the project. Add domain-specific terms as they emerge.
> The agent reads this file at session start (per `AGENTS.md`).

## Ayni Ecosystem

| Term | Definition |
|------|------------|
| **Ayni** | Quechua principle of sacred reciprocity — mutual support, balance, right relationship. The philosophical foundation of the entire ecosystem. |
| **Ayni Consciousness Collective** | The sovereign core — the umbrella identity and governing philosophy under which all seven wings operate. |
| **Ayni Wellness** | Health, healing, consciousness development, plant medicine, longevity science. The human flourishing wing. |
| **Ayni Energy** | Renewable energy (solar, microgrids), permaculture, vertical farming, regenerative economics. Energy sovereignty for Calca. |
| **Ayni Sanctuary** | The physical retreat center in Calca, Perú — bungalows, ceremonies, restaurant, shop. The for-profit arm that funds the non-profit mission. Also the living laboratory for regenerative living. |
| **Ayni Art** | Creative media — music production, podcasts, film, photography, courses, digital content. The storytelling engine. |
| **Ayni Learning Institute** | Education for children and adults — AI, crypto, robotics, permaculture, sovereignty skills. Includes the Mystery School for advanced consciousness studies. |
| **Ayni Games** | Web3 impact gaming — in-game actions fund real-world outcomes. Token economy (AYNI token), DAO governance, real-world mirror. |
| **Ayni Labs** | Technology infrastructure — blockchain, AI, robotics, open-source engineering. The backbone that powers the other wings. |

## Seven Wings → Seven Pillars

| Wing | Serves Pillar(s) |
|------|------------------|
| Ayni Sanctuary | Community & Culture + Events |
| Ayni Wellness | Consciousness + Health & Vitality |
| Ayni Art | Community & Culture (media) |
| Ayni Energy | Regeneration & Ecology |
| Ayni Learning Institute | Education & Wisdom |
| Ayni Games | Prosperity & Contribution + Governance |
| Ayni Labs | Purpose & Service (technology) |

**Sovereign Core** embodies all pillars as the philosophical foundation.

See [ADR 0003](./docs/adr/0003-seven-wings-ecosystem.md) for the binding contract.

## Architecture

| Term | Definition |
|------|------------|
| **Sovereign Core** | The philosophical center — Ayni Consciousness Collective itself. Every wing connects back to it. Not a holding company; a living agreement. |
| **Mandala** | The visual/conceptual model of the seven wings orbiting the sovereign core. Used as navigation on the website. |
| **Local-first** | Architecture where data lives primarily on the user's device and syncs when connected, rather than depending on a reachable server. |
| **CRDT** | Conflict-free Replicated Data Types — mathematical approach to merging data from multiple offline sources without conflicts. |
| **Mesh network** | Community-owned local network (LoRa, Meshtastic) providing connectivity without internet dependency. |
| **SvelteKit** | Full-stack framework used for the platform. Single app, all 8 surfaces as route groups. |
| **Tauri** | Cross-platform wrapper (web, desktop, iOS, Android). One Rust shell around the SvelteKit app. |
| **Sovereign Connectivity Tiers** | The four-tier model defining how the app behaves as infrastructure degrades (internet → LAN → mesh → off-device). See [ADR 0002](./docs/adr/0002-sovereign-connectivity-tiers.md). |
| **Local-first sync stack** | **Yjs (CRDT) + Hyperswarm (P2P transport).** See [ADR 0004](./docs/adr/0004-yjs-hyperswarm-tauri.md) for the binding decision; [`docs/research/backend-stack/research.md`](./docs/research/backend-stack/research.md) is the canonical record. |
| **NixOS flake** | Single declarative definition of every mesh node. `colmena apply` deploys the whole mesh atomically. |
| **Self-sovereign identity (SSI)** | Identity model where users own their identity via DIDs and Verifiable Credentials — no centralized database. |

## Geography

| Term | Definition |
|------|------------|
| **Calca** | Town in the Sacred Valley, Perú — physical home of Ayni Sanctuary and most ground operations. |
| **Sacred Valley** | The Urubamba River valley in the Peruvian Andes — the broader region Ayni serves and draws from. |

<!-- Add domain-specific terms here as the project develops. Keep entries short, one sentence max. -->
