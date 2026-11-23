import '../helpers/storage-mock.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../../js/core/storage.js';
import * as H from '../../js/domain/habits.js';

describe('habits.toggle (check‑in & undo)', () => {
  beforeEach(() => { S.wipe(); });

  it('creates a new check‑in event for today', () => {
    const base = {
      schemaVersion: 2,
      habits: [{ id: 'h_1', name: 'Test', identity: 'Tester', category: 'Health', stackedAfter: null, intention: null, createdAt: new Date().toISOString(), archivedAt: null }],
      events: [],
      journal: [],
      scorecard: [],
      woop: [],
      settings: {}
    };
    S.save(base);
    const added = H.toggle('h_1'); // should add event
    assert.equal(added, true);
    const st = S.load();
    assert.equal(st.events.length, 1);
    const ev = st.events[0];
    assert.equal(ev.habitId, 'h_1');
    assert.equal(ev.type, 'checkin');
    assert.equal(ev.version, 'full');
  });

  it('undoes an existing check‑in event', () => {
    const today = new Date().toISOString().slice(0, 10);
    const base = {
      schemaVersion: 2,
      habits: [{ id: 'h_2', name: 'UndoMe', identity: 'Undoer', category: 'Learning', stackedAfter: null, intention: null, createdAt: new Date().toISOString(), archivedAt: null }],
      events: [{ id: 'e_1', habitId: 'h_2', type: 'checkin', date: today, at: new Date().toISOString(), version: 'full', mood: null, energy: null }],
      journal: [],
      scorecard: [],
      woop: [],
      settings: {}
    };
    S.save(base);
    const added = H.toggle('h_2'); // should remove event and return false
    assert.equal(added, false);
    const st = S.load();
    assert.equal(st.events.length, 0);
  });
});
