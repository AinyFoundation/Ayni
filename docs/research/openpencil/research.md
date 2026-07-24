---
owns: []
slug: openpencil
status: reference
created: 2026-07-14
last-updated: 2026-07-14
---

# OpenPencil — Design Tool Integration Research

**Status:** reference  
**Date:** 2026-07-14  
**Decision:** Adopt OpenPencil CLI as the design tool for AyniCollective

## Summary

OpenPencil is an open-source (MIT license) design editor that reads/writes Figma (.fig) and Pencil (.pen) files. It provides a headless CLI, MCP server for AI agents, and a web app. Installed globally via npm for use as a design tool in this codebase.

## What

- **Package:** `@open-pencil/cli` v0.13.2
- **License:** MIT (complies with open-source only rule)
- **Installation:** `npm install -g @open-pencil/cli`
- **Location:** Global npm package (not in project dependencies)

## Why

1. **Design-to-code workflow** — Create visual designs that export to JSX/Tailwind/HTML
2. **AI agent integration** — MCP server allows AI agents to inspect/modify designs
3. **Figma compatibility** — Can read/write native .fig files
4. **No external dependencies** — Runs locally, no account required for CLI
5. **Open-source** — MIT license, no vendor lock-in

## Capabilities

| Feature | Command |
|---------|---------|
| Inspect design files | `openpencil tree design.fig` |
| Find nodes by type | `openpencil find design.pen --type TEXT` |
| Query with XPath | `openpencil query design.fig "//FRAME"` |
| Export to PNG/JPG/SVG | `openpencil export design.fig` |
| Export to JSX/Tailwind | `openpencil export design.fig -f jsx --style tailwind` |
| Lint design files | `openpencil lint design.fig` |
| Analyze tokens | `openpencil analyze colors design.fig` |
| Convert formats | `openpencil convert design.pen output.fig` |

## Supported Formats

- **Read:** .fig (Figma), .pen (Pencil)
- **Write:** .fig
- **Export:** PNG, JPG, WEBP, SVG, PDF, JSX

## Usage in This Project

1. **Design exploration** — Create/mockup UI components visually
2. **Export to code** — Generate JSX/Tailwind from designs
3. **Token analysis** — Audit color/typography/spacing consistency
4. **AI-assisted design** — Use MCP server for agent-driven design

## Constraints

- CLI is installed globally (not in project dependencies)
- No research doc needed for global CLI tools (only for npm dependencies)
- Web app available at https://openpencil.dev for browser-based editing

## Sources

- https://github.com/open-pencil/open-pencil
- https://openpencil.dev
- npm: @open-pencil/cli v0.13.2
