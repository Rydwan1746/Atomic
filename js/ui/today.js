import * as S from '../core/storage.js';
import * as H from '../domain/habits.js';
import * as SC from '../domain/scorecard.js';
import * as K from '../domain/streaks.js';
import { today, addDays, toDate } from '../core/dates.js';
import { h, catVars, moodPicker, energyPicker, grid, announce } from './components.js';
import { getRollingPulse } from '../domain/insights.js';
import { id } from '../core/ids.js';
import { missedYesterday } from '../domain/missed.js';
import { promptForToday, HABIT_PROMPTS } from '../data/prompts.js';
import './components/UnfoldingPactDialog.js';

let root;
let formOpen = false;
let queue = [];
let rows = [];
let activeTab = 'votes'; // 'votes' | 'scorecard'

const dlg = () => document.getElementById('stacking-dialog');
const redraw = () => render(root);

function checkin(hid, fromStack = false, version = 'full') {
  const added = H.toggle(hid, version);
  redraw();
  if (!added) return; // undo: no popup
  const next = H.stackedAfter(hid).filter(x => !H.todayEvent(x.id));
  if (fromStack || S.load().settings.notePrompts === false) {
    if (next.length) offer(next);
    return;
  }
  askNote(H.get(hid), 'done', next);
}

const noteDlg = () => document.getElementById('note-dialog');
let afterNote = [];

function askNote(hb, kind, then = []) {
  const qs = HABIT_PROMPTS[kind];
  const q = qs[new Date().getDate() % qs.length];
  const d = noteDlg();
  const ta = h('textarea', { 'aria-label': q, placeholder: 'A line or two is plenty. Optional.' });
  afterNote = then;
  d.replaceChildren(
    h('h2', { id: 'note-title' }, q),
    h('p', { class: 'sub' }, (hb.name || hb.vote || 'Habit') + (kind === 'done' ? '. Capture it while it is fresh.' : '. No judgment, just noticing.')),
    ta,
    h('div', { class: 'acts', style: 'margin-top:14px;justify-content:flex-end' },
      h('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Not now'),
      h('button', { class: 'btn primary', type: 'button', onclick: () => {
        const text = ta.value.trim();
        if (text) {
          const st = S.load();
          st.journal.push({
            id: id('j'),
            at: new Date().toISOString(),
            date: today(),
            kind: kind === 'done' ? 'completion_note' : 'miss_reason',
            habitId: hb.id,
            prompt: q,
            text,
            mood: null,
            energy: null,
            private: false
          });
          S.save(st);
        }
        d.close();
      } }, 'Save'))
  );
  d.showModal();
  ta.focus();
}

function offer(habits) {
  if (dlg().open) { queue.push(...habits); return; }
  rows = habits;
  drawDialog();
  dlg().showModal();
}

function drawDialog() {
  const d = dlg();
  d.replaceChildren(...[
    h('h2', { id: 'dlg-title' }, 'Ready for the next one?'),
    h('p', { class: 'sub' }, 'These are stacked after what you just did. Log any you have done.'),
    rows.map(x => h('div', { class: 'item', style: catVars(x.category) },
      h('div', {}, h('div', {}, x.name || x.vote), h('div', { class: 'sub voice' }, x.identity)),
      h('button', { class: 'btn log', type: 'button', onclick: () => {
        rows = rows.filter(r => r.id !== x.id);
        checkin(x.id, true);
        if (rows.length) drawDialog(); else d.close();
      } }, 'Log it'))),
    h('div', { class: 'acts', style: 'margin-top:14px;justify-content:flex-end' },
      h('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Not now'))
  ].flat());
}

export function initDialog() {
  noteDlg().addEventListener('click', e => { if (e.target === noteDlg()) noteDlg().close(); });
  noteDlg().addEventListener('close', () => {
    const n = afterNote;
    afterNote = [];
    if (n.length) offer(n);
  });
  dlg().addEventListener('click', e => { if (e.target === dlg()) dlg().close(); });
  dlg().addEventListener('close', () => {
    const next = [...new Map(queue.map(x => [x.id, x])).values()].filter(x => !H.todayEvent(x.id));
    queue = [];
    if (next.length) offer(next);
  });
}

