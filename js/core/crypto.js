// Full-State Passphrase Encryption Vault
// Story 5.2: PBKDF2 (HMAC-SHA256, 600,000 iterations), AES-256-GCM, 16-byte salt, 12-byte IV

const ITERATIONS = 600000;
const HASH = 'SHA-256';

function getSubtle() {
  const c = globalThis.crypto;
  if (!c || !c.subtle) {
    throw new Error('Web Cryptography API is not available in this environment.');
  }
  return c.subtle;
}

function getRandomValues(len) {
  const arr = new Uint8Array(len);
  globalThis.crypto.getRandomValues(arr);
  return arr;
}

function toBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return globalThis.btoa(binary);
}

function fromBase64(base64) {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function deriveKey(passphrase, saltBytes) {
  const subtle = getSubtle();
  const encoder = new TextEncoder();
  const passKey = await subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: ITERATIONS,
      hash: HASH
    },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts an object or string state using AES-256-GCM.
 * Returns an envelope string formatted as: `atomic:vault:v1:<salt_b64>:<iv_b64>:<ciphertext_b64>`
 */
export async function encryptState(state, passphrase) {
  const subtle = getSubtle();
  const salt = getRandomValues(16);
  const iv = getRandomValues(12);

  const key = await deriveKey(passphrase, salt);
  const dataStr = typeof state === 'string' ? state : JSON.stringify(state);
  const plaintext = new TextEncoder().encode(dataStr);

  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  const saltB64 = toBase64(salt);
  const ivB64 = toBase64(iv);
  const cipherB64 = toBase64(new Uint8Array(ciphertext));

  return `atomic:vault:v1:${saltB64}:${ivB64}:${cipherB64}`;
}

/**
 * Decrypts an encrypted envelope string back to an object.
 */
export async function decryptState(envelope, passphrase) {
  if (!isEncrypted(envelope)) {
    throw new Error('Not a valid encrypted vault envelope.');
  }

  const parts = envelope.split(':');
  const salt = fromBase64(parts[3]);
  const iv = fromBase64(parts[4]);
  const ciphertext = fromBase64(parts[5]);

  const subtle = getSubtle();
  const key = await deriveKey(passphrase, salt);

  const decrypted = await subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const text = new TextDecoder().decode(decrypted);
  return JSON.parse(text);
}

export function isEncrypted(raw) {
  return typeof raw === 'string' && raw.startsWith('atomic:vault:v1:');
}


// --- At-rest encryption (FR-26 / AD-6) ------------------------------------------
// The key is derived once (600,000 PBKDF2 iterations) when the user unlocks or sets a passphrase, then
// reused for every save with a fresh 12-byte IV. It lives only in memory. Envelopes use the same
// atomic:vault:v1 format, so decryptState() can still open them with the passphrase.

// A new random salt and the key derived from it.
export async function createKey(passphrase) {
  const salt = getRandomValues(16);
  return { key: await deriveKey(passphrase, salt), salt };
}

export async function encryptWithKey(state, key, salt) {
  const iv = getRandomValues(12);
  const plaintext = new TextEncoder().encode(typeof state === 'string' ? state : JSON.stringify(state));
  const ciphertext = await getSubtle().encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return `atomic:vault:v1:${toBase64(salt)}:${toBase64(iv)}:${toBase64(new Uint8Array(ciphertext))}`;
}

// Opens an envelope and returns the state together with the key and salt, so later saves can reuse them.
// Throws on a wrong passphrase (AES-GCM authentication fails).
export async function openEnvelope(envelope, passphrase) {
  if (!isEncrypted(envelope)) throw new Error('Not a valid encrypted vault envelope.');
  const parts = envelope.split(':');
  const salt = fromBase64(parts[3]);
  const key = await deriveKey(passphrase, salt);
  const decrypted = await getSubtle().decrypt({ name: 'AES-GCM', iv: fromBase64(parts[4]) }, key, fromBase64(parts[5]));
  return { state: JSON.parse(new TextDecoder().decode(decrypted)), key, salt };
}
