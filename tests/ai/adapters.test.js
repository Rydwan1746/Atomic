import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { ollamaChat, listOllamaModels, geminiChat, anthropicChat, openaiChat, AIError } from '../../js/ai/adapters.js';
import { buildSystemPrompt } from '../../js/ai/prompts.js';
import { buildSafePayload } from '../../js/ai/firewall.js';

// A stand-in for the Ollama daemon, so the real fetch path is exercised over HTTP.
let server, endpoint, lastBody;
before(async () => {
  server = http.createServer((req, res) => {
    let data = '';
    req.on('data', c => { data += c; });
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/api/tags') return res.end(JSON.stringify({ models: [{ name: 'llama3.2:latest' }, { name: 'qwen2.5:0.5b' }] }));
      if (req.url === '/api/chat') {
        lastBody = JSON.parse(data);
        if (lastBody.model === 'missing') { res.statusCode = 404; return res.end(JSON.stringify({ error: "model 'missing' not found" })); }
        return res.end(JSON.stringify({ message: { role: 'assistant', content: 'Reading sits at 82% over 30 days.' } }));
      }
      res.statusCode = 404; res.end('{}');
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  endpoint = `http://127.0.0.1:${server.address().port}/`;
});
after(() => server.close());

const fakeFetch = (status, body, capture = {}) => async (url, init) => {
  capture.url = url; capture.init = init; capture.body = init?.body ? JSON.parse(init.body) : null;
  return { ok: status < 400, status, json: async () => body };
};

describe('Ollama adapter (local HTTP)', () => {
  it('posts system + messages to /api/chat and returns the reply', async () => {
    const text = await ollamaChat({ system: 'SYS', messages: [{ role: 'user', content: 'hi' }], settings: { endpoint, model: 'llama3.2' } });
    assert.equal(text, 'Reading sits at 82% over 30 days.');
    assert.equal(lastBody.stream, false);
    assert.equal(lastBody.model, 'llama3.2');
    assert.deepEqual(lastBody.messages[0], { role: 'system', content: 'SYS' });
    assert.equal(lastBody.messages.at(-1).content, 'hi');
  });

  it('lists installed models', async () => {
    assert.deepEqual(await listOllamaModels(endpoint), ['llama3.2:latest', 'qwen2.5:0.5b']);
  });

  it('reports a missing model as an http error with the daemon message', async () => {
    await assert.rejects(
      ollamaChat({ system: 'S', messages: [{ role: 'user', content: 'x' }], settings: { endpoint, model: 'missing' } }),
      e => e instanceof AIError && e.kind === 'http' && /not found/.test(e.message));
  });

  it('reports a stopped daemon as unreachable', async () => {
    await assert.rejects(
      ollamaChat({ system: 'S', messages: [{ role: 'user', content: 'x' }], settings: { endpoint: 'http://127.0.0.1:1' } }),
      e => e instanceof AIError && e.kind === 'unreachable');
  });
});

describe('Cloud adapters (mocked fetch)', () => {
  it('Gemini sends the key in a header, not the URL, and a system instruction', async () => {
    const cap = {};
    const text = await geminiChat({
      system: 'SYS', messages: [{ role: 'user', content: 'q' }, { role: 'assistant', content: 'a' }, { role: 'user', content: 'q2' }],
      settings: { model: 'gemini-2.5-flash' }, apiKey: 'K',
      fetchImpl: fakeFetch(200, { candidates: [{ content: { parts: [{ text: 'ok' }] } }] }, cap)
    });
    assert.equal(text, 'ok');
    assert.equal(cap.url.includes('K'), false);
    assert.equal(cap.init.headers['x-goog-api-key'], 'K');
    assert.equal(cap.body.systemInstruction.parts[0].text, 'SYS');
    assert.deepEqual(cap.body.contents.map(c => c.role), ['user', 'model', 'user']);
    assert.equal(cap.body.generationConfig.thinkingConfig.thinkingBudget, 0);
  });

  it('Anthropic uses the browser-access header and reads text blocks', async () => {
    const cap = {};
    const text = await anthropicChat({
      system: 'SYS', messages: [{ role: 'user', content: 'q' }], settings: {}, apiKey: 'K',
      fetchImpl: fakeFetch(200, { stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: 'hello' }] }, cap)
    });
    assert.equal(text, 'hello');
    assert.equal(cap.init.headers['anthropic-dangerous-direct-browser-access'], 'true');
    assert.equal(cap.init.headers['x-api-key'], 'K');
    assert.equal(cap.body.system, 'SYS');
    assert.equal(cap.body.model, 'claude-opus-5-5');
  });

  it('Anthropic refusals become AIError(refused)', async () => {
    await assert.rejects(
      anthropicChat({ system: 'S', messages: [{ role: 'user', content: 'q' }], apiKey: 'K', fetchImpl: fakeFetch(200, { stop_reason: 'refusal', content: [] }) }),
      e => e.kind === 'refused');
  });

  it('OpenAI sends a bearer token and a system message', async () => {
    const cap = {};
    const text = await openaiChat({
      system: 'SYS', messages: [{ role: 'user', content: 'q' }], settings: {}, apiKey: 'K',
      fetchImpl: fakeFetch(200, { choices: [{ message: { content: 'yo' } }] }, cap)
    });
    assert.equal(text, 'yo');
    assert.equal(cap.init.headers.Authorization, 'Bearer K');
    assert.equal(cap.body.messages[0].role, 'system');
  });

  it('missing keys and bad keys are distinct errors', async () => {
    await assert.rejects(geminiChat({ system: 'S', messages: [], apiKey: '' }), e => e.kind === 'config');
    await assert.rejects(openaiChat({ system: 'S', messages: [], apiKey: 'K', fetchImpl: fakeFetch(401, { error: { message: 'bad key' } }) }),
      e => e.kind === 'auth' && /bad key/.test(e.message));
  });
});

