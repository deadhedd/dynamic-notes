# Daily Flow

Daily Flow is an experimental private Obsidian plugin that turns three structured regions in a daily note into a small, local workflow: **Now → Done**, then **Later → Now**. Markdown remains the only workflow state.

Use it in a dedicated test vault before considering a production vault.

## Install in a test vault

1. From this directory, run `npm install` and `npm run build`.
2. Create `<test-vault>/.obsidian/plugins/daily-flow/`.
3. Copy `manifest.json` and the generated `main.js` into that directory.
4. In Obsidian, enable Community plugins, then enable **Daily Flow**.

For development, run `npm run dev`, which rebuilds the plugin when source files change. Run `npm test` for the pure engine tests.

## Required note structure

```markdown
---
daily-flow: 1
---

<!-- daily-flow:now -->
<!-- daily-flow:block:morning -->
## Morning
- [ ] First task
<!-- /daily-flow:block:morning -->
<!-- /daily-flow:now -->

<!-- daily-flow:later -->
<!-- daily-flow:block:yard-work -->
## Yard work
<!-- /daily-flow:block:yard-work -->
<!-- /daily-flow:later -->

<!-- daily-flow:done -->
<!-- /daily-flow:done -->
```

Structural markers must be on their own lines. The regions must occur exactly once and in `now`, `later`, `done` order. Block IDs use lowercase letters, digits, and hyphens and must be unique. Only whitespace and complete blocks may appear inside a managed region.

## Commands

- **Daily Flow: Validate current note** validates the active note without making changes.
- **Daily Flow: Advance** validates first, moves the current `now` block to the end of `done`, and promotes the first `later` block. If no later block remains, it completes the flow.

Both commands work in Reading view as well as Edit view. In Edit view, a successful advance is applied as one editor update and should be reversible with one ordinary Obsidian undo. In Reading view, the plugin uses Obsidian’s atomic vault update API; use Obsidian’s normal file-history/versioning facilities if you need to revert it.

The left ribbon also includes a **Daily Flow: Advance** button. It runs the same operation on the active note.

Malformed or ambiguous notes are never changed.
