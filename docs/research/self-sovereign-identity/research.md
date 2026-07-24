---
owns:
  - src/lib/auth/**
  - **/did/**
  - **/identity/**
status: draft
---

# Self-Sovereign Identity

> **Flexibility** — this plan defers stack choices (auth provider, E2EE posture, sync engine) to [`backend-stack/research.md`](../backend-stack/research.md). It owns only the identity-domain decisions: DID methods, Verifiable Credentials, verification flows, wallet SDKs.
>
> **Living document.** This plan is exploratory and will change as research, constraints, and decisions evolve. Flexibility is preserved on purpose. For the current backend decision, see [`backend-stack/research.md`](../backend-stack/research.md). For other in-flight decisions, follow cross-links rather than re-deriving.

## Active Constraints

**Hard:**
- Users must own their identity completely — no centralized database holds their account
- Must work across all surfaces: website, game client, community forum, physical Sanctuary check-in
- Must support offline identity verification across Tiers 1-4 (see [ADR 0002](../../docs/adr/0002-sovereign-connectivity-tiers.md))
- Sovereignty-first: no third-party identity provider
- E2EE posture: per the chosen backend option in [`backend-stack/research.md`](../backend-stack/research.md) (native for Jazz; hybrid pattern for LiveStore+cr-sqlite and Convex+Replicate)

**Soft:** Frictionless UX, progressive onboarding, minimal new infrastructure, compatible with known wallet ecosystems.

**Scope in:** DID method selection, Verifiable Credential taxonomy, wallet-based auth flows, cross-platform identity, offline verification, integration with the chosen backend.

**Scope out:** Smart contracts, token economics, DAO governance (see [`web3-architecture/research.md`](../web3-architecture/research.md)).

**Stop if:** Any DID method requires a permissioned ledger · offline verification is impossible without custom hardware.

---

## DID methods

| Method | Use for | Notes |
|--------|---------|-------|
| **did:webvh** (primary) | Canonical community identity, long-term member DIDs, credential issuance | DIF spec, self-certifying ID, history via `did.jsonl`, no blockchain |
| **did:key** (secondary) | Ephemeral identities, offline peer verification, mesh bootstrapping | Self-contained, derived from key pair, zero infrastructure |
| **did:ion** (tertiary, optional) | High-assurance credentials — governance, legal agreements | Bitcoin-anchored, requires ION node or resolver, ~$0.50-$5 per creation |

Explicitly not recommended: did:ethr (gas fees), did:sov (permissioned), cheqd (token dependency).

---

## Verifiable Credential taxonomy

**Base:** AyniMembershipCredential (memberSince, communityWing, contributionLevel). Issued by Ayni Collective root.

**Wing-specific:** AyniWellnessPractitioner, AyniEnergyContributor, AyniSanctuaryAttendee, AyniStudioArtist, AyniLearningEducator, AyniGamesPlayer, AyniLabsDeveloper, AyniGovernanceDelegate. Wing leads can be delegated sub-issuers.

**Ephemeral:** AyniEventPass, AyniVolunteerBadge, AyniSkillAttestation.

**Issuance:** Root issues base + wing credentials. Peer attestations use individual DIDs. Revocation via Status List 2022 served from `https://ayni.community/.well-known/status-list.json`.

---

## Authentication flow

BetterAuth is the bridge. Sign-in flow:

1. User clicks "Sign in with SSI Wallet" in SvelteKit.
2. `/api/auth/challenge` returns Presentation Definition + nonce (QR code).
3. Wallet creates Verifiable Presentation with required VCs.
4. `/api/auth/callback` resolves DID, validates VP, checks revocation, validates nonce.
5. BetterAuth session cookie set; `locals.user` populated.

Session: server-side cookie, httpOnly. No private keys on server. Session maps to DID.

```
src/hooks.server.ts           → reads BetterAuth session
src/routes/api/auth/challenge → returns Presentation Definition
src/routes/api/auth/callback  → validates VP
src/routes/api/auth/logout    → destroys session
```

---

## Hybrid E2EE pattern (when applicable per backend choice)

Per [`backend-stack/research.md`](../backend-stack/research.md), some options deliver E2EE natively; others use a hybrid pattern.

**Plaintext (server-readable, operational metadata):**
- User ID (DID), user role / wing membership, timestamps
- Relationship IDs (who-follows-whom, group memberships)
- Public forum posts, aggregates, indexes

**Client-side encrypted (server cannot read):**
- Message bodies in private conversations
- Personal journal entries, private documents
- Wiki pages marked "private"
- Any field explicitly marked sensitive

Encryption on device before write. Decryption keys derived from user's DID key material. Server sees ciphertext blob + a key-reference field for routing only.

---

## Cross-platform identity

One DID per member, across all surfaces:

| Surface | Method | Transport | Tier |
|---------|--------|-----------|------|
| Website | OpenID4VP redirect / QR | HTTPS | 1, 2 |
| Game client | DIDComm v2 | HTTPS or local WS | 1, 2, 3 |
| Community forum | OpenID4VP → BetterAuth SSO | HTTPS | 1, 2 |
| Sanctuary check-in | OpenID4VP over BLE / QR | Bluetooth LE | 2, 3 |
| Mesh remote peer | DIDComm over Reticulum | LoRa / Reticulum | 3 |
| Device-only | Cached credentials | None | 4 |

All surfaces resolve the same DID and trust the same DID document.

---

## Offline verification

Preconditions: DID documents cached locally before going offline. Status lists have a local cache TTL.

**Methods by tier:**
- Tier 1/2: OpenID4VP over HTTPS or LAN.
- Tier 2/3: OpenID4VP over BLE (DHE key agreement, AES-256-GCM session). QR fallback.
- Tier 3: DIDComm over Reticulum. Two members exchange VPs over LoRa using cached DIDs.
- Tier 4: on-device only. Cached credentials + local verification.

---

## Wallet SDK

**Primary: Veramo v7+** (Node.js, React Native, browser). Plugin stack covers DID management, key management, VC issuance/verification, KMS, data store, selective disclosure.

**Alternative: Credo (Hyperledger Aries JS)** — heavier but more DIDComm-native. Switch only if peer-to-peer credential exchange becomes primary.

---

## Implementation phases

1. Foundation — Deploy did:webvh, configure Veramo cloud agent, configure BetterAuth, test issue/verify/revoke.
2. Web auth — SvelteKit hooks, Presentation Definition, mobile wallet or browser-based wallet.
3. Cross-platform — game client, forum SSO, Sanctuary check-in.
4. Offline & mesh — DID cache, mesh DIDComm over Reticulum.
5. Advanced credentials — wing-specific schemas, delegated issuance, peer attestations.

---

## Risk highlights

- **Key loss/recovery:** High impact. Social recovery, backup phrase, did:webvh controller key rotation.
- **Issuer key compromise:** Very high impact. Quarterly rotation via sops-nix re-encryption, hardware-backed KMS for high-value credentials.
- **Wallet adoption friction:** QR-based progressive onboarding; browser-based wallet option (no app install).

---

## Related

- [ADR 0002: Sovereign Connectivity Tiers](../../docs/adr/0002-sovereign-connectivity-tiers.md)
- [`backend-stack/research.md`](../backend-stack/research.md) — the chosen backend defines E2EE posture
- [`sovereign-connectivity-tiers/research.md`](../sovereign-connectivity-tiers/research.md) — tier-by-tier UX
- [`mesh-network/research.md`](../mesh-network/research.md) — Tier 3 transport