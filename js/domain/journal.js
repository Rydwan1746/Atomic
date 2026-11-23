// Journal domain utilities – pure functions acting on the storage state
// State shape: state.journal (array of entries)
// Each entry: { id, at, date, kind, habitId, text, mood, energy, private }

import { id } from '../core/ids.js';

export const KINDS = {
  free: 'Free write',
  completion_note: 'After a check-in',
  miss_reason: 'After a skip'
};

/** Add a new journal entry */
export function addEntry(state, options = {}) {
  const kind = options.kind || 'free';
  const habitId = options.habitId || null;
  const text = options.text || '';
  const mood = options.mood ?? null;
  const energy = options.energy ?? null;
  const isPrivate = Boolean(options['private'] ?? options.isPrivate ?? false);

  const entry = {
    id: id('j'),
    at: new Date().toISOString(),
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    kind,
    habitId,
    text,
    mood,
    energy,
    'private': isPrivate,
  };

  const newJournal = [...(state.journal || []), entry];
  return { ...state, journal: newJournal };
}

/** Update an existing entry by id */
export function updateEntry(state, idToUpdate, updates = {}) {
  const newJournal = (state.journal || []).map(e => {
    if (e.id !== idToUpdate) return e;
    const updated = { ...e, ...updates };
    if ('private' in updates) {
      updated['private'] = Boolean(updates['private']);
    } else if ('isPrivate' in updates) {
      updated['private'] = Boolean(updates.isPrivate);
      delete updated.isPrivate;
    }
    return updated;
  });
  return { ...state, journal: newJournal };
}

/** Delete an entry by id */
export function deleteEntry(state, idToDelete) {
  const newJournal = (state.journal || []).filter(e => e.id !== idToDelete);
  return { ...state, journal: newJournal };
}

/** List paginated entries – newest first */
export function list(state, page = 0, size = 10) {
  const sorted = [...(state.journal || [])].sort((a, b) => (a.at < b.at ? 1 : -1));
  const start = page * size;
  const end = start + size;
  return sorted.slice(start, end);
}

/** Helper to get total pages */
export function totalPages(state, size = 10) {
  return Math.ceil((state.journal || []).length / size);
}
