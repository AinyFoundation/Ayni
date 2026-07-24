---
owns:
  # The portal (Layer 8) is the only Ayni Dev component living in this repo,
  # merged as a route group per single-app-architecture. Everything else
  # (provisioner, protocol, CLI, agent runtime, .infra/) lives in the separate
  # ayni-dev/ repo per the "one repo per product" rule.
  - src/routes/(dev)/**
  - .github/workflows/dev-*.yml
  - docs/transparency/**
status: evaluating
---

# Ayni Dev Platform

> **Flexibility** — this plan owns the developer-experience domain (workspace provisioning, agent orchestration, onboarding, previews, secrets, portal). Concrete tool choices that intersect the broader stack (NixOS, Reticulum, identity provider, backend sync engine) defer to their canonical plans via cross-link. This plan does not duplicate those decisions.
>
> **Living document.** This plan is exploratory and will change as research, constraints, and decisions evolve. Flexibility is preserved on purpose. For related decisions, follow cross-links rather than re-deriving.

## Disposition

**Status:** `evaluating`. This plan has unresolved open questions and is not yet a basis for implementation. **Nine of ten** questions in [Open Questions](#open-questions) remain pending and require explicit user decisions before the status can move to `active` (#1 resolved 2026-06-27).

The 30-minute-onboarding north star and the services-led monetization model are the two load-bearing decisions in this plan. Both are explicitly **chosen** rather than **inherited** from existing plans. Everything else is design space that defers to canonical plans.

**Note on research vs. execution:** Per the [`plan-feature` skill](../../.agents/skills/plan-feature/SKILL.md), this artifact is research that informs execution — not a queue of work. The Implementation Order and File Map sections are *speculative hints* to be re-validated when the plan moves to `active`. They are not commitments.

## Context

Ayni Labs needs a development platform for its own workers, and the same platform, when generalized, can serve the broader sovereign-infrastructure market — without compromising the sovereignty principles the project is built on.

The platform is **not a competitor to Codespaces, Cursor, or Coder.com**. Those products are useful references. What Ayni Dev is trying to be has no direct analog: a workspace that lives on the customer's own infrastructure, accessible from any device including a phone on a mesh network, with an AI teammate that persists across sessions, with the agent's knowledge system itself being sovereign and reproducible from source. The closest architectural relative is **Coder** (workspace provisioner) plus an orchestration layer designed for sovereignty first. **SUPERSEDED 2026-06-27 — Open Question #1 resolved in favor of building the workspace provisioner from scratch in Rust under Apache 2.0, with no relation to Coder.com or any other upstream workspace-provisioner project. Coder is no longer an architectural reference.**

The strategic question this plan answers is: *what does the developer workspace look like when it is built by, and for, a non-profit that does not want a managed cloud business, does not want per-seat SaaS, and wants the code itself to be the trust mechanism?*

## Active Constraints

**Hard (must / never):**

- **Apache 2.0 across the entire stack.** Workspace provisioner, agent runtime, portal UI, integrations, protocol — every line that touches a developer's workspace is open source. No proprietary agent layer. No premium portal tier. No hosted-only features. Ayni Labs maintains the code as a trust mechanism, not a moat.
- **Customer-managed infrastructure.** Customers self-host. Ayni Labs does not operate managed cloud at scale. The only managed offerings are engagement-scoped (field engineer retainers for high-stakes deployments), and even those are bounded.
- **Non-VC funding.** Angel investors, non-profit grants, ecosystem contributions, donations, expertise fees. No venture capital. No per-seat rent. No equity-holder between the customer and the mission.
- **Sovereignty first.** Identical posture to the rest of Ayni: self-hosted, local-first, CRDT-friendly, decentralized identity, no external cloud dependency for core function. Per [ADR 0002](../../docs/adr/0002-sovereign-connectivity-tiers.md) the user-facing app must work offline; the dev platform must work the same way (laptop closed, mesh-attached, mesh-unavailable).
- **Data-egress rule (binding).** Developer code never leaves the customer's infrastructure unless the developer explicitly sends it. Applies to workspace state, agent memory, IDE state, secrets, telemetry. This is enforced in architecture, not in marketing. Sovereign regions must enforce per-region egress controls.
- **Agent identity rule (binding).** Every agent action is signed by a DID. Audit log is portable — customers can take it with them if they leave the platform. No lock-in via audit data.
- **Open-source only dependencies.** Every dependency must be Apache-2.0 or compatible. Same posture as the rest of the project.
- **30-minute north star.** Invitation-to-first-PR in under 30 minutes. This is the success metric for the Onboarding State Machine section.
- **Mobile-first.** The portal works as a PWA on a phone. The portal is *designed* mobile-first, not "responsive" mobile-first. Bottom navigation, voice input primary, gesture-driven review.
- **Cross-plan consistency.** Reuses the single SvelteKit app pattern from [`single-app-architecture/research.md`](../single-app-architecture/research.md) where appropriate. Reuses the DID / VC identity stack from [`self-sovereign-identity/research.md`](../self-sovereign-identity/research.md). **Consumes** (does not own) the tier-aware data abstraction at `src/lib/data/**` owned by [`unified-platform-architecture/research.md`](../unified-platform-architecture/research.md). Does not re-derive any of those decisions.

**Soft (preferences, not requirements):**

- Voice input as primary input mode on mobile (push-to-talk, locally transcribed, sent to workspace agent).
- ~~Coder (Apache-2.0, mature, MIT-style license allows commercial redistribution) as the workspace provisioner baseline — fork-as-Apache-2.0-fork or contribute upstream, never proprietary divergence.~~ **RESOLVED 2026-06-27 — removed per user decision; provisioner is built from scratch in Rust under Apache 2.0, no relation to Coder.com. See Open Questions #1 resolution.**
- Rust as the implementation language for the workspace provisioner, agent runtime, and protocol server.
- NixOS as the workspace image substrate (matches the rest of the project's NixOS-first posture).
- Tailscale for VPN overlay (matches the rest of the project's network architecture).
- Self-hosted Infisical for secrets (matches sovereignty posture, MIT license).
- Cloudflare in front of `*.dev.ayni.so` for TLS / wildcard certs / DDoS (open-source tier).

**Scope in:**

- Workspace provisioning (laptop, shared sandbox, cloud, mesh-attached)
- Workspace state (files, IDE state, agent memory) — CRDT-backed
- Secret management for workspaces
- Preview deployments (`*.dev.ayni.so`)
- Agent runtime (role taxonomy, memory tiers, knowledge-system integration)
- Portal UI (web + mobile + voice)
- Developer onboarding state machine
- Identity issuance for developers, workspaces, and agents (DID-bound)
- Sovereignty-by-design (network, compute, storage residency)
- Transparency reporting infrastructure (`docs/transparency/**`)

**Scope out (or in follow-up plans):**

- The **Ayni Knowledge System** as a project-wide primitive — see follow-up plan `docs/research/knowledge-system/research.md` (to be drafted). This plan only describes the *dev-platform-specific* contract for consuming it.
- The deep design of **agent orchestration** (inter-agent protocols, role library, memory coalescing) — see follow-up plan `docs/research/agent-orchestration/research.md` (to be drafted). This plan names the roles and memory tiers but does not specify protocols.
- AyniDB itself — covered by [`aynidb-exploration/research.md`](../aynidb-exploration/research.md).
- AI provider strategy for the agent runtime — decided at implementation start, not here.
- Hardware kits (Sovereign Field Kit) — v2, not v1.
- Mesh-attached workspace topology — design for it, ship v1 over Tailscale internet only.
- **First-party UI components for the portal.** Until the portal merges into the single SvelteKit app per [`single-app-architecture/research.md`](../single-app-architecture/research.md), `packages/ayni-dev-portal/` is a *standalone* SvelteKit app. After the merge, this ownership path moves into `src/routes/(dev)/`. The current `owns:` glob covers the pre-merge state only.

**Stop if:**

- Any dependency requires a non-Apache-2.0 license.
- The architecture assumes always-on internet for any user-facing path.
- Any agent action cannot be DID-signed and audit-logged.
- The portal cannot render read-only on a phone with no connectivity.
- The Onboarding State Machine cannot reach the 30-minute target on the happy path with the proposed primitives.

**Rollback primitive (per planning-philosophy skill):** the dogfooding rule — Ayni Labs builds Ayni Dev on Ayni Dev — is itself the rollback mechanism. If the plan goes wrong or needs to be paused, Ayni Labs falls back to the prior toolchain for its own development. There is no lock-in. Customers face the same property: every component of Ayni Dev can be removed and replaced without taking the customer's existing development workflow down, because the workspace API is an internal abstraction, not a public surface.

## Reusable Patterns

This plan defers to and composes with the following existing plans:

- [`single-app-architecture/research.md`](../single-app-architecture/research.md) — mobile-first rules, Tauri plugin inventory, data abstraction contract.
- [`unified-platform-architecture/research.md`](../unified-platform-architecture/research.md) — inter-surface communication model, entity-naming conventions, the tier-aware `src/lib/data/` abstraction.
- [`backend-stack/research.md`](../backend-stack/research.md) — the canonical backend decision (Jazz / LiveStore+cr-sqlite / Convex+Replicate / AyniDB). Ayni Dev consumes the chosen client but does not re-derive it.
- [`self-sovereign-identity/research.md`](../self-sovereign-identity/research.md) — DID methods, VC taxonomy, wallet-based auth flows. Agents and workspaces are first-class identity subjects in this stack.
- [`sovereign-connectivity-tiers/research.md`](../sovereign-connectivity-tiers/research.md) — user-facing tier semantics. Workspace Topology (next section) is a separate dimension that cross-links to this.
- [`mesh-network/research.md`](../mesh-network/research.md) — mesh transport for mesh-attached workspaces.
- [`aynidb-exploration/research.md`](../aynidb-exploration/research.md) — the services-led monetization thesis Ayni Dev inherits.
- [`web3-architecture/research.md`](../web3-architecture/research.md) — token / DAO primitives that may be relevant for transparent funding flows.
- [ADR 0001](../../docs/adr/0001-single-app-tauri.md), [ADR 0002](../../docs/adr/0002-sovereign-connectivity-tiers.md) — binding architectural contracts.

## The Vision

### North star

A developer receives an invitation to Ayni Labs. From invitation to first PR in under 30 minutes. The same developer, on a normal Tuesday a month later, is at a ceremony in Calca with no laptop. Their phone shows them what their AI teammate has done while they were away. They respond to a review comment by voice, approve the AI's draft, and put the phone away.

### Day 1 — invitation to first PR

| Minute | What happens |
|---|---|
| 0 | Magic-link email: "You've been invited to Ayni Labs." |
| 2 | Click → `dev.ayni.so` → DID issuance begins (5-second VC flow, no password). |
| 3 | Portal greets the developer by name: "Welcome, Sara. I've prepared your workspace. Say *ready* when you want me to set it up." |
| 3:30 | "ready." AI runs the Onboarding State Machine scan. |
| 4 | AI: "Found 2 things to fix. Running now." (pulls Infisical secrets, starts Postgres container.) |
| 6 | AI: "Backend healthy. Frontend ready. 47 tests passing. Your first issue is #214 — a missing validation in the booking endpoint. Want me to open it?" |
| 7 | "yes." AI opens file, highlights gap, suggests a 4-line patch. |
| 9 | Sara approves. AI commits on `sara/214-fix-validation`, opens PR. |
| 12 | CI runs in the same workspace. PR preview at `pr-214.dev.ayni.so`. AI links it in the PR. |
| 18 | "What does this PR need to merge?" AI lists the 3 requirements (test, review, CI green). |

### Day 30 — a normal Tuesday in Calca

Sara is at a morning sit. No laptop. While she was away:

- A new PR landed from a teammate. AI summarized it in 3 sentences.
- CI failed on the staging deploy. AI diagnosed (Postgres connection pool exhausted), restarted the service, filed an incident.
- A reviewer left a comment on her open PR. AI drafted a response and is holding it for her approval.

Sara opens the phone during a break. Reads the summary. Approves the AI's draft. Asks: "Anything I should worry about?" AI: "Postgres restart ate ~30s of test runs; team has been notified. No action needed."

She puts the phone away and goes back to the ceremony.

This is the experience the architecture is built around. Everything in the rest of this plan is a structural commitment to making this day-1 and day-30 experience possible.

## Workspace Topology

ADR 0002 defines **user-facing** connectivity tiers (1: internet, 4: off-device). The dev platform introduces a separate, **developer-facing** dimension: where the workload runs.

| Topology | Where it runs | Use case | Owner |
|---|---|---|---|
| `local` | Developer's own machine | Quick experiments, offline work | Developer |
| `shared` | Team sandbox VM (`ayni-dev`, always running) | Staging, migrations, dev DB | Team |
| `cloud` | Customer infrastructure (ayni-dev + Ayni orchestrator) | Daily work, persistent AI agents | Org |
| `mesh-attached` | Customer infrastructure, mesh-reachable | Calca no-internet scenarios | Org + mesh relay |

This lives separately from ADR 0002. They cross-link at one point: a `mesh-attached` workspace is reachable at *user-facing Tier 3* (mesh between isolated LANs with no internet) but the workspace topology itself is still `cloud`.

**Default at Ayni Labs:** every Ayni Labs developer gets a `cloud` workspace on Ayni's own Ayni Cloud Pilot — the Sacred Valley data center running on the microgrid. This is the dogfooding primitive: Ayni Labs builds Ayni Dev on Ayni Dev.

## Architecture — 9 layers, from user downward

```
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 9   EXPERIENCE       dev.ayni.so (web + mobile + voice)   │
│  LAYER 8   PORTAL           SvelteKit app (per single-app-arch)  │
│  LAYER 7   AGENT RUNTIME    Role taxonomy + memory tiers (CRDT)  │
│  LAYER 6   WORKSPACE STATE  CRDT: files · IDE · agent memory     │
│  LAYER 5   SECRETS          Infisical (customer self-host)       │
│  LAYER 4   PREVIEWS         *.dev.ayni.so with on-demand Caddy   │
│  LAYER 3   WORKSPACE PROV.  ayni-dev (Rust, Apache 2.0)         │
│  LAYER 2   COMPUTE          Customer infra (NixOS, microgrid-ok)  │
│  LAYER 1   NETWORK          Tailscale overlay + Cloudflare edge   │
│  LAYER 0   IDENTITY         DIDs · VCs · agent identities        │
└──────────────────────────────────────────────────────────────────┘
```

Each layer is **sovereign** (customer owns it), **mesh-aware** (each layer degrades gracefully when connectivity drops — same posture as the user-facing app), and **owned by Ayni Labs** for the parts of the stack most exposed to customer data (Layers 3, 5, 6, 7, 8). Layers 1 and 4 (Tailscale, Cloudflare) are best-of-breed open-source integrations.

### Layer 0 — Identity

DIDs for developers, workspaces, agents, and services. VCs gate access to workspaces, secrets, and repos. Identity issuance is per the canonical [`self-sovereign-identity/research.md`](../self-sovereign-identity/research.md).

### Layer 1 — Network

Tailscale overlay for inter-workspace and developer-to-workspace connectivity. Cloudflare in front of `*.dev.ayni.so` for wildcard TLS, edge caching of static portal assets, DDoS protection (open-source tier). Mesh topology defers to [`mesh-network/research.md`](../mesh-network/research.md).

### Layer 2 — Compute

Customer infrastructure. For Ayni Labs: Sacred Valley data center on microgrid. NixOS as the image substrate (consistent with the rest of the project's NixOS-first posture). Hardware agnostic — runs on any x86 / aarch64 / RPi-class hardware that meets the minimum workspace resource profile.

### Layer 3 — Workspace provisioner

**Built from scratch. No relation to Coder.com or any other upstream project.** Apache 2.0 from day one, owned entirely by Ayni Labs. This is a sovereignty and IP-clarity commitment: no shared codebase, no shared vulnerability surface, no shared roadmap dependencies, no contributor-license ambiguity.

#### Scope of what we build

The workspace provisioner has six responsibilities:

1. **Workspace lifecycle** — create, list, pause, resume, destroy. Per-developer (the user's daily cloud workspace) and per-task (preview workspaces from PRs).
2. **Identity binding** — every workspace has a DID, signed at creation, verified at every API call. External auth provider implements the DID/VC flow (no shared auth tokens).
3. **IDE surface** — at least: SSH daemon bound to the workspace DID, code-server (open-source VS Code in browser) bundled into the workspace image, terminal access via tmux.
4. **Container execution** — Docker / Podman inside the workspace; deterministic environment from a Nix-derived OCI image.
5. **Resource enforcement** — CPU, RAM, disk, network per workspace. Enforced via cgroups / NixOS resource limits.
6. **Audit logging** — every action (start, stop, command run, file accessed, secret accessed) signed by workspace DID, appended to a customer-owned audit log.

#### What we explicitly do NOT build in v1

- **A GUI admin panel for the provisioner itself.** Provisioner is API-only; the portal (Layer 8) is the GUI. The provisioner is infrastructure, not the product.
- **A marketplace of prebuilt templates.** v1 supports one Nix-derived base image; customers extend it. Marketplace is v2.
- **A user-facing billing dashboard.** Pricing is engagement-scoped (see Monetization); no per-workspace billing meter.

#### Implementation language

**Rust.** Rationale:

- Single static binary deployment, no runtime dependencies — fits the Ayni Dev "runs anywhere" posture.
- Memory safety — eliminates a class of workspace-isolation vulnerabilities at the language level.
- Mature async ecosystem (tokio) — fits a long-running daemon that handles many concurrent workspaces.
- Strong NixOS alignment — Rust toolchain is well-supported in Nixpkgs.
- Existing ecosystem fit — `bollard` (Docker daemon API), `libssh`, `tokio-russh`, `ratatui` (terminal UIs) cover the workspace's needs.

Alternatives considered and rejected for v1: Go (good fit but weaker memory-safety story), Nim (smaller ecosystem), TypeScript/Node (heavier runtime, weaker isolation story).

#### What `ayni-dev-protocol` defines

The provisioner is a backend implementation of the `ayni-dev-protocol`. The protocol is the public surface; the provisioner is one backend. A customer could swap to a different backend (Kubernetes-native, custom VM, etc.) without touching any other layer.

The protocol defines:

- Workspace resource description (CPU, RAM, disk, image reference, secret refs, DID-bound ACLs)
- Workspace state machine (provisioning, ready, paused, terminated, errored)
- Workspace command surface (run command, attach shell, attach filesystem, port-forward)
- Workspace identity verification (signed handshake, DID-bound public key, audit log append)

#### Resource model

```
Workspace
  ├── DID (workspace identity)
  ├── Owner DID (developer or service)
  ├── Image (Nix-derived OCI)
  ├── Resources (cpu, mem, disk, network profile)
  ├── Secrets (Infisical references, scoped by VC)
  ├── State (provisioning | ready | paused | terminated | errored)
  ├── Audit log (signed, customer-owned)
  └── Endpoints (ssh://, https://code, https://app)
```

#### v1 scope envelope

**v1 of the provisioner handles:** A single Nix-derived base image, container-based execution (Docker / Podman), SSH + code-server IDE surfaces, DID-bound auth, basic resource limits, audit logging.

**v1 explicitly defers:** Kubernetes operator, multi-image marketplace, remote desktop, GPU acceleration (relevant for AI workloads), custom SSH host key pinning (initially uses ephemeral keys, replaced with DID-pinned keys in v1.1).

This is the right scope envelope because it makes the provisioner honest: a small, auditable, sovereign, Apache-2.0 component that does one thing well. Customers who need Kubernetes-native execution implement their own `ayni-dev-protocol` backend.

### Layer 4 — Preview deployments

PR-driven on-demand workspaces exposed as `pr-NNN.dev.ayni.so` or `feature-<name>.dev.ayni.so`. Implementation pattern:

```
PR opened
   │
   ▼
CI workflow (GitHub Actions)
   │ - builds the app
   │ - calls Ayni Dev API to provision preview workspace
   │ - registers DNS via Cloudflare API (CNAME wildcard)
   ▼
Workspace spins up with PR branch checked out
   │
   ▼
Preview URL posted as a PR comment
   │
   ▼
On PR close/merge: workspace torn down, DNS removed
```

Wildcard cert via Cloudflare DNS-01 challenge. No per-preview cert provisioning. No `pre.ayni.so` (the convention is `dev.ayni.so` — same posture as the Bioma research).

### Layer 5 — Secrets

Customer self-hosts Infisical. Workspaces pull secrets via `infisical run -- <command>` at startup, scoped to a `bioma/dev` environment. Per-workspace identity-bound secret access (the workspace DID signs the request; Infisical verifies the VC). No prod secrets ever injected into a workspace.

### Layer 6 — Workspace state

The set of files, IDE state, agent memory, and shell history that constitute a developer's working environment. **All CRDT-backed** so the same state can sync across a developer's laptop, phone, and any other device with no conflict resolution friction.

This is the layer that enables the "computer can be off" promise: workspace state lives in the customer infrastructure, not on the developer device. Devices are clients.

### Layer 7 — Agent runtime

Role taxonomy, memory tiers, and the knowledge-system integration. Detailed in the **Agent Orchestration** section below.

### Layer 8 — Portal

A SvelteKit app (per [`single-app-architecture/research.md`](../single-app-architecture/research.md)) that renders `dev.ayni.so`. Reuses the mobile-first design system. Adds:

- **Bottom nav**: Workspaces · Chat · Reviews · Me
- **Voice input primary** (push-to-talk, locally transcribed, sent to workspace agent)
- **Quick action sheet** (review · approve · merge · request changes · delegate to AI · open in full IDE)
- **PWA-installable** (works offline for read-only views, queues writes for sync)

The portal is the product surface for v1. The workspace provisioner has no GUI; it is an API surface that the portal consumes.

### Layer 9 — Experience

The combined effect of all eight layers above. Measured by the 30-minute onboarding metric and the day-30 normal-Tuesday experience. There is no separate "experience layer" codebase; there are experience *targets* the other layers must meet.

## Agent Orchestration

### Role taxonomy

Agents are typed to be coordinated. Each role has a defined trigger, output, and DID-binding scope.

| Role | Trigger | Output | DID-binding |
|---|---|---|---|
| **Daily driver** | Per-developer, always present | Code, commits, answers | DID-bound to developer |
| **Workspace** | Per-workspace, ephemeral | Commands, builds, runs | DID-bound to workspace |
| **Planner** | Goal → plan | Ordered tasks | DID-bound to team |
| **Builder** | Plan → code | Diff | DID-bound to workspace |
| **Reviewer** | Diff → verdict | Comments, blocking issues | DID-bound to team |
| **Researcher** | Question → answer | Cited findings | DID-bound to project |
| **Operator** | Service down → fix | Runbook execution | DID-bound to team |
| **Architect** | Cross-cutting question | ADR draft | DID-bound to Ayni Labs |

All roles are open-source. Their prompts, playbooks, and decision logic are visible in the repo. The expertise Ayni Labs sells is in *operating* this system well, not in hiding the prompts.

### Memory tiers

Six tiers, all CRDT-backed, scoped per-identity:

| Tier | Scope | Examples |
|---|---|---|
| **Ephemeral** | Per session | Current plan, scratchpad |
| **Workspace** | Per workspace | Open files, recent commands, current state |
| **Project** | Per repo | Past decisions, recurring patterns, repo-specific preferences |
| **Developer** | Per DID | Your style, your preferences, your history |
| **Team** | Opt-in | Shared conventions, patterns the team likes |
| **Collective** | Opt-in, Ayni Labs only | Cross-team learnings |

Memory coalescing between tiers is the work of the agent runtime (see follow-up `agent-orchestration/research.md`). The data model primitives — CRDT-backed memory objects with DID-bound access control — are defined here.

### Knowledge-system integration

This plan does not define the Ayni Knowledge System as a project-wide primitive. It does define the **dev-platform-specific** contract for how the agent runtime consumes knowledge:

| Knowledge type | Source | Trust level | Refresh |
|---|---|---|---|
| Dependency map | CI-generated from source | High | Regenerated on every change |
| Module graph | CI-generated | High | Regenerated on every change |
| Ownership | `CODEOWNERS` + git blame | High | Refreshed on commit |
| ADRs | `docs/adr/` | High | Reviewed like code |
| Product docs (vision, personas, terminology) | `docs/product/` | High | Reviewed |
| Product docs (roadmap, metrics) | `docs/product/` | Low | Reference, don't over-trust |
| Past incidents | `docs/history/` | Pull-only | Pulled on explicit query |
| Recurring review lessons | Extracted from PR reviews | High | Codified as CI rules when possible |

**The third-pass-review thesis applies:** the durable advantage is *not* the size of the corpus — it's the freshness mechanism. Knowledge with neither a derived guarantee (CI-regenerated) nor an authored guarantee (human-reviewed, dated) gets deleted, not kept.

## Onboarding State Machine

The developer-joining flow is modeled as a **state graph** with detectable states, fixable transitions, and reversible retries.

```
States:
  invited
  identity_issued
  workspace_provisioned
  repo_cloned
  dependencies_installed
  secrets_present
  services_running
  migrations_applied
  tests_passing
  first_pr_open
  productive

Transitions (each is detectable, fixable, reversible):
  invited          → identity_issued        [issue DID + welcome VC]
  identity_issued  → workspace_provisioned  [create workspace, bind to DID]
  workspace_prov.  → repo_cloned            [git clone, configure git user]
  repo_cloned      → deps_installed         [detect package manager, install]
  deps_installed   → secrets_present        [pull from Infisical]
  secrets_present  → services_running       [start docker compose / k8s]
  services_running → migrations_applied     [run migrations]
  migrations_appl. → tests_passing          [run test suite]
  tests_passing    → first_pr_open          [AI proposes first issue]
  first_pr_open    → productive             [developer approves first diff]
```

### MVP v1

- Workspace starts
- Script runs diagnostics
- AI summarizes issues
- Buttons: **Fix automatically** / **Run command** / **Skip**

This is the minimum that already feels 10× better than normal onboarding.

### Full v1

- Detect each state from real signals (process status, port checks, file presence, command exit codes, git state)
- Map issues to fixes via playbooks (see below)
- Prefer safe automated fix > instruction > explain
- Tight feedback loop: every action immediately re-checks state

### Playbooks (codified, not invented per-issue)

```yaml
backend_onboarding:
  - check: postgres_running
    fix: start_postgres_container
    verify: pg_isready -h localhost -p 5432

  - check: env_present
    fix: pull_from_infisical
    verify: test -f .env.local && grep -q DATABASE_URL .env.local

  - check: migrations_applied
    fix: run_migrations
    verify: psql -c "SELECT 1 FROM migrations LIMIT 1"
```

Playbooks live in `packages/ayni-dev-protocol/playbooks/`. Engineers add to them as new workspaces are onboarded. AI is orchestrating known flows, not guessing.

### Failure modes

- **Wrong playbook fires:** developer can correct, transition is reversible, playbook is updated.
- **No playbook matches:** AI asks the developer for guidance, captures the resolution as a new playbook.
- **State detection is wrong:** explicit "re-check" command, debug-mode logs visible to developer.
- **Workspace can't be reached:** falls back to local topology, same state machine applies with a different `WorkspaceProvider` implementation.

## Mobile / Anywhere Experience

The portal is mobile-first. Not "responsive" — *designed* mobile-first. Phone is a first-class surface, not a fallback.

### Phone-first capabilities

- **Read-only workspace views** (cached state, available offline as PWA)
- **Voice input** to the agent runtime (push-to-talk, locally transcribed, sent to workspace agent over Tailscale)
- **PR review** (summary-first, drill-down per comment, swipe to approve / request changes)
- **Quick actions** (review · approve · merge · request changes · delegate to AI · open in full IDE)
- **CI / build status** (live, push-based)
- **Notifications** for: new review comment, CI failure, AI needs approval, teammate @mention

### "Computer can be off" promise

The architectural commitment that makes this real: **workspace state lives in customer infrastructure.** The phone is a thin client. The laptop is a thin client. Closing the laptop does not stop the AI; the AI continues in the workspace. The phone shows the result when the developer picks it up.

This is not a feature — it's the consequence of putting workspace state at Layer 6 with CRDT-backed customer infrastructure underneath. If the architecture is correct, the property falls out. If the architecture is wrong (e.g., workspace state lives on the laptop), no amount of mobile UX will save the promise.

### SSH bridge (the escape hatch)

Developers who want their preferred IDE (Neovim, Emacs, JetBrains, custom setup) get **direct SSH access** to the workspace. Tailscale handles the network. The workspace runs an SSH daemon bound to the developer's DID-bound public key. Authentication is bidirectional (workspace verifies developer, developer verifies workspace via host key pinned in the portal).

### Tauri shell

The full-featured IDE experience ships as a Tauri shell (per [`single-app-architecture/research.md`](../single-app-architecture/research.md)) around the SvelteKit portal. Native menu bar, native notifications, native file dialogs when needed. The Tauri shell is the "thick client" surface; the browser is the "thin client" surface; both talk to the same workspace API.

## Sovereignty & Security

### Network topology

```
Internet (developer)
   │
   ▼
Cloudflare edge  (TLS, wildcard certs, DDoS — open-source tier)
   │
   ▼
Tailscale overlay  (mutual TLS, mesh routing)
   │
   ▼
Workspace host  (NixOS, customer infra)
   │
   ▼
Internal services  (ayni-dev, Infisical, Ayni agent runtime, dev DB, monitoring)
```

The internal services never have public IPs. Tailscale is the only path in. Cloudflare is in front of `*.dev.ayni.so` because wildcard DNS-01 is simpler than Tailscale funnel for browser-based access.

### Identity gating

Every API call from any layer to any other layer is signed by a DID and verified by a VC. No shared API tokens. No service-to-service trust that bypasses identity. This is what makes the agent identity rule implementable.

### Per-region sovereignty

When a customer runs in a sovereign region (Sacred Valley, future microgrid regions), the region's egress controls are enforced at the network layer. A malicious or compromised agent cannot exfiltrate workspace state — packets leaving the region require a developer-signed explicit send action.

This is not policy. It's enforced in the NixOS module that ships with the platform.

### Audit log

Every agent action (file read, file write, command run, secret accessed, external request made) is signed by the agent DID and appended to a customer-owned audit log. The log is portable — customers can take it with them. The log is also CRDT-backed so the customer can replicate it to their own long-term storage.

## Monetization — Services-Led, Transparency-Bound

This section is the **most important** in this plan. The monetization model is the binding principle that determines what code is open, what is closed, and how the project grows.

### Binding principle

> The code is the trust mechanism. The money comes from being good at running the code, not from controlling who can run it.

### Funding sources

| Source | Posture |
|---|---|
| Angel investors | Acceptable. Aligned with non-profit mission. |
| Non-profit grants | Acceptable. Aligned with mission. |
| Ecosystem contributions | Acceptable. Co-ops, partner NGOs, allied projects. |
| Donations | Acceptable. Standard non-profit channel. |
| Expertise fees | Acceptable. The primary revenue source. |
| **Venture capital** | **Not acceptable.** Incompatible with non-profit mission and services-led model. |
| Per-seat SaaS | **Not acceptable.** Incompatible with transparency posture. |
| Managed cloud at scale | **Not acceptable.** Customer-managed is the binding posture. |

### Expertise offerings

| Offering | Realistic range | Notes |
|---|---|---|
| **Deployment consulting** | $10-50k per engagement | 2-4 weeks. Help customer self-host successfully. |
| **Integration support** | $25-150k per engagement | Connect to customer's auth, CI, secrets, repo, observability. |
| **Custom development** | $200-400k/engineer-year | Customer-specific features contributed upstream where possible. |
| **Training & certification** | $1-5k per person | "Build with Ayni Dev" workshops. Certified practitioner program. |
| **Field engineer retainer** | $200-400k/engineer-year | Embedded engineer for high-stakes deployments. Bounded scope. |
| **Sovereign Field Kit (v2)** | $3-15k per kit at cost | Pre-flashed mini-server + LoRa + satellite uplink. Sold at cost, not for profit. |

Pricing is **realistic range**, not committed. Final pricing emerges from first engagements.

### Ayni Regen Surcharge (recommended for v1)

Optional +20% on the Field Engineer Retainer tier, routed to Ayni Sanctuary microgrid expansion. The "Ayni-ness" of the model — visible to customers, transparent in the annual transparency report, funding the same microgrid that powers Ayni Labs's own dogfooding infrastructure.

### Transparency report

Ayni Labs publishes an annual transparency report at `docs/transparency/YYYY.md`. Contents:

- Total revenue, broken down by source
- Total expenditures, broken down by category
- All grants received, with funders named
- All angel investments received, with investors named
- All expertise engagements, with customer org names (unless customer requests anonymity)
- Cumulative contributor count, with breakdown by region
- Cumulative deployments, by topology type
- Any disagreements about the sovereignty posture, with how they were resolved

The transparency report is itself part of the codebase. Reviewers can propose changes. The report is signed by Ayni Labs leadership and by an independent auditor.

### Schema implications

The customer-management pricing model means the schema must model:

- **Workspaces** as first-class entities (with topology, region, owner DID, audit log reference)
- **Engagements** as first-class entities (with type, scope, deliverables, billing reference)
- **Regions** as first-class entities (with sovereignty posture, egress controls, microgrid status)
- **Transparency report** content as a queryable store (not just static markdown)

There is **no** `seats` / `per_user` / `subscription` entity in the schema. Pricing is engagement-scoped, not seat-scoped.

## Implementation Order

Bottom-up. Each step produces verifiable value before the next begins.

1. **Layer 0 — Identity issuance flow.** DID + welcome VC issuance for an invited developer. Verifiable end-to-end with a curl-driven smoke test. ~1 week.
2. **Layer 1 — Tailscale + Cloudflare.** Wildcard `*.dev.ayni.so` provisioned. Tailscale ACLs gating internal services. ~1 week.
3. **Layer 3 — Workspace provisioner v1 (Rust, from scratch).** Design `ayni-dev-protocol`, implement core responsibilities 1–6, harden audit log + resource enforcement. ~6-8 weeks of focused Rust work for a single senior engineer.
4. **Layer 5 — Infisical deployment.** Customer self-hosted, per-workspace identity-bound secret access. ~1 week.
5. **Layer 4 — Preview deployments.** PR-driven on-demand workspaces with `pr-NNN.dev.ayni.so`. ~1 week.
6. **Layer 6 — Workspace state as CRDT.** Workspace state syncs across two devices (laptop + phone). Verify the "computer can be off" promise. ~2 weeks.
7. **Layer 7 — Agent runtime MVP.** Single role (Daily Driver), single playbook (backend onboarding), single memory tier (Workspace). ~2 weeks.
8. **Layer 8 — Portal MVP.** SvelteKit app, mobile-first, voice input, quick action sheet, PWA-installable. ~3 weeks.
9. **Layer 7 — Onboarding State Machine MVP.** Detect states, fix transitions, run state machine to "first PR open" in under 30 minutes on the happy path. ~2 weeks.
10. **Layer 9 — First transparency report.** Annual report infrastructure. First report covers the dogfooding period. ~1 week.

Total: ~16-18 weeks for v1 if executed in sequence. Parallelizable to ~12-14 weeks with 2-3 engineers.

### Dogfooding rule (binding)

**Ayni Labs uses Ayni Dev to build Ayni Dev, and to build everything else.** No exceptions. This is the credibility primitive — without it, no customer will trust the expertise that the model depends on.

The implementation order above is itself executed inside Ayni Dev from step 7 onward. Pre-step-7 work happens in the existing single-app-architecture setup until Layer 8 is ready.

## File Map

What this plan, when executed, will own:

```
# Inside the Ayni Collective repo (this repo):
src/routes/(dev)/                     # Layer 8 portal source (merged into single app)
  workspaces/                         # Workspace list + management
  chat/                               # Agent chat surface
  reviews/                            # PR review surface
  me/                                 # Developer profile / preferences
  api/                                # Internal API for portal
.github/workflows/
  dev-portal-build.yml                # Portal build + deploy
  dev-portal-test.yml                 # Vitest + Playwright for portal
  dev-workspace-smoke.yml             # Smoke test the Onboarding State Machine
  dev-transparency.yml                # Annual transparency report generation
docs/
  transparency/
    YYYY.md                           # Annual transparency reports
```

```
# Inside the separate ayni-dev/ repo (Apache-2.0 workspace provisioner product):
packages/
  ayni-dev-protocol/                  # Cross-layer protocol (Apache 2.0)
    src/
    playbooks/                        # Onboarding playbooks (YAML)
    tests/
  ayni-dev-cli/                       # Developer CLI for local topology
    src/
    bin/
    tests/
  ayni-dev-agent/                     # Agent runtime + role library
    src/
      roles/                          # Per-role implementations
      memory/                         # CRDT-backed memory tiers
      knowledge/                      # Knowledge-system client
    tests/
.infra/
  ayni-dev/                           # Layer 3 from-scratch workspace provisioner (Rust)
    configuration.nix                 # NixOS module — installs the ayni-dev binary, configures resources
    ayni-dev.nix                      # Nix derivation for the ayni-dev binary
    ayni-auth/                        # DID-based auth provider for ayni-dev
    ayni-dev-protocol/                # Protocol definition (workspace resource, state machine, command surface)
    audit-log/                        # Customer-owned audit log implementation
    resource-enforcement/             # cgroups + NixOS resource limit glue
  tailscale/                          # Layer 1 Tailscale ACLs + DNS
    acl.json
    dns-records.tf
  infisical/                          # Layer 5 Infisical config
    configuration.nix
    workspace-scopes.yaml
  previews/                           # Layer 4 preview infrastructure
    caddy.nix
    cloudflare-api.tf
    preview-ctl                       # Lifecycle management for preview workspaces
```

**Repo topology (corrected 2026-07-01):** Ayni Dev is a *separate product* under the [`single-app-architecture/research.md`](../single-app-architecture/research.md) "one repo per product" rule. The `packages/` workspace structure **violates** that plan's "single `package.json`, no workspaces" hard constraint. Therefore:

- The workspace provisioner, CLI, protocol, agent runtime, and `.infra/` live in a dedicated `ayni-dev/` repository (Apache 2.0), consumed by this repo via published TS SDK (`@ayni-dev/client`).
- The **portal** (Layer 8) is the only Ayni Dev component that belongs in this repo — as `src/routes/(dev)/`, one more route group among the eight Ayni Collective surfaces. This satisfies the single-app rule while keeping the dev experience integrated.
- The dogfooding primitive still works: the Collective repo consumes `ayni-dev/` via its published SDK, and Ayni Labs's own developers run workspaces provisioned by `ayni-dev/` to build both repos.

**Concrete rule for code review:** any PR that adds a top-level `packages/` directory to `AyniCollective` is a regression and must be rejected or paired with an ADR amendment.

## Open Questions

These require explicit user input or decisions before this plan can move from `evaluating` to `active`. Each entry includes my recommendation inline to save a round-trip; the recommendation is not binding and can be overridden.

| # | Question | My recommendation | Awaiting |
|---|---|---|---|
| 1 | ~~Coder relationship: fork as Apache-2.0 fork vs. contribute upstream vs. own provisioner~~ | ~~Fork as Apache-2.0 fork. Fastest path; license allows commercial redistribution; periodic re-sync with upstream~~ | **RESOLVED 2026-06-27** |
| 2 | AI provider strategy: self-host open / proxy closed / hybrid | Hybrid with explicit data-egress controls (closed for capability, open for privacy-sensitive work) | User decision |
| 3 | Mesh-attached topology scope: design for it from day 1, ship v1 over Tailscale internet only? | Acceptable as proposed | User confirmation |
| 4 | Ayni Regen Surcharge: +20% on Field Engineer Retainer, routed to Sanctuary microgrid expansion? | Acceptable as proposed | User confirmation |
| 5 | Knowledge system follow-up plan (`docs/research/knowledge-system/research.md`): parallel or sequential? | Parallel — it's a project-wide primitive, not dev-specific | User decision |
| 6 | Agent orchestration follow-up plan (`docs/research/agent-orchestration/research.md`): parallel or sequential? | Sequential after this plan locks (so its scope is bounded by what's here) | User decision |
| 7 | Workspace access policy: Ayni Labs developers access to all customer instances? | Only their own + opt-in, audit-logged, per-session-customer-approved support access | User decision |
| 8 | Hardware kit timing: Sovereign Field Kit is v2, not v1? | Confirm | User confirmation |
| 9 | Pricing ranges in the Monetization section are *realistic range*, not committed. Final pricing emerges from first engagements. | Acknowledge as not-yet-final | User acknowledgement |
| 10 | Should the dogfooding rule (Ayni Labs builds on Ayni Dev) be promoted to a binding ADR? | Yes — proposed as ADR 0005 in the Related section | User decision |

## Related

- [ADR 0001: Single App + Tauri 2](../../docs/adr/0001-single-app-tauri.md)
- [ADR 0002: Sovereign Connectivity Tiers](../../docs/adr/0002-sovereign-connectivity-tiers.md)
- [`single-app-architecture/research.md`](../single-app-architecture/research.md)
- [`unified-platform-architecture/research.md`](../unified-platform-architecture/research.md)
- [`backend-stack/research.md`](../backend-stack/research.md)
- [`self-sovereign-identity/research.md`](../self-sovereign-identity/research.md)
- [`sovereign-connectivity-tiers/research.md`](../sovereign-connectivity-tiers/research.md)
- [`mesh-network/research.md`](../mesh-network/research.md)
- [`aynidb-exploration/research.md`](../aynidb-exploration/research.md)
- [`web3-architecture/research.md`](../web3-architecture/research.md)

### Proposed follow-up plans

- `docs/research/knowledge-system/research.md` — project-wide Ayni Knowledge System (derived/authored split, L1/L2/L3, work-type-aware budgets).
- `docs/research/agent-orchestration/research.md` — deep design of agent roles, memory, inter-agent protocols.

### Proposed ADRs (when the plans warrant)

- **ADR 0003: Ayni Dev is Apache 2.0 across the entire stack.** Binding once the implementation begins. Codifies the trust mechanism.
- **ADR 0004: Ayni Labs does not accept venture capital.** Codifies the funding posture. Aligns with non-profit status.
- **ADR 0005: Ayni Labs dogfoods Ayni Dev (proposed in Open Questions #10).** Codifies the credibility primitive.
- **ADR 0006: Ayni Dev workspace provisioner is built from scratch under Apache 2.0 with no relation to Coder.com or any other upstream workspace-provisioner project (proposed 2026-06-27 per Open Question #1 resolution).** Codifies the sovereignty/IP-clarity commitment. Implementation language: Rust.

## Decisions and revisions

- **2026-06-27** — Initial draft. Framed as an evaluative plan that adopts the Bioma research's layered architecture, the third-pass-review's knowledge-system thesis, and the AyniDB-aligned services-led monetization model. Locked decisions: Apache 2.0 across the stack, customer-managed infrastructure, non-VC funding, no managed cloud at scale, transparency-by-structure. Open: Coder relationship, AI provider strategy, mesh scope, Ayni Regen Surcharge, follow-up plan sequencing.
- **2026-06-27** — Compliance audit against the `plan-feature` skill. Disposition section strengthened with status rationale and research-vs-execution note. Cross-plan consistency constraint clarified: `src/lib/data/**` is *consumed*, not owned. Scope-out expanded with the portal-merge migration note (pre-merge standalone SvelteKit app; post-merge into `src/routes/(dev)/`). Added Rollback primitive per the `planning-philosophy` skill. Open Questions reformatted as a table to match the skill's "user input before action" emphasis, with inline recommendations and explicit "Awaiting" column. Open questions expanded from 8 to 10 (added pricing-ranges acknowledgement and ADR-0005 proposal). Decisions and revisions appended per the skill's "append, don't rewrite" rule.
- **2026-06-27** — Open Question #1 resolved. User decision: **no relation to Coder.com**; the workspace provisioner is built from scratch under Apache 2.0. Layer 3 rewritten in full: six responsibilities (lifecycle, identity binding, IDE surface, container execution, resource enforcement, audit logging), explicit v1 exclusions, implementation language Rust with rationale, `ayni-dev-protocol` as the public surface with the provisioner as one backend, v1 scope envelope (single Nix-derived image, Docker/Podman execution, SSH + code-server, DID-bound auth, basic resource limits). Implementation Order Layer 3 estimate updated from ~2 weeks to ~6-8 weeks of focused Rust work; total v1 estimate shifts from ~16-18 weeks to ~20-24 weeks. File Map Layer 3 changed from `coder/` (NixOS module for Coder) to `ayni-dev/` (NixOS module + Rust binary + protocol + audit log + resource enforcement). Removed the Coder preference from Soft Constraints, replaced with the Rust preference; updated `Context` section to mark Coder as no longer an architectural reference. Proposed ADR 0006: workspace provisioner is built from scratch, no relation to Coder.com. Open Questions table updated: #1 marked RESOLVED, "Awaiting" column renamed to "Status" with mixed pending/resolved entries. Soft constraint language uses ~~strikethrough~~ for the removed item per the append-only edit rule.

- **2026-07-01** — Repo-topology contradiction resolved. The File Map previously listed `packages/ayni-dev-{protocol,cli,portal,agent}/` and `src/dev/` inside `AyniCollective`. This violated `single-app-architecture/research.md` § "Repo topology" / "When to reconsider monorepo" (one repo per product, no workspaces, single `package.json`). Fixed by (1) shrinking the frontmatter `owns:` block to only paths this plan legitimately owns inside `AyniCollective`: `src/routes/(dev)/**`, `.github/workflows/dev-*.yml`, `docs/transparency/**`; (2) rewriting the File Map section to split the surfaces into "inside `AyniCollective`" (portal as `src/routes/(dev)/`) and "inside the new `ayni-dev/` repo" (provisioner, CLI, protocol, agent, `.infra/`); (3) adding a binding rule for code review: any PR that adds a top-level `packages/` to `AyniCollective` is a regression unless paired with an ADR amendment. No ADR written yet — this resolves via the canonical repo-topology rule in `single-app-architecture/research.md`, so a separate ADR is unnecessary. Proposed follow-up: track creation of the `ayni-dev/` repo in HANDOFF.md as an open user action.
