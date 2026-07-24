---
owns:
  - src/lib/event-bus/**
  - src/lib/shared/**
  - src/lib/data/**
status: active
---

# Unified Platform Architecture

> **Flexibility** — this plan owns the inter-surface communication model and entity-naming conventions. Stack-specific transports for Tier 3 and Tier 4 defer to [`backend-stack/research.md`](../backend-stack/research.md).
>
> **Living document.** This plan is exploratory and will change as research, constraints, and decisions evolve. Flexibility is preserved on purpose. For the current backend decision, see [`backend-stack/research.md`](../backend-stack/research.md). For other in-flight decisions, follow cross-links rather than re-deriving.

## Active Constraints

**Hard:**
- Self-hosted backend — zero dependency on external cloud services for core function
- Local-first — app functions fully offline, syncs when connected
- Web3 identity layer — DIDs, Verifiable Credentials, wallet-based auth
- SvelteKit + TypeScript, open-source (Apache-2.0)
- 8 surfaces: website, forum, LMS, token economy, energy dashboard, game bridge, retreat booking, PWA
- Scales from single Calca server to globally distributed nodes
- Single SvelteKit app wrapped by Tauri 2 (per [ADR 0001](../../docs/adr/0001-single-app-tauri.md))
- Mobile-first: every UI component works at 360×640
- All four connectivity tiers must work from the same app shell (per [ADR 0002](../../docs/adr/0002-sovereign-connectivity-tiers.md))
- E2EE posture per the chosen option in [`backend-stack/research.md`](../backend-stack/research.md)

**Soft:**
- Feature-Sliced Design for module organization
- Svelte 5 Runes ($state, $derived, $effect)
- Nostr for community forum storage
- did:webvh primary, did:key for ephemeral/offline (see [`self-sovereign-identity/research.md`](../self-sovereign-identity/research.md))

**Stop if:** Any dependency requires a non-open-source license · architecture assumes always-on internet · data model cannot be CRDT-friendly · identity system stores user credentials centrally · any single point of failure blocks Tier 3 mesh operation.

## Active decisions

- Single-app + Tauri 2 shell (per [ADR 0001](../../docs/adr/0001-single-app-tauri.md))
- Sovereign Connectivity Tiers (per [ADR 0002](../../docs/adr/0002-sovereign-connectivity-tiers.md))
- Lean ops layer: NixOS + Colmena + sops-nix (per [`backend-stack/research.md`](../backend-stack/research.md))
- BetterAuth + Veramo for identity (per [`self-sovereign-identity/research.md`](../self-sovereign-identity/research.md))
- Backend stack: **decision pending** — see [`backend-stack/research.md`](../backend-stack/research.md)

## Cross-tier event transport

Inter-surface communication is selected by current connectivity tier:

| Tier | Scope | Transport | Latency | Persistence |
|------|-------|-----------|---------|-------------|
| 1 | Same component | Svelte 5 `$state` (`.svelte.ts`) | µs | Memory |
| 1, 2 | Cross-device, online | Chosen backend's reactive query | <100ms | Authoritative store on Pi |
| 3 | Cross-device, offline | Per chosen backend option in `backend-stack/research.md` | minutes | Local SQLite + CRDT merge |
| 4 | Same device, no network | Local reactive query | <10ms | Local SQLite |
| All | Same component | Svelte 5 `$state` | µs | Memory |
| All | Same browser, cross-surface | In-process event bus (IndexedDB-backed) | ms | IndexedDB |

The connectivity tier is detected by `src/lib/tier-detect/index.ts` on every write. The reactive layer transparently picks the right transport. The user never picks a mode.

## Scaling model

- **Single sovereign server (Calca)** is the sovereign minimum — everything works on one NixOS-declared Pi 4.
- **Mesh survival (Tier 3)** adds hilltop relay Pis running the chosen backend's Tier 3 transport (same flake, different module composition). See [`backend-stack/research.md`](../backend-stack/research.md) for which option delivers native Tier 3.
- **Global distribution (Tier 1)** is optional — the platform functions identically at 10 users in Calca or 10,000 globally.

Conflict resolution is CRDT-native end-to-end. E2EE posture is per chosen backend (see [`backend-stack/research.md`](../backend-stack/research.md)).

## Data schema conventions

| Convention | Rule | Example |
|------------|------|---------|
| Table/collection | `snake_case`, plural | `community_posts`, `booking_reservations` |
| Column/field | `snake_case` | `created_at`, `member_did`, `wing_slug` |
| TypeScript type | `PascalCase` | `CommunityPost`, `BookingReservation` |
| Zod schema | `PascalCase + Schema` | `CommunityPostSchema` |
| Events | `PascalCase`, past-tense verb | `PostCreated`, `BookingConfirmed` |
| Reactive subscription name | `kebab-case` | `my-forum-posts`, `upcoming-bookings` |
| DID path | `kebab-case` | `did:webvh:ayni.community:member:scid` |

### Required fields on every entity

```typescript
{
  id: string;          // UUID v4 (client-generated for offline-first)
  created_at: string;  // ISO 8601 (server, first sync)
  updated_at: string;  // ISO 8601 (server, every sync)
  _synced_at: string;  // ISO 8601 (client-only)
  _version: number;    // Monotonic counter for conflict detection
  // Fields prefixed `encrypted_` are client-encrypted; server sees ciphertext blob
}
```

### Entity location

```
src/lib/shared/entities/
├── user.ts              ← User (DID-based; identity lives in Veramo)
├── wing.ts              ← Wing enum (wellness | energy | sanctuary | studio | learning | games | labs)
├── content.ts           ← Website content
├── forum-post.ts        ← Community forum
├── course.ts            ← LMS
├── token-account.ts     ← Token economy
├── energy-site.ts       ← Energy dashboard
├── booking.ts           ← Sanctuary retreat booking
├── game-session.ts      ← Game bridge
└── event.ts             ← Cross-wing event
```

### Reactive subscriptions (per wing)

| Subscription | Wing | Tier(s) |
|--------------|------|---------|
| `my-profile` | All | 1-4 |
| `wing-{slug}-content` | Web | 1-2 |
| `my-forum-threads` | Community | 1-3 |
| `forum-category-{slug}` | Community | 1-3 |
| `course-{id}-enrolled` | LMS | 1-3 |
| `my-token-balance` | Token Economy | 1-2 |
| `energy-production-7d` | Energy | 1-2 |
| `available-bookings-30d` | Booking | 1-2 |
| `active-game-sessions` | Games | 1-3 |

The reactive code is identical across tiers; only the transport differs (decided per chosen backend).

### Nostr event kinds (community forum)

| Kind | Name | Purpose |
|------|------|---------|
| 30001 | ForumThread | A forum thread (replaceable) |
| 30002 | ForumPost | A post within a thread (replaceable) |
| 30003 | ForumCategory | Category/board metadata (replaceable) |
| 30004 | UserProfile | Extended community profile (replaceable) |
| 40001 | ImpactAction | A real-world impact action from gaming (ephemeral) |

## Related

- [ADR 0001: Single App + Tauri 2](../../docs/adr/0001-single-app-tauri.md)
- [ADR 0002: Sovereign Connectivity Tiers](../../docs/adr/0002-sovereign-connectivity-tiers.md)
- [`backend-stack/research.md`](../backend-stack/research.md)
- [`single-app-architecture/research.md`](../single-app-architecture/research.md)
- [`sovereign-connectivity-tiers/research.md`](../sovereign-connectivity-tiers/research.md)
- [`self-sovereign-identity/research.md`](../self-sovereign-identity/research.md)