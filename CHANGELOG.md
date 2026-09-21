# Changelog

All notable changes to **Dynamic Notes** are documented here.

This changelog was reconstructed from the repository's Git history and existing release metadata.

## 0.2.1 - 2026-09-21

### Changed

- Updated the validation command text to **Dynamic Notes: Validate active note** to match Obsidian terminology.

## 0.2.0 - 2026-08-16

### Added

- Added **Dynamic Notes: Reset flow** to restore a workflow queue to its starting order.
- Reset reconstructs the queue from completed blocks first, followed by the current block and remaining Later blocks.
- Added reset support in both Edit and Reading views.
- Added reset transformation tests and command integration coverage.

### Changed

- Reset preserves each block's Markdown while normalizing whitespace inside managed regions.
- After a reset, the restored current block becomes the active Now block when work remains.

## 0.1.1 - 2026-08-10

### Changed

- Generalized Dynamic Notes from a daily-note-specific tool into a workflow mechanism for any Markdown note.
- Updated plugin metadata, README, and design documentation to remove unnecessary daily-note-specific framing.
- Standardized terminology around **dynamic notes** instead of **flow notes**.
- Updated installation documentation for availability through Obsidian Community Plugins.

This release contained no functional behavior changes.

## 0.1.0 - 2026-08-10

### Added

- Initial public release of Dynamic Notes for Obsidian.
- Added opt-in Markdown workflows built around **Now**, **Later**, and **Done** managed regions.
- Added movable Markdown blocks whose contents are treated as opaque Markdown and preserved when moved.
- Added the validation command to check the complete managed structure without modifying the note.
- Added **Dynamic Notes: Advance** to move the current Now block to Done and promote the first Later block into Now.
- Added support for Advance in both Edit and Reading views, including a ribbon action.
- Added conservative parsing and validation that fails closed on malformed, ambiguous, nested, duplicated, or otherwise invalid workflow structures.
- Added a Markdown-first state model with no hidden per-note database or server dependency.
- Added a standalone parser, validator, and transformation layer separated from Obsidian-specific integration.
- Added automated parser, validation, and Markdown transformation tests.
- Added CI for tests, linting, and release builds.
- Added tag-driven GitHub release automation for Obsidian plugin assets.
- Added desktop/mobile-compatible implementation using documented Obsidian APIs without Node.js or Electron runtime dependencies.

### Changed

- Renamed the original **Daily Flow** project to **Dynamic Notes** for public release.
- Renamed the persistent Markdown format from `daily-flow` markers to `dynamic-notes` markers.
