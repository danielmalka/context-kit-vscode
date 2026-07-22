# Changelog

All notable releases are packaged under `releases/context-kit-<version>.vsix`.

## Versioning

- **MAJOR** — breaking changes for extension users
- **MINOR** — new features, backward compatible
- **PATCH** — fixes / docs / packaging only

Bump `package.json` **before** `npm run package` when keeping a build in `releases/`.

## 1.3.0

### Features

- **Activity map:** hide inactive sessions by default; toggle **Show inactive** / **Hide inactive**

## 1.2.0

### Features

- **Orchestrator (M4):** multi-CLI pipeline webview — sequential waves, parallel groups, confirm between waves

## 1.1.0

### Features

- **Activity map live tail (M2):** fs.watch + 3s poll, Live ON/OFF, fingerprint skip for unchanged UI

## 1.0.0

First stable line: core harness + dream polish (activity map M0/M1, coverage, launch pad, update webview). **No** live tail (M2) yet; **no** multi-CLI orchestrator (M4) yet.
