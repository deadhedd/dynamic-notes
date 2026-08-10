# Dynamic Notes — Obsidian Plugin Design

**Status:** Initial design / implementation target  
**Document version:** 0.1  
**Date:** 2026-08-09  
**Intended audience:** Project owner and Codex  
**Distribution:** Private plugin during early development

---

## 1. Purpose

Dynamic Notes is an Obsidian plugin for making any note behave like a changing operational interface rather than a large static document.

The central problem is that a conventional note can present too much information at once. Information that mattered during an earlier stage of a workflow continues occupying attention after it is no longer relevant, while later work competes for space before it is useful.

Dynamic Notes solves this by allowing structured Markdown blocks to move through a small workflow inside the note:

1. **Now** — the block currently relevant.
2. **Later** — blocks waiting to become relevant.
3. **Done** — completed blocks retained for the record.

The plugin performs local, immediate edits inside Obsidian. Existing sync and Git infrastructure remains responsible only for propagating and versioning the resulting Markdown changes.

---

## 2. Core Design Principle

> **Markdown is the source of truth.**

The plugin must not maintain hidden per-note workflow state in a database, plugin data file, local storage, or server-side service.

If the Markdown says a block is in `Now`, then it is current.

This has several important consequences:

- A note remains understandable without the plugin.
- A note can be edited manually.
- Git history records actual workflow transitions.
- Sync remains ordinary file synchronization.
- Reinstalling or disabling the plugin does not destroy workflow state.
- Multiple devices can independently understand the same note after sync.
- The plugin does not depend on the user's server being reachable.

Plugin settings may eventually store global preferences, but **the state of an individual note must remain in the Markdown file itself**.

---

## 3. Scope of Version 0.1

Version 0.1 is intentionally narrow.

It must implement only enough functionality to prove that structured Markdown blocks can be safely and predictably moved through a note.

### 3.1 Required capabilities

Version 0.1 must:

- identify an opted-in Dynamic Notes note;
- parse three workflow regions: `Now`, `Later`, and `Done`;
- parse movable blocks contained within those regions;
- validate the document structure before writing;
- provide a command to validate the active note;
- provide a command to advance the flow;
- move the current block from `Now` to the end of `Done`;
- move the first block from `Later` into `Now`;
- refuse to modify malformed or ambiguous notes;
- display a useful Obsidian notice when an operation succeeds or fails;
- work without Node.js or Electron APIs;
- keep the transformation engine separate from Obsidian-specific integration;
- include automated tests for parsing, validation, and transformation.

### 3.2 Explicit non-goals for version 0.1

Do **not** implement any of the following yet:

- automatic advancement when a checkbox is checked;
- file watchers;
- timers or time-of-day behavior;
- server communication;
- custom views or sidebars;
- drag-and-drop block reordering;
- visual block controls embedded in the editor;
- CodeMirror editor extensions;
- custom Markdown rendering;
- conditional branches;
- priorities;
- due dates;
- recurrence;
- block dependencies;
- automatic compression of completed blocks;
- automatic deletion of ephemeral blocks;
- settings UI unless strictly required;
- multiple simultaneous `Now` blocks;
- workflow state stored outside the Markdown note;
- public Community Plugin packaging or submission work.

These features may be considered later, but Codex must not implement them merely because they appear easy or useful.

---

## 4. Terminology

### Dynamic note

A Markdown note explicitly opted into Dynamic Notes using frontmatter.

### Region

One of three machine-readable areas in the note:

- `now`
- `later`
- `done`

### Block

A machine-readable Markdown unit that may be moved intact between regions.

### Current block

The single block contained within the `now` region.

### Advance

The operation that completes the current block, moves it to `done`, and promotes the first waiting block from `later` into `now`.

---

## 5. Markdown Contract

The Markdown syntax is part of the plugin's persistent data format. It should therefore be simple, explicit, human-readable, and conservatively parsed.

### 5.1 Opt-in frontmatter

A Dynamic Notes note must contain:

```yaml
---
dynamic-notes: 1
---
```

