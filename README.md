# Dynamic Notes

Private tools and experiments for operating a Markdown-first note system.

## Daily Flow

[Daily Flow](daily-flow/) is the first project in this repository: an experimental Obsidian plugin that moves complete Markdown blocks through a daily note in a small, deliberate workflow:

    Now -> Done
    Later -> Now

The note itself is the source of truth. The plugin keeps no hidden per-note state, requires no server, and changes ordinary Markdown that can be understood, synced, and versioned without the plugin.

## What it does

A Daily Flow note has three managed regions: now, later, and done. The plugin validates the entire structure before making any change.

- Advance moves the single current block from now to the end of done.
- It then promotes the first later block into now.
- When later is empty, advancing the final current block completes the flow.
- Validate current note checks the active note without changing it.
- The Advance command works in both Reading and Edit view, and is also available from the left ribbon.

Malformed or ambiguous notes fail closed: the plugin reports the first actionable problem and does not modify the note.

## Quick start

1. Use a dedicated Obsidian test vault.
2. Build the plugin from [daily-flow](daily-flow/):

       npm install
       npm run build

3. Copy daily-flow/manifest.json and the generated daily-flow/main.js to:

       <test-vault>/.obsidian/plugins/daily-flow/

4. Enable Community plugins and then enable Daily Flow in Obsidian.
5. Reload the plugin after each rebuild.

See the [Daily Flow README](daily-flow/README.md) for the required note format and its command behavior.

## Development

From daily-flow:

    npm test
    npm run build
    npm run dev

The core parser, validator, and transformation engine live in daily-flow/src/flow and do not depend on Obsidian. Tests include validation cases and Markdown-to-Markdown golden transformation fixtures.

## Safety and scope

Daily Flow version 0.1 is intentionally limited. It does not watch files, respond to checkboxes automatically, use timers, store workflow state outside Markdown, contact a server, or add an editor extension.

For the full format contract, architectural rationale, and v0.1 requirements, read the [design document](Daily-Flow-DESIGN.md).
