# 0001. Current architecture and behavior contract

**Date**: 2026-09-22
**Status**: Accepted

## Summary

Dynamic Notes 0.2.1 is a small Obsidian plugin with a pure TypeScript flow engine and a thin Obsidian adapter. A user owned Markdown note is the only persistent source of workflow state. The engine parses and validates the complete note before it returns an Advance or Reset result, and the adapter performs the editor or vault write only after receiving a successful result.

This specification records the released behavior so future work can preserve it. It does not redesign the parser, the Markdown format, or either transformation.

## Context

Dynamic Notes is released at version 0.2.1. Its important compatibility surface is the Markdown stored in user notes, together with the behavior of Advance and Reset. A future maintainer needs one current description of that surface rather than having to reconstruct it from source, tests, README.md, and the historical DESIGN.md.

The repository already has the required separation in code. The `src/flow` area handles parsing, validation, and pure text transformations. `src/main.ts` connects those results to Obsidian commands, views, notices, editors, and vault writes. Tests exercise the pure engine with malformed inputs and Markdown fixtures.

`DESIGN.md` remains useful as the version 0.1 design record. It is not authoritative where it describes an older command set, older state rules, or behavior that the released implementation has since changed. The known issue with indented Markdown code blocks is separately tracked and is not changed by this specification.

## Requirements

**User stories**:

1. As a future maintainer, I want the current component boundaries and side effect boundary stated clearly so that changes remain in the correct layer.
2. As a note owner, I want the Markdown format and transformation rules recorded precisely so that my notes remain readable and compatible.
3. As a task author, I want malformed or ambiguous notes to fail without a write so that a transformation cannot silently damage user content.

**Acceptance criteria**:

1. **AC-1**: One current specification describes the released 0.2.1 architecture and persistent behavior, while preserving DESIGN.md as historical context.
2. **AC-2**: The specification names the responsibilities and boundaries of the parser, validator, transformation engine, Obsidian adapter, and tests.
3. **AC-3**: The specification defines the version 1 frontmatter, region markers, block markers, identifier rules, ordering rules, parsing assumptions, and preservation rules that form the Markdown compatibility contract.
4. **AC-4**: The specification states every validation invariant that must hold before a transformation result is returned, including the conditions that refuse Advance or Reset.
5. **AC-5**: The specification states the exact released state transition for Advance, including complete flows and final current blocks.
6. **AC-6**: The specification states the exact released state transition for Reset, including its queue order, block preservation, and whitespace normalization.
7. **AC-7**: The specification identifies how commands and ribbon actions reach the engine from Editing view and Reading view, and where editor and vault mutations occur.
8. **AC-8**: The specification records the current Obsidian Desktop and Mobile compatibility assumptions and the absence of hidden per note state and network requirements.
9. **AC-9**: The specification records current intentional non goals and the separately tracked indented code block parser issue without presenting that issue as a desired format rule.
10. **AC-10**: The specification identifies historical DESIGN.md statements that no longer describe the released 0.2.1 product.

## Options considered

### Option 1: Add one current specification and retain historical documents

Record the current contract in one file under `docs/specs/`, use source and tests as authority, and leave README.md, CHANGELOG.md, RELEASE.md, and DESIGN.md in their existing roles.

**Pros**:

1. Gives future maintenance work one current entry point.
2. Preserves useful history without confusing it with released behavior.
3. Keeps the artifact proportional to the plugin.

**Cons**:

1. Some related facts remain in user facing and release documents.
2. Future behavior changes must update this specification as well as the user facing documentation that describes the change.

### Option 2: Treat DESIGN.md as the current specification

Continue directing maintainers to the version 0.1 design document and rely on readers to reconcile it with current code and tests.

**Pros**:

1. Creates no new architecture document.
2. Preserves the original design narrative in one place.

**Cons**:

1. It leaves the current Reset behavior and current command surface implicit.
2. It contains state and command claims that no longer match version 0.2.1.

### Option 3: Redesign or repair the product while documenting it

Use this slice to change parser behavior, revise the Markdown format, or refactor the integration boundary while creating the documentation.

**Pros**:

1. Could address known or suspected product issues sooner.

**Cons**:

1. Changes user owned data behavior outside this slice.
2. Makes it impossible to distinguish released behavior from new behavior.
3. Expands the work into product and defect changes that the scope explicitly defers.

## Decision

**Chosen option**: Option 1: Add one current specification and retain historical documents

