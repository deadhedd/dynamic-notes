# Dynamic Notes release checklist

Dynamic Notes is prepared for an initial 0.1.0 public release, but it is not published or submitted by this repository change.


## Version and compatibility

- manifest.json and package.json must use the same release version.
- This initial release is 0.1.0.
- minAppVersion is 1.1.0 because Dynamic Notes uses Vault.process(), which is documented as available since Obsidian 1.1.0.
- versions.json maps 0.1.0 to 1.1.0. It is included so Obsidian can choose the newest compatible release as later versions raise the minimum app version.

## Before publishing

- [ ] Review README.md, DESIGN.md, manifest.json, package.json, and this checklist.
- [ ] Confirm https://github.com/deadhedd/dynamic-notes is public.
- [ ] Run npm install, npm test, npm run lint, and npm run build from a clean checkout.
- [ ] Perform a final desktop test in a dedicated vault.
- [ ] Perform a final real-mobile test.
- [ ] Confirm manifest.json and package.json both say 0.1.0.
- [ ] Commit release-preparation changes.
- [ ] Push the default branch.

## Create the 0.1.0 release

- [ ] Create and push the exact tag 0.1.0. Do not prefix it with v.
- [ ] Confirm the Release Obsidian plugin GitHub Actions workflow succeeds.
- [ ] Confirm GitHub creates a draft release named 0.1.0.
- [ ] Confirm the draft release has main.js and manifest.json attached. No styles.css is expected because the plugin has no styles.
- [ ] Review the release notes and publish the GitHub Release.
- [ ] Test installation from the release assets in a separate vault.

The release tag must match manifest.json exactly. Obsidian installs main.js, manifest.json, and styles.css if present from the matching GitHub Release.

## Submit to Obsidian Community Plugins

- [ ] Sign in at https://community.obsidian.md.
- [ ] Link the GitHub account that owns the repository.
- [ ] Choose Plugins, then New plugin.
- [ ] Submit https://github.com/deadhedd/dynamic-notes.
- [ ] Review and agree to the current developer policies.
- [ ] Address automated or human reviewer feedback.

Official references:

- [Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin)
- [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin%20guidelines)
- [Manifest reference](https://docs.obsidian.md/Reference/Manifest)
- [Obsidian Community directory](https://community.obsidian.md)
