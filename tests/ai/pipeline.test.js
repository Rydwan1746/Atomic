import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ask, aiSettings, setApiKey, getApiKey, noticeText, auditEntry } from '../../js/ai/index.js';
import { CRISIS_TEXT, MAX_WORDS } from '../../js/ai/guardrails.js';

const baseState = (ai = { provider: 'none' }) => ({
  habits: [{ id: 'h1', name: 'Meditate', identity: 'Calm mind', category: 'Mindfulness', createdAt: '2026-05-01T08:00:00.000Z' }],
  events: [{ id: 'e1', habitId: 'h1', type: 'checkin', date: '2026-05-10' }],
  journal: [{ id: 'j1', date: '2026-05-10', text: 'Secret', private: true }, { id: 'j2', date: '2026-05-10', text: 'Shareable', private: false }],
  alterEgo: { name: 'Sage', narrative: 'Calm', coreValues: ['Patience'], obstacleStrategy: 'Breathe deeply', behaviors: ['Sit', 'Walk', 'Rest'] },
  chatHistory: [],
  settings: { ai }
});

// Records calls and answers like Ollama's /api/chat.
function ollamaFetch(reply, calls = []) {
  return async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return { ok: true, status: 200, json: async () => ({ message: { content: reply } }) };
  };
}

describe('AI pipeline: checks before any network call', () => {
  it('answers acute distress with the support message and sends nothing', async () => {
    const calls = [];
    const r = await ask(baseState({ provider: 'ollama' }), { message: 'I want to end my life', mode: 'future', fetchImpl: ollamaFetch('x', calls) });
    assert.equal(r.source, 'crisis');
    assert.equal(r.text, CRISIS_TEXT);
    assert.equal(calls.length, 0);
    assert.equal(r.sent, null);
  });

  it('offers the other mode for a clear out-of-scope question, offline', async () => {
    const r = await ask(baseState(), { message: 'What is my current streak?', mode: 'future' });
    assert.equal(r.source, 'redirect');
    assert.equal(r.redirect, 'mirror');
  });

  it('still lets a connected model answer, and adds the switch offer', async () => {
    const calls = [];
    const r = await ask(baseState({ provider: 'ollama' }), {
      message: 'What is my current streak?', mode: 'future',
      fetchImpl: ollamaFetch('I don\'t hold the numbers, but I know what showing up feels like for us. What would a good week look like to you?', calls)
    });
    assert.equal(calls.length, 1);
    assert.equal(r.source, 'model');
    assert.equal(r.redirect, 'mirror');
    assert.ok(r.text.startsWith("I don't hold the numbers"));
  });

  it('answers "what can I ask you?" offline in the mode\'s voice', async () => {
    const r = await ask(baseState(), { message: 'What can i ask you?', mode: 'mirror' });
    assert.equal(r.redirect, null);
    assert.ok(/data/.test(r.text));
  });
});

describe('AI pipeline: offline reflection', () => {
  it('uses the offline reflection when the provider is none', async () => {
    const f = await ask(baseState(), { message: 'I am tired tonight', mode: 'future' });
    assert.equal(f.source, 'offline');
    assert.equal(f.notice, 'off');
    assert.ok(f.text.includes('Breathe deeply'));
    assert.equal(/\d+%/.test(f.text), false);

    const m = await ask(baseState(), { message: 'How is meditation going?', mode: 'mirror' });
    assert.equal(m.source, 'offline');
    assert.ok(m.text.includes('Meditate'));
    assert.ok(m.text.split(/\s+/).length <= MAX_WORDS);
  });

  it('falls back gracefully and explains why when Ollama is down', async () => {
    const st = baseState({ provider: 'ollama', ollama: { endpoint: 'http://127.0.0.1:1', model: 'llama3.2' } });
    const r = await ask(st, { message: 'How is meditation going?', mode: 'mirror' });
    assert.equal(r.source, 'offline');
    assert.equal(r.notice, 'unavailable');
    assert.ok(r.text.length > 0);
    assert.ok(noticeText(r, st).includes('http://127.0.0.1:1'));
  });

  it('does not log a send when a key is missing', async () => {
    const r = await ask(baseState({ provider: 'gemini' }), { message: 'How is meditation going?', mode: 'mirror' });
    assert.equal(r.notice, 'unavailable');
    assert.equal(r.sent, null);
    assert.equal(auditEntry(r), null);
  });
});