describe('System prompts', () => {
  const st = {
    habits: [{ id: 'h1', name: 'Read', identity: 'Reader', category: 'Learning', createdAt: '2026-05-01T08:00:00.000Z' }],
    events: [], journal: [],
    alterEgo: { name: 'The Wise Mentor', narrative: 'Steady', coreValues: ['Patience', 'Depth'], obstacleStrategy: 'Rest before quitting', behaviors: ['a', 'b', 'c'] }
  };

  it('Mirror prompt states its boundaries and the redirect token', () => {
    const s = buildSystemPrompt('mirror', buildSafePayload(st, 'mirror'));
    assert.ok(s.includes('Objective Mirror'));
    assert.ok(s.includes('[REDIRECT:future]'));
    assert.ok(s.includes('under 120 words'));
    assert.ok(/self-harm/.test(s));
    assert.equal(s.includes('Rest before quitting'), false);
  });

  it('renders the data as plain sentences, with recovery time spelled out', () => {
    const s = buildSystemPrompt('mirror', buildSafePayload(st, 'mirror'));
    assert.equal(s.includes('"currentStreakDays"'), false);
    assert.ok(s.includes('"Read" (identity: Reader)'));
    assert.ok(/never checked in so far/.test(s));
    assert.equal(/exactly/.test(s), false);
  });

  it('Future prompt speaks from the Alter Ego and forbids metrics', () => {
    const s = buildSystemPrompt('future', buildSafePayload(st, 'future'));
    assert.ok(s.includes('The Wise Mentor'));
    assert.ok(s.includes('Rest before quitting'));
    assert.ok(s.includes('[REDIRECT:mirror]'));
    assert.ok(/never state percentages/.test(s));
  });

  it('includes journal snippets only when present', () => {
    st.journal = [{ id: 'j', date: '2026-05-10', text: 'Shared note', private: false }];
    assert.equal(buildSystemPrompt('mirror', buildSafePayload(st, 'mirror')).includes('Shared note'), false);
    assert.ok(buildSystemPrompt('mirror', buildSafePayload(st, 'mirror', { includeJournalOptIn: true })).includes('Shared note'));
  });
});