The released 0.2.1 implementation, tests, fixtures, README.md, CHANGELOG.md, RELEASE.md, manifest.json, versions.json, and AGENTS.md are reconciled here as the current contract. No product source or parser behavior changes are part of this decision.

**Implementation skills**: none

## Rationale

The current implementation is already small and has the needed separation, so the safest architecture record is a precise description of what exists. A new pure engine, a new persistence layer, or a parser rewrite would add risk to user owned Markdown without helping this normalization slice.

Keeping one current specification beside the historical design gives future work a clear authority boundary. The source and tests establish released details such as Reset, complete flow handling, Reading view writes, and the current parser limitation, while DESIGN.md continues to explain the original constraints.

## Proposed stack

This table records the current stack. It is descriptive, not a proposal to replace it.

| Layer | Current choice | Reason |
|---|---|---|
| Language | TypeScript | The pure flow engine and Obsidian adapter are implemented in TypeScript. |
| Plugin host | Obsidian plugin API | The adapter uses documented `Plugin`, `MarkdownView`, `Editor`, `Notice`, `TFile`, and vault APIs. |
| Persistent state | Markdown in the active note | Markdown is user owned, readable without the plugin, syncable, and versionable. |
| Build | TypeScript checking plus esbuild | The production command checks TypeScript and bundles the plugin into generated `main.js`. |
| Test runner | Vitest | Parser, validator, and transformation behavior is tested without loading Obsidian. |
| Package management | npm with `package-lock.json` | The repository uses `npm ci` for reproducible installation. |
| Compatibility | Obsidian 1.1.0 or later, `isDesktopOnly: false` | The manifest declares the minimum version and does not require desktop only APIs. |

## Current architecture

### Pure flow engine

The `src/flow` module has no Obsidian import and owns all interpretation of the Dynamic Notes Markdown format.

| Area | Responsibility |
|---|---|
| `src/flow/parser.ts` | Reads version 1 frontmatter, region markers, block markers, fences, nesting, order, matching identifiers, and structural marker errors. Returns parsed offsets and raw block text. |
| `src/flow/validator.ts` | Enforces whole document invariants after parsing, including content outside blocks, duplicate identifiers, the maximum current block count, and the relationship between empty `now` and nonempty `later`. |
| `src/flow/transform.ts` | Runs parse then validation, computes pure Advance and Reset replacements, and returns full Markdown results plus cursor offsets. It does not read files, write files, display notices, or call Obsidian. |
| `src/flow/types.ts` | Defines regions, blocks, parsed documents, errors, and transformation result types. |
| `src/flow/index.ts` | Exposes the public flow engine functions and types. |

The engine returns `FlowResult` values for expected malformed input. It does not throw for ordinary parse or validation failures. A transformation result is only returned after both parsing and validation succeed.

### Obsidian integration

`src/main.ts` owns the plugin lifecycle and all Obsidian specific effects.

1. `onload` registers the Advance, Reset flow, and Validate active note commands. It also registers the Advance ribbon action.
2. `whenActiveMarkdownView` limits command availability to an active `MarkdownView` with a file.
3. Validation reads editor text in Editing view and uses `vault.read` in Reading view, then reports the pure engine result.
4. Editing view transformations read from the editor, call the pure engine, apply one `editor.setValue` operation, place the cursor from the returned offset when available, and display a notice.
5. Reading view transformations call `vault.process`. The callback receives the current file text, calls the pure engine, and returns the replacement text only on success. An expected invalid or complete result aborts the callback without a write.
6. Unexpected Reading view errors are logged and reported with a general failure notice.

The boundary is therefore simple. The flow engine decides whether a document is valid and what its replacement text is. `src/main.ts` decides how to obtain that text, how to apply a successful result, and how to communicate with the user.

## Persistent Markdown contract

### Opt in and version

A note is eligible for Dynamic Notes only when its first line is `---`, its frontmatter closes with a line containing `---`, and the frontmatter contains exactly one `dynamic-notes: 1` property. The property value is the format version and the opt in marker. Missing, duplicated, or non version 1 values are rejected. Other frontmatter properties are not interpreted by the flow engine.

### Regions

The note contains one region of each type, in this exact order: `now`, `later`, then `done`.

```markdown
<!-- dynamic-notes:now -->
...
<!-- /dynamic-notes:now -->

<!-- dynamic-notes:later -->
...
<!-- /dynamic-notes:later -->

<!-- dynamic-notes:done -->
...
<!-- /dynamic-notes:done -->
```

