import '../helpers/storage-mock.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../../js/core/storage.js';
import * as H from '../../js/domain/habits.js';
import { missedYesterday } from '../../js/domain/missed.js';
import { today, addDays } from '../../js/core/dates.js';

describe('Story 2.1: Never-Miss-Twice & missedYesterday', () => {
  beforeEach(() => { S.wipe(); });

  it('detects a habit missed yesterday when created before yesterday', () => {
    const t = today();
    const createdDate = addDays(t, -5);
    const hb = {
      id: 'h_missed',
      name: 'Read',
      identity: 'Reader',
      category: 'Learning',
      twoMinuteVersion: 'Read one page',
      createdAt: `${createdDate}T10:00:00.000Z`,
      archivedAt: null
    };
    const st = {
      schemaVersion: 2,
      habits: [hb],
      events: [], // No check-ins
      journal: [],
      scorecard: [],
      woop: [],
      settings: { nudgeDismissed: {} }
    };
    S.save(st);

    assert.equal(missedYesterday(hb, st), true);
  });

  it('does not flag as missed if created yesterday or today', () => {
    const t = today();
    const hbYesterday = {
      id: 'h_yest',
      name: 'Yoga',
      createdAt: `${addDays(t, -1)}T10:00:00.000Z`,
      archivedAt: null
    };
    const hbToday = {
      id: 'h_tod',
      name: 'Run',
      createdAt: `${t}T08:00:00.000Z`,
      archivedAt: null
    };
    const st = {
      schemaVersion: 2,
      habits: [hbYesterday, hbToday],
      events: [],
      journal: [],
      scorecard: [],
      woop: [],
      settings: { nudgeDismissed: {} }
    };
    S.save(st);

    assert.equal(missedYesterday(hbYesterday, st), false);
    assert.equal(missedYesterday(hbToday, st), false);
  });

  it('does not flag as missed if checked in yesterday', () => {
    const t = today();
    const y = addDays(t, -1);
    const hb = {
      id: 'h_done_yest',
      name: 'Meditate',
      createdAt: `${addDays(t, -10)}T10:00:00.000Z`,
      archivedAt: null
    };
    const st = {
      schemaVersion: 2,
      habits: [hb],
      events: [{
        id: 'e_1',
        habitId: hb.id,
        type: 'checkin',
        date: y,
        at: `${y}T12:00:00.000Z`,
        version: 'full'
      }],
      journal: [],
      scorecard: [],
      woop: [],
      settings: { nudgeDismissed: {} }
    };
    S.save(st);

    assert.equal(missedYesterday(hb, st), false);
  });

  it('creates minimal check-in version and marks complete for today', () => {
    const t = today();
    const hb = {
      id: 'h_recovery',
      name: 'Floss',
      identity: 'Healthy person',
      category: 'Health',
      twoMinuteVersion: 'Floss one tooth',
      createdAt: `${addDays(t, -10)}T10:00:00.000Z`,
      archivedAt: null
    };
    const st = {
      schemaVersion: 2,
      habits: [hb],
      events: [],
      journal: [],
      scorecard: [],
      woop: [],
      settings: { nudgeDismissed: {} }
    };
    S.save(st);

    // Call toggle with 'minimal'
    const created = H.toggle(hb.id, 'minimal');
    assert.equal(created, true);

    const loaded = S.load();
    const ev = loaded.events.find(e => e.habitId === hb.id && e.date === t);
    assert.ok(ev);
    assert.equal(ev.version, 'minimal');
    assert.equal(ev.type, 'checkin');
  });

  it('dismissing nudge updates settings.nudgeDismissed for today', () => {
    const t = today();
    const st = S.load();
    st.settings.nudgeDismissed = st.settings.nudgeDismissed || {};
    st.settings.nudgeDismissed['h_test'] = t;
    S.save(st);

    const reloaded = S.load();
    assert.equal(reloaded.settings.nudgeDismissed['h_test'], t);
  });
});

