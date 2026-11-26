import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHabit } from '../../js/domain/habits.js';

describe('habits.createHabit', () => {
  it('adds a habit with required defaults', () => {
    const base = { habits: [], events: [], journal: [], settings: {} };
    const payload = {
      identity: 'Future Reader',
      vote: 'Read daily',
      category: 'Learning',
      stackedAfter: null,
      intention: null,
    };
    const next = createHabit(base, payload);
    assert.equal(next.habits.length, 1);
    const h = next.habits[0];
    assert.match(h.id, /^h_/);
    assert.equal(h.identity, payload.identity);
    assert.equal(h.vote, payload.vote);
    assert.equal(h.name, payload.vote);
    assert.equal(h.category, payload.category);
    assert.equal(h.stackedAfter, null);
    assert.equal(h.intention, null);
    assert.ok(h.createdAt);
    assert.equal(h.archivedAt, null);
  });

  it('populates name, vote, and twoMinuteVersion from wizard payload', () => {
    const base = { habits: [], events: [], journal: [], settings: {} };
    const wizardPayload = {
      identity: 'An athlete',
      vote: 'Workout 30 mins',
      category: 'Health',
      stackedAfter: 'h_prev',
      intention: 'Do 5 pushups on floor',
    };
    const next = createHabit(base, wizardPayload);
    assert.equal(next.habits.length, 1);
    const h = next.habits[0];
    assert.equal(h.name, 'Workout 30 mins');
    assert.equal(h.vote, 'Workout 30 mins');
    assert.equal(h.identity, 'An athlete');
    assert.equal(h.category, 'Health');
    assert.equal(h.stackedAfter, 'h_prev');
    assert.equal(h.twoMinuteVersion, 'Do 5 pushups on floor');
    assert.deepEqual(h.intention, { time: '', place: 'Do 5 pushups on floor' });
  });
});


import { updateHabit, archiveHabit, restoreHabit, wouldCycle } from '../../js/domain/habits.js';

describe('habits: edit and archive (FR-5)', () => {
  const base = () => ({
    habits: [
      { id: 'a', name: 'Read', vote: 'Read', identity: 'Reader', category: 'Learning', stackedAfter: null, intention: null, reminderOn: false, archivedAt: null },
      { id: 'b', name: 'Tea', vote: 'Tea', identity: 'Calm', category: 'Health', stackedAfter: 'a', intention: null, reminderOn: false, archivedAt: null }
    ],
    scorecard: [{ id: 's1', name: 'Coffee', rating: '=' }],
    events: [{ habitId: 'a', type: 'checkin', date: '2026-11-01' }]
  });
  const get = (st, id) => st.habits.find(h => h.id === id);

  it('updates fields and trims text', () => {
    const st = updateHabit(base(), 'a', { name: ' Read 10 pages ', identity: 'A reader', category: 'Mindfulness', time: '21:00', place: ' the sofa ', twoMinuteVersion: ' One page ' });
    const a = get(st, 'a');
    assert.equal(a.name, 'Read 10 pages');
    assert.equal(a.vote, 'Read 10 pages');
    assert.equal(a.category, 'Mindfulness');
    assert.deepEqual(a.intention, { time: '21:00', place: 'the sofa' });
    assert.equal(a.twoMinuteVersion, 'One page');
  });

  it('ignores blank names and unknown categories', () => {
    const a = get(updateHabit(base(), 'a', { name: '  ', category: 'Sports' }), 'a');
    assert.equal(a.name, 'Read');
    assert.equal(a.category, 'Learning');
  });

  it('refuses stacking loops and self-stacking, allows routine anchors', () => {
    assert.equal(wouldCycle(base().habits, 'a', 'b'), true);
    assert.equal(get(updateHabit(base(), 'a', { stackedAfter: 'b' }), 'a').stackedAfter, null);
    assert.equal(get(updateHabit(base(), 'a', { stackedAfter: 'a' }), 'a').stackedAfter, null);
    assert.equal(get(updateHabit(base(), 'a', { stackedAfter: 's1' }), 'a').stackedAfter, 's1');
  });

  it('only allows a reminder when there is an intention time', () => {
    assert.equal(get(updateHabit(base(), 'a', { reminderOn: true }), 'a').reminderOn, false);
    assert.equal(get(updateHabit(base(), 'a', { reminderOn: true, time: '07:00' }), 'a').reminderOn, true);
  });

  it('archives without losing history, and restores', () => {
    const archived = archiveHabit(base(), 'a', '2026-11-26T10:00:00.000Z');
    assert.equal(get(archived, 'a').archivedAt, '2026-11-26T10:00:00.000Z');
    assert.equal(archived.events.length, 1);
    assert.equal(get(restoreHabit(archived, 'a'), 'a').archivedAt, null);
  });
});
