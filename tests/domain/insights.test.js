import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getRollingPulse,
  evaluatePatterns,
  getRecurringThemes,
  getWeeklyReview
} from '../../js/domain/insights.js';

describe('Story 2.4, 2.5, 2.6: Insights & Pattern Engine', () => {
  it('getRollingPulse aggregates last 7 days votes across normalized identities', () => {
    const t = '2026-05-10';
    const state = {
      habits: [
        { id: 'h1', identity: 'A reader', name: 'Read pages', category: 'Learning' },
        { id: 'h2', identity: 'A Reader', name: 'Read book', category: 'Learning' },
        { id: 'h3', identity: 'A calm mind', name: 'Meditate', category: 'Mindfulness' },
      ],
      events: [
        { id: 'e1', habitId: 'h1', type: 'checkin', date: '2026-05-09' },
        { id: 'e2', habitId: 'h2', type: 'checkin', date: '2026-05-10' },
        { id: 'e3', habitId: 'h3', type: 'checkin', date: '2026-05-10' },
        { id: 'e4', habitId: 'h1', type: 'checkin', date: '2026-04-01' }, // older than 7 days
      ]
    };

    const pulse = getRollingPulse(state, t);
    assert.equal(pulse.totalVotes, 3);
    assert.equal(pulse.identities.length, 2);
    // Reader has 2 votes
    assert.equal(pulse.identities[0].identity, 'A reader');
    assert.equal(pulse.identities[0].votes, 2);
    assert.equal(pulse.identities[1].identity, 'A calm mind');
    assert.equal(pulse.identities[1].votes, 1);
  });

  it('evaluatePatterns reports cold start when total logged days < 7', () => {
    const state = {
      habits: [{ id: 'h1', name: 'Floss', identity: 'Healthy' }],
      events: [
        { id: 'e1', habitId: 'h1', type: 'checkin', date: '2026-05-01' },
        { id: 'e2', habitId: 'h1', type: 'checkin', date: '2026-05-02' },
      ]
    };
    const res = evaluatePatterns(state, '2026-05-05');
    assert.equal(res.coldStart, true);
    assert.equal(res.totalLoggedDays, 2);
    assert.equal(res.milestones.length, 6);
    assert.ok(res.locked.some(m => m.name === 'Mood Correlates'));
    assert.equal(res.patterns.length, 0);
  });

  it('getRecurringThemes locks under 8 entries and detects top recurring words across >= 3 entries', () => {
    // Under 8 entries
    const under8 = {
      journal: [
        { id: 'j1', text: 'focus and clarity' },
        { id: 'j2', text: 'focus was tough' },
      ]
    };
    const locked = getRecurringThemes(under8);
    assert.equal(locked.unlocked, false);
    assert.equal(locked.entryCount, 2);

    // 8 entries with "clarity" in 3 entries
    const with8 = {
      journal: [
        { id: 'j1', text: 'Looking for clarity in the morning' },
        { id: 'j2', text: 'Gained great clarity today' },
        { id: 'j3', text: 'Moments of clarity while walking' },
        { id: 'j4', text: 'Routine day without friction' },
        { id: 'j5', text: 'Short reflection about work' },
        { id: 'j6', text: 'Quiet evening at home' },
        { id: 'j7', text: 'Another productive session' },
        { id: 'j8', text: 'Closing the week with gratitude' },
      ]
    };

    const res = getRecurringThemes(with8);
    assert.equal(res.unlocked, true);
    assert.ok(res.themes.length >= 1);
    const clarityTheme = res.themes.find(t => t.word === 'clarity');
    assert.ok(clarityTheme);
    assert.equal(clarityTheme.count, 3);
  });

  it('getWeeklyReview synthesizes pulse, pattern, and theme prompt', () => {
    const state = {
      habits: [{ id: 'h1', identity: 'Writer', name: 'Write', category: 'Creativity' }],
      events: [{ id: 'e1', habitId: 'h1', type: 'checkin', date: '2026-05-10' }],
      journal: []
    };
    const review = getWeeklyReview(state, '2026-05-10');
    assert.ok(review.reflectionPrompt);
    assert.equal(review.topIdentity.identity, 'Writer');
    assert.equal(review.totalWeeklyVotes, 1);
  });
});


import { streakBreaks, dailyAverages } from '../../js/domain/insights.js';
import { addDays } from '../../js/core/dates.js';

describe('Pattern engine: precursors and mood (FR-15)', () => {
  const T = '2026-11-26';
  const day = n => addDays(T, -n);   // n days ago

  it('finds streak breaks up to yesterday', () => {
    assert.deepEqual(streakBreaks([day(5), day(4), day(2)], T), [day(3), day(1)]);
  });

  it('averages a 1 to 5 field per day', () => {
    const m = dailyAverages([{ type: 'checkin', date: 'd', mood: 2 }, { type: 'checkin', date: 'd', mood: 4 }, { type: 'checkin', date: 'e', mood: null }], 'mood');
    assert.equal(m.get('d'), 3);
    assert.equal(m.has('e'), false);
  });

  it('reports a precursor shared by at least half of the breaks', () => {
    // Read runs in pairs and breaks 3 times; Walk was skipped the day before each break.
    const readDays = [20, 19, 15, 14, 10, 9, 5, 4].map(day);
    const walkDays = Array.from({ length: 22 }, (_, i) => day(i + 1)).filter(d => ![day(19), day(14), day(9)].includes(d));
    const state = {
      habits: [
        { id: 'r', name: 'Read', identity: 'Reader', createdAt: day(25) },
        { id: 'w', name: 'Walk', identity: 'Walker', createdAt: day(25) }
      ],
      events: [...readDays.map(d => ({ habitId: 'r', type: 'checkin', date: d })), ...walkDays.map(d => ({ habitId: 'w', type: 'checkin', date: d }))]
    };
    const p = evaluatePatterns(state, T).patterns.find(x => x.type === 'streak_break_precursor' && x.habitId === 'r');
    assert.ok(p, 'precursor found');
    assert.match(p.message, /skipping Walk/);
    assert.ok(p.sampleSize.k >= 2 && p.sampleSize.k / p.sampleSize.n >= 0.5);
  });

  it('reports a mood correlate only with 10+ mood days and a clear gap', () => {
    const events = [];
    for (let i = 1; i <= 14; i++) {
      const d = day(i);
      const read = i % 2 === 0;
      events.push({ habitId: 'w', type: 'checkin', date: d, mood: read ? 4 : 2 });
      if (read) events.push({ habitId: 'r', type: 'checkin', date: d });
    }
    const state = { habits: [{ id: 'r', name: 'Read', createdAt: day(20) }, { id: 'w', name: 'Walk', createdAt: day(20) }], events };
    const p = evaluatePatterns(state, T).patterns.find(x => x.type === 'mood_correlate' && x.habitId === 'r');
    assert.ok(p, 'mood correlate found');
    assert.equal(p.proof.withHabit, 4);
    assert.equal(p.proof.withoutHabit, 2);
    assert.match(p.message, /not a cause/);

    const few = { ...state, events: events.filter(e => e.date >= day(8)) };
    assert.equal(evaluatePatterns(few, T).patterns.some(x => x.type === 'mood_correlate'), false);
  });
});