function form() {
  const hs = H.list();
  return h('form', { class: 'card', onsubmit: e => {
    e.preventDefault();
    const f = new FormData(e.target);
    H.add({
      name: f.get('name'),
      identity: f.get('identity'),
      category: f.get('category'),
      stackedAfter: f.get('stackedAfter'),
      time: f.get('time'),
      place: f.get('place'),
      two: f.get('two'),
      bundle: f.get('bundle')
    });
    formOpen = false;
    redraw();
  } },
    h('label', {}, 'Habit name *', h('input', { name: 'name', required: true, placeholder: 'e.g. Read 10 pages', autocomplete: 'off' })),
    h('label', {}, 'Identity statement *', h('input', { name: 'identity', required: true, placeholder: 'e.g. A reader', autocomplete: 'off' })),
    h('label', {}, 'Category *', h('select', { name: 'category', required: true }, H.CATEGORIES.map(c => h('option', { value: c }, c)))),
    h('label', {}, 'Stack after (optional)', h('select', { name: 'stackedAfter' },
      h('option', { value: '' }, 'None'), hs.map(x => h('option', { value: x.id }, x.name)))),
    h('label', {}, 'Intention: time (optional)', h('input', { name: 'time', type: 'time' })),
    h('label', {}, 'Intention: place (optional)', h('input', { name: 'place', placeholder: 'e.g. the sofa', autocomplete: 'off' })),
    h('label', {}, 'Two-minute version (optional)', h('input', { name: 'two', placeholder: 'e.g. Read one page', autocomplete: 'off' })),
    h('label', {}, 'Temptation bundle (optional)', h('input', { name: 'bundle', placeholder: 'e.g. Tea while reading', autocomplete: 'off' })),
    h('div', { class: 'acts' },
      h('button', { class: 'btn primary', type: 'submit' }, 'Add habit'),
      h('button', { class: 'btn', type: 'button', onclick: () => { formOpen = false; redraw(); } }, 'Cancel'))
  );
}

function card(hb, st) {
  const ds = K.datesFor(st.events, hb.id);
  const t = today();
  const ev = H.todayEvent(hb.id);
  const done = !!ev;
  const days = Array.from({ length: 14 }, (_, i) => addDays(t, i - 13));
  const minimalDates = new Set(st.events.filter(e => e.habitId === hb.id && e.type === 'checkin' && e.version === 'minimal').map(e => e.date));
  const parent = hb.stackedAfter && H.get(hb.stackedAfter);
  const nudgeDismissed = (st.settings.nudgeDismissed ??= {})[hb.id] === t;
  const showNudge = !done && missedYesterday(hb, st) && !nudgeDismissed;
  const rec = K.recoveryTime(ds, toDate(new Date(hb.createdAt)), t);
  const linkedWoop = (st.woop || []).find(w => w.habitId === hb.id);

  return h('article', { class: 'card', style: catVars(hb.category) },
    h('div', { class: 'pill' }, hb.category),
    h('a', { class: 'identity', href: '#/habit/' + hb.id, style: 'display:block;color:inherit;text-decoration:none' }, hb.identity),
    h('div', { class: 'sub' }, (hb.name || hb.vote || 'Habit') + (parent ? ` · stacked after ${parent.name || parent.vote}` : '') + (done ? ' · done today' : '')),
    showNudge && h('div', { class: 'nudge' },
      h('p', {}, 'Yesterday was a miss. Today is the day that counts.' + (hb.twoMinuteVersion ? ` Try the two-minute version: ${hb.twoMinuteVersion}.` : '')),
      linkedWoop && h('p', { class: 'sub voice', style: 'font-size:13px;margin:2px 0' }, `WOOP Hint: ${linkedWoop.plan}`),
      h('div', { class: 'acts' },
        hb.twoMinuteVersion && h('button', { class: 'btn', type: 'button', onclick: () => checkin(hb.id, false, 'minimal') }, 'Do 2-min version'),
        h('button', { class: 'btn-text', type: 'button', onclick: () => { st.settings.nudgeDismissed[hb.id] = t; S.save(st); redraw(); } }, 'Not today'))),
    grid(ds, days, minimalDates),
    h('div', { class: 'stats' },
      'Streak ', h('b', {}, K.current(ds)),
      ' · Consistency ', h('b', {}, K.consistency(ds, toDate(new Date(hb.createdAt))) + '%'),
      rec != null ? [' · Recovery ', h('b', {}, rec + 'd')] : null
    ),
    h('button', { class: 'checkin ' + (done ? 'done' : 'todo'), type: 'button', onclick: () => checkin(hb.id) },
      done ? 'Done. Tap to undo' : 'Mark done today'),
    !done && h('button', { class: 'btn-text', type: 'button', style: 'align-self:flex-start', onclick: () => askNote(hb, 'missed') }, 'Skip today'),
    done && moodPicker(ev.mood, m => { H.setMood(hb.id, m); redraw(); }),
    done && energyPicker(ev.energy, n => { H.setEnergy(hb.id, n); redraw(); }, 'Energy (optional)'),
    h('details', { class: 'more' }, h('summary', {}, 'More'),
      h('div', { class: 'acts', style: 'margin-top:8px' },
        h('a', { class: 'btn', href: `#/habit/${hb.id}?edit`, style: 'display:inline-flex;align-items:center;text-decoration:none' }, 'Edit'),
        h('button', { class: 'btn', type: 'button', onclick: () => {
          if (!confirm(`Archive "${hb.name || hb.vote || 'habit'}"? It leaves Today but keeps its history. You can restore it any time.`)) return;
          S.save(H.archiveHabit(S.load(), hb.id)); announce('Habit archived'); redraw();
        } }, 'Archive'),
        h('button', { class: 'btn', type: 'button', onclick: () => {
          if (confirm(`Delete "${hb.name || hb.vote || 'habit'}" and all of its history? This cannot be undone. Archive keeps the history instead.`)) { H.remove(hb.id); redraw(); }
        } }, 'Delete')))
  );
}

