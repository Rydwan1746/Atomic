import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addEntry, updateEntry, deleteEntry, list, totalPages } from '../../js/domain/journal.js';

describe('domain/journal.js', () => {
  const emptyState = () => ({
    habits: [],
    events: [],
    journal: [],
    settings: {}
  });

  it('addEntry adds an entry with id, timestamps, and default values', () => {
    const st = emptyState();
    const next = addEntry(st, { text: 'Hello journal' });
    assert.equal(next.journal.length, 1);
    const entry = next.journal[0];
    assert.match(entry.id, /^j_/);
    assert.equal(entry.text, 'Hello journal');
    assert.equal(entry.kind, 'free');
    assert.equal(entry.private, false);
    assert.equal(entry.habitId, null);
    assert.ok(entry.at);
    assert.ok(entry.date);
  });

  it('addEntry supports habitId, mood, and private: true', () => {
    const st = emptyState();
    const next = addEntry(st, {
      text: 'Deep reflection',
      habitId: 'h_123',
      mood: 4,
      energy: 5,
      private: true
    });
    assert.equal(next.journal.length, 1);
    const entry = next.journal[0];
    assert.equal(entry.habitId, 'h_123');
    assert.equal(entry.mood, 4);
    assert.equal(entry.energy, 5);
    assert.equal(entry.private, true);
  });

  it('updateEntry updates specified fields while keeping others intact', () => {
    const st = emptyState();
    const withEntry = addEntry(st, { text: 'Draft version', private: false });
    const id = withEntry.journal[0].id;

    const updated = updateEntry(withEntry, id, { text: 'Final version', private: true });
    assert.equal(updated.journal[0].text, 'Final version');
    assert.equal(updated.journal[0].private, true);
  });

  it('deleteEntry removes the specified entry', () => {
    const st = emptyState();
    const s1 = addEntry(st, { text: 'Entry 1' });
    const s2 = addEntry(s1, { text: 'Entry 2' });
    const idToDelete = s2.journal[0].id;

    const afterDelete = deleteEntry(s2, idToDelete);
    assert.equal(afterDelete.journal.length, 1);
    assert.equal(afterDelete.journal[0].text, 'Entry 2');
  });

  it('list sorts descending by at and paginates', () => {
    let st = emptyState();
    st = addEntry(st, { text: 'Oldest' });
    st.journal[0].at = '2026-01-01T00:00:00.000Z';

    st = addEntry(st, { text: 'Newest' });
    st.journal[1].at = '2026-01-02T00:00:00.000Z';

    const page0 = list(st, 0, 1);
    assert.equal(page0.length, 1);
    assert.equal(page0[0].text, 'Newest');

    const page1 = list(st, 1, 1);
    assert.equal(page1.length, 1);
    assert.equal(page1[0].text, 'Oldest');

    assert.equal(totalPages(st, 1), 2);
  });
});

