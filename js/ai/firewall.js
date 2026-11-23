// Client-side privacy firewall: builds the ONLY data that may leave the device for a chat reply.
//
// Separation of responsibility starts here: each mode receives only the context its role needs.
//   - mirror: aggregated numbers (consistency, streaks, recovery, votes, detected patterns, scorecard tally).
//             No Alter Ego profile.
//   - future: identity statements, habit names, the Alter Ego profile and WOOP plans. No numbers at all,
//             so the Future Self cannot quote metrics it was never given.
// Journal text is excluded unless the user ticks "Include journal text" for that one message, and entries
// marked private: true ("Never send to AI") are excluded even then.
import { today, toDate } from '../core/dates.js';
import * as K from '../domain/streaks.js';
import * as INS from '../domain/insights.js';
import { getTally } from '../domain/scorecard.js';

export const JOURNAL_SNIPPET_LIMIT = 3;
const SNIPPET_CHARS = 600;

const createdDate = h => toDate(new Date(h.createdAt || Date.now()));

function journalSnippets(state, include) {
  if (!include) return [];
  const habitName = id => (state.habits || []).find(h => h.id === id)?.name || null;
  return (state.journal || [])
    .filter(j => !j['private'] && (j.text || '').trim())
    .slice(-JOURNAL_SNIPPET_LIMIT)
    .map(j => ({
      date: j.date,
      habit: j.habitId ? habitName(j.habitId) : null,
      prompt: j.prompt || null,
      text: j.text.length > SNIPPET_CHARS ? j.text.slice(0, SNIPPET_CHARS) + '…' : j.text
    }));
}

function mirrorContext(state, t) {
  const habits = (state.habits || []).filter(h => !h.archivedAt);
  const events = state.events || [];
  const pulse = INS.getRollingPulse(state, t);
  let patterns = [];
  try {
    patterns = (INS.evaluatePatterns(state, t).patterns || [])
      .filter(p => p.unlocked !== false && p.message)
      .slice(0, 5)
      .map(p => ({ finding: p.message, sample: p.sampleSize || null }));
  } catch { patterns = []; }

  return {
    today: t,
    totals: {
      activeHabits: habits.length,
      checkInsAllTime: events.filter(e => e.type === 'checkin').length,
      checkInsLast7Days: pulse.totalVotes
    },
    habits: habits.map(h => {
      const ds = K.datesFor(events, h.id);
      return {
        name: h.name,
        identity: h.identity || null,
        category: h.category || null,
        currentStreakDays: K.current(ds, t),
        longestStreakDays: K.longest(ds),
        consistency30dPercent: K.consistency(ds, createdDate(h), t),
        averageRecoveryDays: K.recoveryTime(ds, createdDate(h), t),
        doneToday: ds.includes(t)
      };
    }),
    votesLast7DaysByIdentity: pulse.identities.map(g => ({ identity: g.identity, votes: g.votes })),
    patterns,
    scorecard: (state.scorecard || []).length ? getTally(state.scorecard) : null
  };
}

function futureContext(state) {
  const habits = (state.habits || []).filter(h => !h.archivedAt);
  const ae = state.alterEgo || {};
  const identities = [...new Set(habits.map(h => (h.identity || '').trim()).filter(Boolean))];
  return {
    alterEgo: {
      name: ae.name || null,
      narrative: ae.narrative || '',
      coreValues: ae.coreValues || [],
      obstacleStrategy: ae.obstacleStrategy || '',
      behaviors: ae.behaviors || []
    },
    identities,
    habits: habits.map(h => ({
      name: h.name,
      identity: h.identity || null,
      twoMinuteVersion: h.twoMinute || h.twoMinuteVersion || null
    })),
    woopPlans: (state.woop || []).map(w => ({ wish: w.wish, obstacle: w.obstacle, plan: w.plan }))
  };
}

export function buildSafePayload(state, mode = 'mirror', { includeJournalOptIn = false } = {}) {
  const t = today();
  const journal = state.journal || [];
  const snippets = journalSnippets(state, includeJournalOptIn);

  return {
    version: '2.1',
    mode,
    context: mode === 'future' ? futureContext(state) : mirrorContext(state, t),
    journalSnippets: snippets,
    privacyVerification: {
      journalEntriesShared: snippets.length,
      privateEntriesExcluded: journal.filter(j => j['private']).length,
      metricsShared: mode === 'mirror',
      alterEgoShared: mode === 'future'
    }
  };
}

export function formatPrivacyChipLabel(payload) {
  const n = payload.journalSnippets?.length || 0;
  const scope = payload.mode === 'future' ? 'Alter Ego profile and habit names' : 'Aggregated stats only';
  const journal = n ? ` + ${n} journal ${n === 1 ? 'entry' : 'entries'}` : ', no journal text';
  return `🔒 ${scope}${journal} · Tap to preview`;
}
