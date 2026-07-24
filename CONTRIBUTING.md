# Contributing

Thanks for your interest in contributing to Ayni Consciousness Collective. By participating, you agree to the [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## First contributions

Good places to start:

- **Fix a typo or broken link** in docs or `README.md`.
- **Improve a code comment or docstring** — clarity saves everyone time.
- **Translate** docs into Spanish or Quechua.

Look for issues labeled `good first issue` when they exist.

## How to submit

1. Fork the repo (or create a branch if you have write access).
2. Make your change. Keep it small and focused — one PR per concern.
3. Fill in the PR template.
4. Open the PR. CI checks must pass.
5. Expect review feedback. We aim to respond within a week.

## Reviewers

Reviewers are routed automatically from [`.github/CODEOWNERS`](./.github/CODEOWNERS). Each file path maps to a GitHub team; PRs touching that path request review from that team. The mapping is intentional:

- **Founders** review changes to the constitution (`AGENTS.md`), contributor surface (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`), and the ownership file itself.
- **Architecture** team reviews changes to ADRs, research docs, and design docs.
- **Skills** teams (one per skill) review changes to their own `SKILL.md` and scripts.
- **CI maintainers** review changes to workflows and the OSS gate.

When a path has no explicit owner, the default fallback (`@ayni-collective/founders`) catches it. If you are changing a file and unsure who should review, leave a comment on the PR and a maintainer will assign manually.

## Decision-making

- **Small** (typo fixes, doc updates): open a PR.
- **Medium** (new files, dependency changes): open an issue first.
- **Large** (license changes, architectural pivots): produce a research document in `docs/research/`, then discuss.

## Code of conduct

All participants are expected to follow the [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md). Please report unacceptable behavior to the contacts listed there.

## Questions?

Open an issue with the `question` label.