`dynamic-notes: 1` is both an opt-in marker and a format version.

A note without this property must not be modified by Dynamic Notes commands.

Future incompatible syntax may use a later integer such as:

```yaml
dynamic-notes: 2
```

Version 0.1 must recognize only version `1`.

---

## 6. Region Syntax

Regions use HTML comments as machine boundaries.

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

The human-facing headings around them are not semantically significant.

For example, this is valid:

```markdown
## What matters now

<!-- dynamic-notes:now -->
...
<!-- /dynamic-notes:now -->
```

The plugin must not depend on the heading text being `## Now`.

This preserves freedom to change the visible note design without changing the machine format.

---

## 7. Block Syntax

A movable block uses paired HTML comments:

```markdown
<!-- dynamic-notes:block:morning -->

### Morning Startup

- [ ] Take medications
- [ ] Review calendar
- [ ] Choose the first meaningful task

<!-- /dynamic-notes:block:morning -->
```

The block identifier is `morning`.

### 7.1 Block identifier rules

For version 0.1, block IDs must:

- be non-empty;
- use only lowercase ASCII letters, digits, and hyphens;
- begin with a lowercase letter or digit;
- be unique within the note.

Recommended validation pattern:

```text
[a-z0-9][a-z0-9-]*
```

Examples:

```text
morning
yard-work
job-search
evening-1
```

Invalid examples:

```text
Morning
yard_work
yard work
```

### 7.2 Block contents

The parser must treat everything between matching block markers as opaque Markdown.

A block may contain:

- headings;
- paragraphs;
- task lists;
- ordinary lists;
- callouts;
- wikilinks;
- embeds;
- code blocks;
- tables;
- other normal Markdown content.

Version 0.1 does not need to understand the contents.

It only needs to identify and move the entire block safely.

### 7.3 Nested Dynamic Notes blocks

Nested Dynamic Notes blocks are invalid in version 0.1.

The parser must reject them rather than attempt to infer intent.

---

## 8. Canonical Example Note

This example uses a daily note, but the same format works in any Markdown note.

```markdown
---
dynamic-notes: 1
---

# Sunday, August 9, 2026

## Now

<!-- dynamic-notes:now -->

<!-- dynamic-notes:block:morning -->

### Morning Startup

- [ ] Take medications
- [ ] Review calendar
- [ ] Choose the first meaningful task

<!-- /dynamic-notes:block:morning -->

<!-- /dynamic-notes:now -->


## Later

<!-- dynamic-notes:later -->

<!-- dynamic-notes:block:yard-work -->

### Yard Work

Continue blackberry removal.

- [ ] Get changed
- [ ] Gather tools
- [ ] Work approximately one hour

<!-- /dynamic-notes:block:yard-work -->


<!-- dynamic-notes:block:job-search -->

### Job Search

- [ ] Review new jobs
- [ ] Process promising results

<!-- /dynamic-notes:block:job-search -->

<!-- /dynamic-notes:later -->


## Done

<!-- dynamic-notes:done -->

<!-- /dynamic-notes:done -->
```

---

## 9. Version 0.1 State Rules

A valid version 0.1 note must obey all of the following.

### 9.1 Region rules

There must be exactly:

- one `now` region;
- one `later` region;
- one `done` region.

Region markers must:

- be correctly paired;
- not overlap;
- not be nested within one another.

The physical order of the regions should normally be:

```text
now
later
done
```

Version 0.1 should require this canonical order rather than support arbitrary region ordering.

### 9.2 `Now` rules

The `now` region must contain:

- exactly one Dynamic Notes block while the workflow is active; or
- zero blocks only when there is no remaining work to promote.

It must never contain more than one block.

Ordinary whitespace is permitted around the block.

Version 0.1 should reject other non-whitespace content directly inside `now` outside the block. This keeps transformation semantics unambiguous.

### 9.3 `Later` rules

The `later` region may contain zero or more blocks.

Their physical Markdown order is the queue order.

The first block in `later` is the next block to be promoted.

Version 0.1 should allow whitespace between blocks but reject unrelated non-whitespace content directly in the region outside a block.

