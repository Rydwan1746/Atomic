// Pure Pattern Engine & Insights Domain
// Stories 2.4, 2.5, 2.6
import { today, addDays, diffDays, parse } from '../core/dates.js';

const STOPWORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'all', 'also', 'and', 'any', 'are', 'because',
  'been', 'before', 'being', 'below', 'between', 'both', 'but', 'can', 'cannot', 'could',
  'did', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
  'has', 'have', 'having', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'into', 'its', 'itself', 'just', 'more', 'most', 'myself', 'not', 'now', 'off', 'once',
  'only', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'should',
  'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'too', 'under', 'until', 'very',
  'was', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with',
  'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MIN_BREAKS = 3;
export const MIN_MOOD_DAYS = 10;

const datesFor = (events, hid) =>
  [...new Set(events.filter(e => e.habitId === hid && e.type === 'checkin').map(e => e.date))].sort();

// Days on which a streak broke: the day after a done day that was not done, up to yesterday.
export function streakBreaks(sortedDates, t = today()) {
  const done = new Set(sortedDates);
  return sortedDates.map(d => addDays(d, 1)).filter(b => !done.has(b) && b < t);
}

// date -> average of a 1 to 5 field (mood or energy) across that day's check-ins.
export function dailyAverages(events, field) {
  const sums = new Map();
  for (const e of events) {
    if (e.type !== 'checkin' || typeof e[field] !== 'number') continue;
    const s = sums.get(e.date) || { t: 0, n: 0 };
    s.t += e[field]; s.n++;
    sums.set(e.date, s);
  }
  return new Map([...sums].map(([d, s]) => [d, s.t / s.n]));
}

/**
 * Story 2.4: 7-Day Rolling Pulse
 * Aggregates check-in events across [today - 6 days, today] grouped by normalized identity statement.
 */
export function getRollingPulse(state, t = today()) {
  const from = addDays(t, -6);
  const habitsMap = new Map((state.habits || []).map(h => [h.id, h]));
  const groups = new Map();

  for (const ev of state.events || []) {
    if (ev.type !== 'checkin' || ev.date < from || ev.date > t) continue;
    const hb = habitsMap.get(ev.habitId);
    if (!hb) continue;

    const normalized = (hb.identity || '').trim().toLowerCase();
    if (!normalized) continue;

    if (!groups.has(normalized)) {
      groups.set(normalized, {
        identity: hb.identity.trim(),
        category: hb.category || 'Health',
        votes: 0,
        habits: new Set()
      });
    }

    const g = groups.get(normalized);
    g.votes++;
    g.habits.add(hb.name || hb.vote);
  }

  const list = [...groups.values()].map(g => ({
    identity: g.identity,
    category: g.category,
    votes: g.votes,
    habits: [...g.habits]
  })).sort((a, b) => b.votes - a.votes);

  const totalVotes = list.reduce((sum, g) => sum + g.votes, 0);

  return {
    from,
    to: t,
    totalVotes,
    identities: list
  };
}

/**
 * Story 2.5: Deterministic Statistical Pattern Engine
 * Evaluates:
 * 1. Weekday Slip: >= 25% gap between a specific weekday consistency and overall average
 * 2. Time-of-Day Rhythm: >= 60% of check-ins clustering in morning (05-12), afternoon (12-17), or evening (17-23)
 * 3. Streak-Break Precursor: >= 50% correlation with previous day's specific skip/behavior
 * 4. Habit Co-occurrence: >= 25% joint completion likelihood
 */
