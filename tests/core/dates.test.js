import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toDate, today, parse, diffDays, addDays } from '../../js/core/dates.js';

describe('dates.js', () => {
  describe('toDate(d)', () => {
    it('formats a date using local calendar getters (zero-pads month and day)', () => {
      const d = new Date(2026, 0, 5); // local: Jan 5 2026
      assert.equal(toDate(d), '2026-01-05');
    });

    it('formats December correctly', () => {
      const d = new Date(2026, 11, 31); // local: Dec 31 2026
      assert.equal(toDate(d), '2026-12-31');
    });
  });

  describe('today()', () => {
    it('returns a string in YYYY-MM-DD format', () => {
      assert.match(today(), /^\d{4}-\d{2}-\d{2}$/);
    });

    it('matches the local date constructed from getFullYear/getMonth/getDate', () => {
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const expected = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      assert.equal(today(), expected);
    });
  });

  describe('parse(s)', () => {
    it('parses a YYYY-MM-DD string into a local date', () => {
      const d = parse('2026-06-15');
      assert.equal(d.getFullYear(), 2026);
      assert.equal(d.getMonth(), 5); // June = 5
      assert.equal(d.getDate(), 15);
    });

    it('does not apply UTC offset — month and day are local', () => {
      const d = parse('2026-01-01');
      assert.equal(d.getFullYear(), 2026);
      assert.equal(d.getMonth(), 0);
      assert.equal(d.getDate(), 1);
    });
  });

  describe('diffDays(a, b)', () => {
    it('returns the number of calendar days from b to a', () => {
      assert.equal(diffDays('2026-10-16', '2026-10-14'), 2);
    });

    it('returns 0 for the same date', () => {
      assert.equal(diffDays('2026-06-01', '2026-06-01'), 0);
    });

    it('returns a negative value when a is before b', () => {
      assert.equal(diffDays('2026-10-14', '2026-10-16'), -2);
    });

    it('handles month boundaries', () => {
      assert.equal(diffDays('2026-11-01', '2026-10-31'), 1);
    });
  });

  describe('addDays(s, n)', () => {
    it('advances by n days', () => {
      assert.equal(addDays('2026-10-14', 2), '2026-10-16');
    });

    it('handles negative offsets', () => {
      assert.equal(addDays('2026-10-16', -2), '2026-10-14');
    });

    it('crosses month boundaries', () => {
      assert.equal(addDays('2026-10-31', 1), '2026-11-01');
    });

    it('crosses year boundaries', () => {
      assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    });

    it('survives DST boundary (spring-forward week)', () => {
      // 2026-03-28 is in DST-change week for many locales; must still count calendar days correctly
      assert.equal(addDays('2026-03-28', 2), '2026-03-30');
    });
  });
});

