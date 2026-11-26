// Shared backup download and storage-persistence helpers.
import * as S from '../core/storage.js';
import { h, announce } from './components.js';

export function downloadBackup() {
  const a = h('a', {
    href: URL.createObjectURL(new Blob([S.exportJSON()], { type: 'application/json' })),
    download: `atomic-backup-${new Date().toLocaleDateString('en-CA')}.json`
  });
  a.click();
  const st = S.load();
  st.settings.lastBackupAt = new Date().toISOString();
  S.save(st);
  announce('Backup downloaded');
}

// Asks the browser not to clear Atomic's data under storage pressure or inactivity.
// Chrome and Edge decide silently; Firefox may ask the user. Safari's support varies, so backups still matter.
export async function requestPersistence() {
  try {
    if (!navigator.storage?.persist) return 'unsupported';
    if (await navigator.storage.persisted()) return 'granted';
    return (await navigator.storage.persist()) ? 'granted' : 'denied';
  } catch { return 'unsupported'; }
}

export async function persistenceStatus() {
  try {
    if (!navigator.storage?.persisted) return 'unsupported';
    return (await navigator.storage.persisted()) ? 'granted' : 'denied';
  } catch { return 'unsupported'; }
}
