// Reminders: RFC 5545 calendar export (FR-24) and in-tab notifications (FR-25).
import { today } from '../core/dates.js';

const pad = n => String(n).padStart(2, '0');

// S18: reminder text uses the intention. "Read 10 pages at 21:00 in the sofa?" / "Read 10 pages today?"
export function reminderText(hb) {
  const name = hb.name || hb.vote || 'Your habit';
  const i = hb.intention || {};
  if (!i.time) return `${name} today?`;
  return `${name} at ${i.time}${i.place ? ` in ${i.place}` : ''}?`;
}

// --- RFC 5545 -----------------------------------------------------------------

// Escapes TEXT values: backslash, semicolon, comma and newlines.
export function icsEscape(text = '') {
  return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

// Folds content lines longer than 75 octets, as RFC 5545 section 3.1 requires.
export function foldLine(line) {
  const bytes = s => new TextEncoder().encode(s).length;
  if (bytes(line) <= 75) return line;
  const out = [];
  let cur = '';
  for (const ch of line) {
    if (bytes(cur + ch) > (out.length ? 74 : 75)) { out.push(cur); cur = ''; }
    cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

const localTimeZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch { return null; }
};

// One daily VEVENT per active habit that has an intention time.
// opts.now and opts.timeZone exist for tests.
export function generateIcs(state, { now = new Date(), timeZone = localTimeZone() } = {}) {
  const habits = (state.habits || []).filter(h => !h.archivedAt && /^\d{2}:\d{2}$/.test(h.intention?.time || ''));
  const stamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

  const events = habits.map(hb => {
    const [hh, mm] = hb.intention.time.split(':');
    const start = `${date}T${hh}${mm}00`;
    const summary = reminderText(hb);
    const description = [
      hb.identity ? `A vote for: ${hb.identity}` : '',
      hb.twoMinuteVersion ? `Two-minute version: ${hb.twoMinuteVersion}` : ''
    ].filter(Boolean).join('\n');
    return [
      'BEGIN:VEVENT',
      `UID:${hb.id}-daily@atomic`,
      `DTSTAMP:${stamp}`,
      // Floating local time if the time zone is unknown; otherwise the IANA zone name.
      timeZone ? `DTSTART;TZID=${timeZone}:${start}` : `DTSTART:${start}`,
      'DURATION:PT10M',
      'RRULE:FREQ=DAILY',
      `SUMMARY:${icsEscape(summary)}`,
      description && `DESCRIPTION:${icsEscape(description)}`,
      hb.intention.place && `LOCATION:${icsEscape(hb.intention.place)}`,
      'BEGIN:VALARM',
      'TRIGGER:PT0M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsEscape(summary)}`,
      'END:VALARM',
      'END:VEVENT'
    ].filter(Boolean);
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Atomic//Habit Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.flat(),
    'END:VCALENDAR'
  ].map(foldLine).join('\r\n') + '\r\n';
}

export const icsHabitCount = state => (state.habits || []).filter(h => !h.archivedAt && h.intention?.time).length;

// --- In-tab notifications -------------------------------------------------------

export const REMINDER_WINDOW_MIN = 30;   // a reminder missed while the tab slept still fires within 30 minutes

export const notificationsSupported = () => typeof Notification !== 'undefined';

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') return Notification.permission;
  return Notification.requestPermission();
}

// Pure: which habits should be reminded about right now?
// Active, reminder on, has an intention time, not done today, not reminded today,
// and now is between the intention time and REMINDER_WINDOW_MIN minutes after it.
export function dueReminders(state, now = new Date()) {
  const t = today();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const reminded = state.settings?.remindedOn || {};
  return (state.habits || []).filter(hb => {
    if (hb.archivedAt || !hb.reminderOn || !hb.intention?.time) return false;
    if (reminded[hb.id] === t) return false;
    if ((state.events || []).some(e => e.habitId === hb.id && e.type === 'checkin' && e.date === t)) return false;
    const [hh, mm] = hb.intention.time.split(':').map(Number);
    const at = hh * 60 + mm;
    return minutesNow >= at && minutesNow < at + REMINDER_WINDOW_MIN;
  });
}

export function notifyHabit(habit) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  new Notification(reminderText(habit), {
    body: habit.twoMinuteVersion ? `Two-minute version: ${habit.twoMinuteVersion}` : (habit.identity ? `A vote for: ${habit.identity}` : ''),
    tag: `atomic-${habit.id}`
  });
  return true;
}
