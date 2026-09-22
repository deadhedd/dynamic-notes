# Dynamic Notes

## Stack

- **Language and runtime**: TypeScript, Node.js 24 in CI
- **Framework**: Obsidian plugin API, bundled with esbuild
- **Key dependencies**: `obsidian`, `esbuild`, `vitest`, `eslint`
- **Package manager**: npm, with `package-lock.json`

## Build approach

Tracer Bullet, complete each engineering slice through its contract, implementation, and verification before starting the next.

## Commands

```bash
# Install
npm ci

# Development watch build
npm run dev

# Production build
npm run build

# Tests
npm test

# Lint
npm run lint
```

## Specs

Stored in `docs/specs/` when architectural decisions need a durable record.

## Rules

- Markdown is the persistent source of truth for workflow state.
- Validate a parsed document before any transformation or Obsidian file write.
- Keep the pure flow engine in `src/flow` separate from Obsidian integration in `src/main.ts`.
- Treat block contents as opaque Markdown and preserve their text when moving them.
- Use documented Obsidian APIs and keep the plugin free of Node.js and Electron runtime dependencies.
- `main.js` is generated, ignored by Git, and uploaded with `manifest.json` for releases.
- Keep `package.json`, `manifest.json`, `versions.json`, and release tags consistent.

## Context files

- [src/flow/AGENTS.md](src/flow/AGENTS.md): parser, validation, and transformation invariants

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
