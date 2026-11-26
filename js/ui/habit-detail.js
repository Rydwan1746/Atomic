import * as S from '../core/storage.js';
import * as K from '../domain/streaks.js';
import * as H from '../domain/habits.js';
import { today, addDays, parse, toDate } from '../core/dates.js';
import { h, catVars, announce } from './components.js';
import { getStackingAnchors } from '../domain/scorecard.js';
import { reminderText, requestNotificationPermission, notificationsSupported } from '../domain/reminders.js';

let editing = null;   // habit id being edited

function editForm(hb, st, done) {
  // Habits (without loops) and neutral Scorecard routines can be anchors, as in the new-habit dialog.
  const others = getStackingAnchors(st).filter(a => a.id !== hb.id && !H.wouldCycle(st.habits, hb.id, a.id));
  const i = hb.intention || {};
  return h('form', { class: 'card', style: catVars(hb.category), onsubmit: async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const reminderOn = f.get('reminderOn') === 'on';
    if (reminderOn && !hb.reminderOn) {
      const perm = await requestNotificationPermission();
      if (perm !== 'granted') announce('Notifications are blocked in this browser, so only the calendar export will remind you.');
    }
    S.save(H.updateHabit(S.load(), hb.id, {
      name: f.get('name'), identity: f.get('identity'), category: f.get('category'),
      stackedAfter: f.get('stackedAfter'), time: f.get('time'), place: f.get('place'),
      twoMinuteVersion: f.get('two'), temptationBundle: f.get('bundle'), reminderOn
    }));
    announce('Habit saved');
    done();
  } },
    h('h2', { class: 'voice' }, 'Edit habit'),
    h('label', {}, 'Habit name', h('input', { name: 'name', required: true, value: hb.name || hb.vote || '', autocomplete: 'off' })),
    h('label', {}, 'Identity statement', h('input', { name: 'identity', required: true, value: hb.identity || '', autocomplete: 'off' })),
    h('label', {}, 'Category', h('select', { name: 'category', value: hb.category }, H.CATEGORIES.map(c => h('option', { value: c }, c)))),
    h('label', {}, 'Stack after', h('select', { name: 'stackedAfter', value: hb.stackedAfter || '' },
      h('option', { value: '' }, 'None'), others.map(a => h('option', { value: a.id }, a.type === 'scorecard' ? `${a.name} (routine)` : a.name)))),
    h('label', {}, 'Intention: time', h('input', { name: 'time', type: 'time', value: i.time || '' })),
    h('label', {}, 'Intention: place', h('input', { name: 'place', value: i.place || '', placeholder: 'e.g. the sofa', autocomplete: 'off' })),
    h('label', {}, 'Two-minute version', h('input', { name: 'two', value: hb.twoMinuteVersion || '', placeholder: 'e.g. Read one page', autocomplete: 'off' })),
    h('label', {}, 'Temptation bundle', h('input', { name: 'bundle', value: hb.temptationBundle || '', placeholder: 'e.g. Tea while reading', autocomplete: 'off' })),
    h('label', { class: 'inline-check' },
      h('input', { type: 'checkbox', name: 'reminderOn', checked: Boolean(hb.reminderOn), disabled: !notificationsSupported() }),
      notificationsSupported()
        ? 'Remind me at the intention time (works only while Atomic is open in a tab)'
        : 'In-tab reminders are not supported in this browser'),
    h('p', { class: 'sub', style: 'font-size:13px' }, 'Reminders need an intention time. For reminders when Atomic is closed, use the calendar export in Me.'),
    h('div', { class: 'acts' },
      h('button', { class: 'btn primary', type: 'submit' }, 'Save'),
      h('button', { class: 'btn', type: 'button', onclick: done }, 'Cancel'))
  );
}

