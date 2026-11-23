import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { id, randomUUID } from '../../js/core/ids.js';

describe('ids.js', () => {
  it('generates a valid prefixed UUID with default crypto', () => {
    const habitId = id('h');
    assert.match(habitId, /^h_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    const scoreId = id('sc');
    assert.match(scoreId, /^sc_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('falls back to crypto.getRandomValues when crypto.randomUUID is not a function', () => {
    const mockCrypto = {
      getRandomValues: bytes => {
        for (let i = 0; i < bytes.length; i++) bytes[i] = (Math.random() * 256) | 0;
        return bytes;
      }
    };
    const generated = randomUUID(mockCrypto);
    assert.match(generated, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('falls back to Math.random when crypto is completely undefined', () => {
    const generated = randomUUID(undefined);
    assert.match(generated, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
