import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { current, longest, consistency, recoveryTime } from '../../js/domain/streaks.js';

describe('Story 2.3: Consistency Metrics & Recovery Window', () => {
  it('calculates current streak ending today or yesterday', () => {
    const t = '2026-05-10';
    const ds1 = ['2026-05-08', '2026-05-09', '2026-05-10'];
    assert.equal(current(ds1, t), 3);

    // Ending yesterday still preserves streak
    const ds2 = ['2026-05-08', '2026-05-09'];
    assert.equal(current(ds2, t), 2);

    // Broken streak
    const ds3 = ['2026-05-05', '2026-05-06'];
    assert.equal(current(ds3, t), 0);
  });

  it('calculates longest streak in history', () => {
    const ds = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-10', '2026-01-11'];
    assert.equal(longest(ds), 3);
  });

  it('calculates 30-day consistency percentage', () => {
    const t = '2026-05-30';
    const createdDate = '2026-05-01'; // 30 active days
    // 15 check-in dates
    const ds = Array.from({ length: 15 }, (_, i) => `2026-05-${String(i * 2 + 1).padStart(2, '0')}`);
    assert.equal(consistency(ds, createdDate, t), 50);
  });

  it('recoveryTime returns null if fewer than 3 misses occurred', () => {
    const t = '2026-05-05';
    const createdDate = '2026-05-01';
    // Checked in 4 out of 5 days (only 1 miss on 2026-05-03)
    const ds = ['2026-05-01', '2026-05-02', '2026-05-04', '2026-05-05'];
    assert.equal(recoveryTime(ds, createdDate, t), null);
  });

  it('recoveryTime returns average elapsed days when >= 3 misses occurred', () => {
    const t = '2026-05-07';
    const createdDate = '2026-05-01';
    // Checked in on May 1, 3, 5, 7
    // Misses:
    // May 2 (next check-in May 3 -> 1 day)
    // May 4 (next check-in May 5 -> 1 day)
    // May 6 (next check-in May 7 -> 1 day)
    // Total misses = 3, avg = 1.0 day
    const ds = ['2026-05-01', '2026-05-03', '2026-05-05', '2026-05-07'];
    assert.equal(recoveryTime(ds, createdDate, t), 1.0);
  });
});

