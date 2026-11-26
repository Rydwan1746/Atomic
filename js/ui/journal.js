import * as S from '../core/storage.js';
import { h, moodPicker } from './components.js';
import { promptForToday } from '../data/prompts.js';
import * as J from '../domain/journal.js';

// Screen state that survives redraws.
let mood = null;
let shift = 0;
let draft = '';
let isPrivate = false;
let page = 0;
const PAGE_SIZE = 5;

// FR-9b: the writing area is a ruled notebook page on a 28px grid. It grows with the text so every
// line of writing sits on a rule; the rules themselves are a CSS background (see .ruled in style.css).
export const RULE = 28;

export function autoGrow(ta) {
  const grow = () => {
    ta.style.height = 'auto';
    const cs = getComputedStyle(ta);
    const chrome = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    const lines = Math.ceil((ta.scrollHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / RULE);
    ta.style.height = `${Math.max(lines, 1) * RULE + chrome}px`;
  };
  ta.addEventListener('input', grow);
  requestAnimationFrame(grow);
  return ta;
}

const longDate = d => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

export function render(el) {
  const st = S.load();
  const redraw = () => render(el);
  const q = promptForToday(shift);

  function entryCard(j) {
    const hb = j.habitId && st.habits.find(x => x.id === j.habitId);
    return h('article', { class: 'card entry' },
      h('div', { class: 'acts' },
        h('span', { class: 'sub' }, j.date ? longDate(j.date) : ''),
        h('span', { class: 'chip' }, J.KINDS[j.kind] || 'Entry'),
        hb && h('span', { class: 'chip' }, hb.name),
        j['private'] && h('span', { class: 'chip' }, 'Never sent to AI')
      ),
      j.prompt && h('div', { class: 'entry-prompt voice' }, j.prompt),
      h('p', { class: 'ruled' }, j.text),
      h('div', { class: 'acts' },
        h('button', { class: 'btn-text', type: 'button', onclick: () => openEdit(j) }, 'Edit'),
        h('button', { class: 'btn-text', type: 'button', onclick: () => {
          if (confirm('Delete this entry?')) { S.save(J.deleteEntry(st, j.id)); redraw(); }
        } }, 'Delete'))
    );
  }

  function openEdit(entry) {
    const dlg = h('dialog', { class: 'dlg dlg-wide', 'aria-labelledby': 'edit-title' });
    let editPrivate = Boolean(entry['private']);
    let editMood = entry.mood;
    const ta = autoGrow(h('textarea', { class: 'ruled', 'aria-label': 'Entry text', value: entry.text }));
    const moodEl = () => moodPicker(editMood, m => { editMood = editMood === m ? null : m; moodSlot.replaceChildren(moodEl()); }, 'Mood (optional)');
    const moodSlot = h('div', {}, moodEl());
    dlg.append(
      h('h2', { id: 'edit-title' }, 'Edit entry'),
      entry.prompt && h('p', { class: 'sub voice' }, entry.prompt),
      ta,
      moodSlot,
      h('label', { class: 'inline-check' },
        h('input', { type: 'checkbox', checked: editPrivate, onchange: e => { editPrivate = e.target.checked; } }),
        'Never send to AI'),
      h('div', { class: 'acts', style: 'margin-top:14px;justify-content:flex-end' },
        h('button', { class: 'btn', type: 'button', onclick: () => dlg.close() }, 'Cancel'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => {
          const text = ta.value.trim();
          if (!text) return;
          S.save(J.updateEntry(st, entry.id, { text, mood: editMood, 'private': editPrivate }));
          dlg.close();
          redraw();
        } }, 'Save'))
    );
    dlg.addEventListener('close', () => dlg.remove());
    document.body.appendChild(dlg);
    dlg.showModal();
  }

  const writing = autoGrow(h('textarea', {
    class: 'ruled notebook-input',
    'aria-label': q,
    placeholder: 'Write anything. There are no rules, only lines.',
    value: draft,
    oninput: e => { draft = e.target.value; }
  }));

  const save = () => {
    const text = draft.trim();
    if (!text) return;
    S.save(J.addEntry(st, { kind: 'free', habitId: null, prompt: q, text, mood, 'private': isPrivate }));
    mood = null; draft = ''; isPrivate = false; page = 0;
    redraw();
  };

  const notebook = h('section', { class: 'notebook' },
    h('div', { class: 'notebook-head' },
      h('span', { class: 'sub' }, longDate(new Date().toLocaleDateString('en-CA'))),
      h('span', { class: 'chip' }, 'Stays on this device')),
    h('p', { class: 'notebook-prompt voice' }, q),
    h('button', { class: 'btn-text', type: 'button', style: 'align-self:flex-start;padding:0', onclick: () => { shift++; redraw(); } }, 'Try another question'),
    writing,
    moodPicker(mood, m => { mood = mood === m ? null : m; redraw(); }, 'Mood (optional)'),
    h('div', { class: 'acts', style: 'justify-content:space-between' },
      h('label', { class: 'inline-check' },
        h('input', { type: 'checkbox', checked: isPrivate, onchange: e => { isPrivate = e.target.checked; } }),
        'Never send to AI'),
      h('button', { class: 'btn primary', type: 'button', onclick: save }, 'Save entry'))
  );

  const entries = J.list(st, 0, (page + 1) * PAGE_SIZE);
  const total = J.totalPages(st, PAGE_SIZE);

  el.replaceChildren(...[
    h('h1', { class: 'greet' }, 'Journal'),
    notebook,
    entries.length ? h('h2', { class: 'voice', style: 'font-size:18px;margin-top:8px' }, 'Earlier pages') : null,
    entries.length ? entries.map(entryCard) : h('div', { class: 'empty' }, 'Nothing written yet. The first page is the hardest.'),
    page + 1 < total ? h('button', { class: 'btn', type: 'button', style: 'align-self:flex-start', onclick: () => { page++; redraw(); } }, 'Load more') : null
  ].flat().filter(Boolean));
}
