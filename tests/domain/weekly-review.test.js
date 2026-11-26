import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reviewWindow, reviewStatus, buildReview, completeReview } from '../../js/domain/weekly-review.js';

// 2026-11-22 is a Sunday.
const at = (d, hh = 12, mm = 0) => { const [y, m, day] = d.split('-').map(Number); return new Date(y, m - 1, day, hh, mm); };
const st = (days = 3) => ({
  habits: [{ id: 'h1', name: 'Read', identity: 'Reader', category: 'Learning', createdAt: '2026-11-01T08:00:00' }],
  events: Array.from({ length: days }, (_, i) => ({ habitId: 'h1', type: 'checkin', date: `2026-11-1${i}` })),
  journal: [], reviews: []
});

describe('Weekly review window (FR-17)', () => {
  it('opens on Sunday at 18:00 and lasts a week', () => {
    assert.equal(reviewWindow(at('2026-11-22', 17, 59)).weekOf, '2026-11-15');
    assert.equal(reviewWindow(at('2026-11-22', 18, 0)).weekOf, '2026-11-22');
    assert.equal(reviewWindow(at('2026-11-26')).weekOf, '2026-11-22');
    assert.equal(reviewWindow(at('2026-11-29', 17)).weekOf, '2026-11-22');
  });

  it('needs 3 days of activity', () => {
    const s = reviewStatus(st(2), at('2026-11-26'));
    assert.equal(s.status, 'locked');
    assert.equal(s.activeDays, 2);
    assert.equal(reviewStatus(st(3), at('2026-11-26')).status, 'open');
  });

  it('is done once per window and reopens next Sunday evening', () => {
    const done = completeReview(st(), { reflection: 'Evenings work', intention: 'Read before the phone' }, at('2026-11-26'));
    assert.equal(reviewStatus(done, at('2026-11-27')).status, 'done');
    assert.equal(reviewStatus(done, at('2026-11-29', 18, 1)).status, 'open');
  });

  it('saves the reflection and intention to the journal', () => {
    const done = completeReview(st(), { reflection: 'Evenings work', intention: 'Read before the phone', prompt: 'Q?' }, at('2026-11-26'));
    const entry = done.journal.at(-1);
    assert.equal(entry.kind, 'weekly_review');
    assert.equal(entry.prompt, 'Q?');
    assert.ok(entry.text.includes('Intention: Read before the phone'));
    assert.equal(done.reviews[0].journalId, entry.id);
  });

  it('builds the four steps with per-habit consistency', () => {
    const r = buildReview(st(), at('2026-11-26'));
    assert.equal(r.steps.length, 4);
    assert.equal(r.habits[0].name, 'Read');
    assert.equal(typeof r.habits[0].consistency, 'number');
    assert.ok(r.reflectionPrompt);
  });
});
