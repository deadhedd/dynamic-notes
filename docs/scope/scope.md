# Scope: Dynamic Notes engineering maturity

Dynamic Notes is a released Obsidian plugin that moves structured Markdown blocks through local note workflows. This scope brings its repository practices to the level expected for a small released project, without changing product behavior.

**Build approach:** Tracer Bullet (complete each engineering slice through its contract, implementation, and verification before starting the next).
**Workflow:** Beta (after `/develop`, run `/check verify`, then `/test`). The project default level of rigor.

_These are recommendations to keep the work orderly. You decide when each slice is done._

## At a glance

| # | Feature | Phase | Status |
|---|---|---|---|
| 1 | Flow engine and note format | Existing | existing |
| 2 | Obsidian commands and views | Existing | existing |
| 3 | CI and release publication | Existing | existing |
| 4 | Current architecture and behavior contract | Foundation | done |
| 5 | Enforced test analysis boundary | Foundation | done |
| 6 | Node and npm toolchain contract | Foundation | done |
| 7 | Release metadata consistency gate | Foundation | done |

## Existing product

### 1. Flow engine and note format · existing

The pure engine parses, validates, advances, and resets the persistent Dynamic Notes Markdown format. Its safety invariants and tests live in `src/flow/` and `tests/`.

Code in `src/flow/` and `tests/`.

### 2. Obsidian commands and views · existing

The plugin exposes validation, Advance, Reset flow, and ribbon behavior in editing and reading views through the documented Obsidian API.

Code in `src/main.ts`.

### 3. CI and release publication · existing

GitHub Actions installs dependencies, runs tests and lint, builds the release asset, verifies the release tag, and publishes the required Obsidian assets.

Code in `.github/workflows/` and `RELEASE.md`.

## Normalization foundations

### 4. Current architecture and behavior contract · done

Record the current persistent Markdown contract, safety rules, transformation behavior, Obsidian write boundaries, compatibility assumptions, and non goals in one current specification. Keep `DESIGN.md` as historical context rather than treating it as the current authority.

**Done when:** one current spec is authoritative for the released behavior, names the preserved runtime contract, and gives future work a clear entry point without changing source behavior.

- [x] Design it (spec): [0001](../specs/0001-current-architecture-behavior.md) `/architect current architecture and behavior contract`

**Verification note:** `/check verify` passed the automated and CLI checks for Advance, Reset, and malformed input behavior, all 25 tests, lint, the production build, release metadata verification, and `git diff --check`. The built plugin also contains the expected commands and ribbon action.

Manual runtime verification remains deferred because the current environment has no controllable Obsidian GUI or test vault surface:

- Editing view behavior
- Reading view and vault write behavior
- Desktop smoke test
- Mobile smoke test

This is deferred manual verification, not a failed normalization slice and not a new engineering requirement. The completed slice remains done.

### 5. Enforced test analysis boundary · done

Bring test files into the normal TypeScript and static analysis checks using the smallest configuration change that preserves the existing commands and test behavior.

**Done when:** the normal local and CI verification path type checks relevant test code, applies the chosen lint boundary to tests, and all existing tests, lint, and production builds remain green.

- [x] Build it: `/develop enforced test analysis boundary`

### 6. Node and npm toolchain contract · planned

Declare the supported Node and npm environment and pin the tested Obsidian API dependency without broadly upgrading the dependency set.

**Done when:** a fresh checkout has one documented Node and npm contract, the Obsidian package resolves to the tested version, `npm ci` remains reproducible, and local and CI commands use the same contract.

- [x] Build it: `/develop Node and npm toolchain contract`

### 7. Release metadata consistency gate · done

Add one lightweight verification command for the repository’s chosen version and compatibility metadata, then reuse it in the appropriate local, CI, and tag release paths.

**Done when:** a release cannot pass its normal checks with inconsistent package, manifest, versions, tag, or required release asset metadata, while the current release workflow and published asset behavior remain unchanged.

- [x] Build it: `/develop release metadata consistency gate`

## Not in this scope

The indented Markdown code block parser defect remains a separate product defect.

The Community Plugins directory description typo remains separate external publication cleanup.

Broad dependency upgrades, coverage targets, contributor process documents, release evidence bureaucracy, feature work, and speculative refactors remain deferred.

## Legend

**Existing** means the product capability predates this workflow and is recorded for context. It is not rebuilt by this scope.

**Planned** means the normalization slice remains to be built. The first unticked box is the next recommended command.

**Needs a decision** means `/architect` should capture the current contract before implementation. The other slices have a bounded implementation path and can go directly to `/develop`.
