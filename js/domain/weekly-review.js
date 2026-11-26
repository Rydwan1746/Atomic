// FR-17: Weekly Review protocol.
// A review window opens every Sunday at 18:00 local time and stays open until the next one opens.
// It is available once the user has at least 3 days of logged activity, and can be completed once per window.
import { toDate, today } from '../core/dates.js';
import { id } from '../core/ids.js';
import * as K from './streaks.js';
import { getWeeklyReview } from './insights.js';

export const MIN_ACTIVE_DAYS = 3;
export const OPEN_HOUR = 18;

// The window containing `now`: { weekOf: 'YYYY-MM-DD' (the Sunday it opened), opensAt, nextOpensAt }.
export function reviewWindow(now = new Date()) {
  const opens = new Date(now);
  opens.setHours(OPEN_HOUR, 0, 0, 0);
  opens.setDate(opens.getDate() - opens.getDay());          // this week's Sunday 18:00
  if (opens > now) opens.setDate(opens.getDate() - 7);       // before Sunday 18:00: last week's window
  const next = new Date(opens);
  next.setDate(next.getDate() + 7);
  return { weekOf: toDate(opens), opensAt: opens, nextOpensAt: next };
}

export const activeDays = state =>
  new Set((state.events || []).filter(e => e.type === 'checkin').map(e => e.date)).size;

// { status: 'locked' | 'open' | 'done', activeDays, needed, window, completed }
export function reviewStatus(state, now = new Date()) {
  const window = reviewWindow(now);
  const days = activeDays(state);
  const completed = (state.reviews || []).find(r => r.weekOf === window.weekOf) || null;
  const status = days < MIN_ACTIVE_DAYS ? 'locked' : completed ? 'done' : 'open';
  return { status, activeDays: days, needed: MIN_ACTIVE_DAYS, window, completed };
}

// The four steps: (1) votes and consistency, (2) strongest insight, (3) theme-derived reflection,
// (4) an open intention, saved to the journal.
export function buildReview(state, now = new Date()) {
  const t = toDate(now);
  const base = getWeeklyReview(state, t);
  const habits = (state.habits || []).filter(h => !h.archivedAt).map(h => {
    const ds = K.datesFor(state.events || [], h.id);
    return { id: h.id, name: h.name || h.vote, consistency: K.consistency(ds, toDate(new Date(h.createdAt || now)), t) };
  });
  return {
    ...base,
    habits,
    steps: [
      { n: 1, title: 'Your votes this week' },
      { n: 2, title: 'What the data noticed' },
      { n: 3, title: 'A question to sit with' },
      { n: 4, title: 'One intention for the week ahead' }
    ]
  };
}

// Saves the intention (and optional reflection) as a journal entry and marks this window as done.
export function completeReview(state, { reflection = '', intention = '', prompt = '' } = {}, now = new Date()) {
  const window = reviewWindow(now);
  const text = [
    reflection.trim() && `Reflection: ${reflection.trim()}`,
    intention.trim() && `Intention: ${intention.trim()}`
  ].filter(Boolean).join('\n\n');
  const journalId = text ? id('j') : null;
  const journal = text
    ? [...(state.journal || []), {
        id: journalId, at: now.toISOString(), date: today(), kind: 'weekly_review', habitId: null,
        prompt: prompt || 'Weekly review', text, mood: null, energy: null, private: false
      }]
    : (state.journal || []);
  const reviews = [...(state.reviews || []).filter(r => r.weekOf !== window.weekOf),
    { weekOf: window.weekOf, completedAt: now.toISOString(), journalId, intention: intention.trim() || null }];
  return { ...state, journal, reviews };
}
