// Client-Side Privacy Firewall & Payload Builder
// Story 4.1
import { today, diffDays, toDate } from '../core/dates.js';
import * as K from '../domain/streaks.js';
import * as INS from '../domain/insights.js';

export function buildSafePayload(state, mode = 'mirror', { includeJournalOptIn = false } = {}) {
  const t = today();
  const habits = (state.habits || []).filter(h => !h.archivedAt);
  const events = state.events || [];
  const journal = state.journal || [];

  // Aggregated habit metrics (strictly numerical & categorical)
  const habitsSummary = habits.map(h => {
    const ds = K.datesFor(events, h.id);
    const createdDate = toDate(new Date(h.createdAt || new Date()));
    return {
      name: h.name,
      identity: h.identity,
      category: h.category,
      currentStreak: K.current(ds, t),
      longestStreak: K.longest(ds),
      consistency30d: K.consistency(ds, createdDate, t)
    };
  });

  const pulse = INS.getRollingPulse(state, t);

  // Journal filtering: strictly exclude any entry with private: true
  // Even if user opts in to sharing journal text for reflection, private: true is strictly filtered.
  let safeJournalEntries = [];
  if (includeJournalOptIn) {
    safeJournalEntries = journal
      .filter(j => !j['private'])
      .slice(-3)
      .map(j => ({ date: j.date, prompt: j.prompt, text: j.text }));
  }

  const payload = {
    version: '2.0',
    mode, // 'mirror' | 'future'
    timestamp: new Date().toISOString(),
    metrics: {
      totalHabits: habits.length,
      totalEvents: events.length,
      trailing7DayVotes: pulse.totalVotes,
      leadingIdentity: pulse.identities[0] ? pulse.identities[0].identity : null
    },
    habits: habitsSummary,
    alterEgo: mode === 'future' ? {
      name: state.alterEgo?.name || 'Future Self',
      narrative: state.alterEgo?.narrative || '',
      coreValues: state.alterEgo?.coreValues || [],
      obstacleStrategy: state.alterEgo?.obstacleStrategy || '',
      behaviors: state.alterEgo?.behaviors || []
    } : null,
    journalSnippets: safeJournalEntries,
    privacyVerification: {
      rawJournalEntriesCount: safeJournalEntries.length,
      strictlyExcludedPrivateEntriesCount: journal.filter(j => j['private']).length,
      localOnly: true
    }
  };

  return payload;
}

export function formatPrivacyChipLabel(payload) {
  const count = payload.journalSnippets?.length || 0;
  return `🔒 Aggregated stats only (${count} raw journal entries shared) · Tap to preview payload`;
}