### 9.4 `Done` rules

The `done` region may contain zero or more blocks.

Completed blocks are appended in completion order.

Version 0.1 should allow whitespace between blocks but reject unrelated non-whitespace content directly inside the region outside blocks.

### 9.5 Block identity rules

Every block ID in the note must be unique.

A duplicate ID is a validation error even if the blocks are in different regions.

### 9.6 Marker-like text inside code fences

A robust parser must not accidentally interpret examples inside fenced code blocks as real Dynamic Notes markers.

If practical in version 0.1, markers occurring inside fenced Markdown code blocks should be ignored.

If Codex determines that reliably supporting this would substantially complicate the initial parser, the alternative is to document that literal Dynamic Notes marker examples are not allowed inside flow-note code fences and to add a failing validation case. Do not silently misparse them.

---

## 10. The `Advance` Operation

`Advance` is the central version 0.1 operation.

### 10.1 Preconditions

Before modifying the note, the plugin must confirm:

1. an active Markdown note exists;
2. the note opts in using `dynamic-notes: 1`;
3. the note parses successfully;
4. all structural validation passes;
5. the `now` region contains exactly one current block.

If any precondition fails, no write occurs.

### 10.2 Normal transition

Given:

```text
NOW:
    morning

LATER:
    yard-work
    job-search

DONE:
```

`Advance` produces:

```text
NOW:
    yard-work

LATER:
    job-search

DONE:
    morning
```

Semantically:

```text
current = NOW.block
next = first(LATER.blocks)

remove current from NOW
append current to DONE
remove next from LATER
insert next into NOW
```

### 10.3 Advancing the final block

Given:

```text
NOW:
    evening

LATER:
    [empty]

DONE:
    morning
    yard-work
    job-search
```

`Advance` produces:

```text
NOW:
    [empty]

LATER:
    [empty]

DONE:
    morning
    yard-work
    job-search
    evening
```

The operation succeeds.

The plugin should display a notice such as:

```text
Dynamic Notes complete
```

### 10.4 Advancing an already complete flow

If `now` and `later` are both empty:

- the command must perform no write;
- the command should report that the flow is already complete.

### 10.5 Preservation requirement

Blocks must move intact.

`Advance` must not:

- rewrite task states;
- normalize Markdown inside the block;
- rename headings;
- alter links;
- modify indentation inside the block;
- remove comments other than moving the defined block markers with the block;
- change block IDs.

Formatting changes outside the exact movement necessary for the transition should be minimized.

---

## 11. Fail-Closed Behavior

> **Ambiguity means no write.**

This is a foundational safety rule.

The plugin is allowed to transform a note only after the entire relevant structure has been parsed and validated.

Examples that must cause the operation to abort:

- missing frontmatter opt-in;
- unsupported `dynamic-notes` version;
- missing region;
- duplicate region;
- overlapping region markers;
- unclosed region;
- nested region;
- mismatched block start/end IDs;
- unclosed block;
- nested Dynamic Notes block;
- duplicate block ID;
- multiple blocks in `now`;
- unknown Dynamic Notes structural marker;
- non-whitespace free content in a managed region outside a block;
- any parser state the implementation cannot interpret deterministically.

On failure:

1. do not modify the note;
2. display a concise Obsidian Notice;
3. log a more detailed diagnostic to the developer console if useful.

Example user-facing errors:

```text
Dynamic Notes: missing `later` region
```

```text
Dynamic Notes: block `morning` is not closed
```

```text
Dynamic Notes: `now` contains 2 blocks
```

```text
Dynamic Notes: duplicate block ID `yard-work`
```

The plugin should report the first clearly actionable error rather than dump internal parser state into the UI.

---

## 12. Commands

Version 0.1 should register exactly two user commands.

### 12.1 `Dynamic Notes: Advance`

Purpose:

- validate the active Dynamic Notes note;
- perform the advance transformation;
- write the transformed Markdown as one logical edit;
- report the result.

The command should only be available when an active Markdown editor exists.

Do not assign a default hotkey.

