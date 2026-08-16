# Dynamic Notes

Dynamic Notes is an early-stage Obsidian plugin for moving structured Markdown blocks through small, local workflows in any note. It moves blocks through three managed regions:

    Now -> Done
    Later -> Now

Markdown is the source of truth. Dynamic Notes keeps no hidden per-note state, has no network dependency, and makes ordinary Markdown changes that remain readable, syncable, and versionable without the plugin.

## Example use cases

- Project workflows that promote the next scoped task when the current one is complete.
- Procedures and checklists that reveal one step at a time.
- Study sequences that move the next topic into focus.
- Maintenance routines that preserve completed work as a record.
- Daily notes, where the same workflow can guide the current part of the day.

## Features

- Dynamic Notes: Validate current note checks a note before any change is made.
- Dynamic Notes: Advance moves the current Now block to Done and promotes the first Later block.
- Dynamic Notes: Reset flow restores the original queue: completed blocks first, then the current block and the remaining Later blocks.
- The Advance command works in Reading and Edit view, and is also available from the left ribbon.
- Edit-view advances are applied as one editor update and can normally be undone with one ordinary Obsidian undo.
- The plugin uses documented Obsidian APIs and has no Node.js or Electron runtime dependency, so it is designed for mobile compatibility.

Dynamic Notes intentionally does not add automatic advancement, scheduling, recurrence, settings, telemetry, network access, or workflow state outside the note.

## Markdown format

A dynamic note opts in with frontmatter and contains exactly one Now, Later, and Done region in that order:

    ---
    dynamic-notes: 1
    ---

    ## Now

    <!-- dynamic-notes:now -->

    <!-- dynamic-notes:block:morning -->
    ### Morning
    - [ ] Review the day
    <!-- /dynamic-notes:block:morning -->

    <!-- /dynamic-notes:now -->

    ## Later

    <!-- dynamic-notes:later -->

    <!-- dynamic-notes:block:work -->
    ### Work
    - [ ] Begin primary task
    <!-- /dynamic-notes:block:work -->

    <!-- /dynamic-notes:later -->

    ## Done

    <!-- dynamic-notes:done -->

    <!-- /dynamic-notes:done -->

The region and block markers must each be on their own line. Block IDs must be unique, non-empty, lowercase identifiers made from letters, digits, and hyphens. Managed regions may contain only whitespace and complete Dynamic Notes blocks.

Dynamic Notes validates the whole structure before modifying a note. If it finds an unsupported version, missing or mismatched marker, duplicate ID, nested block, extra current block, or unrelated content in a managed region, it reports an actionable error and leaves the note unchanged.

## Usage

1. Create or open a note using the format above.
2. Run Dynamic Notes: Validate current note from the Command palette to confirm the note is valid.
3. Run Dynamic Notes: Advance to complete the current block and promote the next one.
4. Run Dynamic Notes: Reset flow to restart the queue. It preserves each block's Markdown while normalizing whitespace inside managed regions.
5. Optionally assign hotkeys to Dynamic Notes commands in Obsidian settings, or use the left-ribbon Advance button.

In Reading view, Advance uses Obsidian's atomic vault update API. Use Obsidian file history, Sync version history, or Git to revert a Reading-view advance if needed.

## Installation

Install Dynamic Notes from the Obsidian Community Plugins directory:

1. Open **Settings → Community plugins** in Obsidian.
2. Select **Browse**, search for **Dynamic Notes**, then select **Install**.
3. Enable Dynamic Notes after installation.

## Manual development installation

For private testing or development, build the release files:

       npm install
       npm run build

Then copy `main.js` and `manifest.json` into:

       <vault>/.obsidian/plugins/dynamic-notes/

There is no `styles.css` because Dynamic Notes does not use custom styles. Enable the plugin in Obsidian and reload it after each development rebuild.

Use a dedicated test vault before relying on any early-stage plugin with important notes.

## Development

    npm install
    npm test
    npm run lint
    npm run build

The pure parser, validator, and transformation engine are in src/flow. Their automated tests include validation failures and Markdown-to-Markdown golden fixtures.

## Status

Dynamic Notes is in the 0.1.x early-release stage. It is suitable for careful testing, not a promise of long-term format stability.

## License

Dynamic Notes is released under the [MIT License](LICENSE).

## Design

The complete format contract, safety model, architecture, and version 0.1 scope are in [DESIGN.md](DESIGN.md).
