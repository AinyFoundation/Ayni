---
name: gold-standard
description: Project coding standard. Universal principles apply to every project regardless of language. Stack-specific rules live in the marked section at the bottom and are filled in when the project adopts a toolchain.
---

# Gold Standard

The project's coding standard. Universal principles (§ below) apply to every project. Stack-specific rules live in the marked section at the bottom and are filled in when the project adopts a toolchain.

## Universal principles

These apply regardless of language or framework.

- **Before you write, ask the ladder.** See the `ponytail` skill — does this need to exist? Is it already in the codebase? Does stdlib do it? Is there a one-line version? The post-write rules below apply *after* the ladder.
- **Read before edit.** Open the file. Read enough to understand the surrounding code. Then edit. Never edit blind.
- **No premature abstraction.** Three call sites minimum before extracting a helper. Two duplicates are cheaper than the wrong abstraction.
- **Functions do one thing.** If `and` appears in the function name, split it.
- **Names describe *what*, not *how*.** `getUserById`, not `queryUsersTableByPrimaryKey`. `retry`, not `doExponentialBackoffWithJitter`.
- **Errors are values, not control flow.** Every public function's error path is documented. Either handle, log, or rethrow — never swallow.
- **No silent catches.** A bare `catch {}` is a bug report waiting to happen.
- **Tests describe behavior, not implementation.** If the test breaks when you refactor without changing behavior, the test is wrong.
- **Stop-and-ask triggers** (see `AGENTS.md`): new dependencies, schema/auth/crypto changes, replacing existing patterns, 5+ file edits, adding vendor directories.

## Architecture

### Layer discipline

Code flows one direction. Define your project's direction here:

```
[Presentation] → [Business Logic] → [Data Access]
```

Examples:
- **Web app:** UI Components → Hooks/Services → API/Database
- **CLI:** Commands → Core Logic → File System/Network
- **Library:** Public API → Internal Modules → Primitives

**Rules:**
- Lower layers never import from higher layers
- Shared types can be imported anywhere
- When in doubt, dependency points inward (toward business logic)

### Feature communication

When features interact, use **typed contracts**, not ad-hoc imports.

**The Shared Data Rule:**
If two components need the same data, they use the **same hook/function**, not parallel implementations.

```ts
// ❌ Bad: Two components fetching data independently
function UserList() { const users = fetchUsers(); ... }
function UserStats() { const users = fetchUsers(); ... }

// ✅ Good: Shared data fetching
function useUsers() { return fetchUsers(); }
```

**The Contract Rule:**
Features communicate through defined interfaces, not internal imports.

```ts
// ❌ Bad: Feature A importing Feature B's internal function
import { processPayment } from '@/features/billing/internal';

// ✅ Good: Feature A uses Feature B's public API
const processPayment = useBilling().processPayment;
```

**Why this matters:** Without these rules, every feature creates its own data fetching and processing — leading to duplication, inconsistency, and tight coupling.

### State management

Use this decision tree when choosing where to store state:

```
Is it local to one component? → Local state
Is it shared across 2-3 components? → Lift state up or context
Is it global and rarely changes? → Context/config
Is it global and changes frequently? → State manager
Is it server data? → Data fetching library
Is it URL-relevant? → URL parameters
```

**Key principle:** Prefer the simplest solution that works. Don't reach for a state manager when lifting state up suffices.

## Code quality

### Error handling

**Frontend:**
- Catch at the boundary (error boundaries, try/catch in handlers)
- Display user-friendly messages
- Log technical details for debugging

**Backend/API:**
- Validate inputs at the top of the function
- Return early on errors
- Don't nest `if` blocks more than 2 levels deep
- Use typed errors, not generic `Error` with string messages

```ts
// ✅ Good: Fail fast, return early
async function createUser(args) {
  if (!args.email) throw new ValidationError("Email required");
  if (!isValidEmail(args.email)) throw new ValidationError("Invalid email");
  
  // ... main logic
}
```

### Testing scope

**What to test:**
- Business logic and pure functions
- User interactions (clicks, form submissions)
- Edge cases and error paths
- Integration between components

**What NOT to test:**
- Framework internals (React, Django, etc.)
- Third-party libraries (assume they work)
- Style/CSS (unless visual regression testing)
- Trivial getters/setters

**Rule:** If the test breaks when you refactor without changing behavior, the test is wrong.

## Before you commit

Ask yourself:

1. **Would a new team member understand this in 30 seconds?** If not, simplify or add a comment.
2. **Did I violate the layer dependency direction?** Check your imports.
3. **Is there a file I should split?** (See `code-quality` skill for size thresholds)

If yes to any, fix it before committing.

## Enforcement

This standard is enforced by:

