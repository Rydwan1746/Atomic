// Me > AI: provider choice, Ollama connection test, API keys, and the local log of what was sent.
import * as S from '../core/storage.js';
import { h, announce } from './components.js';
import { aiSettings, setApiKey, getApiKey, needsKey, PROVIDERS, DEFAULTS } from '../ai/index.js';
import { listOllamaModels } from '../ai/adapters.js';

let ollamaStatus = null;      // { ok, text }
let ollamaModels = [];

function persist(st, next) {
  const { keys = {}, ...rest } = next;
  const kept = Object.fromEntries(Object.entries(keys).filter(([, v]) => v));
  st.settings.ai = { ...rest, keys: next.rememberKeys ? kept : {} };
  S.save(st);
}

export function aiSettingsCard(st, redraw) {
  const cfg = aiSettings(st);
  const update = patch => { persist(st, { ...cfg, ...patch }); redraw(); };
  const p = cfg.provider;

  const providerSelect = h('label', {}, 'Provider',
    h('select', { onchange: e => { ollamaStatus = null; update({ provider: e.target.value }); } },
      Object.entries(PROVIDERS).map(([k, label]) => h('option', { value: k, selected: k === p }, label))));

  const fields = [];

  if (p === 'ollama') {
    const modelInput = h('input', {
      list: 'ollama-models', value: cfg.ollama.model, placeholder: DEFAULTS.ollama.model,
      onchange: e => update({ ollama: { ...cfg.ollama, model: e.target.value.trim() || DEFAULTS.ollama.model } })
    });
    fields.push(
      h('label', {}, 'Ollama address',
        h('input', {
          value: cfg.ollama.endpoint, placeholder: DEFAULTS.ollama.endpoint, inputmode: 'url',
          onchange: e => { ollamaStatus = null; update({ ollama: { ...cfg.ollama, endpoint: e.target.value.trim() || DEFAULTS.ollama.endpoint } }); }
        })),
      h('label', {}, 'Model', modelInput),
      h('datalist', { id: 'ollama-models' }, ollamaModels.map(m => h('option', { value: m }))),
      h('div', { class: 'acts' },
        h('button', {
          class: 'btn', type: 'button',
          onclick: async () => {
            ollamaStatus = { ok: null, text: 'Checking…' };
            redraw();
            try {
              ollamaModels = await listOllamaModels(cfg.ollama.endpoint);
              const hasModel = ollamaModels.some(m => m === cfg.ollama.model || m.split(':')[0] === cfg.ollama.model);
              ollamaStatus = ollamaModels.length
                ? { ok: hasModel, text: `Connected. Installed models: ${ollamaModels.join(', ')}.` + (hasModel ? '' : ` "${cfg.ollama.model}" is not installed: pick one above or run "ollama pull ${cfg.ollama.model}".`) }
                : { ok: false, text: `Connected, but no models are installed. Run "ollama pull ${cfg.ollama.model}" in a terminal.` };
            } catch (err) {
              ollamaModels = [];
              ollamaStatus = { ok: false, text: `${err.message} Check that Ollama is running ("ollama serve"). If Atomic is not opened from localhost, start Ollama with OLLAMA_ORIGINS set to this page's address (${location.origin}).` };
            }
            announce(ollamaStatus.text);
            redraw();
          }
        }, 'Test connection')),
      ollamaStatus ? h('p', { class: 'sub', role: 'status', style: ollamaStatus.ok === false ? 'color:var(--text-primary)' : '' }, ollamaStatus.text) : null,
      h('p', { class: 'sub' }, 'Runs on this computer. Nothing leaves the device. Works on desktop only.')
    );
  }

  if (needsKey(p)) {
    const hasKey = Boolean(getApiKey(st, p));
    let keyDraft = '';
    fields.push(
      h('label', {}, 'Model',
        h('input', {
          value: cfg[p].model, placeholder: DEFAULTS[p].model,
          onchange: e => update({ [p]: { model: e.target.value.trim() || DEFAULTS[p].model } })
        })),
      h('label', {}, hasKey ? 'API key (set; enter a new one to replace it)' : 'API key',
        h('input', { type: 'password', autocomplete: 'off', placeholder: hasKey ? '••••••••' : 'Paste your key', oninput: e => { keyDraft = e.target.value.trim(); } })),
      h('label', { class: 'inline-check' },
        h('input', { type: 'checkbox', checked: cfg.rememberKeys, onchange: e => update({ rememberKeys: e.target.checked, keys: e.target.checked ? { ...cfg.keys, [p]: getApiKey(st, p) } : {} }) }),
        'Remember keys on this device (otherwise they are forgotten when you close the tab)'),
      h('div', { class: 'acts' },
        h('button', {
          class: 'btn primary', type: 'button',
          onclick: () => {
            if (!keyDraft) return;
            setApiKey(p, keyDraft);
            if (cfg.rememberKeys) update({ keys: { ...cfg.keys, [p]: keyDraft } }); else redraw();
            announce('API key saved');
          }
        }, 'Save key'),
        hasKey ? h('button', {
          class: 'btn', type: 'button',
          onclick: () => { setApiKey(p, ''); const keys = { ...cfg.keys }; delete keys[p]; update({ keys }); announce('API key removed'); }
        }, 'Remove key') : null),
      h('p', { class: 'sub' }, 'Requests go straight from this browser to the provider; Atomic has no server. Anything stored in the browser can be read by scripts running on this page, so only use a key you can revoke.')
    );
  }

  const log = st.aiLog || [];
  const logSection = [
    h('strong', { style: 'margin-top:8px' }, 'What was sent'),
    log.length
      ? h('div', { class: 'ai-log' },
          log.slice().reverse().slice(0, 10).map(e => h('details', {},
            h('summary', {}, `${new Date(e.at).toLocaleString()} · ${PROVIDERS[e.provider] || e.provider}${e.model ? ' · ' + e.model : ''} · ${e.mode === 'future' ? 'Future Self' : 'Mirror'} · ${e.journalEntriesShared} journal ${e.journalEntriesShared === 1 ? 'entry' : 'entries'}${e.ok ? '' : ' · failed'}`),
            h('pre', { class: 'payload-pre' }, JSON.stringify(e.payload, null, 2)))))
      : h('p', { class: 'sub' }, 'Nothing has been sent to an AI provider yet.'),
    h('div', { class: 'acts' },
      log.length ? h('button', { class: 'btn', type: 'button', onclick: () => { st.aiLog = []; S.save(st); redraw(); } }, 'Clear log') : null,
      (st.chatHistory || []).length ? h('button', {
        class: 'btn', type: 'button',
        onclick: () => { if (confirm('Delete all chat conversations?')) { st.chatHistory = []; S.save(st); redraw(); } }
      }, 'Delete all chats') : null)
  ];

  return h('section', { class: 'card' },
    h('div', { class: 'pill' }, 'AI reflection'),
    h('h2', { class: 'voice', style: 'font-size:22px;margin:2px 0' }, 'Chat provider'),
    h('p', { class: 'sub' }, 'Off by default. With no provider, Chat gives offline reflections built from your own data.'),
    providerSelect,
    ...fields,
    ...logSection
  );
}
