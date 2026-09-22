# Flow engine

## Overview

This area parses, validates, and transforms the Dynamic Notes Markdown format without importing Obsidian. It is the safety boundary for all workflow changes, so malformed or ambiguous documents must fail before a transformation is returned.

## Key files

| File | Owns |
|---|---|
| `parser.ts` | Frontmatter, region, block, and structural marker parsing |
| `validator.ts` | Whole document invariants and duplicate or misplaced content checks |
| `transform.ts` | Advance and reset transformations after parsing and validation |
| `types.ts` | Parsed document, block, region, and result contracts |
| `index.ts` | Public flow engine exports |
| `../../tests/flow.test.ts` | Parser, validation, and transformation coverage |

## Conventions

- Return `FlowResult` values for expected malformed input instead of throwing.
- Keep block contents opaque and retain exact block text during transformations.
- Parse structure first, then call `validateFlowDocument` before returning any writeable transformation.
- Maintain offset correctness because the Obsidian editor uses returned offsets to place the cursor.
- Update golden fixtures and malformed input cases when persistent format behavior changes.

## Gotchas

- Managed regions must appear in `now`, `later`, `done` order.
- Region and block markers inside fenced code are ignored.
- There may be at most one current block, and an empty `now` region cannot have later work.
- Changes here affect the persistent Markdown format and both editing view and reading view operations.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