Region marker lines may have surrounding whitespace and the marker comments may have the parser's permitted internal whitespace. Human headings and other content outside the managed region markers are not interpreted by the engine.

### Blocks

A block is a matching pair of marker lines with an identifier matching `[a-z0-9][a-z0-9-]*`.

```markdown
<!-- dynamic-notes:block:morning -->
### Morning
- [ ] Review the day
<!-- /dynamic-notes:block:morning -->
```

Identifiers are lowercase ASCII letters, digits, and hyphens, with a lowercase letter or digit first. Every identifier must be unique across all three regions. Blocks cannot be nested, and a block marker outside a region is invalid.

Block contents are opaque Markdown. The engine does not interpret headings, lists, task state, links, embeds, callouts, tables, indentation, or content inside a block. The parsed `rawText` preserves the block markers and the text between them. Transformations move that raw block text rather than serializing a Markdown object model.

### Parsing assumptions

1. Structural markers must occupy their own logical line. A marker embedded in ordinary text is not a structural marker.
2. The parser is line oriented and stateful. It tracks an open region, an open block, and fenced code state.
3. Fenced code blocks beginning with up to three spaces and using at least three backticks or tildes suppress Dynamic Notes marker recognition until their matching fence closes. Marker looking text inside such a fence is treated as block content.
4. An unknown Dynamic Notes structural comment on a non fenced line is rejected rather than ignored.
5. Indented Markdown code blocks are not handled as fenced code state. A marker looking line in an indented code block can therefore be interpreted as a structural marker. This is the separately tracked parser defect and is not a supported way to embed Dynamic Notes marker examples.

## Validation and fail closed behavior

After parsing, `validateFlowDocument` requires all of the following:

1. Each managed region contains only whitespace and complete blocks outside the block ranges.
2. Region order and all marker pairing rules have already passed parsing.
3. Every block identifier is unique across `now`, `later`, and `done`.
4. `now` contains at most one block.
5. If `now` is empty, `later` must also be empty. This is the released representation of a complete flow.

Parsing also refuses missing or unsupported frontmatter, missing or duplicate regions, wrong region order, unclosed or mismatched regions, unknown structural markers, blocks outside regions, nested blocks, unclosed blocks, and mismatched block identifiers.

Advance and Reset both parse and validate before producing a transformation. If either step fails, the engine returns an error and no replacement Markdown. Editing view leaves the editor unchanged. Reading view throws an internal abort from the `vault.process` callback, so the process does not return replacement text to write. The adapter reports the first useful error through an Obsidian notice and logs the detailed message to the console.

An already complete flow is also fail safe. Advance returns `status: complete` and the original Markdown, and the adapter does not write it. Reset is allowed on a valid complete flow and rewrites only the managed region whitespace to its Reset form.

## Advance behavior

Advance uses the current first block in `now` and the first block in `later` as the next queue item.

For a normal active flow it performs this state transition:

```text
now:   current, later items    becomes    next later item
later: next later item, rest   becomes    rest
done:  completed items         becomes    completed items, current
```

The implementation moves the current and next raw text segments with range replacements. It preserves the raw block contents and the surrounding note outside the affected managed ranges. The first later block becomes the current block. Its returned `nextBlockOffset` points to the promoted block in the resulting Markdown.

When `now` has a block and `later` is empty, Advance moves the current block to the end of `done`, leaves both `now` and `later` empty, returns `status: advanced`, and omits the next block offset. The Editing view reports `Flow complete` for this final transition. The Reading view reports `Flow advanced` after its vault process completes.

When both `now` and `later` are empty, Advance returns `status: complete` with the original Markdown. It does not append, normalize, or otherwise write anything.

Advance does not change task checkboxes, headings, links, block identifiers, block body text, frontmatter, or content outside the moved managed ranges. It does not delete completed blocks.

## Reset behavior

Reset first parses and validates the complete document. It reconstructs the queue in this physical order:

```text
all done blocks, then the current now block, then all later blocks
```

The first reconstructed block becomes the only `now` block. All remaining blocks become `later` blocks. The `done` region becomes empty. This means Reset uses the current order in the note; it does not use hidden history or a stored original queue.

Reset preserves every block's `rawText`, including its markers and Markdown body. It normalizes whitespace inside the managed regions by rebuilding those regions with one leading newline, blank lines between blocks, and a trailing blank line. It does not rewrite frontmatter, human headings, or content outside the managed regions. When at least one block is restored, the returned `nextBlockOffset` points at the restored current block. A valid flow with no blocks is still resettable and receives the same managed region normalization with no current offset.