describe('AI pipeline: model replies', () => {
  it('sends the mode payload and returns the cleaned reply', async () => {
    const calls = [];
    const r = await ask(baseState({ provider: 'ollama' }), { message: 'How is meditation going?', mode: 'mirror', fetchImpl: ollamaFetch('**Meditate**: 3% over 30 days.', calls) });
    assert.equal(r.source, 'model');
    assert.equal(r.text, 'Meditate: 3% over 30 days.');
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.endsWith('/api/chat'));
    const system = calls[0].body.messages[0].content;
    assert.ok(system.includes('Objective Mirror'));
    assert.equal(system.includes('Shareable'), false);
    assert.equal(system.includes('Breathe deeply'), false);
  });

  it('includes opted-in journal text but never private entries', async () => {
    const calls = [];
    await ask(baseState({ provider: 'ollama' }), { message: 'Anything in my notes?', mode: 'mirror', includeJournal: true, fetchImpl: ollamaFetch('ok', calls) });
    const system = calls[0].body.messages[0].content;
    assert.ok(system.includes('Shareable'));
    assert.equal(system.includes('Secret'), false);
  });

  it('turns a model redirect token into a switch offer', async () => {
    const r = await ask(baseState({ provider: 'ollama' }), {
      message: 'Is this worth it?', mode: 'mirror',
      fetchImpl: ollamaFetch("That's a question for your Future Self. [REDIRECT:future]")
    });
    assert.equal(r.source, 'redirect');
    assert.equal(r.redirect, 'future');
    assert.equal(r.text.includes('[REDIRECT'), false);
  });

  it('replays only same-mode model turns as history', async () => {
    const st = baseState({ provider: 'ollama' });
    st.chatHistory = [
      { role: 'user', text: 'mirror q', mode: 'mirror' },
      { role: 'assistant', text: 'mirror a', mode: 'mirror', source: 'model' },
      { role: 'user', text: 'future q', mode: 'future' },
      { role: 'assistant', text: 'offline a', mode: 'mirror', source: 'offline' },
      { role: 'user', text: 'old q', mode: 'mirror' },
      { role: 'assistant', text: "That's a question for your Future Self. future", mode: 'mirror', source: 'model' }
    ];
    const calls = [];
    await ask(st, { message: 'next', mode: 'mirror', fetchImpl: ollamaFetch('ok', calls) });
    const sent = calls[0].body.messages.slice(1).map(m => m.content);
    assert.deepEqual(sent, ['mirror q', 'mirror a', 'old q', 'next']);
  });

  it('records what was sent for the local audit log', async () => {
    const r = await ask(baseState({ provider: 'ollama' }), { message: 'How is meditation going?', mode: 'mirror', fetchImpl: ollamaFetch('ok') });
    const e = auditEntry(r);
    assert.equal(e.provider, 'ollama');
    assert.equal(e.mode, 'mirror');
    assert.equal(e.journalEntriesShared, 0);
    assert.ok(e.payload.context.habits);
  });
});

describe('AI settings and keys', () => {
  beforeEach(() => setApiKey('gemini', ''));

  it('normalises the legacy settings shape', () => {
    const s = aiSettings({ settings: { ai: { provider: 'ollama', ollamaModel: 'mistral' } } });
    assert.equal(s.provider, 'ollama');
    assert.equal(s.ollama.model, 'mistral');
    assert.equal(s.ollama.endpoint, 'http://localhost:11434');
    assert.equal(aiSettings({}).provider, 'none');
    assert.equal(aiSettings({ settings: { ai: { provider: 'bogus' } } }).provider, 'none');
  });

  it('keeps keys in memory unless remembering is on', () => {
    const st = { settings: { ai: { provider: 'gemini', rememberKeys: false, keys: { gemini: 'stored' } } } };
    assert.equal(getApiKey(st, 'gemini'), '');
    setApiKey('gemini', 'session');
    assert.equal(getApiKey(st, 'gemini'), 'session');
    setApiKey('gemini', '');
    st.settings.ai.rememberKeys = true;
    assert.equal(getApiKey(st, 'gemini'), 'stored');
  });
});