The user can assign one in Obsidian settings.

### 12.2 `Dynamic Notes: Validate current note`

Purpose:

- parse and validate the active note;
- make no changes;
- display success or the first actionable validation error.

Success notice:

```text
Dynamic Notes: note is valid
```

This command is important during template development and manual troubleshooting.

---

## 13. Obsidian Integration

The Obsidian-specific layer should be intentionally thin.

Responsibilities:

- register commands during plugin load;
- obtain the active Markdown note/editor;
- read current note text;
- pass text into the pure Dynamic Notes engine;
- apply a successful transformation;
- display Notices;
- optionally log developer diagnostics.

It should not contain parsing or workflow semantics that belong in the core engine.

### 13.1 Editing strategy

The active editor is the primary version 0.1 execution context.

Preferred implementation goal:

- calculate the complete transformation in pure code first;
- only after validation succeeds, apply the result as one logical editor operation.

Use the documented Obsidian Editor API where practical so the user receives normal editor behavior, including a sensible undo path.

If the implementation instead requires file-level transformation, `Vault.process()` is the documented atomic read-modify-write API and should be preferred over an independent `read()` followed by `modify()`.

Do not perform a write until the full transformed result is known.

### 13.2 Undo requirement

A successful `Advance` must be reversible with a single ordinary Obsidian undo if the active-editor API supports that reliably.

This must be tested.

If Codex encounters an Obsidian API limitation that prevents a reliable single-step undo while meeting the other safety requirements, document the limitation before choosing a more complex workaround.

### 13.3 Cursor and selection

Version 0.1 should avoid surprising cursor behavior.

Minimum acceptable behavior:

- the editor remains usable after `Advance`;
- the cursor does not end up at an invalid position;
- the note is not unexpectedly scrolled to an unrelated location if avoidable.

Preferred behavior:

- after promotion, position the cursor at or near the beginning of the newly promoted `Now` block.

Do not add substantial complexity solely for cursor perfection in version 0.1.

---

## 14. Architecture

The codebase should separate workflow logic from Obsidian integration.

Recommended conceptual layout:

```text
src/
├── main.ts
├── flow/
│   ├── parser.ts
│   ├── validator.ts
│   ├── transform.ts
│   ├── types.ts
│   └── errors.ts
└── obsidian/
    └── commands.ts
```

Exact filenames are flexible, but the separation is not.

### 14.1 Core engine

The core engine must be testable without loading Obsidian.

Conceptual API:

```ts
parseFlowDocument(text: string): ParseResult
validateFlowDocument(document: FlowDocument): ValidationResult
advanceFlow(text: string): TransformResult
```

An equally clean API is acceptable.

The important constraint is:

> Core parser and transformation tests must not require Obsidian.

### 14.2 Suggested data model

Conceptually:

```ts
type RegionName = "now" | "later" | "done";

interface FlowBlock {
    id: string;
    rawText: string;
    startOffset: number;
    endOffset: number;
}

interface FlowRegion {
    name: RegionName;
    blocks: FlowBlock[];
    startOffset: number;
    endOffset: number;
}

interface FlowDocument {
    version: number;
    now: FlowRegion;
    later: FlowRegion;
    done: FlowRegion;
}
```

This is guidance, not a mandatory exact TypeScript interface.

Preserving offsets or raw text segments will likely help prevent accidental Markdown normalization.

---

## 15. Parser Design Guidance

The parser should be conservative.

A full general-purpose Markdown parser is not required.

A line-oriented parser/state machine is acceptable if it can reliably recognize:

- YAML frontmatter at the beginning of the file;
- Dynamic Notes region markers;
- Dynamic Notes block markers;
- fenced code blocks if support is implemented;
- matching IDs and nesting rules.

Do not parse the document by a chain of broad regular-expression replacements.

Regular expressions may identify individual marker lines, but structural validation should be stateful.

### 15.1 Marker lines

Version 0.1 should require structural markers to occupy their own logical line, allowing surrounding horizontal whitespace.

For example:

```markdown
<!-- dynamic-notes:now -->
```

is valid.

This:

