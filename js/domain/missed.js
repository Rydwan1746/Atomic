import * as S from '../core/storage.js';
import { today, addDays, toDate } from '../core/dates.js';
const yesterday = () => addDays(today(), -1);
const existed = (hb, y) => !hb.archivedAt && toDate(new Date(hb.createdAt)) < y;   // created before yesterday
const done = (st, hid, d) => st.events.some(e => e.habitId === hid && e.type === 'checkin' && e.date === d);
export const missedYesterday = (hb, st = S.load()) => existed(hb, yesterday()) && !done(st, hb.id, yesterday());
// Habits missed yesterday with no "Skip today" note written that day.
export function forgotten(st = S.load()) {
  const y = yesterday();
  return st.habits.filter(hb => missedYesterday(hb, st) &&
    !st.journal.some(j => j.kind === 'miss_reason' && j.habitId === hb.id && j.date === y));
}