export function evaluatePatterns(state, t = today()) {
  const events = state.events || [];
  const habits = (state.habits || []).filter(h => !h.archivedAt);

  // Calculate total active days of logging across the whole app
  const allDates = [...new Set(events.filter(e => e.type === 'checkin').map(e => e.date))].sort();
  const totalLoggedDays = allDates.length;

  const coldStart = totalLoggedDays < 7;
  const moodDays = dailyAverages(events, 'mood');
  const maxBreaks = Math.max(0, ...habits.map(hb => streakBreaks(datesFor(events, hb.id), t).length));
  const milestones = [
    { name: '7-Day Rolling Rhythm', unit: 'days logged', daysRequired: 7, current: Math.min(7, totalLoggedDays) },
    { name: 'Weekday Slip Analysis', unit: 'days logged', daysRequired: 21, current: Math.min(21, totalLoggedDays) },
    { name: 'Time-of-Day Clustering', unit: 'days logged', daysRequired: 14, current: Math.min(14, totalLoggedDays) },
    { name: 'Habit Co-occurrences', unit: 'days logged', daysRequired: 14, current: Math.min(14, totalLoggedDays) },
    { name: 'Streak-Break Precursors', unit: 'streak breaks', daysRequired: MIN_BREAKS, current: Math.min(MIN_BREAKS, maxBreaks) },
    { name: 'Mood Correlates', unit: 'days with a mood', daysRequired: MIN_MOOD_DAYS, current: Math.min(MIN_MOOD_DAYS, moodDays.size) },
  ];

  if (coldStart) {
    return {
      coldStart: true,
      totalLoggedDays,
      milestones,
      locked: milestones.filter(m => m.current < m.daysRequired),
      patterns: []
    };
  }

  const patterns = [];

  for (const hb of habits) {
    const hbEvents = events.filter(e => e.habitId === hb.id && e.type === 'checkin');
    const hbDates = new Set(hbEvents.map(e => e.date));
    const createdDate = hb.createdAt ? hb.createdAt.slice(0, 10) : (allDates[0] || t);
    const totalDaysActive = Math.max(1, diffDays(t, createdDate) + 1);

    if (totalDaysActive < 14) continue;

    // --- 1. Weekday Slip (>= 25% gap) ---
    const weekdayTotal = [0, 0, 0, 0, 0, 0, 0];
    const weekdayDone = [0, 0, 0, 0, 0, 0, 0];
    const weekdayDates = [[], [], [], [], [], [], []];

    for (let i = 0; i < totalDaysActive; i++) {
      const curDate = addDays(createdDate, i);
      if (curDate > t) break;
      const dayOfWeek = parse(curDate).getDay();
      weekdayTotal[dayOfWeek]++;
      weekdayDates[dayOfWeek].push(curDate);
      if (hbDates.has(curDate)) {
        weekdayDone[dayOfWeek]++;
      }
    }

    const overallRate = hbDates.size / totalDaysActive;

    for (let d = 0; d < 7; d++) {
      if (weekdayTotal[d] >= 3) {
        const dayRate = weekdayDone[d] / weekdayTotal[d];
        const gap = overallRate - dayRate;
        if (gap >= 0.25) {
          const missedDates = weekdayDates[d].filter(dt => !hbDates.has(dt));
          patterns.push({
            id: `p_weekday_${hb.id}_${d}`,
            type: 'weekday_slip',
            habitId: hb.id,
            habitName: hb.name || hb.vote,
            unlocked: true,
            sampleSize: { k: weekdayTotal[d] - weekdayDone[d], n: weekdayTotal[d] },
            message: `${hb.name} slips on ${WEEKDAY_NAMES[d]}s: completed only ${Math.round(dayRate * 100)}% vs ${Math.round(overallRate * 100)}% overall.`,
            proof: {
              weekday: WEEKDAY_NAMES[d],
              completed: weekdayDone[d],
              totalOpportunities: weekdayTotal[d],
              overallRate: Math.round(overallRate * 100),
              weekdayRate: Math.round(dayRate * 100),
              dates: missedDates
            }
          });
        }
      }
    }

    // --- 2. Time-of-Day Rhythm (>= 60% cluster) ---
    if (hbEvents.length >= 7) {
      let morning = 0, afternoon = 0, evening = 0;
      const timestamps = [];

      for (const ev of hbEvents) {
        if (!ev.at) continue;
        timestamps.push(ev.at);
        const hour = new Date(ev.at).getHours();
        if (hour >= 5 && hour < 12) morning++;
        else if (hour >= 12 && hour < 17) afternoon++;
        else evening++;
      }

      const totalTimed = hbEvents.length;
      const clusters = [
        { period: 'morning (05:00–12:00)', count: morning },
        { period: 'afternoon (12:00–17:00)', count: afternoon },
        { period: 'evening (17:00–23:00)', count: evening },
      ];

      for (const cl of clusters) {
        const ratio = cl.count / totalTimed;
        if (ratio >= 0.60) {
          patterns.push({
            id: `p_tod_${hb.id}`,
            type: 'time_of_day_cluster',
            habitId: hb.id,
            habitName: hb.name || hb.vote,
            unlocked: true,
            sampleSize: { k: cl.count, n: totalTimed },
            message: `${hb.name} clusters strongly in the ${cl.period} (${Math.round(ratio * 100)}% of check-ins).`,
            proof: {
              cluster: cl.period,
              matchingCount: cl.count,
              totalCount: totalTimed,
              percentage: Math.round(ratio * 100),
              dates: hbEvents.map(e => e.date)
            }
          });
          break;
        }
      }
    }
  }

  // --- 3. Streak-Break Precursor (>= 50% of a habit's breaks share a precursor the day before) ---
  const energyDays = dailyAverages(events, 'energy');
  for (const hb of habits) {
    const breaks = streakBreaks(datesFor(events, hb.id), t);   // first missed day after a done day
    if (breaks.length < MIN_BREAKS) continue;
    const candidates = [
      { key: 'low_mood', label: 'a low mood (1 or 2)', test: d => (moodDays.get(d) ?? 99) <= 2 },
      { key: 'low_energy', label: 'low energy (1 or 2)', test: d => (energyDays.get(d) ?? 99) <= 2 },
      ...habits.filter(o => o.id !== hb.id).map(o => {
        const od = new Set(datesFor(events, o.id));
        const born = (o.createdAt || '').slice(0, 10);
        return { key: `missed_${o.id}`, label: `skipping ${o.name || o.vote}`, test: d => d >= born && !od.has(d) };
      })
    ];
    let best = null;
    for (const c of candidates) {
      const hits = breaks.filter(b => c.test(addDays(b, -1)));
      const ratio = hits.length / breaks.length;
      if (ratio >= 0.5 && hits.length >= 2 && (!best || ratio > best.ratio)) best = { ...c, hits, ratio };
    }
    if (best) {
      patterns.push({
        id: `p_break_${hb.id}_${best.key}`,
        type: 'streak_break_precursor',
        habitId: hb.id,
        habitName: hb.name || hb.vote,
        unlocked: true,
        sampleSize: { k: best.hits.length, n: breaks.length },
        message: `${best.hits.length} of ${breaks.length} times ${hb.name || hb.vote} stopped, the day before included ${best.label}.`,
        proof: { precursor: best.key, breaks, dates: best.hits.map(b => addDays(b, -1)), ratio: Math.round(best.ratio * 100) }
      });
    }
  }

  // --- 4. Habit Co-occurrence (>= 25% joint completion likelihood) ---
  if (habits.length >= 2) {
    for (let i = 0; i < habits.length; i++) {
      for (let j = i + 1; j < habits.length; j++) {
        const hA = habits[i];
        const hB = habits[j];

        const datesA = new Set(events.filter(e => e.habitId === hA.id && e.type === 'checkin').map(e => e.date));
        const datesB = new Set(events.filter(e => e.habitId === hB.id && e.type === 'checkin').map(e => e.date));

        if (datesA.size < 5 || datesB.size < 5) continue;

        let joint = 0;
        const sharedDates = [];
        for (const d of datesA) {
          if (datesB.has(d)) {
            joint++;
            sharedDates.push(d);
          }
        }

        const coOccurrenceRatio = joint / Math.min(datesA.size, datesB.size);
        if (coOccurrenceRatio >= 0.25 && joint >= 3) {
          patterns.push({
            id: `p_co_${hA.id}_${hB.id}`,
            type: 'co_occurrence',
            habitId: hA.id,
            secondaryHabitId: hB.id,
            habitName: `${hA.name} & ${hB.name}`,
            unlocked: true,
            sampleSize: { k: joint, n: Math.min(datesA.size, datesB.size) },
            message: `${hA.name} and ${hB.name} reinforce each other (co-occur ${Math.round(coOccurrenceRatio * 100)}% of the time).`,
            proof: {
              sharedDays: joint,
              dates: sharedDates,
              ratio: Math.round(coOccurrenceRatio * 100)
            }
          });
        }
      }
    }
  }

  // --- 5. Mood Correlates (>= 10 days with a mood; >= 0.5 point gap on the 1 to 5 scale) ---
  if (moodDays.size >= MIN_MOOD_DAYS) {
    for (const hb of habits) {
      const done = new Set(datesFor(events, hb.id));
      const born = (hb.createdAt || '').slice(0, 10);
      const withH = [], withoutH = [];
      for (const [d, m] of moodDays) {
        if (d < born) continue;
        (done.has(d) ? withH : withoutH).push(m);
      }
      if (withH.length < 3 || withoutH.length < 3) continue;
      const avg = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
      const a = avg(withH), b = avg(withoutH);
      if (Math.abs(a - b) < 0.5) continue;
      patterns.push({
        id: `p_mood_${hb.id}`,
        type: 'mood_correlate',
        habitId: hb.id,
        habitName: hb.name || hb.vote,
        unlocked: true,
        sampleSize: { k: withH.length, n: withH.length + withoutH.length },
        message: `On days with ${hb.name || hb.vote}, your recorded mood averages ${a.toFixed(1)}, against ${b.toFixed(1)} on days without it. This is a correlation, not a cause.`,
        proof: { withHabit: Number(a.toFixed(2)), withoutHabit: Number(b.toFixed(2)), daysWith: withH.length, daysWithout: withoutH.length,
          dates: [...moodDays.keys()].filter(d => d >= born).sort() }
      });
    }
  }

  return {
    coldStart: false,
    totalLoggedDays,
    milestones,
    locked: milestones.filter(m => m.current < m.daysRequired),
    patterns
  };
}