```markdown
Some text <!-- dynamic-notes:now -->
```

should not be treated as a structural marker.

This keeps the grammar deterministic.

### 15.2 Unknown Dynamic Notes markers

If a line appears to be a Dynamic Notes structural marker but is not recognized by version 0.1, validation should fail.

This prevents a future or mistyped marker from being silently ignored.

---

## 16. Formatting Strategy

The plugin should preserve user-authored formatting whenever possible.

The safest strategy is to treat the original file as slices of raw text and perform minimal range movement.

Avoid serializing the whole note from a normalized abstract syntax tree if that would alter:

- blank-line counts;
- indentation;
- list formatting;
- YAML formatting;
- trailing spaces;
- heading style;
- unrelated content.

The expected diff for `Advance` should mostly look like a block being cut from one region and pasted into another.

---

## 17. Mobile Compatibility

Mobile compatibility is a design requirement from the beginning.

The plugin must not depend on:

- Node.js built-ins;
- Electron;
- desktop filesystem APIs;
- shell commands;
- external executables;
- localhost services.

Use Obsidian APIs and ordinary TypeScript/JavaScript.

Set `isDesktopOnly` to `false` in the manifest unless a later verified dependency requires otherwise.

Actual mobile testing may occur after the desktop version works, but version 0.1 architecture must not knowingly prevent mobile use.

---

## 18. Development Environment

Start from the official Obsidian sample plugin/template rather than inventing custom build scaffolding.

The plugin is expected to use:

- TypeScript;
- the current `obsidian` API package/types;
- the sample plugin's supported build pattern;
- npm tooling;
- Git.

Development should occur in a dedicated test vault, not the production vault.

The repository should contain the plugin source and tests.

Compiled build artifacts should follow normal Obsidian plugin conventions.

---

## 19. Testing Requirements

Automated tests are required for the core engine.

At minimum, cover the following.

### 19.1 Parsing and validation

Valid:

- canonical note with one current block;
- empty `later`;
- empty `done`;
- completed flow with all regions empty except `done`;
- arbitrary human headings outside machine markers;
- Markdown contents inside blocks.

Invalid:

- no `dynamic-notes` frontmatter;
- unsupported version;
- missing `now`;
- missing `later`;
- missing `done`;
- duplicate region;
- wrong region order;
- unclosed region;
- overlapping regions;
- mismatched block IDs;
- unclosed block;
- nested block;
- duplicate block ID;
- two blocks in `now`;
- free non-whitespace content directly in a managed region;
- malformed marker;
- unknown Dynamic Notes marker.

### 19.2 Advance transformations

Test:

1. normal promotion;
2. final-block completion;
3. already-complete flow;
4. one waiting block;
5. several waiting blocks;
6. existing completed blocks;
7. block contents containing headings, tasks, wikilinks, callouts, and code;
8. preservation of block raw contents;
9. no mutation on validation error.

### 19.3 Golden-file tests

Prefer several fixture pairs:

```text
tests/fixtures/advance/basic.before.md
tests/fixtures/advance/basic.after.md
```

Then assert:

```text
advance(before) === after
```

Golden tests are especially useful because the desired behavior is literally a Markdown-to-Markdown transformation.

---

## 20. Manual Acceptance Tests

Before version 0.1 is considered usable, manually verify in a dedicated test vault:

### Test A — Basic advance

Starting:

```text
NOW: Morning
LATER: Yard Work, Job Search
DONE: empty
```

Run `Dynamic Notes: Advance`.

Expected:

```text
NOW: Yard Work
LATER: Job Search
DONE: Morning
```

### Test B — Validation failure

Intentionally break a closing block ID.

Run `Advance`.

Expected:

- no text changes;
- clear error Notice.

### Test C — Undo

Run a successful `Advance`.

Immediately invoke Obsidian Undo once.

Expected:

- note returns to its exact prior state.

### Test D — Sync transparency

Advance a note on one device.

Allow the existing sync system to propagate the change.

Expected:

- another device sees ordinary changed Markdown;
- no Dynamic Notes-specific server support is required.