## Invocation and mutation boundary

The user can reach the engine through these current entry points:

1. The `Advance` command is available from an active Markdown view in Editing view or Reading view.
2. The `Reset flow` command is available from an active Markdown view in Editing view or Reading view.
3. The `Validate active note` command is available from an active Markdown view in Editing view or Reading view and never writes.
4. The left ribbon exposes Advance when a Markdown file is active. It reports that a Markdown note must be open when no suitable view exists.

Editing view uses the current `Editor` value and applies a complete successful result with one `setValue` call. This keeps Advance as one ordinary editor operation and updates the cursor from the pure result when a block was promoted or restored.

Reading view reads and updates the active `TFile` through documented vault APIs. Validation uses `vault.read`. Advance and Reset use `vault.process` so the current file text is passed into the pure transformation and the returned text is applied as one vault read modify write operation. No direct filesystem access, shell command, Node.js runtime API, Electron API, or separate state store is used by the plugin.

## Compatibility assumptions and non goals

The manifest declares `minAppVersion` 1.1.0 and `isDesktopOnly` false. The implementation is intended to run on Desktop and Mobile because it uses documented Obsidian APIs and ordinary TypeScript and JavaScript, with no Node.js or Electron runtime dependency. It assumes the active view and vault APIs provide the documented Editing view, Reading view, editor, read, and process behavior described above. Release documentation still calls for a desktop smoke test and a real mobile test when runtime or API behavior changes.

The current product does not provide automatic advancement, scheduling, recurrence, settings for workflow behavior, telemetry, network access, server communication, custom views, drag and drop block ordering, conditional branches, priorities, due dates, dependencies, automatic compression, automatic deletion, multiple simultaneous `now` blocks, or workflow state outside the note. It also does not accept arbitrary non whitespace content inside a managed region, nested Dynamic Notes blocks, unknown structural markers, unsupported format versions, or ambiguous marker structure.

The parser's handling of indented Markdown code blocks is a known separate product defect. This specification records the current behavior so maintenance work does not mistake it for an intentional compatibility guarantee. Fixing it belongs to the separately tracked defect, not to this normalization slice.

## Historical documentation differences

`DESIGN.md` is explicitly labeled as the historical version 0.1 design. These statements no longer describe the released 0.2.1 product:

| Historical statement | Current released behavior |
|---|---|
| Version 0.1 should register exactly two user commands. | Version 0.2.1 registers Advance, Reset flow, and Validate active note, plus a ribbon action for Advance. |
| The current `now` block is required while the workflow is active. | A valid completed flow has empty `now` and `later` regions, and Advance reports completion without writing. |
| The active editor is the primary execution context. | Advance, Reset, and validation also operate from Reading view through vault APIs. |
| The version 0.1 design is the complete product scope. | Version 0.2.0 added Reset and its tests, and version 0.2.1 changed the validation command wording. |
| The original examples and framing are daily flow material. | Version 0.1.1 generalized the product to workflows in any Markdown note. |
| The suggested validation success message is `Dynamic Notes: note is valid`. | The released adapter displays `Note is valid` on success and prefixes validation errors with `Dynamic Notes:`. |

The historical document remains valuable for the original rationale and safety principles. When it conflicts with this specification, the current implementation and its tests are authoritative for version 0.2.1.

## Consequences

**Positive**:

1. Future changes have one current architecture and Markdown contract to consult.
2. The pure engine remains testable without Obsidian and the side effect boundary remains visible.
3. User owned Markdown remains the durable workflow state, with block content preserved through transformations.
4. Fail closed behavior is explicit for both malformed notes and already complete flows.

**Negative or tradeoffs**:

1. The specification must be updated whenever released parser or transformation behavior changes.
2. Reset intentionally normalizes managed region whitespace, so Reset is not a byte identical operation even though block text is preserved.
3. Reading view relies on the documented behavior of `vault.process`, while Editing view relies on editor replacement and undo behavior.
4. The parser is deliberately narrow. Notes that need unsupported structure must remain unchanged until the format is intentionally extended.

**Neutral**:

1. Generated `main.js` remains a release artifact and is not part of the source architecture.
2. `package.json`, `manifest.json`, `versions.json`, and release tags remain release metadata concerns rather than note state.

## Follow up

1. Keep the indented Markdown code block parser defect as a separate product task. Do not fix or expand its contract as part of this specification.
2. Keep this specification current when a future release intentionally changes the persistent format, validation invariants, or transformation behavior.
