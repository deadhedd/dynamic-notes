# Daily Flow implementation notes

This directory implements version 0.1 of the Daily Flow design in the repository-root [design document](../Daily-Flow-DESIGN.md).

The implementation deliberately has two layers:

- `src/flow/` is a pure Markdown parser, validator, and transformation engine. It stores no workflow state and does not import Obsidian.
- `src/main.ts` only registers the two commands, reads the active view, applies a known-good whole-document result, and reports notices. Edit view uses the Editor API; Reading view uses `Vault.process()` for an atomic file update.

The v0.1 contract is fail-closed: parsing or validation errors never produce a replacement document. Code fences are ignored while scanning for structural markers. The advance operation moves raw block ranges, including the whitespace that follows a moved block, so block contents are not reserialized or normalized.

No automatic advancement, file watching, settings, editor widgets, network communication, or Node/Electron runtime API is included.
