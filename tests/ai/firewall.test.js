import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSafePayload, formatPrivacyChipLabel } from '../../js/ai/firewall.js';

describe('Story 4.1: Client-Side Privacy Firewall', () => {
  it('builds aggregated numerical metadata and strictly excludes raw journal by default', () => {
    const state = {
      habits: [
        { id: 'h1', name: 'Exercise', identity: 'Athlete', category: 'Health', createdAt: '2026-05-01' }
      ],
      events: [
        { id: 'e1', habitId: 'h1', type: 'checkin', date: '2026-05-10' }
      ],
      journal: [
        { id: 'j1', text: 'Private thoughts', private: true },
        { id: 'j2', text: 'Normal thoughts', private: false }
      ]
    };

    const payload = buildSafePayload(state, 'mirror');

    assert.equal(payload.mode, 'mirror');
    assert.equal(payload.habits.length, 1);
    assert.equal(payload.habits[0].name, 'Exercise');
    assert.ok('consistency30d' in payload.habits[0]);

    // Zero raw journal entries included by default
    assert.equal(payload.journalSnippets.length, 0);
    assert.equal(payload.privacyVerification.strictlyExcludedPrivateEntriesCount, 1);

    const label = formatPrivacyChipLabel(payload);
    assert.ok(label.includes('0 raw journal entries shared'));
  });

  it('strictly excludes entries with private: true even if opted in', () => {
    const state = {
      habits: [],
      events: [],
      journal: [
        { id: 'j1', text: 'Top secret diary', private: true },
        { id: 'j2', text: 'Public reflection', private: false }
      ]
    };

    const payload = buildSafePayload(state, 'mirror', { includeJournalOptIn: true });

    assert.equal(payload.journalSnippets.length, 1);
    assert.equal(payload.journalSnippets[0].text, 'Public reflection');
    assert.equal(payload.journalSnippets.some(j => j.text.includes('Top secret')), false);
  });
});

