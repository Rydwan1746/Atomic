// The ONLY file that touches localStorage.
//
// FR-26 / AD-6: when passphrase protection is on, everything is stored as one AES-256-GCM envelope.
// The key is held in memory only. While the data is locked, saving is refused, so the encrypted copy can
// never be overwritten by an empty state; main.js shows the unlock screen before anything renders.
import { isEncrypted, createKey, encryptWithKey, openEnvelope } from './crypto.js';

const KEY = 'atomic.v2';
const fresh = () => ({
  schemaVersion: 2, habits: [], events: [], journal: [], scorecard: [], alterEgo: null,
  woop: [], reviews: [], chatHistory: [], aiLog: [],
  settings: { theme: 'auto', warmTint: false, weekStart: 'sunday', nudgeDismissed: {},
    lastBackupAt: null, encryptionEnabled: false, ai: { provider: 'none' } }
});
let mem = null;
export let error = null;

// Encryption state (memory only).
let vault = null;          // { key, salt } while protection is on and unlocked
let locked = false;        // encrypted data found and not yet unlocked
let writing = Promise.resolve();
let pendingWrite = false;

function normalise(s) {
  if (s.schemaVersion !== 2) throw new Error(`Unsupported schemaVersion ${s.schemaVersion}`);
  s.habits = s.habits || [];
  s.events = s.events || [];
  s.journal = s.journal || [];
  s.scorecard = s.scorecard || [];
  s.settings = s.settings || {};
  return s;
}

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
          ...fresh(),
          habits: legacy.habits ?? [],
          events: (legacy.events ?? []).map(ev => ({ ...ev, atApproximate: true, version: 'full' })),
          journal: legacy.journal ?? []
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
    if (isEncrypted(raw)) {
      locked = true;
      error = 'locked';          // refuses saves until unlock()
      mem = fresh();
      return mem;
    }
    mem = normalise(raw ? JSON.parse(raw) : fresh());
  } catch (e) {
    error = e.message;          // never overwrite data we could not read
    mem = fresh();
  }
  return mem;
}

export function save(state = mem) {
  mem = state;
  if (error) return false;
  if (vault) { queueEncryptedWrite(); return true; }
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}

// Encrypted writes are asynchronous. Saves made while one is running collapse into a single write of the
// latest state, in order.
function queueEncryptedWrite() {
  if (pendingWrite) return;
  pendingWrite = true;
  writing = writing.then(async () => {
    pendingWrite = false;
    if (!vault) return;
    try { localStorage.setItem(KEY, await encryptWithKey(mem, vault.key, vault.salt)); }
    catch { /* quota or crypto failure: the next save retries */ }
  });
}

// Resolves once every queued write has reached localStorage.
export const flush = () => writing;

export const exportJSON = () => JSON.stringify(load(), null, 2);
export function importJSON(text) {
  const s = JSON.parse(text);
  if (s.schemaVersion !== 2 || !['habits', 'events', 'journal'].every(k => Array.isArray(s[k])))
    throw new Error('Not a valid Atomic backup.');
  if (locked) throw new Error('Unlock your data before importing a backup.');
  error = null;
  s.settings = { ...(s.settings || {}), encryptionEnabled: Boolean(vault) };
  return save(s);
}
export function wipe() {
  error = null; mem = null; vault = null; locked = false;
  try { localStorage.removeItem(KEY); } catch {}
}

// --- Passphrase protection --------------------------------------------------------

export const isLocked = () => { load(); return locked; };
export const isProtected = () => Boolean(vault) || isLocked();

// Opens the stored envelope. Throws if the passphrase is wrong; nothing changes in that case.
export async function unlock(passphrase) {
  const raw = localStorage.getItem(KEY);
  const { state, key, salt } = await openEnvelope(raw, passphrase);
  mem = normalise(state);
  vault = { key, salt };
  locked = false;
  error = null;
  return mem;
}

// True if `passphrase` opens the stored data. Used before turning protection off or changing it.
export async function checkPassphrase(passphrase) {
  try { await openEnvelope(localStorage.getItem(KEY), passphrase); return true; }
  catch { return false; }
}

export async function enableProtection(passphrase) {
  if (locked) throw new Error('Unlock first.');
  vault = await createKey(passphrase);
  load().settings.encryptionEnabled = true;
  save();
  await flush();
}

export async function changePassphrase(passphrase) {
  if (!vault) throw new Error('Protection is not on.');
  vault = await createKey(passphrase);
  save();
  await flush();
}

export async function disableProtection() {
  if (!vault) return;
  await flush();
  vault = null;
  load().settings.encryptionEnabled = false;
  save();
}