1. **This skill** — loaded before every AI session.
2. **CI gates** — `oss-gate.yml` runs on every PR. Toolchain-specific commands to be added when scaffolded.
3. **Code review** — PR reviewer checks against this document.
4. **Pre-commit hooks** — optional but recommended.

CI commands (planned, to be added when toolchain is scaffolded):

```bash
pnpm check       # svelte-check + tsc
pnpm lint        # eslint
pnpm test        # vitest
pnpm build       # production build
```

## Stack-specific

Current stack (per `docs/research/single-app-architecture/research.md` + `docs/research/unified-platform-architecture/research.md`):

- **Language:** TypeScript (strict mode, `noUncheckedIndexedAccess`)
- **Runtime:** Node.js LTS
- **Framework:** SvelteKit (Svelte 5 Runes) — single app, no monorepo
- **Package manager:** pnpm (single `package.json` per app, no workspaces)
- **Lint:** eslint + prettier
- **Test:** vitest
- **Type check:** svelte-check / tsc --noEmit
- **Module organization:** Feature-Sliced Design (app/entities/features/shared)
- **State management:** Svelte 5 Runes ($state, $derived, $effect) — no legacy stores
- **Data layer:** Local-first sync stack — Path 1 (Jazz), Path 2 (LiveStore + cr-sqlite), or Path 3 (Convex + Replicate) under evaluation (per `docs/research/backend-stack/research.md`); backend must satisfy the four Sovereign Connectivity Tiers ([ADR 0002](../../../docs/adr/0002-sovereign-connectivity-tiers.md))
- **App shell:** Single SvelteKit app wrapped by Tauri 2 (per `docs/research/single-app-architecture/research.md`). Web, desktop (Win/macOS/Linux), iOS, Android ship from one codebase. Mobile-first design.
- **File naming:** kebab-case for files, PascalCase for components
- **Module structure:** Single app with SvelteKit route groups — `src/routes/(web)/`, `(forum)/`, etc. — for surface boundaries; `src/lib/` for shared code
- **Import order:** external → internal → relative (enforced by eslint-plugin-import)

### SvelteKit conventions

- **Route groups** (`(name)/`) for surface boundaries — parentheses make them invisible in URLs
- **`+page.svelte`** for pages, **`+layout.svelte`** for shared chrome, **`+server.ts`** for API endpoints
- **Load functions** (`+page.ts`, `+layout.ts`) for SSR data fetching — use these instead of client-side `fetch`
- **Form actions** for mutations — progressive enhancement by default
- **`$lib`** alias for shared code in `src/lib/`
- **Co-locate** component-specific styles, tests, and helpers in the same folder

### Svelte 5 Runes

- `$state` for reactive state — never use legacy `let` for state in `.svelte` files
- `$derived` for computed values — replaces `$:` reactive declarations
- `$effect` for side effects — replaces `onMount` for non-mount effects
- `$props()` for component props — replaces `export let`
- **Reactive classes** in `.svelte.ts` files for shared state across components
- See [Svelte 5 docs](https://svelte.dev/docs/svelte/overview) before using legacy patterns

### Tauri 2 conventions

- **Rust commands** in `src-tauri/src/lib.rs` for native operations (file system, network, OS APIs)
- **Permission system** — declare permissions in `src-tauri/capabilities/`, never grant blanket access
- **State management** — use Tauri's `State` for shared Rust-side state, Svelte 5 Runes for UI state
- **Mobile targets** — test iOS and Android early, web APIs don't always map 1:1
- **IPC contract** — type both sides with shared TypeScript types in `src/lib/tauri/`
- **Security** — validate all inputs in Rust commands, never trust frontend data

### Local-first sync stack conventions (path-agnostic)

The data layer must work across all four Sovereign Connectivity Tiers. Concrete conventions are decided only after the option is chosen in [`docs/research/backend-stack/research.md`](../../../docs/research/backend-stack/research.md). Until then:

- **Tier-aware data abstraction** — app code calls `src/lib/data/index.ts`, never the sync library directly. The abstraction picks the right transport per detected tier.
- **Schema lives in code** — types and schemas are TypeScript-first.
- **CRDT-friendly data model** — every entity must be representable as a conflict-free type. No last-write-wins on shared fields unless explicitly local-only.
- **E2EE posture** — per the chosen option in [`docs/research/backend-stack/research.md`](../../../docs/research/backend-stack/research.md). **For all options: do not commit code that encrypts fields the server must query.**

Path-specific conventions will be appended to this section after the option is chosen. Filling in this section does not lock the stack — it's the current target. Changes require a plan update.

## How to evolve this standard

Propose changes via PR. Standards that aren't enforced rot — if a rule is universally ignored, it's wrong, and the standard should change rather than the codebase fighting it.
