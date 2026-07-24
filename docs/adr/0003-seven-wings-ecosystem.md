# ADR 0003: Seven Wings Ecosystem Structure

**Status:** Accepted · **Date:** 2026-06-30

## Context

Ayni Consciousness Collective is organized around seven wings that map the seven foundational pillars (see `CONTEXT.md`) to operational divisions.

## Decision

The ecosystem is structured as seven wings surrounding a Sovereign Core (Ayni Consciousness Collective):

### 1. Ayni Sanctuary — "The living heart"
- **Purpose:** Physical living laboratory + events & gatherings
- **Serves Pillars:** Community & Culture + Events
- **Functions:** Retreat center, bungalows, restaurant, shop, ceremonies, conferences, festivals
- **Key Insight:** The physical anchor and first door for most people

### 2. Ayni Wellness — "Consciousness & healing"
- **Purpose:** Consciousness development, health, healing, longevity
- **Serves Pillars:** Consciousness + Health & Vitality
- **Functions:** Plant medicine ceremonies, energy work, breathwork, workshops, biohacking, regenerative medicine
- **Key Insight:** Covers both inner dimensions (consciousness) and physical dimensions (health)

### 3. Ayni Art — "Culture, media & signal"
- **Purpose:** Storytelling engine and cultural amplifier
- **Serves Pillars:** Community & Culture (media expression)
- **Functions:** Music production, podcasts, video, courses, digital content, marketing
- **Key Insight:** The only wing that connects to all others; makes the vision visible to the world

### 4. Ayni Energy — "Regenerative infrastructure"
- **Purpose:** Energy sovereignty and regenerative systems
- **Serves Pillars:** Regeneration & Ecology
- **Functions:** Solar systems, permaculture, vertical farming, water management, community energy grid
- **Key Insight:** Physical backbone of sovereignty; modeled in Ayni Games

### 5. Ayni Learning Institute — "Education for future generations"
- **Purpose:** Lifelong learning for all ages
- **Serves Pillars:** Education & Wisdom
- **Functions:** Children's education, youth development, adult learning, mystery school
- **Key Insight:** The long-term proof of the entire vision; educated community is the future

### 6. Ayni Games — "Impact gaming & Web3"
- **Purpose:** Bridge between digital and physical worlds
- **Serves Pillars:** Prosperity & Contribution + Governance
- **Functions:** Impact gaming, AYNI token, DAO governance, real-world mirror
- **Key Insight:** In-game actions fund real-world outcomes; token economy

### 7. Ayni Labs — "Technology & open-source R&D"
- **Purpose:** Technical infrastructure and innovation
- **Serves Pillars:** Purpose & Service (technology as means)
- **Functions:** Blockchain, AI, robotics, open-source engineering, game engine
- **Key Insight:** Least visible externally but most load-bearing internally

## The Sovereign Core

**Ayni Consciousness Collective** is not a company or umbrella brand. It is the philosophical foundation—the living agreement that all seven wings share the same root. It embodies:
- The principle of Ayni (sacred reciprocity)
- Governance without centralization
- Community values and stewardship
- The operating system for the entire ecosystem

## Pillar-to-Wing Mapping

| Pillar | Dimension | Wing(s) | Mapping |
|--------|-----------|---------|---------|
| 1. Consciousness | Inner | Ayni Wellness | Direct |
| 2. Health & Vitality | Physical | Ayni Wellness | Direct |
| 3. Community & Culture | Social | Ayni Art + Ayni Sanctuary | Split |
| 4. Education & Wisdom | Intellectual | Ayni Learning Institute | Direct |
| 5. Regeneration & Ecology | Environmental | Ayni Energy | Direct |
| 6. Prosperity & Contribution | Economic | Ayni Games | Partial |
| 7. Purpose & Service | Spiritual | Ayni Labs + Sovereign Core | Split |

## Alternatives considered

- **9 pillars (original documentation):** Too granular for operational implementation; merged related pillars into single wings
- **Fewer wings (merged functions):** Would lose clarity of identity and autonomy for each division
- **Matrix organization:** Would create confusion about reporting and responsibility
- **Separate brands per wing:** Would fragment the ecosystem identity

## Consequences

- Each wing has clear identity and autonomy for external communication
- All wings connect to Sovereign Core as their philosophical root
- Ayni Art is the only wing that connects to all others (storytelling amplifier)
- Ayni Games and Ayni Energy have the tightest functional bond (modeled systems)
- Ayni Learning Institute is the long-term proof of the entire vision
- Website structure follows the mandala: reveal the whole organism, then let users find their door

## Reversibility

This structure is foundational and should not change without significant reason. Supersede this ADR only if:
1. The seven pillars framework is fundamentally revised
2. Operational requirements demand a different organizational structure
3. The ecosystem expands to require additional wings beyond seven

## Sources

- `AyniContent/AYNI Sanctuary.txt` — Seven Foundational Pillars of AYNI Sanctuary
- `AyniContent/AYNI Ecosystem.txt` — Original 9-pillar framework
- `AyniContent/AYNI Learning Institute.txt` — Education division structure
- `AyniContent/ayni_ecosystem_interactive.html` — Interactive wing visualization
- `AyniContent/claude-chat.md` — Wing naming and structure discussions
- `CONTEXT.md` — Domain glossary with wing definitions
- `README.md` — Public-facing wing descriptions

## Plan

This ADR is informed by the documentation in `AyniContent/` and establishes the foundation for all platform development. The seven wings will be implemented as distinct sections/routes in the single SvelteKit application (per [ADR 0001](./0001-single-app-tauri.md)).
