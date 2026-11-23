// Alter Ego & Identity Portfolio Domain
// Stories 3.1, 3.3
import { today, diffDays, toDate } from '../core/dates.js';
import * as K from './streaks.js';

export function saveAlterEgo(state, data = {}) {
  const alterEgo = {
    name: (data.name || '').trim(),
    narrative: (data.narrative || '').trim(),
    coreValues: Array.isArray(data.coreValues)
      ? data.coreValues.map(v => String(v).trim()).filter(Boolean).slice(0, 3)
      : [],
    obstacleStrategy: (data.obstacleStrategy || '').trim(),
    behaviors: Array.isArray(data.behaviors)
      ? data.behaviors.map(b => String(b).trim()).filter(Boolean).slice(0, 3)
      : [],
    updatedAt: new Date().toISOString(),
  };

  return {
    ...state,
    alterEgo
  };
}

// FR-18: Future-Self chat unlocks only once the profile has a description and 3 behaviors.
export function isAlterEgoConfigured(alterEgo) {
  if (!alterEgo) return false;
  const behaviors = (alterEgo.behaviors || []).filter(b => String(b).trim());
  return Boolean((alterEgo.narrative || '').trim()) && behaviors.length >= 3;
}

export function getIdentityPortfolio(state, t = today()) {
  const habits = (state.habits || []).filter(h => !h.archivedAt);
  const events = state.events || [];

  const portfolio = new Map();

  for (const hb of habits) {
    const norm = (hb.identity || '').trim().toLowerCase();
    if (!norm) continue;

    if (!portfolio.has(norm)) {
      portfolio.set(norm, {
        identity: hb.identity.trim(),
        category: hb.category || 'Health',
        totalVotes: 0,
        habits: [],
        allDates: new Set(),
        earliestCreated: toDate(new Date(hb.createdAt || new Date()))
      });
    }

    const item = portfolio.get(norm);
    item.habits.push(hb.name || hb.vote);

    const hbCreated = toDate(new Date(hb.createdAt || new Date()));
    if (hbCreated < item.earliestCreated) {
      item.earliestCreated = hbCreated;
    }
  }

  for (const ev of events) {
    if (ev.type !== 'checkin') continue;
    const hb = (state.habits || []).find(h => h.id === ev.habitId);
    if (!hb) continue;
    const norm = (hb.identity || '').trim().toLowerCase();
    const item = portfolio.get(norm);
    if (item) {
      item.totalVotes++;
      item.allDates.add(ev.date);
    }
  }

  return [...portfolio.values()].map(item => {
    const datesArr = [...item.allDates].sort();
    const consistencyPct = K.consistency(datesArr, item.earliestCreated, t);
    return {
      identity: item.identity,
      category: item.category,
      totalVotes: item.totalVotes,
      consistencyPct,
      habits: item.habits
    };
  }).sort((a, b) => b.totalVotes - a.totalVotes);
}

/**
 * Story 3.3: Offline Scenario Simulator
 * Deterministically maps user friction scenarios to Alter Ego values and behaviors.
 */
export function simulateScenario(alterEgo, scenarioText) {
  const text = (scenarioText || '').trim();
  const name = alterEgo?.name || 'Your Future Self';
  const strategy = alterEgo?.obstacleStrategy || 'pause, breathe, and take the smallest possible step';
  const values = alterEgo?.coreValues && alterEgo.coreValues.length
    ? alterEgo.coreValues.join(', ')
    : 'intentionality, courage, consistency';
  const behaviors = alterEgo?.behaviors && alterEgo.behaviors.length
    ? alterEgo.behaviors
    : ['taking the 2-minute version', 'showing up for 60 seconds'];

  const prompt = [
    `${name} stands anchored in ${values}.`,
    `When encountering "${text || 'a moment of friction'}", your defined obstacle strategy is:`,
    `"${strategy}"`,
    `Consider which archetype behavior to deploy right now:`,
    ...behaviors.map((b, i) => `${i + 1}. ${b}`),
    `What is one immediate 2-minute vote you can cast right now to align with ${name}?`
  ].join('\n\n');

  return {
    scenario: text,
    name,
    prompt,
    strategy,
    values,
    behaviors
  };
}