### Test E — Plugin disabled

Disable Dynamic Notes.

Open a dynamic note.

Expected:

- note remains valid, readable Markdown;
- workflow structure can still be understood manually.

### Test F — Mobile architecture

Run or emulate the plugin in Obsidian mobile.

Expected:

- plugin loads without Node/Electron dependency failures;
- validate and advance can operate through supported Obsidian APIs.

---

## 21. Safety and Data-Integrity Requirements

Because the plugin edits notes automatically, data integrity outranks convenience.

The implementation must follow these rules:

1. **Validate before write.**
2. **Never partially apply an advance.**
3. **Never guess at malformed structure.**
4. **Never silently discard user Markdown.**
5. **Never normalize unrelated note content.**
6. **Make successful edits undoable where the Obsidian API permits.**
7. **Do not write hidden workflow state elsewhere.**
8. **Do not require network access.**
9. **Do not automatically repair malformed notes in version 0.1.**
10. **Keep transformations deterministic.**

Given identical input Markdown, `Advance` should always produce identical output Markdown.

---

## 22. Proposed Version 0.1 Repository Deliverables

Codex should produce:

```text
./
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── src/
│   ├── main.ts
│   └── ...
├── tests/
│   └── ...
├── DESIGN.md
└── README.md
```

The exact sample-plugin-generated support files may differ.

### README scope

The initial README only needs:

- what Dynamic Notes is;
- how to install it privately in a test vault;
- the required Markdown structure;
- the two commands;
- development/build/test commands;
- a warning that the plugin is experimental and should be tested outside the production vault.

Do not spend time producing public-facing marketing documentation.

---

## 23. Implementation Sequence

Codex should build version 0.1 in this order.

### Phase 1 — Project scaffold

- create project from official Obsidian sample-plugin conventions;
- define manifest;
- configure build;
- configure test runner;
- ensure plugin loads in a test vault.

### Phase 2 — Pure parser

- parse frontmatter opt-in/version;
- recognize region markers;
- recognize block markers;
- preserve offsets/raw text;
- emit structured parse errors.

No Obsidian editing yet.

### Phase 3 — Validation

Implement all version 0.1 structural invariants.

Build invalid fixtures before transformation work.

### Phase 4 — Pure transformation

Implement:

```text
advanceFlow(markdown)
```

against fixture tests.

No file writes from transformation code.

### Phase 5 — Obsidian commands

Implement:

- `Dynamic Notes: Validate current note`
- `Dynamic Notes: Advance`

Connect the active editor to the pure engine.

### Phase 6 — Undo and editor behavior

Verify:

- one-step undo;
- cursor behavior;
- no accidental scrolling;
- no editor desynchronization.

Adjust the write mechanism if necessary.

### Phase 7 — Mobile check

Verify the implementation contains no Node/Electron dependency and test using Obsidian's mobile emulation or a mobile installation.

### Phase 8 — Private trial

Only after automated and manual tests pass, install into the real vault for limited use.

---

## 24. Future Design Directions — Not Yet Implemented

These ideas motivate the architecture but are deliberately deferred.

### 24.1 Additional block operations

Potential future commands:

```text
Dynamic Notes: Complete current
Dynamic Notes: Defer current
Dynamic Notes: Skip current
Dynamic Notes: Move block up
Dynamic Notes: Move block down
```

Possible semantics:

- **Complete** — move current block to `done` and promote next.
- **Defer** — move current block to the end of `later` and promote next.
- **Skip** — behavior to be defined; likely differs from completion.
- **Reorder** — alter queue order without changing workflow state.

Do not assume exact semantics until separately designed.

### 24.2 Block disposition

Future blocks may declare how they behave when completed:

```text
keep
compress
discard
```

For example:

- routine morning boilerplate may disappear;
- exercise may compress into a history line;
- project work may remain intact.

No disposition syntax is defined in version 0.1.

### 24.3 Automatic advancement

A future version may observe a special task such as:

```markdown
- [x] Complete phase
```

and call the same core transformation used by the manual `Advance` command.

