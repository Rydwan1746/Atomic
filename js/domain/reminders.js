// RFC 5545 .ics Calendar Export & In-Tab Reminder Notifications
// Story 5.1

/**
 * Generates standard RFC 5545 .ics string with recurring daily VEVENTs
 * for habits with reminders or intentions.
 */
export function generateIcs(state) {
  const habits = (state.habits || []).filter(h => !h.archivedAt);
  const now = new Date();
  const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const events = [];

  for (const hb of habits) {
    const timeStr = hb.intention?.time || '08:00';
    const [hh, mm] = timeStr.split(':').map(Number);

    const startYear = now.getFullYear();
    const startMonth = String(now.getMonth() + 1).padStart(2, '0');
    const startDay = String(now.getDate()).padStart(2, '0');
    const startHour = String(hh || 8).padStart(2, '0');
    const startMin = String(mm || 0).padStart(2, '0');

    const dtStart = `${startYear}${startMonth}${startDay}T${startHour}${startMin}00`;
    const dtEndMin = (Number(startMin) + 10) % 60;
    const dtEndHour = Number(startHour) + Math.floor((Number(startMin) + 10) / 60);
    const dtEnd = `${startYear}${startMonth}${startDay}T${String(dtEndHour).padStart(2, '0')}${String(dtEndMin).padStart(2, '0')}00`;

    const summary = `Vote for: ${hb.identity || hb.name}`;
    const description = `Habit: ${hb.name}\\nIdentity: ${hb.identity}\\nTwo-Minute Version: ${hb.twoMinuteVersion || 'Show up'}`;
    const location = hb.intention?.place || 'Everyday Sanctuary';

    events.push([
      'BEGIN:VEVENT',
      `UID:${hb.id}-daily@atomic.v2`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      'RRULE:FREQ=DAILY',
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT5M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${summary}`,
      'END:VALARM',
      'END:VEVENT'
    ].join('\r\n'));
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Atomic Habits v2//Daily Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Checks in-tab notification permissions and schedules reminder checks
 */
export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return await Notification.requestPermission();
}

export function notifyHabit(habit) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  new Notification(`Time for your vote: ${habit.name}`, {
    body: habit.twoMinuteVersion ? `2-min version: ${habit.twoMinuteVersion}` : habit.identity,
    icon: '/icon.png'
  });
}

