import * as S from '../core/storage.js';
import { today } from '../core/dates.js';
import { id } from '../core/ids.js';
export const CATEGORIES = ['Health', 'Learning', 'Creativity', 'Mindfulness', 'Connection'];
export const list = () => S.load().habits.slice().reverse();          // newest first
export const get = hid => S.load().habits.find(h => h.id === hid);
export const stackedAfter = hid => S.load().habits.filter(h => h.stackedAfter === hid);
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

export function add(f) {
  const st = S.load();
  st.habits.push({ id: id('h'), name: f.name.trim(), identity: f.identity.trim(), category: f.category,
    stackedAfter: f.stackedAfter || null,
    intention: (f.time || f.place) ? { time: f.time || '', place: (f.place || '').trim() } : null,
    twoMinuteVersion: (f.two || '').trim() || null, temptationBundle: (f.bundle || '').trim() || null,
    reminderOn: false, createdAt: new Date().toISOString(), archivedAt: null });
  S.save(st);
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
