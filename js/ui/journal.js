import * as S from '../core/storage.js';
import { h, moodPicker } from './components.js';
import { promptForToday } from '../data/prompts.js';
import * as J from '../domain/journal.js';

let mood = null;
let shift = 0;
let draft = '';
let page = 0;
const PAGE_SIZE = 5;

export function render(el) {
  const st = S.load();
  const redraw = () => render(el);
  const q = promptForToday(shift);

  function entryCard(j) {
    const hb = j.habitId && st.habits.find(x => x.id === j.habitId);
    const editBtn = h('button', { class: 'btn-text', type: 'button', onclick: () => openEdit(j) }, 'Edit');
    const delBtn = h('button', { class: 'btn-text', type: 'button', onclick: () => {
      if (confirm('Delete this entry?')) {
        const newSt = J.deleteEntry(st, j.id);
        S.save(newSt);
        redraw();
      }
    } }, 'Delete');

    return h('article', { class: 'card entry' },
      h('div', { class: 'acts' },
        h('span', { class: 'sub' }, j.date),
        h('span', { class: 'chip' }, J.KINDS[j.kind] || 'Entry'),
        hb && h('span', { class: 'chip' }, hb.name)
      ),
      j.prompt && h('div', { class: 'sub voice' }, j.prompt),
      h('p', {}, j.text),
      h('label', {},
        h('input', {
          type: 'checkbox',
          checked: Boolean(j['private']),
          onchange: e => {
            const newSt = J.updateEntry(st, j.id, { 'private': e.target.checked });
            S.save(newSt);
            redraw();
          }
        }),
        'Never send to AI'
      ),
      h('div', { class: 'acts' }, editBtn, delBtn)
    );
  }

  function openEdit(entry) {
    const modal = document.createElement('div');
    modal.className = 'dlg';
    let editPrivate = Boolean(entry['private']);
    let editMood = entry.mood;

    const ta = h('textarea', { rows: 4 }, entry.text);
    const moodPickerEl = moodPicker(editMood, m => { editMood = m; }, 'Mood (optional)');
    const privateChk = h('label', {},
      h('input', {
        type: 'checkbox',
        checked: editPrivate,
        onchange: e => { editPrivate = e.target.checked; }
      }),
      'Never send to AI'
    );
    const saveBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => {
      const updates = { text: ta.value.trim(), mood: editMood, 'private': editPrivate };
      const newSt = J.updateEntry(st, entry.id, updates);
      S.save(newSt);
      if (modal.parentNode) modal.parentNode.removeChild(modal);
      redraw();
    } }, 'Save');
    const cancelBtn = h('button', { class: 'btn', type: 'button', onclick: () => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    } }, 'Cancel');

    modal.appendChild(h('h2', {}, 'Edit entry'));
    modal.appendChild(ta);
    modal.appendChild(moodPickerEl);
    modal.appendChild(privateChk);
    modal.appendChild(h('div', { class: 'acts', style: 'margin-top:14px;justify-content:flex-end' }, saveBtn, cancelBtn));
    document.body.appendChild(modal);
  }

  const entries = J.list(st, 0, (page + 1) * PAGE_SIZE);
  const total = J.totalPages(st, PAGE_SIZE);

  el.replaceChildren(...[
    h('h2', {}, 'Journal'),
    h('span', { class: 'chip' }, 'Stays on this device'),
    h('p', { class: 'voice', style: 'font-size:20px;line-height:1.35' }, q),
    h('div', {}, h('button', { class: 'btn-text', type: 'button', onclick: () => { shift++; redraw(); } }, 'Try another question')),
    h('textarea', {
      'aria-label': q,
      placeholder: 'Write anything. There are no rules.',
      value: draft,
      oninput: e => { draft = e.target.value; }
    }),
    moodPicker(mood, m => { mood = mood === m ? null : m; redraw(); }, 'Mood (optional)'),
    h('div', { class: 'acts' }, h('button', { class: 'btn primary', type: 'button', onclick: () => {
      const text = draft.trim();
      if (!text) return;
      const newSt = J.addEntry(st, { kind: 'free', habitId: null, text, mood, 'private': false });
      mood = null;
      draft = '';
      S.save(newSt);
      redraw();
    } }, 'Save')),
    entries.length ? entries.map(entryCard) : h('div', { class: 'empty' }, 'Nothing written yet.'),
    page + 1 < total ? h('button', { class: 'btn', type: 'button', onclick: () => { page++; redraw(); } }, 'Load more') : null
  ].flat().filter(Boolean));
}