/**
 * Story 2.6: Recurring-Theme NLP Tokenizer
 * Scans all journal entries and miss notes.
 * Unlocks after >= 8 total entries.
 * Surfaces top 10 recurring words (>= 4 letters, >= 3 distinct entries, stopwords excluded).
 */
export function getRecurringThemes(state) {
  const entries = state.journal || [];
  if (entries.length < 8) {
    return {
      unlocked: false,
      entryCount: entries.length,
      threshold: 8,
      themes: []
    };
  }

  const wordEntriesMap = new Map();

  for (const entry of entries) {
    const text = (entry.text || '').toLowerCase();
    // Match alphabetic word tokens >= 4 chars
    const tokens = text.match(/[a-z]{4,}/g) || [];
    const uniqueInEntry = new Set(tokens.filter(w => !STOPWORDS.has(w)));

    for (const word of uniqueInEntry) {
      if (!wordEntriesMap.has(word)) {
        wordEntriesMap.set(word, []);
      }
      wordEntriesMap.get(word).push(entry);
    }
  }

  // Filter words appearing in >= 3 distinct entries
  const eligible = [];
  for (const [word, matchingEntries] of wordEntriesMap.entries()) {
    if (matchingEntries.length >= 3) {
      eligible.push({
        word,
        count: matchingEntries.length,
        entryIds: matchingEntries.map(e => e.id),
        dates: matchingEntries.map(e => e.date)
      });
    }
  }

  // Sort descending by count, top 10
  eligible.sort((a, b) => b.count - a.count);
  const top10 = eligible.slice(0, 10);

  return {
    unlocked: true,
    entryCount: entries.length,
    threshold: 8,
    themes: top10
  };
}

/**
 * Story 2.6: Weekly Review Protocol Generator
 * Synthesizes:
 * 1. Weekly identity votes
 * 2. Strongest unlocked pattern
 * 3. Theme-derived reflection prompt
 * 4. Open intention saved to journal
 */
export function getWeeklyReview(state, t = today()) {
  const pulse = getRollingPulse(state, t);
  const patternsResult = evaluatePatterns(state, t);
  const themesResult = getRecurringThemes(state);

  const topIdentity = pulse.identities[0] || null;
  const strongestPattern = patternsResult.patterns[0] || null;
  const leadingTheme = themesResult.themes[0] || null;

  let reflectionPrompt = 'What was your single most meaningful vote this past week?';
  if (leadingTheme) {
    reflectionPrompt = `You often mentioned "${leadingTheme.word}" across ${leadingTheme.count} reflections. How did that shape your consistency this week?`;
  } else if (strongestPattern) {
    reflectionPrompt = `Your patterns show that ${strongestPattern.message} What small adjustment will support you?`;
  }

  return {
    date: t,
    topIdentity,
    totalWeeklyVotes: pulse.totalVotes,
    strongestPattern,
    leadingTheme,
    reflectionPrompt
  };
}

