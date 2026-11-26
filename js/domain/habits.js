import * as S from '../core/storage.js';
import { today } from '../core/dates.js';
import { id } from '../core/ids.js';
export const CATEGORIES = ['Health', 'Learning', 'Creativity', 'Mindfulness', 'Connection'];
export const list = () => S.load().habits.filter(h => !h.archivedAt).reverse();   // active, newest first
export const listArchived = () => S.load().habits.filter(h => h.archivedAt).reverse();
export const get = hid => S.load().habits.find(h => h.id === hid);
export const stackedAfter = hid => S.load().habits.filter(h => h.stackedAfter === hid && !h.archivedAt);
export const todayEvent = hid => S.load().events.find(e => e.habitId === hid && e.date === today() && e.type === 'checkin');
export function createHabit(state, payload = {}) {
  const habitName = (payload.name || payload.vote || '').trim();
  const identityName = (payload.identity || '').trim();
  const habit = {
    id: id('h'),
    name: habitName,
    vote: habitName,
    identity: identityName,
    category: payload.category || 'Health',
    stackedAfter: payload.stackedAfter || null,
    intention: typeof payload.intention === 'object' && payload.intention !== null
      ? payload.intention
      : (payload.intention ? { time: '', place: payload.intention } : null),
    twoMinuteVersion: payload.twoMinuteVersion || (typeof payload.intention === 'string' ? payload.intention : null),
    temptationBundle: payload.temptationBundle || null,
    reminderOn: false,
    createdAt: new Date().toISOString(),
    archivedAt: null,
    events: [],
    notes: [],
  };
  const newHabits = [...(state.habits || []), habit];
  return { ...state, habits: newHabits };
}

export function remove(hid) {
  const st = S.load();
  st.habits = st.habits.filter(h => h.id !== hid);
  st.habits.forEach(h => { if (h.stackedAfter === hid) h.stackedAfter = null; });
  st.events = st.events.filter(e => e.habitId !== hid);
  S.save(st);
}
export function toggle(hid, version = 'full') {               // returns true when a NEW check-in was created
  const st = S.load(), d = today();
  const i = st.events.findIndex(e => e.habitId === hid && e.date === d && e.type === 'checkin');
  if (i >= 0) { st.events.splice(i, 1); S.save(st); return false; }
  st.events.push({ id: id('e'), habitId: hid, type: 'checkin', date: d, at: new Date().toISOString(),
    version, mood: null, energy: null });
  S.save(st); return true;
}
export function setMood(hid, mood) {
  const e = todayEvent(hid); if (!e) return;
  e.mood = e.mood === mood ? null : mood; S.save();
}

export function setEnergy(hid, energy) {
  const e = todayEvent(hid); if (!e) return;
  e.energy = e.energy === energy ? null : energy; S.save();
}

// --- FR-5: edit and archive (pure functions on state) ------------------------

// True when making `hid` stack after `anchorId` would create a loop (A after B after A).
export function wouldCycle(habits, hid, anchorId) {
  const byId = new Map(habits.map(h => [h.id, h]));
  let cur = anchorId;
  const seen = new Set();
  while (cur && !seen.has(cur)) {
    if (cur === hid) return true;
    seen.add(cur);
    cur = byId.get(cur)?.stackedAfter || null;
  }
  return false;
}

// Applies an edit. Unknown or invalid values are ignored rather than stored.
export function updateHabit(state, hid, f = {}) {
  const habits = state.habits || [];
  const clean = v => (typeof v === 'string' ? v.trim() : v);
  return {
    ...state,
    habits: habits.map(h => {
      if (h.id !== hid) return h;
      const next = { ...h };
      if (clean(f.name)) { next.name = clean(f.name); next.vote = next.name; }
      if (clean(f.identity)) next.identity = clean(f.identity);
      if (CATEGORIES.includes(f.category)) next.category = f.category;
      if ('stackedAfter' in f) {
        const anchor = f.stackedAfter || null;
        const exists = habits.some(x => x.id === anchor) || (state.scorecard || []).some(x => x.id === anchor);
        const valid = anchor && anchor !== hid && exists && !wouldCycle(habits, hid, anchor);
        next.stackedAfter = valid ? anchor : null;
      }
      if ('time' in f || 'place' in f) {
        const time = /^\d{2}:\d{2}$/.test(f.time || '') ? f.time : '';
        const place = clean(f.place) || '';
        next.intention = time || place ? { time, place } : null;
      }
      if ('twoMinuteVersion' in f) next.twoMinuteVersion = clean(f.twoMinuteVersion) || null;
      if ('temptationBundle' in f) next.temptationBundle = clean(f.temptationBundle) || null;
      if ('reminderOn' in f) next.reminderOn = Boolean(f.reminderOn) && Boolean(next.intention?.time);
      return next;
    })
  };
}

// Archiving keeps the habit and its history but hides it from Today, insights and reminders.
export function archiveHabit(state, hid, at = new Date().toISOString()) {
  return { ...state, habits: (state.habits || []).map(h => h.id === hid ? { ...h, archivedAt: at, reminderOn: false } : h) };
}

export function restoreHabit(state, hid) {
  return { ...state, habits: (state.habits || []).map(h => h.id === hid ? { ...h, archivedAt: null } : h) };
}
