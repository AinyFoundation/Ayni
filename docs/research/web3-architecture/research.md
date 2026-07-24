---
owns:
  - **/web3/**
  - **/contracts/**
  # Note: the canonical in-process event bus lives at `src/lib/event-bus/`
  # and is owned by `unified-platform-architecture/research.md`. Web3 does not
  # own that bus. For on-chain event consumption, this plan owns the
  # indexer pipeline (see § Indexer architecture below).
  - **/web3/indexer/**
  - src/routes/(tokens)/**
  - src/routes/(game)/**
  - src/routes/(forum)/**
  - .github/workflows/deploy-contracts.yml
---

# Plan 4 — Web3 & Blockchain Architecture (v2)

> **Flexibility** — this plan owns the Web3 protocol-layer decisions (token, governance, IC canisters, Nostr). Concrete data-layer choices for these components defer to [`backend-stack/research.md`](../backend-stack/research.md).
>
> **Living document.** This plan is exploratory and will change as research, constraints, and decisions evolve. Flexibility is preserved on purpose. For the current backend decision, see [`backend-stack/research.md`](../backend-stack/research.md). For other in-flight decisions, follow cross-links rather than re-deriving.

> Research-refined executable plan. Based on v1 (codebase analysis) + Phase 3 external research.
## Active Constraints

(same as v1 — research confirmed all hard constraints are satisfiable)

Hard:
- AYNI token must function as both governance token (DAO voting) and utility token (redeemable for real-world experiences)
- Must connect in-game player actions to real-world treasury disbursements via smart contracts
- Must support decentralized content storage for community forums (IPFS + Ceramic or Nostr)
- Must remain aligned with open-source and sovereignty principles
- Must evaluate ICP for ability to host full application on-chain
- Must assess maturity of self-sovereign Web3 identity solutions
- Must include The Graph for indexing evaluation

Soft:
- Prefer architectures that minimize end-user friction (gas costs, wallet complexity)
- Prefer self-hostable / community-owned infrastructure over SaaS dependencies
- Prefer strong Rust ecosystem (aligns with existing skills from Plan 3 mesh network research)

Scope in:
- Base chain comparison: Solana, ICP, Ethereum L2s (Arbitrum, Optimism, Base, zkSync)
- Tokenomics architecture: governance + utility dual-token model
- Smart contract architecture for game-to-treasury linkage
- Decentralized content storage: IPFS, Ceramic Network, Nostr
- Indexing: The Graph evaluation
- SSI maturity assessment
- ICP full-stack on-chain hosting evaluation

Scope out:
- Token economic model design (supply, distribution, vesting) — that's a separate plan
- Game design / mechanics
- Frontend implementation details
- Mesh network integration (covered in Plan 3)

Stop if:
- ~~Research reveals ICP cannot meet a hard constraint that Solana or Ethereum L2 can~~ ✅ Cleared: ICP can satisfy all hard constraints
- A cross-plan dependency emerges that conflicts with Plan 5 (SSI) or Plan 6 (Unified Platform)
- Token economics research is needed before architectural decisions (defer to follow-up plan)

## Architecture Decision

**Primary: ICP (Internet Computer Protocol)**
**Fallback: Solana**

### Why ICP Wins

1. **Full on-chain hosting** — frontend, backend, and data all live in canisters. No servers, no cloud providers. Tamperproof. The SvelteKit app itself is served from a canister at `https://<canister-id>.icp0.io`.

2. **Reverse gas model** — the DAO treasury pre-funds computation via Cycles. Community members in the Sacred Valley never pay transaction fees. This is the single biggest differentiator for a community ecosystem serving a region where crypto onboarding is a real barrier.

3. **Built-in SNS DAO framework** — launches the AYNI token (ICRC-1/ICRC-2), governs all canisters, manages the treasury, and supports liquid democracy via neuron-based voting. Zero assembly required. No Governor + Timelock + Multisig stitching.

4. **Sovereignty alignment** — the NNS (Network Nervous System) is the largest on-chain DAO by activity, governing the protocol itself. Apps are unstoppable. If DFINITY disappears, the NNS continues. This matches AyniCollective's philosophical core of community self-determination.

5. **Chain Fusion** — native threshold signatures allowing canisters to hold and sign transactions for BTC and ETH. Treasury can hold Bitcoin and Ethereum assets without bridges.

### Why Solana is the Fallback

Solana is chosen over Ethereum L2s because:
- Sub-second finality (vs. 7-day optimistic challenge period)
- Lower transaction costs (~$0.00025 vs. ~$0.01-0.10 on L2s)
- Rust-based smart contracts (same language as ICP, shared skills)
- Token-2022 standard with transfer fee extension (auto-allocate to treasury)
- The Graph support out of the box
- Realms DAO: mature governance platform

Solana's trade-offs vs. ICP: frontend hosted off-chain, users pay gas (minimal but present), DAO governance requires Realms + custom treasury program stitching.

### Why NOT Ethereum L2s

Rejected primarily because the user-pays-gas model creates an unacceptable barrier for the Sacred Valley community. Bridging complexity adds friction. Sequencer centralization is a sovereignty concern. Only the EVM ecosystem size is an advantage — and it's not enough to outweigh the friction costs for this community-first ecosystem.

## Recommended Stack

```
┌──────────────────────────────────────────────────────────┐
│                    AYNI WEB3 STACK                         │
├──────────────────────────────────────────────────────────┤
│ Base Chain:     ICP (Internet Computer)                   │
│ Token:          ICRC-1 / ICRC-2 fungible token            │
│ DAO:            SNS (Service Nervous System)              │
│ Treasury:       SNS Treasury Canister + Chain Fusion      │
│                     (holds AYNI, ICP, ckBTC, ckETH)       │
│ Game Logic:     Rust canister(s) on ICP                   │
│ Frontend:       SvelteKit → asset canister                 │
│ Indexing:       Custom event-log canister (The Graph not  │
│                     supported on ICP)                     │
│ Content (structured): Nostr (forum, governance, profiles) │
│ Content (chat):      Nostr relays                         │
│ Identity:       did:icp + Internet Identity (WebAuthn)    │
│                     + did:webvh for content signing       │
│ Cross-chain:    Chain Fusion (BTC, ETH)                   │
└──────────────────────────────────────────────────────────┘
```

### Fallback Stack (if ICP is not viable)

```
Base Chain:     Solana
Token:          SPL Token-2022 (with transfer fee extension)
DAO:            Realms + SPL Governance
Treasury:       Realms treasury + custom disbursement program
Game Logic:     Solana program(s) via Anchor (Rust)
Frontend:       SvelteKit → Vercel/Cloudflare (ICP asset canister also possible as hybrid)
Indexing:       The Graph subgraphs
Content:        Same as primary (Nostr only)
Identity:       did:sol + did:webvh
```

## Canister Architecture (ICP)

```
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Asset Canister  │  │  Token Canister   │  │  Game Canister    │
│  (Frontend)      │  │  (ICRC-1/ICRC-2)  │  │  (Achievements)   │
│                  │  │                   │  │                   │
│  SvelteKit PWA   │  │  - Mint/burn      │  │  - Record action  │
│  Served via HTTP │  │  - Transfer       │  │  - Track progress │
│                  │  │  - Governance     │  │  - Trigger reward │
│                  │  │                   │  │                   │
└────────┬────────┘  └────────┬──────────┘  └────────┬──────────┘
         │                    │                       │
         │         ┌──────────┴──────────┐            │
         │         │  SNS Governance      │◄───────────┘
         │         │  (DAO Framework)     │
         │         │                      │
         │         │  - Proposals         │
         │         │  - Voting (neurons)  │
         │         │  - Liquid democracy  │
         │         │  - Treasury control  │
         │         └──────────┬───────────┘
         │                    │
         │         ┌──────────┴───────────┐
         │         │  Treasury Canister    │
         │         │                       │
         │         │  - Hold AYNI/ckBTC    │
         │         │  - Disburse funds      │
         │         │  - Chain Fusion       │
         │         └───────────────────────┘
         │
         └──────►  Nostr (off-chain content — forum, governance, profiles, chat)
```

### Canister Details

| Canister | Language | Storage | Cycles/year (est.) |
|----------|----------|---------|---------------------|
| Asset (frontend) | N/A (static assets) | ~50 MB | ~$5 |
| Token (ICRC-1/2) | Rust | ~10 MB | ~$5 |
| Game | Rust | ~100 MB (player state) | ~$50 |
| Indexer | Rust | ~200 MB (event log) | ~$50 |
| **Total (base)** | | **~360 MB** | **~$110/year** |

Note: costs scale with usage. SNS treasury can fund cycle top-ups. At scale, storage grows but compute costs remain predictable (reverse gas model).

## Game-to-Treasury Architecture

This is the most novel component. The flow:

```
1. Player completes in-game achievement
2. Game canister records `AchievementCompleted { player, achievement_type, proof }`
3. Event triggers one of two paths:

   Path A — Auto-disbursement (below threshold):
   Game canister → Treasury canister.claim(amount, purpose, proof)
   Treasury canister verifies achievement signature → disburses
   
   Path B — DAO vote (above threshold):
   Game canister → SNS proposal "Fund project X: Y ICP"
   SNS DAO votes → if passed → Treasury canister disburses
```

### Disbursement to Real World

The critical link: on-chain treasury → real-world bank account or stablecoin payment. Options:

| Method | Trust model | Use case |
|--------|------------|----------|
| **Multi-sig stewards** | N-of-M trusted community members sign off | Large disbursements |
| **Stablecoin transfer** | Send USDC/ckUSDC to recipient wallet | Direct peer payments |
| **Pre-authorized categories** | SNS defines "auto-approved" categories under a threshold | Small, recurring payments |
| **Oracle integration** | Off-chain oracle confirms real-world delivery → triggers payment | Milestone-based funding |

Recommendation: start with multi-sig stewards for large disbursements + auto-approved categories for small ones. Evolve toward oracle integration as the ecosystem matures.

## Content Storage Architecture

### Nostr (Structured Content — Forums, Profiles, Governance Discussion)

```
User (did:webvh) → signs Nostr event (NIP-28 for channel, or NIP-01 for direct events)
  → Publishes to Ayni-run Nostr relays
    → Community members subscribe to same relays
      → SvelteKit queries relay or uses local index
```

Data models (Nostr event kinds, unified-platform conventions):
- `30001` (ForumThread): title, content, author DID, timestamp, tags, parent thread
- `30004` (UserProfile): display name, bio, avatar, skills, membership tier
- `UserProfile`: display name, bio, avatar CID, skills, membership tier

### Nostr (Community Chat)

```
User (npub key) → signs NIP-28 channel message
  → Publishes to Ayni-run Nostr relays
    → Community members subscribe to same relays
      → Real-time chat in SvelteKit frontend
```

Setting up: deploy 2-3 Nostr relays on community servers (Plan 2 backend stack). Use `nostream` or `strfry` (Rust-based, efficient).

### Why Not Pure ICP for Content?

ICRC-1/ICRC-2 and canister storage work for structured data, but:
- Ceramic provides composable data models and DID-based authorship that Plan 5 (SSI) already depends on
- Nostr provides censorship-resistant, lightweight real-time chat without canister cycle costs
- IPFS deduplication is useful for media-heavy community content (photos from ceremonies, video from workshops)
- Content doesn't need on-chain consensus — just verifiable authorship and availability

## Indexing Architecture

> **Ownership:** this section corresponds to the `**/web3/indexer/**` glob in the frontmatter `owns:` block. The on-chain indexer pipeline (listener → processor → query engine) is web3 infrastructure, distinct from the platform-owned in-process event bus at `src/lib/event-bus/`, which is owned by [`unified-platform-architecture/research.md`](../unified-platform-architecture/research.md) and is the Tier-4 same-browser pubsub transport.

**Problem**: The Graph doesn't support ICP. We need an alternative.

**Solution**: Custom indexing canister plus optional The Graph subgraph (if Solana fallback is used).

### Custom Indexer Canister (ICP)

```
┌─────────────────────────────────────┐
│         Indexer Canister             │
│                                      │
│  Event Listener (poll other cans)    │
│    ↓                                 │
│  Event Processor (transform events)  │
│    ↓                                 │
│  Query Engine (expose via HTTP)      │
│    ↓                                 │
│  /query { token_transfers,           │
│           dao_proposals,             │
│           game_achievements }        │
└─────────────────────────────────────┘
```

Design: mirror The Graph pattern:
1. Listen to canister events (via periodic polling or `ic_events` inter-canister calls)
2. Process into query-optimized state (BTreeMap indexes)
3. Expose HTTP query endpoints (JSON responses)
4. SvelteKit frontend queries the indexer canister directly

For Solana fallback: use The Graph subgraphs. Standard approach — index SPL Token, Realms, and game program events.

## Identity Integration (Cross-Plan with Plan 5)

| Identity Concern | ICP Solution | Solana Fallback |
|-----------------|-------------|-----------------|
| Wallet authentication | Internet Identity (WebAuthn, no password, device-based) | Phantom / Backpack wallet + did:sol |
| On-chain identity | Principal (ICP native) → did:icp | Public key → did:sol |
| Content signing | did:webvh (community DID) | Same |
| Community credentials | VC issued by DAO (e.g., "Ayni Steward tier 2") | Same |
| Real-world verification | SpruceID for experience access (retreat, ceremony) | Same |

**SSI maturity verdict**: Production-ready. W3C DID Core and Verifiable Credentials are Recommendations. SpruceID is deployed by California DMV. Chain-native DIDs (did:icp, did:sol) and did:webvh are all production-ready for their respective use cases.

## Implementation Order

### Phase 1 — Token Spike (ICP testnet)

| Step | Action | Validation |
|------|--------|-----------|
| 1.1 | Install `dfx` CLI and create project | `dfx --version` |
| 1.2 | Deploy ICRC-1 fungible token canister to ICP testnet | Token exists on-chain, has symbol AYNI, 8 decimals |
| 1.3 | Implement ICRC-2 approve/transfer_from | Can approve spender, transfer_from succeeds |
| 1.4 | Test token transfers, minting, burning | 100 test transfers, 0 failures |
| 1.5 | Test governance staking (neuron creation) | Stake tokens → create neuron → vote on test proposal |

**Stop-and-ask**: After Phase 1.5, review token design before proceeding to DAO.

### Phase 2 — DAO Spike (ICP testnet)

| Step | Action | Validation |
|------|--------|-----------|
| 2.1 | Set up SNS configuration (tokenomics params) | SNS config YAML valid |
| 2.2 | Deploy SNS to testnet with test token | SNS DAO exists, can accept proposals |
| 2.3 | Create proposal: allocate test funds to mock project | Proposal appears, staked neurons can vote |
| 2.4 | Vote with test neurons, reach quorum | Proposal passes/fails based on vote tally |
| 2.5 | Execute passed proposal: trigger treasury disbursement | Treasury canister sends test tokens to recipient |

### Phase 3 — Game-to-Treasury Spike (ICP testnet)

| Step | Action | Validation |
|------|--------|-----------|
| 3.1 | Deploy Game canister with mock achievement system | Player can "complete" mock achievement |
| 3.2 | Implement achievement → treasury claim (auto-path) | Completing achievement triggers treasury.claim() |
| 3.3 | Implement achievement → SNS proposal (vote path) | Threshold-crossing achievement creates SNS proposal |
| 3.4 | End-to-end: player action → treasury disbursement | Full flow works on testnet |

**Stop-and-ask**: After Phase 3.4, review legal implications of automated treasury disbursement.

### Phase 4 — Content Storage Spike

| Step | Action | Validation |
|------|--------|-----------|
| 4.1 | Set up Ceramic node (self-hosted or Ceramic One) | Node running, accessible from local machine |
| 4.2 | Create `ForumPost` stream with DID-signed content | Stream created, retrievable via ComposeDB query |
| 4.3 | Update stream (edit forum post) | Updated stream retrievable, history preserved |
| 4.4 | Query forum posts by author, by thread | ComposeDB GraphQL returns correct results |
| 4.5 | Set up Nostr relay (strfry) | Relay running, accepts events |
| 4.6 | Publish NIP-28 channel message from SvelteKit | Message appears in channel, retrievable by subscribers |
| 4.7 | Test offline → sync behavior for Nostr | Publish while offline → relay gets event on reconnect |

### Phase 5 — Solana Fallback Spike (Solana devnet)

Only if ICP proves unviable during Phase 1-3.

| Step | Action | Validation |
|------|--------|-----------|
| 5.1 | Deploy Token-2022 with transfer fee extension | Token minted, transfer fee auto-allocates to treasury account |
| 5.2 | Set up Realms DAO | DAO created, token-gated voting working |
| 5.3 | Deploy game program + treasury program | Achievement → CPI → treasury disbursement works |
| 5.4 | Deploy The Graph subgraph for indexing | Subgraph indexes token transfers, proposals, game events |

### Phase 6 — Integration

| Step | Action | Validation |
|------|--------|-----------|
| 6.1 | Wire SSI (Plan 5 DID) with ICP Internet Identity | User logs in with Internet Identity, DID resolves to Principal |
| 6.2 | Wire Nostr content with SvelteKit forum UI | Forum loads posts from relays, shows author DIDs (did:webvh) |
| 6.3 | Wire Nostr chat with SvelteKit community page | Chat loads from relay, new messages appear in real-time |
| 6.4 | Connect indexer canister to SvelteKit dashboard | Dashboard shows token stats, DAO activity, game progress |
| 6.5 | End-to-end user journey test | Authenticate → browse forum → vote on proposal → see result → chat about it |

## Cross-Plan Integration Points

| Plan | Integration needed | When |
|------|-------------------|------|
| Plan 5 (SSI) | Chain-native DID methods (did:icp / did:sol), wallet auth flow, VC issuance by DAO | Phase 6.1 |
| Plan 6 (Unified Platform) | `packages/contracts/` directory, `packages/web3-client/`, shared blockchain types | Throughout |
| Plan 1 (Local-First) | Offline queuing of blockchain transactions, CRDT state merge with on-chain state | Phase 4.7, Phase 6 |
| Plan 2 (Backend Stack) | Where to run Ceramic nodes, Nostr relays, IPFS nodes | Phase 4 |
| Plan 3 (Mesh Network) | PWA serving from ICP canister + local mesh for offline access | Post-Phase 6 |
| Plan 7 (Website Design) | Web3 components (wallet connect button, DAO voting UI, token dashboard) | Phase 6 |

## Risk Tier per Phase (refined from v1)

| Phase | Risk | Reason (from research) |
|-------|------|------------------------|
| Phase 1 (Token Spike) | LOW | ICRC-1/ICRC-2 are well-documented, testnet is disposable |
| Phase 2 (DAO Spike) | MEDIUM | SNS launch has configuration complexity. Tokenomics params must be correct. |
| Phase 3 (Game-Treasury) | **HIGH** | Novel on-chain→real-world bridge. Legal implications for automated payments. First-of-kind integration. |
| Phase 4 (Content Storage) | LOW | Ceramic and Nostr are well-documented, self-hostable, isolatable |
| Phase 5 (Fallback Spike) | MEDIUM | Solana has production tooling but Realms DAO has less flexibility than SNS |
| Phase 6 (Integration) | MEDIUM | Cross-plan dependency risk. 5+ plan boundaries touch this phase. |

## Stop-and-Ask Triggers (refined from v1)

1. **Before installing `dfx` or any blockchain CLI** — confirm version, toolchain
2. **Before SNS configuration finalization** — tokenomics params (supply, distribution) need separate design review
3. **Before mainnet deployment** (any chain) — requires audit + multi-sig approval
4. **If SNS launch costs exceed $100 in Cycles** — halt, budget discussion
5. **Before automated treasury disbursement to real-world addresses** — legal review required
6. **If Ceramic One or `strfry` prove unreliable during spike** — halt, re-evaluate Nostr relay options or pure-ICP content storage
7. **Before cross-plan integration** — verify Plan 5, Plan 6 are approved and stable

## Model / Thinking Recommendation

| Phase | Model | Reason |
|-------|-------|--------|
| Token/DAO spike (I CRC Rust) | Strong (Opus/GPT-5) | Smart contract code, tokenomics, security surface |
| Game-Treasury spike | Strong | Novel architecture, cross-canister calls, security |
| Content storage spike | Standard | API-level integration, well-documented |
| Integration | Strong | Multi-plan coordination, cross-cutting concerns |

---

## Decisions and revisions

- **2026-07-01** — Ownership of the in-process event bus disambiguated. The frontmatter `owns:` block previously listed `**/event-bus/**`, which collided with `src/lib/event-bus/**` owned by [`unified-platform-architecture/research.md`](../unified-platform-architecture/research.md). Research grounding: per the canonical DDD pattern (Microsoft Learn / Cesar de la Torre / Jimmy Bogard), an in-process domain event bus is owned by *platform infrastructure*, not by a domain; web3 surfaces should *consume* it. Per the browser-local pub/sub pattern (MDN BroadcastChannel + IndexedDB-backed replay), `src/lib/event-bus/` is the same-browser cross-surface transport that every surface subscribes to, owned by platform. Per the on-chain event pattern (The Graph / ICP `ic_events` / Solana program logs), web3 has no need for an in-process event bus — it consumes events emitted by chains through an *indexer pipeline*. Fix: dropped `**/event-bus/**` from the frontmatter, added `**/web3/indexer/**` (matching the existing § Indexing Architecture: EventListener → EventProcessor → QueryEngine), and added an ownership blockquote at the head of that section pointing back to the canonical platform bus. No ADR needed — resolution uses the canonical source rule in `AGENTS.md` (canonical source = `unified-platform-architecture/research.md` for cross-surface architecture, `single-app-architecture/research.md` file tree for the canonical `src/lib/event-bus/` home).

---

*This v2 document is the executable plan. All execution proceeds from here.*