// Mock localStorage before the module is imported so the module-level
// singleton initialises against our in-memory store.
const _store = {};
globalThis.localStorage = {
  getItem:    k      => Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null,
  setItem:    (k, v) => { _store[k] = v; },
  removeItem: k      => { delete _store[k]; },
};
function clearStore() { Object.keys(_store).forEach(k => delete _store[k]); }

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../../js/core/storage.js';

// Reset module state and backing store before every test.
function reset() { S.wipe(); clearStore(); }

describe('storage.js', () => {
  beforeEach(reset);

  describe('load()', () => {
    it('returns a fresh state with schemaVersion 2 when storage is empty', () => {
      const st = S.load();
      assert.equal(st.schemaVersion, 2);
    });

    it('fresh state has the required array fields', () => {
      const st = S.load();
      for (const key of ['habits', 'events', 'journal', 'scorecard', 'woop']) {
        assert.ok(Array.isArray(st[key]), `${key} should be an array`);
      }
    });

    it('fresh state has a settings object', () => {
      const st = S.load();
      assert.equal(typeof st.settings, 'object');
    });

    it('returns the same in-memory reference on repeated calls (singleton)', () => {
      const a = S.load();
      const b = S.load();
      assert.equal(a, b);
    });

    it('reads from the atomic.v2 key', () => {
      // Persist a habit, then verify a fresh load() reads it back from localStorage
      const st = S.load();
      st.habits.push({ id: 'h_test' });
      S.save(st);
      // Confirm the key is under 'atomic.v2'
      assert.ok(Object.prototype.hasOwnProperty.call(_store, 'atomic.v2'), 'atomic.v2 key should exist');
      const persisted = JSON.parse(_store['atomic.v2']);
      assert.equal(persisted.habits.length, 1);
      assert.equal(persisted.habits[0].id, 'h_test');
    });
  });

  describe('save()', () => {
    it('persists state to localStorage under atomic.v2', () => {
      const st = S.load();
      st.habits.push({ id: 'h_1' });
      const ok = S.save(st);
      assert.equal(ok, true);
      assert.ok(_store['atomic.v2'], 'atomic.v2 key should exist in localStorage');
      const parsed = JSON.parse(_store['atomic.v2']);
      assert.equal(parsed.habits[0].id, 'h_1');
    });

    it('returns false and aborts write when storage.error is set', () => {
      // Seed bad data, load → triggers quarantine, then try to save
      _store['atomic.v2'] = 'NOT_JSON{{{';
      S.load(); // triggers parse error → sets error
      assert.ok(S.error, 'error should be set after a parse failure');
      const ok = S.save();
      assert.equal(ok, false);
    });
  });

  describe('error quarantine', () => {
    it('sets storage.error when stored JSON cannot be parsed', () => {
      _store['atomic.v2'] = '<<<INVALID JSON>>>';
      S.load();
      assert.ok(S.error !== null, 'error should be non-null');
    });

    it('sets storage.error when schemaVersion is unrecognised', () => {
      _store['atomic.v2'] = JSON.stringify({ schemaVersion: 99, habits: [], events: [], journal: [] });
      S.load();
      assert.ok(S.error !== null, 'error should be non-null for unknown schemaVersion');
    });

    it('returns a usable fresh state even when quarantined', () => {
      _store['atomic.v2'] = '<<<INVALID JSON>>>';
      const st = S.load();
      assert.equal(st.schemaVersion, 2);
      assert.ok(Array.isArray(st.habits));
    });
  });

  describe('wipe()', () => {
    it('resets in-memory state and clears error', () => {
      _store['atomic.v2'] = '<<<INVALID JSON>>>';
      S.load();
      assert.ok(S.error);
      S.wipe();
      assert.equal(S.error, null);
    });

    it('removes the atomic.v2 key from localStorage', () => {
      S.load();
      S.save();
      assert.ok(_store['atomic.v2']);
      S.wipe();
      assert.equal(_store['atomic.v2'], undefined);
    });
  });

  describe('exportJSON()', () => {
    it('returns a valid JSON string of the current state', () => {
      S.load();
      const json = S.exportJSON();
      const parsed = JSON.parse(json);
      assert.equal(parsed.schemaVersion, 2);
    });
  });

  describe('importJSON(text)', () => {
    it('accepts a valid schemaVersion-2 backup and saves it', () => {
      const backup = JSON.stringify({
        schemaVersion: 2, habits: [{ id: 'h_import' }], events: [], journal: [],
        scorecard: [], woop: [], settings: {}
      });
      S.importJSON(backup);
      // importJSON calls save() which updates mem; load() returns current mem
      const st = S.load();
      assert.equal(st.habits.length, 1);
      assert.equal(st.habits[0].id, 'h_import');
    });

    it('throws for a schemaVersion-1 backup', () => {
      const old = JSON.stringify({ schemaVersion: 1, habits: [], events: [], journal: [] });
      assert.throws(() => S.importJSON(old), /Not a valid Atomic backup/);
    });

    it('throws when required array fields are absent', () => {
      const bad = JSON.stringify({ schemaVersion: 2 });
      assert.throws(() => S.importJSON(bad), /Not a valid Atomic backup/);
    });
  });
});
