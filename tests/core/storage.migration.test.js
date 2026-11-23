// Mock localStorage before the module is imported so the module-level
// singleton initialises against our in-memory store.
const _store = {};
globalThis.localStorage = {
  getItem:    k => Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null,
  setItem:    (k, v) => { _store[k] = v; },
  removeItem: k => { delete _store[k]; },
};
function clearStore() { Object.keys(_store).forEach(k => delete _store[k]); }

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../../js/core/storage.js';

// Reset module state and backing store before every test.
function reset() { S.wipe(); clearStore(); }

describe('storage.js migration', () => {
  beforeEach(reset);

  it('detects legacy atomicHabits key and migrates data', () => {
    // Setup legacy data under old key
    const legacy = {
      habits: [{ id: 'h_legacy' }],
      events: [{ id: 'e1', title: 'old' }],
      journal: [],
    };
    _store['atomicHabits'] = JSON.stringify(legacy);
    // Load triggers migration
    const st = S.load();
    // Verify migration result
    assert.equal(st.schemaVersion, 2);
    assert.deepEqual(st.habits, legacy.habits);
    // Events should be enriched with atApproximate and version fields
    assert.equal(st.events.length, 1);
    const migratedEvent = st.events[0];
    assert.equal(migratedEvent.id, 'e1');
    assert.equal(migratedEvent.atApproximate, true);
    assert.equal(migratedEvent.version, 'full');
    // Backup should be stored under atomicHabits_v1_backup
    assert.ok(_store['atomicHabits_v1_backup'], 'backup of legacy data should exist');
    // Old key should be removed
    assert.equal(_store['atomicHabits'], undefined);
    // New state should be persisted under new key as well
    assert.ok(_store['atomic.v2'], 'new key should be populated');
  });

  it('ignores malformed legacy JSON and falls back to fresh state', () => {
    _store['atomicHabits'] = 'NOT_JSON';
    const st = S.load();
    // Should not throw and return fresh state
    assert.equal(st.schemaVersion, 2);
    assert.deepEqual(st.habits, []);
    // No backup should be created because parse failed
    assert.equal(_store['atomicHabits_v1_backup'], undefined);
    // Old key should remain (migration did not succeed)
    assert.ok(_store['atomicHabits'], 'malformed legacy key should remain untouched');
  });
});

