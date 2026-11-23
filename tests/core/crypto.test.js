import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encryptState, decryptState, isEncrypted } from '../../js/core/crypto.js';

describe('Story 5.2: PBKDF2 / AES-256-GCM Encryption Vault', () => {
  it('encrypts state and decrypts back to original object with correct passphrase', async () => {
    const originalState = {
      schemaVersion: 2,
      habits: [{ id: 'h1', name: 'Secret habit' }],
      events: [{ id: 'e1', date: '2026-05-10' }],
      journal: [{ id: 'j1', text: 'Private vault note', private: true }]
    };

    const passphrase = 'MySuperSecretPassphrase123!';
    const envelope = await encryptState(originalState, passphrase);

    assert.equal(isEncrypted(envelope), true);
    assert.ok(envelope.startsWith('atomic:vault:v1:'));

    const decrypted = await decryptState(envelope, passphrase);
    assert.deepEqual(decrypted, originalState);
  });

  it('fails decryption when wrong passphrase is provided', async () => {
    const originalState = { hello: 'world' };
    const envelope = await encryptState(originalState, 'CorrectPassphrase');

    await assert.rejects(
      async () => {
        await decryptState(envelope, 'WrongPassphrase');
      }
    );
  });
});

