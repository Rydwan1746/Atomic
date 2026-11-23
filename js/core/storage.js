// The ONLY file that touches localStorage.
const KEY = 'atomic.v2';
const fresh = () => ({
  schemaVersion: 2, habits: [], events: [], journal: [], scorecard: [], alterEgo: null,
  woop: [], reviews: [], chatHistory: [], aiLog: [],
  settings: { theme: 'auto', warmTint: false, weekStart: 'sunday', nudgeDismissed: {},
    lastBackupAt: null, encryption: false, ai: { provider: 'none' } }
});
let mem = null;
export let error = null;

export function load() {
  // Legacy migration: check for old keys and migrate if present
  const LEGACY_KEYS = ['atomicHabits', 'atomic.state'];
  for (const oldKey of LEGACY_KEYS) {
    const rawLegacy = localStorage.getItem(oldKey);
    if (rawLegacy) {
      try {
        const legacy = JSON.parse(rawLegacy);
        // Backup raw legacy data for safety
        const backupKey = `${oldKey}_v1_backup`;
        try { localStorage.setItem(backupKey, rawLegacy); } catch {}
        // Simple migration: map to new schema if possible
        const migrated = {
          schemaVersion: 2,
          habits: legacy.habits ?? [],
          events: (legacy.events ?? []).map(ev => ({ ...ev, atApproximate: true, version: 'full' })),
          journal: legacy.journal ?? [],
          scorecard: [],
          alterEgo: null,
          woop: [],
          reviews: [],
          chatHistory: [],
          settings: {
            theme: 'auto',
            warmTint: false,
            weekStart: 'sunday',
            nudgeDismissed: {},
            lastBackupAt: null,
            encryption: false,
            ai: { provider: 'none' }
          }
        };
        // Save migrated data under new key and clear legacy keys
        save(migrated);
        localStorage.removeItem(oldKey);
        mem = migrated;
        return mem;
      } catch (e) {
        // If parsing fails, ignore and continue to normal load
      }
    }
  }
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(KEY);
    mem = raw ? JSON.parse(raw) : fresh();
    if (mem.schemaVersion !== 2) throw new Error(`Unsupported schemaVersion ${mem.schemaVersion}`);
    mem.habits = mem.habits || [];
    mem.events = mem.events || [];
    mem.journal = mem.journal || [];
    mem.scorecard = mem.scorecard || [];
  } catch (e) {
    error = e.message;          // never overwrite data we could not read
    mem = fresh();
  }
  return mem;
}
export function save(state = mem) {
  mem = state;
  if (error) return false;
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}
export const exportJSON = () => JSON.stringify(load(), null, 2);
export function importJSON(text) {
  const s = JSON.parse(text);
  if (s.schemaVersion !== 2 || !['habits', 'events', 'journal'].every(k => Array.isArray(s[k])))
    throw new Error('Not a valid Atomic backup.');
  error = null; return save(s);
}
export function wipe() { error = null; mem = null; try { localStorage.removeItem(KEY); } catch {} }
