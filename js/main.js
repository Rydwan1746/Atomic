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

const placeholder = (title, text) => el => el.replaceChildren(h('h2', {}, title), h('div', { class: 'empty' }, text));
const ROUTES = {
  today: ['Today', today.render], journal: ['Journal', journal.render],
  insights: ['Insights', insights.render],
  chat: ['Chat', chat.render],
  me: ['Me', me.render]
};
S.load(); applyTheme(); today.initDialog();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

function route() {
  const key = (location.hash.replace('#/', '') || 'today');
  const name = ROUTES[key] ? key : 'today';
  document.getElementById('nav').replaceChildren(...Object.entries(ROUTES).map(([k, [label]]) =>
    h('a', { href: `#/${k}`, 'aria-current': k === name ? 'page' : null }, label)));
  const view = document.getElementById('view');
  if (key.startsWith('habit/')) detail.render(view, key.slice(6)); else ROUTES[name][1](view);
}
addEventListener('hashchange', route); route(); missed.maybeAsk();
