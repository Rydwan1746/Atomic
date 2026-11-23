import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addWoop, removeWoop, getWoopForHabit } from '../../js/domain/woop.js';

describe('Story 3.2: WOOP Goal & Obstacle Planning', () => {
  it('addWoop creates a plan in canonical format with ID w_', () => {
    const st = { woop: [] };
    const next = addWoop(st, {
      wish: 'Write daily',
      outcome: 'A published essay',
      obstacle: 'Fear of bad first drafts',
      plan: 'If I feel stuck, then I will write 5 clumsy sentences',
      habitId: 'h_123'
    });

    assert.equal(next.woop.length, 1);
    const item = next.woop[0];
    assert.match(item.id, /^w_/);
    assert.equal(item.wish, 'Write daily');
    assert.equal(item.plan, 'If I feel stuck, then I will write 5 clumsy sentences');
    assert.equal(item.habitId, 'h_123');
    assert.ok(item.createdAt);
  });

  it('getWoopForHabit retrieves linked plan', () => {
    const st = {
      woop: [
        { id: 'w1', habitId: 'h_target', plan: 'If sleepy, then splash cold water' },
        { id: 'w2', habitId: 'h_other', plan: 'Other' }
      ]
    };
    const found = getWoopForHabit(st, 'h_target');
    assert.ok(found);
    assert.equal(found.id, 'w1');

    assert.equal(getWoopForHabit(st, 'h_none'), null);
  });

  it('removeWoop removes plan by id', () => {
    const st = { woop: [{ id: 'w1' }, { id: 'w2' }] };
    const next = removeWoop(st, 'w1');
    assert.equal(next.woop.length, 1);
    assert.equal(next.woop[0].id, 'w2');
  });
});

