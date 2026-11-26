import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { backupDue } from '../../js/domain/backup.js';

const NOW = new Date('2026-11-26T12:00:00Z').getTime();
const ago = d => new Date(NOW - d * 864e5).toISOString();
const st = (settings = {}, created = 30) => ({ habits: [{ id: 'h', createdAt: ago(created) }], journal: [], settings });

describe('Backup reminder', () => {
  it('stays quiet with no data or a recent backup', () => {
    assert.equal(backupDue({ habits: [], journal: [], settings: {} }, NOW), null);
    assert.equal(backupDue(st({ lastBackupAt: ago(3) }), NOW), null);
    assert.equal(backupDue(st({}, 5), NOW), null);
  });
  it('reminds after 14 days since the last backup, or since the first habit if never', () => {
    assert.deepEqual(backupDue(st({ lastBackupAt: ago(20) }), NOW), { days: 20, never: false });
    assert.deepEqual(backupDue(st({}, 15), NOW), { days: 15, never: true });
  });
  it('can be snoozed for 7 days', () => {
    assert.equal(backupDue(st({ backupNudgeSnoozedAt: ago(2) }), NOW), null);
    assert.ok(backupDue(st({ backupNudgeSnoozedAt: ago(8) }), NOW));
  });
});
