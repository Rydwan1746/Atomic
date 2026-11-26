// At-rest passphrase protection (FR-26 / AD-6).
const _store = {};
globalThis.localStorage = {
  getItem: k => Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null,
  setItem: (k, v) => { _store[k] = v; },
  removeItem: k => { delete _store[k]; }
};

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../../js/core/storage.js';

const KEY = 'atomic.v2';
const PASS = 'correct horse battery';
const reset = () => { S.wipe(); Object.keys(_store).forEach(k => delete _store[k]); };

// Simulates closing the tab: forget everything in memory, keep localStorage.
async function reopen() {
  const raw = _store[KEY];
  S.wipe();
  _store[KEY] = raw;
}

describe('Passphrase protection', () => {
  beforeEach(reset);

  it('stores only ciphertext once turned on', async () => {
    const st = S.load();
    st.journal.push({ id: 'j1', text: 'A very private sentence' });
    S.save(st);
    await S.enableProtection(PASS);
    assert.ok(_store[KEY].startsWith('atomic:vault:v1:'));
    assert.equal(_store[KEY].includes('private sentence'), false);
    assert.equal(S.load().settings.encryptionEnabled, true);
  });

  it('keeps saving encrypted, with a fresh IV each time', async () => {
    await S.enableProtection(PASS);
    const first = _store[KEY];
    const st = S.load(); st.habits.push({ id: 'h1', name: 'Read' }); S.save(st);
    await S.flush();
    assert.ok(_store[KEY].startsWith('atomic:vault:v1:'));
    assert.notEqual(_store[KEY].split(':')[4], first.split(':')[4]);
  });

  it('is locked after reopening, and refuses to overwrite the ciphertext', async () => {
    const st = S.load(); st.habits.push({ id: 'h1', name: 'Read' }); S.save(st);
    await S.enableProtection(PASS);
    await reopen();
    const before = _store[KEY];
    assert.equal(S.isLocked(), true);
    assert.equal(S.load().habits.length, 0);           // nothing readable while locked
    assert.equal(S.save(S.load()), false);              // and nothing written
    assert.equal(_store[KEY], before);
    assert.throws(() => S.importJSON(JSON.stringify({ schemaVersion: 2, habits: [], events: [], journal: [] })));
  });

  it('rejects a wrong passphrase and unlocks with the right one', async () => {
    const st = S.load(); st.habits.push({ id: 'h1', name: 'Read' }); S.save(st);
    await S.enableProtection(PASS);
    await reopen();
    await assert.rejects(S.unlock('wrong passphrase'));
    assert.equal(S.isLocked(), true);
    await S.unlock(PASS);
    assert.equal(S.isLocked(), false);
    assert.equal(S.load().habits[0].name, 'Read');
    // Saves after unlocking stay encrypted.
    S.save(S.load()); await S.flush();
    assert.ok(_store[KEY].startsWith('atomic:vault:v1:'));
  });

  it('changes the passphrase', async () => {
    await S.enableProtection(PASS);
    await S.changePassphrase('a new passphrase');
    assert.equal(await S.checkPassphrase(PASS), false);
    assert.equal(await S.checkPassphrase('a new passphrase'), true);
  });

  it('turns off and writes plain JSON again', async () => {
    const st = S.load(); st.habits.push({ id: 'h1', name: 'Read' }); S.save(st);
    await S.enableProtection(PASS);
    await S.disableProtection();
    const plain = JSON.parse(_store[KEY]);
    assert.equal(plain.habits[0].name, 'Read');
    assert.equal(plain.settings.encryptionEnabled, false);
  });
});
