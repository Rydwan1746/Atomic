import '../helpers/storage-mock.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../../js/core/storage.js';
import * as H from '../../js/domain/habits.js';

describe('habits.setMood', () => {
  beforeEach(() => { S.wipe(); });

  it('sets mood on today event', () => {
    const today = new Date().toISOString().slice(0, 10);
    const base = {
      schemaVersion: 2,
      habits: [{ id: 'h_1', name: 'test', identity: 'test', category: 'Health', stackedAfter: null, intention: null, createdAt: new Date().toISOString(), archivedAt: null }],
      events: [{ id: 'e_1', habitId: 'h_1', type: 'checkin', date: today, at: new Date().toISOString(), version: 'full', mood: null, energy: null }],
      journal: [],
      scorecard: [],
      woop: [],
      settings: {}
    };
    S.save(base);
    H.setMood('h_1', 3);
    const st = S.load();
    const ev = st.events.find(e => e.habitId === 'h_1');
    assert.equal(ev.mood, 3);
  });

  it('toggles mood off when same value is set again', () => {
    const today = new Date().toISOString().slice(0, 10);
    const base = {
      schemaVersion: 2,
      habits: [{ id: 'h_2', name: 'test2', identity: 'test2', category: 'Learning', stackedAfter: null, intention: null, createdAt: new Date().toISOString(), archivedAt: null }],
      events: [{ id: 'e_2', habitId: 'h_2', type: 'checkin', date: today, at: new Date().toISOString(), version: 'full', mood: 4, energy: null }],
      journal: [],
      scorecard: [],
      woop: [],
      settings: {}
    };
    S.save(base);
    H.setMood('h_2', 4); // should clear
    const st = S.load();
    const ev = st.events.find(e => e.habitId === 'h_2');
    assert.equal(ev.mood, null);
  });
});