Automatic behavior should be layered on top of the proven command, not implemented as a separate workflow engine.

### 24.4 Rich editor UI

Possible future features:

- clickable Complete/Defer controls;
- status indicators;
- context menu actions;
- drag-and-drop reordering;
- a compact flow overview.

These may require CodeMirror extensions or custom UI.

They are not needed to prove the core concept.

### 24.5 Multiple flows

Future versions might allow a note to contain more than one independent flow.

Version 0.1 explicitly supports one flow per note.

---

## 25. Open Questions Reserved for Later Design

The following are intentionally unresolved and should not block version 0.1:

- Should completed boilerplate be retained, compressed, or discarded?
- What exact semantics should `Defer` and `Skip` have?
- Should completion be triggered by a special checkbox?
- Should the newly promoted block automatically receive cursor focus?
- Should blocks have metadata beyond an ID?
- Should the plugin create or repair region scaffolding?
- Should ordinary Markdown be allowed between blocks within managed regions?
- Should future versions support multiple current blocks?
- Should future versions integrate with Obsidian note creation/templates?
- What UI, if any, should appear directly in Live Preview?

Codex must not resolve these by adding features to version 0.1.

---

## 26. Definition of Done for Version 0.1

Version 0.1 is complete when all of the following are true:

- the plugin builds from a clean checkout;
- the plugin loads in a dedicated Obsidian test vault;
- a canonical `dynamic-notes: 1` note validates;
- malformed notes fail closed;
- `Advance` correctly moves blocks through `Now → Done` and `Later → Now`;
- advancing the final block leaves `Now` and `Later` empty;
- no user Markdown is lost during tested transformations;
- the core parser/validator/transformer has automated tests;
- golden transformation fixtures pass;
- one successful Advance can be undone cleanly in Obsidian;
- the implementation does not depend on Node.js or Electron runtime APIs;
- the Markdown remains intelligible with the plugin disabled;
- no server-side component is required;
- no hidden per-note workflow state exists;
- README instructions are sufficient to install and test the private plugin.

At that point, stop.

Do not begin version 0.2 features until the real-world behavior of version 0.1 has been evaluated.

---

## 27. Codex Implementation Directive

When using this document as a Codex specification:

> Implement the smallest reliable version of Dynamic Notes that satisfies the Version 0.1 requirements in this document. Treat the Markdown contract, fail-closed behavior, source-of-truth rule, separation between pure transformation logic and Obsidian integration, mobile-compatible architecture, and explicit non-goals as requirements. Do not add speculative features. When an Obsidian API detail is uncertain, verify it against current official Obsidian developer documentation rather than inventing an API. Prefer simple, testable code and exact Markdown preservation over clever abstractions.

---

## 28. Current Official References

These were current when this design document was written.

- Obsidian Developer Documentation  
  https://docs.obsidian.md/

- Build a plugin  
  https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin

- Official Obsidian sample plugin  
  https://github.com/obsidianmd/obsidian-sample-plugin

- Commands  
  https://docs.obsidian.md/Plugins/User+interface/Commands

- Vault API and `Vault.process()`  
  https://docs.obsidian.md/Plugins/Vault  
  https://docs.obsidian.md/Reference/TypeScript+API/Vault/process

- Editor API  
  https://docs.obsidian.md/Reference/TypeScript+API/Editor

- `Editor.transaction()`  
  https://docs.obsidian.md/Reference/TypeScript+API/Editor/transaction

- Mobile development  
  https://docs.obsidian.md/Plugins/Getting+started/Mobile+development

- Editor extensions  
  https://docs.obsidian.md/Plugins/Editor/Editor+extensions

---

# Design Summary

Dynamic Notes version 0.1 is not a scheduling system, task manager, or custom Obsidian interface.

It is a **safe, local Markdown state-transition tool**.

Its job is simple:

```text
NOW       → DONE
first LATER → NOW
```

The Markdown file contains the state.  
The plugin performs the transformation.  
Obsidian provides the interaction.  
Existing sync/Git infrastructure propagates and records the resulting edit.

Everything else comes later.