export function render(el, hid) {
  const st = S.load(), hb = st.habits.find(x => x.id === hid);
  const redraw = () => render(el, hid);
  const back = h('a', { href: '#/today', class: 'btn-text', style: 'align-self:flex-start;display:inline-flex;align-items:center;text-decoration:none' }, '← Today');
  if (!hb) { el.replaceChildren(back, h('div', { class: 'empty' }, 'Habit not found.')); return; }
  if (location.hash.endsWith('?edit')) { editing = hid; history.replaceState(null, '', `#/habit/${hid}`); }

  const by = new Map(st.events.filter(e => e.habitId === hid && e.type === 'checkin').map(e => [e.date, e.version]));
  const ds = K.datesFor(st.events, hid), t = today(), start = addDays(addDays(t, 6 - parse(t).getDay()), -83);
  const cells = Array.from({ length: 84 }, (_, i) => {           // 12 weeks, Sunday to Saturday, oldest left
    const d = addDays(start, i), v = by.get(d);
    return h('span', { class: 'cell' + (v ? ' on' : '') + (v === 'minimal' ? ' min' : '') + (d > t ? ' fut' : ''), title: `${d}: ${v ? 'done' : 'not done'}` });
  });
  const i = hb.intention, notes = st.journal.filter(j => j.habitId === hid).slice(-5).reverse();
  const parent = hb.stackedAfter && st.habits.find(x => x.id === hb.stackedAfter);

  const actions = h('section', { class: 'card' },
    h('strong', {}, 'Manage'),
    h('div', { class: 'acts' },
      editing !== hid && h('button', { class: 'btn', type: 'button', onclick: () => { editing = hid; redraw(); } }, 'Edit'),
      hb.archivedAt
        ? h('button', { class: 'btn', type: 'button', onclick: () => { S.save(H.restoreHabit(S.load(), hid)); announce('Habit restored'); redraw(); } }, 'Restore to Today')
        : h('button', { class: 'btn', type: 'button', onclick: () => {
            if (!confirm(`Archive "${hb.name}"? It leaves Today but keeps its history. You can restore it any time.`)) return;
            S.save(H.archiveHabit(S.load(), hid)); announce('Habit archived'); redraw();
          } }, 'Archive'),
      h('button', { class: 'btn', type: 'button', onclick: () => {
        if (confirm(`Delete "${hb.name}" and all of its history? This cannot be undone. Archive keeps the history instead.`)) { H.remove(hid); location.hash = '#/today'; }
      } }, 'Delete')),
    hb.archivedAt && h('p', { class: 'sub' }, `Archived on ${new Date(hb.archivedAt).toLocaleDateString()}.`)
  );

  el.replaceChildren(...[
    back,
    editing === hid ? editForm(hb, st, () => { editing = null; redraw(); }) : null,
    h('article', { class: 'card', style: catVars(hb.category) },
      h('div', { class: 'pill' }, hb.category + (hb.archivedAt ? ' · archived' : '')), h('div', { class: 'identity' }, hb.identity), h('div', { class: 'sub' }, hb.name || hb.vote),
      h('div', { class: 'stats' }, 'Streak ', h('b', {}, K.current(ds)), ' · Longest ', h('b', {}, K.longest(ds)),
        ' · Consistency ', h('b', {}, K.consistency(ds, toDate(new Date(hb.createdAt))) + '%')),
      h('div', { class: 'grid-wrap' }, h('div', { class: 'g12', role: 'img', 'aria-label': 'Last 12 weeks' }, cells)),
      i && h('p', { class: 'sub' }, `I will ${hb.name || hb.vote}${i.time ? ' at ' + i.time : ''}${i.place ? ' in ' + i.place : ''}.`),
      parent && h('p', { class: 'sub' }, `Stacked after: ${parent.name || parent.vote}`),
      hb.twoMinuteVersion && h('p', { class: 'sub' }, 'Two-minute version: ' + hb.twoMinuteVersion),
      hb.temptationBundle && h('p', { class: 'sub' }, 'Temptation bundle: ' + hb.temptationBundle),
      hb.reminderOn && h('p', { class: 'sub' }, `In-tab reminder: "${reminderText(hb)}"`)),
    actions,
    notes.length ? h('section', { class: 'card' }, h('strong', {}, 'Recent notes'),
      notes.map(j => h('div', { class: 'entry' }, h('div', { class: 'sub' }, j.date), h('p', { class: 'ruled' }, j.text)))) : null
  ].filter(Boolean));
}
