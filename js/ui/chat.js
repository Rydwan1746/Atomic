import * as S from '../core/storage.js';
import { h } from './components.js';
import { buildSafePayload, formatPrivacyChipLabel } from '../ai/firewall.js';
import { sendChatMessage } from '../ai/adapters.js';
import { isAlterEgoConfigured } from '../domain/alter-ego.js';

let currentMode = 'mirror'; // 'mirror' | 'future'
let sending = false;

export function render(el) {
  const st = S.load();
  const redraw = () => render(el);

  // Initialize chatHistory in state if missing
  st.chatHistory = st.chatHistory || [];

  const isFuture = currentMode === 'future';
  const accentVar = isFuture ? 'var(--accent-future)' : 'var(--accent-mirror)';
  const fontVar = isFuture ? 'var(--font-voice)' : 'var(--font-ui)';
  const alterEgoReady = isAlterEgoConfigured(st.alterEgo);

  // Mode Switcher Tabs
  const modeSwitcher = h('div', { class: 'switcher', role: 'tablist', style: 'margin-bottom:12px' },
    h('button', {
      type: 'button',
      class: 'switcher-tab ' + (currentMode === 'mirror' ? 'active' : 'inactive'),
      onclick: () => { currentMode = 'mirror'; redraw(); }
    }, 'The Objective Mirror'),
    h('button', {
      type: 'button',
      class: 'switcher-tab ' + (currentMode === 'future' ? 'active' : 'inactive'),
      onclick: () => { currentMode = 'future'; redraw(); }
    }, 'Dialogue with Future Self')
  );

  // Payload for privacy chip
  const safePayload = buildSafePayload(st, currentMode);
  const privacyChipText = formatPrivacyChipLabel(safePayload);

  const privacyChip = h('button', {
    type: 'button',
    class: 'btn-text chip',
    style: 'align-self:flex-start;font-size:12px;margin-bottom:8px;cursor:pointer',
    onclick: () => showPayloadPreview(safePayload)
  }, privacyChipText);

  // Gate for Future-Self Mode
  if (isFuture && !alterEgoReady) {
    el.replaceChildren(...[
      h('h1', { class: 'greet' }, 'Dialogue with Your Future Self'),
      modeSwitcher,
      privacyChip,
      h('div', { class: 'card fresh-page-card', style: 'border:1px solid var(--accent-future);text-align:center;padding:32px 20px' },
        h('h3', { class: 'voice', style: 'font-size:20px;margin-bottom:8px' }, 'Author Your Archetype First'),
        h('p', { class: 'sub', style: 'margin-bottom:16px' },
          'Before conversing with your future self, author their values, archetype narrative, and obstacle philosophy in Me > Alter Ego.'
        ),
        h('a', { class: 'btn primary', href: '#/me', style: 'display:inline-block;text-decoration:none' }, 'Go to Me > Alter Ego →')
      )
    ]);
    return;
  }

  // Filter messages for current mode or show all
  const messages = st.chatHistory.filter(m => !m.mode || m.mode === currentMode);

  const messageList = h('div', {
    style: 'display:flex;flex-direction:column;gap:12px;min-height:240px;margin-bottom:14px'
  },
    messages.length ? messages.map(m => {
      const isUser = m.role === 'user';
      return h('div', {
        class: 'scorecard-row',
        style: isUser
          ? 'align-self:flex-end;max-width:85%;background:var(--bg-raised);border-radius:12px;padding:12px 14px'
          : `align-self:flex-start;max-width:90%;background:var(--bg-card);border-left:4px solid ${accentVar};border-radius:12px;padding:14px;font-family:${fontVar}`
      },
        h('div', { class: 'sub', style: 'font-size:11px;margin-bottom:2px' },
          isUser ? 'You' : (isFuture ? (st.alterEgo?.name || 'Future Self') : 'Objective Mirror')
        ),
        h('p', { style: 'font-size:15px;line-height:1.55;white-space:pre-wrap' }, m.text),
        !isUser && h('div', { class: 'acts', style: 'margin-top:8px' },
          h('a', { class: 'ghost-link', href: '#/journal', style: 'font-size:12px' }, 'Write in Journal →')
        )
      );
    }) : h('div', { class: 'empty' },
      isFuture
        ? `Speak with ${st.alterEgo?.name || 'Your Future Self'}. What friction or victory are you bringing?`
        : 'The Objective Mirror reflects your metrics and consistency patterns without judgment.'
    )
  );

  let inputVal = '';
  const inputEl = h('input', {
    type: 'text',
    placeholder: isFuture ? `Ask ${st.alterEgo?.name || 'your future self'} for guidance...` : 'Ask for an objective reflection on your habits...',
    style: 'flex:1;min-height:44px',
    autocomplete: 'off',
    oninput: e => { inputVal = e.target.value; },
    onkeydown: e => {
      if (e.key === 'Enter') sendBtn.click();
    }
  });

  const sendBtn = h('button', {
    class: 'btn primary',
    type: 'button',
    disabled: sending,
    onclick: async () => {
      const q = inputVal.trim();
      if (!q || sending) return;

      sending = true;
      st.chatHistory.push({
        id: `msg_${Date.now()}`,
        role: 'user',
        text: q,
        mode: currentMode,
        at: new Date().toISOString()
      });
      S.save(st);
      inputVal = '';
      inputEl.value = '';
      redraw();

      try {
        const reply = await sendChatMessage(st, q, currentMode);
        st.chatHistory.push({
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          text: reply.text,
          mode: currentMode,
          at: new Date().toISOString()
        });
        S.save(st);
      } finally {
        sending = false;
        redraw();
      }
    }
  }, sending ? 'Reflecting...' : 'Send');

  const inputForm = h('div', { style: 'display:flex;gap:8px;align-items:center' }, inputEl, sendBtn);

  el.replaceChildren(...[
    h('h1', { class: 'greet' }, isFuture ? 'Dialogue with Your Future Self' : 'The Objective Mirror'),
    modeSwitcher,
    privacyChip,
    messageList,
    inputForm
  ]);
}

function showPayloadPreview(payload) {
  const modal = document.createElement('div');
  modal.className = 'dlg';

  const pre = h('pre', {
    style: 'background:var(--bg-raised);padding:12px;border-radius:8px;font-size:12px;overflow:auto;max-height:300px'
  }, JSON.stringify(payload, null, 2));

  const closeBtn = h('button', {
    class: 'btn primary',
    type: 'button',
    onclick: () => { if (modal.parentNode) modal.parentNode.removeChild(modal); }
  }, 'Close Preview');

  modal.appendChild(h('h2', {}, '🔒 Outbound Privacy Payload Preview'));
  modal.appendChild(h('p', { class: 'sub' },
    'Atomic v2 filters all raw journal entries by default. Strictly numerical and categorical data is transmitted.'
  ));
  modal.appendChild(pre);
  modal.appendChild(h('div', { class: 'acts', style: 'margin-top:14px;justify-content:flex-end' }, closeBtn));

  document.body.appendChild(modal);
}

