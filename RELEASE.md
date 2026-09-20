# Dynamic Notes release checklist

Use this checklist for each Dynamic Notes release. The GitHub Actions release workflow builds and verifies the plugin, checks that the Git tag matches `manifest.json`, and creates a draft GitHub release with the required Obsidian plugin assets.

## Prepare the release

- [ ] Review `README.md`, `CHANGELOG.md`, `manifest.json`, `package.json`, `versions.json`, and this checklist.
- [ ] Choose the release version using semantic versioning.
- [ ] Update `manifest.json` and `package.json` to the same version.
- [ ] Add the release version and minimum supported Obsidian version to `versions.json`.
- [ ] Verify that `minAppVersion` reflects the oldest Obsidian version actually supported by this release.
- [ ] Update `CHANGELOG.md` with the release changes.
- [ ] Confirm `main.js` is not committed to the repository.

## Verify the release

From a clean checkout:

```sh
npm ci
npm test
npm run lint
npm run build
```

Then:

- [ ] Confirm all tests pass.
- [ ] Confirm lint passes.
- [ ] Confirm the production build succeeds and generates `main.js`.
- [ ] Perform a desktop smoke test in a dedicated vault.
- [ ] Perform a real mobile test when the release affects runtime behavior or Obsidian API usage.
- [ ] Confirm the plugin still works without network access or hidden per-note state.

## Create the release

- [ ] Commit and push the release-preparation changes to the default branch.
- [ ] Create and push a Git tag that exactly matches the version in `manifest.json`.
- [ ] Do not prefix the tag with `v`.
- [ ] Confirm the **Release Obsidian plugin** GitHub Actions workflow succeeds.
- [ ] Confirm GitHub creates a draft release with `main.js` and `manifest.json` attached.
- [ ] Confirm no `styles.css` asset is expected unless the plugin begins using custom styles.
- [ ] Review the generated draft release title and notes.
- [ ] Publish the GitHub release.

The release tag must match `manifest.json` exactly. Obsidian installs `main.js`, `manifest.json`, and `styles.css` when present from the matching GitHub release.

## Verify the published release

- [ ] Download the published `main.js` and `manifest.json` release assets.
- [ ] Install those exact files into a clean test vault.
- [ ] Confirm Dynamic Notes loads and its commands work.
- [ ] Confirm the release appears correctly on GitHub.
- [ ] Confirm `versions.json` and the published release remain consistent.

Dynamic Notes is already listed in the Obsidian Community plugins directory, so ordinary plugin updates are distributed through new GitHub releases rather than a new initial-submission process.

## References

- [Obsidian developer documentation](https://docs.obsidian.md/)
- [Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin)
- [Manifest reference](https://docs.obsidian.md/Reference/Manifest)
- [Obsidian Community directory](https://community.obsidian.md)
