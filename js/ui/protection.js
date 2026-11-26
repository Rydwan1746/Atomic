// Me > Passphrase protection (FR-26): encrypt the data stored on this device.
import * as S from '../core/storage.js';
import { h, announce } from './components.js';

const MIN_LENGTH = 8;
let mode = null;   // null | 'enable' | 'change' | 'disable'
let busy = false;
let message = '';

const pw = (label, auto = 'new-password') => h('label', {}, label, h('input', { type: 'password', autocomplete: auto, minlength: String(MIN_LENGTH) }));

export function protectionSection(redraw) {
  const on = S.isProtected();
  const done = (msg = '') => { mode = null; busy = false; message = msg; if (msg) announce(msg); redraw(); };
  const fail = msg => { busy = false; message = msg; redraw(); };

  const form = () => {
    if (mode === 'enable' || mode === 'change') {
      const a = pw(mode === 'enable' ? 'New passphrase' : 'New passphrase'), b = pw('Repeat it');
      const ack = h('input', { type: 'checkbox' });
      return h('form', { class: 'sub-form', onsubmit: async e => {
        e.preventDefault();
        const p1 = a.querySelector('input').value, p2 = b.querySelector('input').value;
        if (p1.length < MIN_LENGTH) return fail(`Use at least ${MIN_LENGTH} characters. A short sentence works well.`);
        if (p1 !== p2) return fail('The two passphrases do not match.');
        if (!ack.checked) return fail('Please confirm that you understand there is no recovery.');
        busy = true; message = 'Encrypting…'; redraw();
        try {
          if (mode === 'enable') await S.enableProtection(p1); else await S.changePassphrase(p1);
          done(mode === 'enable' ? 'Passphrase protection is on.' : 'Passphrase changed.');
        } catch (err) { fail(err.message); }
      } },
        a, b,
        h('label', { class: 'inline-check' }, ack, 'I understand that if I forget it, my data cannot be recovered by anyone.'),
        h('div', { class: 'acts' },
          h('button', { class: 'btn primary', type: 'submit', disabled: busy }, mode === 'enable' ? 'Turn on protection' : 'Change passphrase'),
          h('button', { class: 'btn', type: 'button', onclick: () => done() }, 'Cancel')));
    }
    if (mode === 'disable') {
      const cur = pw('Current passphrase', 'current-password');
      return h('form', { class: 'sub-form', onsubmit: async e => {
        e.preventDefault();
        busy = true; message = 'Checking…'; redraw();
        if (!(await S.checkPassphrase(cur.querySelector('input').value))) return fail('That passphrase does not match.');
        await S.disableProtection();
        done('Passphrase protection is off. Your data is stored unencrypted on this device.');
      } },
        cur,
        h('div', { class: 'acts' },
          h('button', { class: 'btn primary', type: 'submit', disabled: busy }, 'Turn off protection'),
          h('button', { class: 'btn', type: 'button', onclick: () => done() }, 'Cancel')));
    }
    return null;
  };

  return [
    h('strong', { style: 'margin-top:8px' }, 'Passphrase protection'),
    h('p', { class: 'sub' }, on
      ? 'On. Everything stored on this device is encrypted (AES-256-GCM, key from your passphrase with PBKDF2). Atomic asks for the passphrase each time it opens.'
      : 'Off. Anyone with access to this browser can read your habits and journal. Turn this on to encrypt them with a passphrase only you know.'),
    mode ? form() : h('div', { class: 'acts' },
      on ? [
        h('button', { class: 'btn', type: 'button', onclick: async () => { await S.flush(); location.reload(); } }, 'Lock now'),
        h('button', { class: 'btn', type: 'button', onclick: () => { mode = 'change'; message = ''; redraw(); } }, 'Change passphrase'),
        h('button', { class: 'btn', type: 'button', onclick: () => { mode = 'disable'; message = ''; redraw(); } }, 'Turn off')
      ] : h('button', { class: 'btn', type: 'button', onclick: () => { mode = 'enable'; message = ''; redraw(); } }, 'Set a passphrase')),
    message ? h('p', { class: 'sub', role: 'status' }, message) : null
  ];
}
