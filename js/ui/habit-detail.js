import * as S from '../core/storage.js';
import * as K from '../domain/streaks.js';
import { today, addDays, parse, toDate } from '../core/dates.js';
import { h, catVars } from './components.js';

export function render(el, hid) {
  const st = S.load(), hb = st.habits.find(x => x.id === hid);
  const back = h('a', { href: '#/today', class: 'btn-text', style: 'align-self:flex-start;display:inline-flex;align-items:center;text-decoration:none' }, '\u2190 Today');
  if (!hb) { el.replaceChildren(back, h('div', { class: 'empty' }, 'Habit not found.')); return; }
  const by = new Map(st.events.filter(e => e.habitId === hid && e.type === 'checkin').map(e => [e.date, e.version]));
  const ds = K.datesFor(st.events, hid), t = today(), start = addDays(addDays(t, 6 - parse(t).getDay()), -83);
  const cells = Array.from({ length: 84 }, (_, i) => {           // 12 weeks, Sunday to Saturday, oldest left
    const d = addDays(start, i), v = by.get(d);
    return h('span', { class: 'cell' + (v ? ' on' : '') + (v === 'minimal' ? ' min' : '') + (d > t ? ' fut' : ''), title: `${d}: ${v ? 'done' : 'not done'}` });
  });
  const i = hb.intention, notes = st.journal.filter(j => j.habitId === hid).slice(-5).reverse();
  el.replaceChildren(...[
    back,
    h('article', { class: 'card', style: catVars(hb.category) },
      h('div', { class: 'pill' }, hb.category), h('div', { class: 'identity' }, hb.identity), h('div', { class: 'sub' }, hb.name || hb.vote),
      h('div', { class: 'stats' }, 'Streak ', h('b', {}, K.current(ds)), ' \u00b7 Longest ', h('b', {}, K.longest(ds)),
        ' \u00b7 Consistency ', h('b', {}, K.consistency(ds, toDate(new Date(hb.createdAt))) + '%')),
      h('div', { class: 'grid-wrap' }, h('div', { class: 'g12', role: 'img', 'aria-label': 'Last 12 weeks' }, cells)),
      i && h('p', { class: 'sub' }, `I will ${hb.name || hb.vote}${i.time ? ' at ' + i.time : ''}${i.place ? ' in ' + i.place : ''}.`),
      hb.twoMinuteVersion && h('p', { class: 'sub' }, 'Two-minute version: ' + hb.twoMinuteVersion),
      hb.temptationBundle && h('p', { class: 'sub' }, 'Temptation bundle: ' + hb.temptationBundle)),
    notes.length ? h('section', { class: 'card' }, h('strong', {}, 'Recent notes'),
      notes.map(j => h('div', { class: 'entry' }, h('div', { class: 'sub' }, j.date), h('p', {}, j.text)))) : null
  ].filter(Boolean));
}