function switchTab(tab) {
  if (activeTab === tab) return;
  const container = document.getElementById('today-tab-content');
  if (container) {
    container.classList.add('fading');
    setTimeout(() => {
      activeTab = tab;
      redraw();
    }, 180);
  } else {
    activeTab = tab;
    redraw();
  }
}

function switcher() {
  return h('div', { class: 'switcher', role: 'tablist', 'aria-label': 'Today views' },
    h('button', {
      type: 'button',
      class: 'switcher-tab ' + (activeTab === 'votes' ? 'active' : 'inactive'),
      role: 'tab',
      'aria-selected': String(activeTab === 'votes'),
      onclick: () => switchTab('votes')
    }, 'Daily Votes'),
    h('button', {
      type: 'button',
      class: 'switcher-tab ' + (activeTab === 'scorecard' ? 'active' : 'inactive'),
      role: 'tab',
      'aria-selected': String(activeTab === 'scorecard'),
      onclick: () => switchTab('scorecard')
    }, 'Habits Scorecard')
  );
}

function scorecardView(st) {
  const tally = SC.getTally(st.scorecard || []);
  const tallyText = `${tally.positive} positive, ${tally.negative} negative, ${tally.neutral} neutral`;

  let newName = '';
  const addForm = h('form', {
    class: 'card',
    onsubmit: e => {
      e.preventDefault();
      const input = e.target.querySelector('input');
      const name = (input ? input.value : newName).trim();
      if (!name) return;
      const currSt = S.load();
      const newSt = SC.addBehavior(currSt, { name, rating: '=' });
      S.save(newSt);
      if (input) input.value = '';
      newName = '';
      redraw();
    }
  },
    h('label', {}, 'Add behavior or routine',
      h('input', {
        placeholder: 'e.g. Morning coffee, Checked phone in bed',
        required: true,
        autocomplete: 'off',
        oninput: e => { newName = e.target.value; }
      })
    ),
    h('div', { class: 'acts' },
      h('button', { class: 'btn primary', type: 'submit' }, 'Add to Scorecard')
    )
  );

  function scorecardRow(item) {
    const isNeg = item.rating === '-';
    const isNeu = item.rating === '=';
    const isPos = item.rating === '+';

    function setR(rating) {
      const newSt = SC.setRating(st, item.id, rating);
      S.save(newSt);
      redraw();
    }

    function promoteToHabit() {
      const dlgEl = document.createElement('unfolding-pact-dialog');
      document.body.appendChild(dlgEl);
      dlgEl.setPrefill({ vote: item.name });
      dlgEl.addEventListener('habitCreated', ev => {
        const currSt = S.load();
        const newSt = H.createHabit(currSt, ev.detail);
        S.save(newSt);
        activeTab = 'votes';
        redraw();
      });
    }

    return h('div', { class: 'scorecard-row' },
      h('div', { class: 'scorecard-main' },
        h('span', { class: 'routine-title' }, item.name),
        h('div', { class: 'rating-badges' },
          h('button', {
            type: 'button',
            class: 'rating-btn' + (isPos ? ' active-pos' : ''),
            'aria-label': 'Rate positive',
            onclick: () => setR('+')
          }, '+'),
          h('button', {
            type: 'button',
            class: 'rating-btn' + (isNeu ? ' active-neu' : ''),
            'aria-label': 'Rate neutral',
            onclick: () => setR('=')
          }, '='),
          h('button', {
            type: 'button',
            class: 'rating-btn' + (isNeg ? ' active-neg' : ''),
            'aria-label': 'Rate negative',
            onclick: () => setR('-')
          }, '−')
        )
      ),
      isNeg && h('div', { class: 'micro-note' }, 'Noticed, not judged.'),
      isPos && h('button', {
        type: 'button',
        class: 'ghost-link',
        onclick: promoteToHabit
      }, 'Promote to identity habit →'),
      isNeu && h('button', {
        type: 'button',
        class: 'ghost-link',
        onclick: () => {
          const dlgEl = document.createElement('unfolding-pact-dialog');
          document.body.appendChild(dlgEl);
          dlgEl.data.stackedAfter = item.id;
          dlgEl.addEventListener('habitCreated', ev => {
            const currSt = S.load();
            const newSt = H.createHabit(currSt, ev.detail);
            S.save(newSt);
            activeTab = 'votes';
            redraw();
          });
        }
      }, 'Use as stacking anchor →')
    );
  }

  const items = st.scorecard || [];

  return h('div', { id: 'today-tab-content', class: 'cross-fade' },
    h('div', { class: 'scorecard-tally' }, tallyText),
    h('div', { class: 'scorecard-banner' },
      h('strong', {}, 'Your Scorecard is a compass. '),
      'Rate each routine by whether it strengthens who you want to become. Zero red warnings; awareness precedes change.'
    ),
    addForm,
    items.length
      ? items.map(scorecardRow)
      : h('div', { class: 'empty' }, 'No behaviors logged yet. Add your daily routines above.')
  );
}

