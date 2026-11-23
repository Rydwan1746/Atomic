import { today, addDays, diffDays } from '../core/dates.js';

export const datesFor = (events, hid) =>
  [...new Set(events.filter(e => e.habitId === hid && e.type === 'checkin').map(e => e.date))].sort();

export function current(ds, t = today()) {
  const s = new Set(ds);
  let d = s.has(t) ? t : addDays(t, -1);
  let n = 0;
  while (s.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

export function longest(ds) {
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of ds) {
    run = prev && diffDays(d, prev) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function consistency(ds, createdDate, t = today()) {
  const days = Math.max(1, Math.min(30, diffDays(t, createdDate) + 1));
  const from = addDays(t, -(days - 1));
  return Math.round(100 * ds.filter(d => d >= from && d <= t).length / days);
}

export function recoveryTime(ds, createdDate, t = today()) {
  if (!createdDate || !ds) return null;
  const doneSet = new Set(ds);
  const sortedDates = [...ds].sort();

  const totalDays = diffDays(t, createdDate);
  if (totalDays <= 0) return null;

  let missCount = 0;
  let totalRecoveryDays = 0;
  let resolvedMisses = 0;

  for (let i = 0; i <= totalDays; i++) {
    const curDate = addDays(createdDate, i);
    if (!doneSet.has(curDate)) {
      missCount++;
      const nextCheckin = sortedDates.find(d => d > curDate);
      if (nextCheckin) {
        resolvedMisses++;
        totalRecoveryDays += diffDays(nextCheckin, curDate);
      }
    }
  }

  // Displayed once >= 3 misses occur
  if (missCount < 3 || resolvedMisses === 0) return null;

  return Number((totalRecoveryDays / resolvedMisses).toFixed(1));
}
