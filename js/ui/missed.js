import * as S from '../core/storage.js';
import { today, addDays } from '../core/dates.js';
import { id } from '../core/ids.js';
import { h } from './components.js';
import { forgotten } from '../domain/missed.js';
const CHIPS = ['Tired', 'Busy', 'Forgot', 'Not in the mood', 'Something unexpected', 'Other'];

export function maybeAsk() {                       // once per day, most recent missed day only
  const st = S.load(), t = today(), y = addDays(t, -1);
  if (st.settings.missHandledDate === t) return;
  const list = forgotten(st); if (!list.length) return;
  const d = document.getElementById('note-dialog'), ans = {};
  d.addEventListener('close', () => { st.settings.missHandledDate = t; S.save(st); }, { once: true });
  d.replaceChildren(...[
    h('h2', { id: 'note-title' }, 'Yesterday slipped by for these.'),
    h('p', { class: 'sub' }, 'What got in the way? No judgment, just noticing.'),
    list.map(hb => {
      const a = ans[hb.id] = { chip: '', text: '' };
      const txt = h('input', { placeholder: 'A line, if you want', autocomplete: 'off', 'aria-label': `Note for ${hb.name}` });
      txt.addEventListener('input', () => { a.text = txt.value; });
      const chips = CHIPS.map(c => h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => {
        a.chip = a.chip === c ? '' : c;
        chips.forEach(x => x.setAttribute('aria-pressed', String(x.textContent === a.chip)));
      } }, c));
      return h('div', { class: 'item', style: 'flex-direction:column;align-items:stretch' },
        h('strong', {}, hb.name), h('div', { class: 'acts' }, chips), txt);
    }),
    h('div', { class: 'acts', style: 'margin-top:14px;justify-content:flex-end' },
      h('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Not now'),
      h('button', { class: 'btn primary', type: 'button', onclick: () => {
        for (const hb of list) {
          const a = ans[hb.id], text = [a.chip, a.text.trim()].filter(Boolean).join(': ');
          if (text) st.journal.push({ id: id('j'), at: new Date().toISOString(), date: y, kind: 'miss_reason',
            habitId: hb.id, prompt: 'What got in the way?', text, mood: null, energy: null, private: false });
        }
        d.close();
      } }, 'Save'))
  ].flat());
  d.showModal();
}
