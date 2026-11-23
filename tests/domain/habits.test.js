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

