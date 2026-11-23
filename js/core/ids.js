export function randomUUID(c = typeof crypto !== 'undefined' ? crypto : undefined) {
  if (c) {
    if (typeof c.randomUUID === 'function') {
      try {
        return c.randomUUID();
      } catch (e) {
        // Fall through if secure context is required or restricted
      }
    }
    if (typeof c.getRandomValues === 'function') {
      try {
        const bytes = new Uint8Array(16);
        c.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // RFC 4122 version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant 10
        const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
        return [
          hex.slice(0, 8),
          hex.slice(8, 12),
          hex.slice(12, 16),
          hex.slice(16, 20),
          hex.slice(20, 32)
        ].join('-');
      } catch (e) {
        // Fall through
      }
    }
  }

  // Math.random fallback for non-secure HTTP origins / legacy engines
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const r = (Math.random() * 16) | 0;
    const v = char === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

export const id = prefix => `${prefix}_${randomUUID()}`;
