---
status: done
route: oneshot
route_source: auto
risk: low
date: 2026-11-11
ticket: 1.1
---

# Plan — Story 1.1: Project Scaffold, ES Module Infrastructure & Local Storage Gateway

## Intent

<frozen-after-approval>
Harden the existing scaffold to fully satisfy Story 1.1 ACs:

1. `js/core/storage.js` must use key `'atomic.v2'` and `schemaVersion: 2`; all guards updated accordingly.
2. `tests/core/dates.test.js` and `tests/core/storage.test.js` must be created using `node:test`.
3. `tests/run.js` must run both test files via `node:test`'s `run()` API and exit non-zero on failure.

No new features. No UI changes. No other files touched.
</frozen-after-approval>

## Code Map

### Files to change

| File | Action | Detail |
|---|---|---|
| `js/core/storage.js` | Edit 3 lines | `KEY`, `schemaVersion` in `fresh()`, and both schema version guards |
| `tests/run.js` | Replace | Use `node:test` `run()` API to execute the two new test files |

### Files to create

| File | Purpose |
|---|---|
| `tests/core/dates.test.js` | Unit tests for `toDate`, `today`, `parse`, `diffDays`, `addDays` via `node:test` |
| `tests/core/storage.test.js` | Unit tests for `load`, `save`, `wipe`, error quarantine, `exportJSON`, `importJSON` via `node:test`; mocks `localStorage` with a plain object before import |

### Do not touch

- `js/core/dates.js` — already correct (local getters, no UTC)
- `js/main.js` — routing already correct
- `index.html`, `style.css` — no changes required
- All domain and UI modules

### Key implementation notes

- **`storage.test.js` localStorage mock**: Set `globalThis.localStorage` before the ES module import using a top-level object store. Reset via `S.wipe()` in `beforeEach`.
- **`run.js`**: Use `node:test`'s `run({ files })` API, pipe through `spec` reporter, await close event and check `exitCode`.
- **Storage key rename** does NOT migrate existing `'atomic.state'` data — that is deferred to Story 1.2 (legacy migration). Story 1.1 is a clean slate.

## Tasks

- [ ] **T1** `js/core/storage.js` — change `KEY` to `'atomic.v2'`
- [ ] **T2** `js/core/storage.js` — change `schemaVersion: 1` → `2` in `fresh()`
- [ ] **T3** `js/core/storage.js` — update `load()` guard: `!== 2`
- [ ] **T4** `js/core/storage.js` — update `importJSON()` guard: `!== 2`
- [ ] **T5** Create `tests/core/dates.test.js` with `node:test` suite
- [ ] **T6** Create `tests/core/storage.test.js` with `node:test` suite (localStorage mock)
- [ ] **T7** Replace `tests/run.js` to run T5+T6 via `node:test` `run()` API
- [ ] **T8** `node tests/run.js` — verify all tests pass, zero failures