function dailyVotesView(st) {
  const hs = H.list();
  const archived = H.listArchived();

  const items = [
    formOpen ? form() : h('button', {
      class: 'btn',
      type: 'button',
      style: 'align-self:flex-start',
      onclick: () => {
        const dlgEl = document.createElement('unfolding-pact-dialog');
        document.body.appendChild(dlgEl);
        dlgEl.addEventListener('habitCreated', ev => {
          const currSt = S.load();
          const newSt = H.createHabit(currSt, ev.detail);
          S.save(newSt);
          activeTab = 'votes';
          redraw();
        });
      }
    }, '+ New Habit'),
    hs.length ? hs.map(x => card(x, st)) : h('div', { class: 'empty' },
      h('strong', {}, 'No habits tracked yet'),
      h('p', {}, 'Start by defining a new habit and the identity you want to reinforce.')),
    hs.length ? h('div', { class: 'prompt' },
      h('p', {}, promptForToday()),
      h('div', { class: 'acts' },
        h('a', { class: 'btn primary', href: '#/journal', style: 'display:inline-flex;align-items:center;text-decoration:none' }, 'Write')
      )
    ) : null,
    archived.length ? h('details', { class: 'more card' },
      h('summary', {}, `Archived habits (${archived.length})`),
      archived.map(x => h('div', { class: 'acts', style: 'justify-content:space-between;margin-top:8px' },
        h('a', { href: `#/habit/${x.id}`, class: 'ghost-link' }, x.name || x.vote),
        h('button', { class: 'btn', type: 'button', onclick: () => { S.save(H.restoreHabit(S.load(), x.id)); announce('Habit restored'); redraw(); } }, 'Restore')))) : null
  ].flat().filter(Boolean);

  return h('div', { id: 'today-tab-content', class: 'cross-fade' }, ...items);
}

// FR-12: the leading identity of the last 7 days leads the greeting.
function greeting(st) {
  const top = getRollingPulse(st).identities[0];
  if (!top) return h('h1', { class: 'greet' }, 'Today is a vote for who you\u2019re becoming.');
  return h('div', {},
    h('h1', { class: 'greet' }, `${top.votes} ${top.votes === 1 ? 'vote' : 'votes'} this week for `, h('i', {}, top.identity), '.'),
    h('p', { class: 'sub voice' }, 'Today is another vote for who you\u2019re becoming.'));
}

export function render(el) {
  root = el;
  const st = S.load();

  el.replaceChildren(
    h('div', { class: 'date' }, new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })),
    greeting(st),
    switcher(),
    activeTab === 'scorecard' ? scorecardView(st) : dailyVotesView(st)
  );
}
