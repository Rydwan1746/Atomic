import * as S from './core/storage.js';
import { h } from './ui/components.js';
import { applyTheme } from './ui/theme.js';
import * as today from './ui/today.js';
import * as journal from './ui/journal.js';
import * as insights from './ui/insights.js';
import * as chat from './ui/chat.js';
import * as me from './ui/me.js';
import * as detail from './ui/habit-detail.js';
import * as missed from './ui/missed.js';
import { dueReminders, notifyHabit } from './domain/reminders.js';
import { today as todayDate } from './core/dates.js';

const placeholder = (title, text) => el => el.replaceChildren(h('h2', {}, title), h('div', { class: 'empty' }, text));
const ROUTES = {
  today: ['Today', today.render], journal: ['Journal', journal.render],
  insights: ['Insights', insights.render],
  chat: ['Chat', chat.render],
  me: ['Me', me.render]
};
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

function route() {
  const key = (location.hash.replace('#/', '') || 'today');
  const name = ROUTES[key] ? key : 'today';
  document.getElementById('nav').replaceChildren(...Object.entries(ROUTES).map(([k, [label]]) =>
    h('a', { href: `#/${k}`, 'aria-current': k === name ? 'page' : null }, label)));
  const view = document.getElementById('view');
  if (key.startsWith('habit/')) detail.render(view, key.slice(6).split('?')[0]); else ROUTES[name][1](view);
}

// FR-25: in-tab reminders. Checked every 30 seconds while the tab is open; each habit fires at most once a day.
function checkReminders() {
  const st = S.load();
  const due = dueReminders(st);
  if (!due.length) return;
  st.settings.remindedOn = st.settings.remindedOn || {};
  for (const hb of due) if (notifyHabit(hb)) st.settings.remindedOn[hb.id] = todayDate();
  S.save(st);
}

// Starts the app. Runs once the data is readable (immediately, or after the passphrase is entered).
function boot() {
  S.load(); applyTheme(); today.initDialog();
  addEventListener('hashchange', route); route(); missed.maybeAsk();
  setInterval(checkReminders, 30000);
  checkReminders();
}

// FR-26: protected data stays locked until the passphrase is entered. Nothing else renders or saves before that.
function lockScreen() {
  document.getElementById('nav').replaceChildren();
  let busy = false;
  const input = h('input', { type: 'password', autocomplete: 'current-password', 'aria-label': 'Passphrase' });
  const msg = h('p', { class: 'sub', role: 'status' });
  const submit = async e => {
    e.preventDefault();
    if (busy || !input.value) return;
    busy = true; msg.textContent = 'Unlocking…';
    try { await S.unlock(input.value); boot(); }
    catch { msg.textContent = 'That passphrase did not open your data. Try again.'; input.select(); }
    finally { busy = false; }
  };
  document.getElementById('view').replaceChildren(
    h('form', { class: 'card lock', onsubmit: submit },
      h('h1', { class: 'greet' }, 'Atomic is locked'),
      h('p', { class: 'sub' }, 'Your data on this device is protected with a passphrase.'),
      h('label', {}, 'Passphrase', input),
      h('div', { class: 'acts' }, h('button', { class: 'btn primary', type: 'submit' }, 'Unlock')),
      msg,
      h('details', { class: 'more' }, h('summary', {}, 'Forgot your passphrase?'),
        h('p', { class: 'sub' }, 'There is no recovery: the passphrase is the only key. You can erase the locked data and start fresh, then restore a JSON backup if you have one.'),
        h('button', { class: 'btn', type: 'button', onclick: () => {
          if (prompt('Type DELETE to erase the locked data on this device.') === 'DELETE') { S.wipe(); location.reload(); }
        } }, 'Erase and start over')))
  );
  input.focus();
}

if (S.isLocked()) lockScreen(); else boot();
