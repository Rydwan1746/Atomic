import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateIcs, reminderText, icsEscape, foldLine, dueReminders } from '../../js/domain/reminders.js';
import { today } from '../../js/core/dates.js';

const habit = (over = {}) => ({
  id: 'h_daily', name: 'Morning Journaling', identity: 'A thoughtful thinker', twoMinuteVersion: 'Write one line',
  intention: { time: '07:30', place: 'Desk, by the window' }, archivedAt: null, ...over
});

describe('Reminder text (S18)', () => {
  it('uses the intention', () => {
    assert.equal(reminderText(habit()), 'Morning Journaling at 07:30 in Desk, by the window?');
    assert.equal(reminderText(habit({ intention: { time: '07:30', place: '' } })), 'Morning Journaling at 07:30?');
    assert.equal(reminderText(habit({ intention: null })), 'Morning Journaling today?');
  });
});

describe('RFC 5545 .ics export (FR-24)', () => {
  const now = new Date(2026, 10, 26, 9, 0);

  it('writes a daily event with time zone, 10-minute duration and an on-time alarm', () => {
    const ics = generateIcs({ habits: [habit()] }, { now, timeZone: 'Europe/Paris' });
    for (const line of ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', 'DTSTART;TZID=Europe/Paris:20261126T073000',
      'DURATION:PT10M', 'RRULE:FREQ=DAILY', 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'END:VCALENDAR']) {
      assert.ok(ics.includes(line), line);
    }
    assert.ok(ics.includes('SUMMARY:Morning Journaling at 07:30 in Desk\\, by the window?'));
    assert.ok(ics.includes('LOCATION:Desk\\, by the window'));
    assert.ok(ics.split('\r\n').every(l => new TextEncoder().encode(l).length <= 75));
  });

  it('only includes active habits with an intention time', () => {
    const ics = generateIcs({ habits: [habit(), habit({ id: 'h2', intention: null }), habit({ id: 'h3', archivedAt: '2026-01-01' })] }, { now });
    assert.equal(ics.match(/BEGIN:VEVENT/g).length, 1);
  });

  it('falls back to floating local time without a time zone', () => {
    assert.ok(generateIcs({ habits: [habit()] }, { now, timeZone: null }).includes('DTSTART:20261126T073000'));
  });

  it('escapes and folds per the RFC', () => {
    assert.equal(icsEscape('a;b,c\\d\ne'), 'a\\;b\\,c\\\\d\\ne');
    const folded = foldLine('SUMMARY:' + 'x'.repeat(100));
    assert.ok(folded.includes('\r\n '));
    assert.equal(folded.replace(/\r\n /g, ''), 'SUMMARY:' + 'x'.repeat(100));
  });
});

describe('In-tab reminders (FR-25)', () => {
  const at = (hh, mm) => { const d = new Date(); d.setHours(hh, mm, 0, 0); return d; };
  const state = (over = {}, extra = {}) => ({ habits: [habit({ reminderOn: true, ...over })], events: [], settings: {}, ...extra });

  it('is due from the intention time for 30 minutes', () => {
    assert.equal(dueReminders(state(), at(7, 29)).length, 0);
    assert.equal(dueReminders(state(), at(7, 30)).length, 1);
    assert.equal(dueReminders(state(), at(7, 59)).length, 1);
    assert.equal(dueReminders(state(), at(8, 0)).length, 0);
  });

  it('skips habits that are off, archived, done today or already reminded today', () => {
    assert.equal(dueReminders(state({ reminderOn: false }), at(7, 31)).length, 0);
    assert.equal(dueReminders(state({ archivedAt: '2026-01-01' }), at(7, 31)).length, 0);
    assert.equal(dueReminders(state({}, { events: [{ habitId: 'h_daily', type: 'checkin', date: today() }] }), at(7, 31)).length, 0);
    assert.equal(dueReminders(state({}, { settings: { remindedOn: { h_daily: today() } } }), at(7, 31)).length, 0);
  });
});
