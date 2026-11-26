// Backup reminders. Data lives only in this browser, and some browsers (Safari in particular) may clear
// site data that has not been used for a while, so a quiet reminder appears when a backup is overdue.
export const BACKUP_EVERY_DAYS = 14;
export const SNOOZE_DAYS = 7;
const DAY = 864e5;

const daysSince = (iso, now) => (iso ? Math.floor((now - new Date(iso).getTime()) / DAY) : null);

// Returns null when no reminder is needed, or { days, never } describing how overdue the backup is.
export function backupDue(state, now = Date.now()) {
  const habits = state.habits || [];
  if (!habits.length && !(state.journal || []).length) return null;               // nothing to lose yet
  const snoozed = daysSince(state.settings?.backupNudgeSnoozedAt, now);
  if (snoozed != null && snoozed < SNOOZE_DAYS) return null;
  const last = daysSince(state.settings?.lastBackupAt, now);
  if (last != null) return last >= BACKUP_EVERY_DAYS ? { days: last, never: false } : null;
  const firstAt = habits.map(h => h.createdAt).filter(Boolean).sort()[0];
  const age = daysSince(firstAt, now);
  return age != null && age >= BACKUP_EVERY_DAYS ? { days: age, never: true } : null;
}
