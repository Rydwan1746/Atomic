import * as S from '../core/storage.js';
import { id } from '../core/ids.js';
import { h, announce } from './components.js';
import { buildSafePayload, formatPrivacyChipLabel } from '../ai/firewall.js';
import { ask, noticeText, auditEntry, aiSettings, PROVIDERS } from '../ai/index.js';
import { isAlterEgoConfigured } from '../domain/alter-ego.js';
import { MODES } from '../ai/guardrails.js';

const AUDIT_LIMIT = 30;

// Screen state that survives redraws (and navigation) for this tab.
let currentMode = 'mirror';           // 'mirror' | 'future'
let sending = false;
const drafts = { mirror: '', future: '' };
let includeJournal = false;           // resets after every send (single-message opt-in)
let notice = null;                    // { mode, text }

const isChatVisible = () => (location.hash.replace('#/', '') || 'today') === 'chat';

export function render(el) {
  const st = S.load();
  st.chatHistory = st.chatHistory || [];
  const redraw = () => { if (isChatVisible()) render(el); };

  const isFuture = currentMode === 'future';
  const accentVar = isFuture ? 'var(--accent-future)' : 'var(--accent-mirror)';
  const fontVar = isFuture ? 'var(--font-voice)' : 'var(--font-ui)';
  const settings = aiSettings(st);
  const futureName = st.alterEgo?.name || 'Future Self';

  const switchTo = (mode, prefill) => {
    currentMode = mode;
    if (prefill && !drafts[mode]) drafts[mode] = prefill;
    redraw();
  };

  const modeSwitcher = h('div', { class: 'switcher', role: 'tablist', 'aria-label': 'Chat mode' },
    ['mirror', 'future'].map(m => h('button', {
      type: 'button', role: 'tab',
      'aria-selected': String(currentMode === m),
      class: 'switcher-tab ' + (currentMode === m ? 'active' : 'inactive'),
      onclick: () => switchTo(m)
    }, m === 'mirror' ? 'The Objective Mirror' : 'Dialogue with Future Self'))
  );

  const providerLine = h('p', { class: 'sub', style: 'font-size:13px' },
    settings.provider === 'none'
      ? ['AI reflection is off: replies are offline reflections. ', h('a', { href: '#/me', class: 'ghost-link' }, 'Connect a model in Me →')]
      : `Replies from ${PROVIDERS[settings.provider]}${settings[settings.provider]?.model ? ` · ${settings[settings.provider].model}` : ''}.`
  );

  // Gate for Future-Self mode (FR-18)
  if (isFuture && !isAlterEgoConfigured(st.alterEgo)) {
    el.replaceChildren(
      h('h1', { class: 'greet' }, 'Dialogue with Your Future Self'),
      modeSwitcher,
      h('div', { class: 'card', style: 'border:1px solid var(--accent-future);text-align:center;padding:32px 20px' },
        h('h3', { class: 'voice', style: 'font-size:20px' }, 'Author your Alter Ego first'),
        h('p', { class: 'sub' }, 'Before conversing with your future self, describe who they are and three things they do, in Me > Alter Ego.'),
        h('a', { class: 'btn primary', href: '#/me', style: 'display:inline-flex;align-items:center;align-self:center;text-decoration:none' }, 'Set up Alter Ego →')
      )
    );
    return;
  }

  // The payload preview is exactly what the next message would send.
  const previewPayload = buildSafePayload(st, currentMode, { includeJournalOptIn: includeJournal });
  const privacyChip = h('button', {
    type: 'button', class: 'chip', style: 'align-self:flex-start',
    onclick: () => showPayloadPreview(previewPayload)
  }, formatPrivacyChipLabel(previewPayload));

  const messages = st.chatHistory.filter(m => (m.mode || 'mirror') === currentMode);

  const bubble = m => {
    if (m.role === 'user') {
      return h('div', { class: 'chat-msg user' },
        h('div', { class: 'chat-who' }, 'You'),
        h('p', {}, m.text));
    }
    const who = m.source === 'crisis' ? 'Atomic' : (isFuture ? futureName : 'Objective Mirror');
    const tag = { offline: 'Offline reflection', crisis: 'Support' }[m.source];
    return h('div', {
      class: 'chat-msg assistant' + (m.source === 'crisis' ? ' crisis' : ''),
      style: m.source === 'crisis' ? '' : `border-left-color:${accentVar};font-family:${fontVar}`
    },
      h('div', { class: 'chat-who' }, who, tag ? h('span', { class: 'chip', style: 'margin-left:8px;font-family:var(--font-ui)' }, tag) : null),
      h('p', {}, m.text),
      h('div', { class: 'acts', style: 'margin-top:6px' },
        m.redirect ? h('button', {
          type: 'button', class: 'btn',
          onclick: () => switchTo(m.redirect, m.question)
        }, m.redirect === 'future' ? 'Continue with your Future Self →' : 'Check with the Objective Mirror →') : null,
        m.source !== 'crisis' && m.source !== 'redirect'
          ? h('a', { class: 'ghost-link', href: '#/journal' }, 'Write in Journal →') : null
      )
    );
  };

  const messageList = h('div', { class: 'chat-list', 'aria-live': 'polite' },
    messages.length ? messages.map(bubble) : h('div', { class: 'empty' },
      isFuture
        ? `Speak with ${futureName}. What friction or victory are you bringing?`
        : 'The Objective Mirror reflects your consistency, streaks and patterns without judgment.'),
    sending ? h('div', { class: 'chat-msg assistant', style: `border-left-color:${accentVar}` },
      h('p', { class: 'sub' }, 'Reflecting…')) : null
  );

  const noticeBar = notice && notice.mode === currentMode
    ? h('div', { class: 'chat-notice', role: 'status' },
        h('span', {}, notice.text),
        h('button', { type: 'button', class: 'btn-text', onclick: () => { notice = null; redraw(); } }, 'Dismiss'))
    : null;

  const inputEl = h('textarea', {
    class: 'chat-input',
    rows: 2,
    'aria-label': isFuture ? 'Message your future self' : 'Message the Objective Mirror',
    placeholder: isFuture ? 'Ask your future self anything...' : 'Ask about your habits, streaks or patterns...',
    oninput: e => { drafts[currentMode] = e.target.value; },
    onkeydown: e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }
  });
  inputEl.value = drafts[currentMode];

  const journalToggle = h('label', { class: 'inline-check' },
    h('input', {
      type: 'checkbox', checked: includeJournal,
      onchange: e => { includeJournal = e.target.checked; redraw(); }
    }),
    'Include my recent journal text for this message');

  async function send() {
    const q = drafts[currentMode].trim();
    if (!q || sending) return;
    const mode = currentMode;
    sending = true;
    notice = null;
    st.chatHistory.push({ id: id('msg'), role: 'user', text: q, mode, at: new Date().toISOString() });
    S.save(st);
    drafts[mode] = '';
    const withJournal = includeJournal;
    includeJournal = false;
    redraw();

    try {
      const result = await ask(st, { message: q, mode, includeJournal: withJournal });
      st.chatHistory.push({
        id: id('msg'), role: 'assistant', text: result.text, mode,
        source: result.source, redirect: result.redirect, question: result.redirect ? q : undefined,
        provider: result.provider, at: new Date().toISOString()
      });
      const entry = auditEntry(result);
      if (entry) st.aiLog = [...(st.aiLog || []), entry].slice(-AUDIT_LIMIT);
      const msg = noticeText(result, st);
      notice = msg && result.notice === 'unavailable' ? { mode, text: msg } : null;
      S.save(st);
      announce(result.redirect ? 'Reply received, with a suggestion to switch modes' : 'Reply received');
    } finally {
      sending = false;
      redraw();
    }
  }

  const sendBtn = h('button', { class: 'btn primary', type: 'button', disabled: sending, onclick: send },
    sending ? 'Reflecting…' : 'Send');

  const clearBtn = messages.length ? h('button', {
    type: 'button', class: 'btn-text', style: 'align-self:flex-start',
    onclick: () => {
      if (!confirm(`Clear this ${MODES[currentMode].label} conversation?`)) return;
      st.chatHistory = st.chatHistory.filter(m => (m.mode || 'mirror') !== currentMode);
      S.save(st);
      redraw();
    }
  }, 'Clear this conversation') : null;

  el.replaceChildren(...[
    h('h1', { class: 'greet' }, isFuture ? 'Dialogue with Your Future Self' : 'The Objective Mirror'),
    modeSwitcher,
    providerLine,
    privacyChip,
    messageList,
    noticeBar,
    h('div', { class: 'chat-compose' }, inputEl, sendBtn),
    journalToggle,
    clearBtn
  ].filter(Boolean));

  if (!sending && isChatVisible()) inputEl.focus({ preventScroll: true });
}

function showPayloadPreview(payload) {
  const dlg = h('dialog', { class: 'dlg', 'aria-labelledby': 'payload-title' });
  dlg.append(
    h('h2', { id: 'payload-title' }, 'What the next message sends'),
    h('p', { class: 'sub' }, payload.mode === 'future'
      ? 'Future Self mode sends your Alter Ego profile, identity statements, habit names and WOOP plans. No numbers.'
      : 'Mirror mode sends aggregated numbers only: consistency, streaks, recovery time, votes and detected patterns.'),
    h('p', { class: 'sub' }, payload.journalSnippets.length
      ? `${payload.journalSnippets.length} recent journal entries are included because you ticked the box. Entries marked "Never send to AI" are always excluded.`
      : 'No journal text is included.'),
    h('pre', { class: 'payload-pre' }, JSON.stringify(payload, null, 2)),
    h('div', { class: 'acts', style: 'margin-top:14px;justify-content:flex-end' },
      h('button', { class: 'btn primary', type: 'button', onclick: () => dlg.close() }, 'Close'))
  );
  dlg.addEventListener('close', () => dlg.remove());
  document.body.appendChild(dlg);
  dlg.showModal();
}
