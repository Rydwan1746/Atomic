import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateIcs } from '../../js/domain/reminders.js';

describe('Story 5.1: RFC 5545 .ics Calendar Export', () => {
  it('generates standard RFC 5545 calendar with daily recurring events and alarms', () => {
    const state = {
      habits: [
        {
          id: 'h_daily',
          name: 'Morning Journaling',
          identity: 'A thoughtful thinker',
          twoMinuteVersion: 'Write one line',
          intention: { time: '07:30', place: 'Desk' },
          archivedAt: null
        }
      ]
    };

    const ics = generateIcs(state);
    assert.ok(ics.includes('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('VERSION:2.0'));
    assert.ok(ics.includes('BEGIN:VEVENT'));
    assert.ok(ics.includes('RRULE:FREQ=DAILY'));
    assert.ok(ics.includes('SUMMARY:Vote for: A thoughtful thinker'));
    assert.ok(ics.includes('LOCATION:Desk'));
    assert.ok(ics.includes('BEGIN:VALARM'));
    assert.ok(ics.includes('TRIGGER:-PT5M'));
    assert.ok(ics.includes('END:VCALENDAR'));
  });
});

