import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSafePayload, formatPrivacyChipLabel } from '../../js/ai/firewall.js';

const state = () => ({
  habits: [{ id: 'h1', name: 'Exercise', identity: 'Athlete', category: 'Health', createdAt: '2026-05-01T08:00:00.000Z', twoMinuteVersion: 'Put on shoes' }],
  events: [{ id: 'e1', habitId: 'h1', type: 'checkin', date: '2026-05-10' }],
  journal: [
    { id: 'j1', date: '2026-05-09', text: 'Top secret diary', private: true },
    { id: 'j2', date: '2026-05-10', text: 'Public reflection', private: false }
  ],
  alterEgo: { name: 'Sage', narrative: 'Calm and steady', coreValues: ['Patience'], obstacleStrategy: 'Rest before quitting', behaviors: ['Walk', 'Read', 'Breathe'] },
  woop: [{ id: 'w1', wish: 'Run 5k', outcome: 'Energy', obstacle: 'Rain', plan: 'If it rains, then I will run indoors' }],
  scorecard: [{ id: 's1', name: 'Coffee', rating: '=' }]
});

describe('Privacy firewall: per-mode separation', () => {
  it('Mirror payload carries metrics and no Alter Ego', () => {
    const p = buildSafePayload(state(), 'mirror');
    assert.equal(p.mode, 'mirror');
    const hb = p.context.habits[0];
    assert.equal(hb.name, 'Exercise');
    for (const k of ['consistency30dPercent', 'currentStreakDays', 'longestStreakDays', 'averageRecoveryDays']) assert.ok(k in hb, k);
    assert.equal('alterEgo' in p.context, false);
    assert.equal(JSON.stringify(p).includes('Rest before quitting'), false);
    assert.deepEqual(p.context.scorecard, { positive: 0, negative: 0, neutral: 1 });
  });

  it('Future payload carries the Alter Ego and no numbers', () => {
    const p = buildSafePayload(state(), 'future');
    assert.equal(p.context.alterEgo.name, 'Sage');
    assert.deepEqual(p.context.identities, ['Athlete']);
    assert.equal(p.context.habits[0].twoMinuteVersion, 'Put on shoes');
    assert.equal(p.context.woopPlans[0].plan, 'If it rains, then I will run indoors');
    const json = JSON.stringify(p.context);
    for (const k of ['consistency', 'Streak', 'checkIns', 'votes', 'patterns']) assert.equal(json.includes(k), false, k);
  });
});

describe('Privacy firewall: journal text', () => {
  it('excludes journal text by default', () => {
    for (const mode of ['mirror', 'future']) {
      const p = buildSafePayload(state(), mode);
      assert.equal(p.journalSnippets.length, 0);
      assert.equal(JSON.stringify(p).includes('reflection'), false);
      assert.equal(p.privacyVerification.privateEntriesExcluded, 1);
    }
  });

  it('includes non-private entries only when opted in, never private ones', () => {
    const p = buildSafePayload(state(), 'mirror', { includeJournalOptIn: true });
    assert.equal(p.journalSnippets.length, 1);
    assert.equal(p.journalSnippets[0].text, 'Public reflection');
    assert.equal(JSON.stringify(p).includes('Top secret'), false);
  });

  it('labels the chip with the payload scope', () => {
    assert.ok(formatPrivacyChipLabel(buildSafePayload(state(), 'mirror')).includes('Aggregated stats only, no journal text'));
    assert.ok(formatPrivacyChipLabel(buildSafePayload(state(), 'future', { includeJournalOptIn: true })).includes('+ 1 journal entry'));
  });
});
