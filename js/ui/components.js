import { today } from '../core/dates.js';

export function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  let value;
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else if (k === 'value') value = v;   // set as a property below: <textarea> ignores a value attribute
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  e.append(...kids.flat().filter(x => x != null && x !== false));
  if (value != null) {
    if (tag === 'option') e.setAttribute('value', value);
    else e.value = value;               // after children, so <select> can match its options
  }
  return e;
}

export const catVars = c => `--c:var(--cat-${c.toLowerCase()});--cs:var(--cat-${c.toLowerCase()}-strong)`;

// A 1 to 5 scale of round buttons (FR-9 mood, FR-2 energy). Tapping the selected value clears it.
export function scalePicker(selected, onPick, { label, name }) {
  return h('div', { class: 'moods', role: 'group', 'aria-label': label },
    h('span', {}, label), h('span', {}, 'Low'),
    [1, 2, 3, 4, 5].map(i => h('button', {
      type: 'button',
      class: 'mood' + (selected === i ? ' sel' : ''),
      'aria-pressed': String(selected === i),
      'aria-label': `${name} ${i} of 5`,
      onclick: () => onPick(i)
    })),
    h('span', {}, 'High'));
}

export const moodPicker = (selected, onPick, label = 'How did it feel?') => scalePicker(selected, onPick, { label, name: 'Mood' });
export const energyPicker = (selected, onPick, label = 'Energy') => scalePicker(selected, onPick, { label, name: 'Energy' });

export function grid(doneDates, days, minimalDates = new Set()) {
  const s = new Set(doneDates);
  const m = minimalDates instanceof Set ? minimalDates : new Set(minimalDates);
  const t = today();
  return h('div', { class: 'row', role: 'img', 'aria-label': 'Last 14 days' },
    days.map(d => {
      const isDone = s.has(d);
      const isMin = m.has(d);
      const isToday = d === t;
      const cls = ['cell', isDone && 'on', isMin && 'min', isToday && 'today-cell'].filter(Boolean).join(' ');
      const title = `${d}: ${isDone ? (isMin ? 'done (minimal)' : 'done') : 'not done'}`;
      return h('span', { class: cls, title });
    })
  );
}

export const announce = msg => { document.getElementById('live').textContent = msg; };
