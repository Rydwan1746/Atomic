// Provider transports. Each one takes a system prompt and a message list and returns raw reply text,
// or throws an AIError. No guardrails, no state, no storage here: see index.js for the pipeline.
//
// Requests go straight from the browser to the provider. There is no Atomic server in between.

export const DEFAULTS = {
  ollama: { endpoint: 'http://localhost:11434', model: 'llama3.2' },
  gemini: { model: 'gemini-2.5-flash' },
  anthropic: { model: 'claude-opus-5-5' },
  openai: { model: 'gpt-4.1-mini' }
};

export const PROVIDERS = {
  none: 'Off (offline reflection only)',
  ollama: 'Local Ollama (on this computer)',
  gemini: 'Google Gemini (your API key)',
  anthropic: 'Anthropic Claude (your API key)',
  openai: 'OpenAI (your API key)'
};

const GENERATION_TIMEOUT_MS = 120000; // local models can take a while on first load
const PROBE_TIMEOUT_MS = 4000;
const MAX_OUTPUT_TOKENS = 400;

export class AIError extends Error {
  // kind: 'unreachable' | 'timeout' | 'http' | 'auth' | 'empty' | 'config' | 'refused'
  constructor(kind, message, { provider = null, status = null } = {}) {
    super(message);
    this.name = 'AIError';
    this.kind = kind;
    this.provider = provider;
    this.status = status;
  }
}

export const trimEndpoint = url => String(url || DEFAULTS.ollama.endpoint).trim().replace(/\/+$/, '');

async function request(provider, url, init, timeoutMs = GENERATION_TIMEOUT_MS, fetchImpl = globalThis.fetch) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  let resp;
  try {
    resp = await fetchImpl(url, { ...init, signal: ctrl?.signal });
  } catch (err) {
    if (err?.name === 'AbortError') throw new AIError('timeout', `${provider} did not answer within ${Math.round(timeoutMs / 1000)}s.`, { provider });
    throw new AIError('unreachable', `Could not reach ${provider}.`, { provider });
  } finally {
    if (timer) clearTimeout(timer);
  }
  let body = null;
  try { body = await resp.json(); } catch { body = null; }
  if (!resp.ok) {
    const detail = body?.error?.message || body?.error || `HTTP ${resp.status}`;
    const kind = resp.status === 401 || resp.status === 403 ? 'auth' : 'http';
    throw new AIError(kind, `${provider}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`, { provider, status: resp.status });
  }
  return body || {};
}

const nonEmpty = (provider, text) => {
  if (!text || !String(text).trim()) throw new AIError('empty', `${provider} returned an empty reply.`, { provider });
  return String(text);
};

// --- Ollama ----------------------------------------------------------------
export async function ollamaChat({ system, messages, settings = {}, fetchImpl }) {
  const endpoint = trimEndpoint(settings.endpoint);
  const json = await request('Ollama', `${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: settings.model || DEFAULTS.ollama.model,
      messages: [{ role: 'system', content: system }, ...messages],
      stream: false,
      options: { temperature: 0.6, num_predict: MAX_OUTPUT_TOKENS }
    })
  }, GENERATION_TIMEOUT_MS, fetchImpl);
  return nonEmpty('Ollama', json.message?.content);
}

// Lists installed models. Used by "Test connection" in Me > AI reflection.
export async function listOllamaModels(endpoint, fetchImpl) {
  const json = await request('Ollama', `${trimEndpoint(endpoint)}/api/tags`, { method: 'GET' }, PROBE_TIMEOUT_MS, fetchImpl);
  return (json.models || []).map(m => m.name).filter(Boolean);
}

// --- Google Gemini ---------------------------------------------------------
export async function geminiChat({ system, messages, settings = {}, apiKey, fetchImpl }) {
  if (!apiKey) throw new AIError('config', 'Add a Gemini API key in Me > AI reflection.', { provider: 'Gemini' });
  const model = settings.model || DEFAULTS.gemini.model;
  const generationConfig = { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.6 };
  // 2.5-series models spend output tokens on hidden thinking unless told not to.
  if (/2\.5-flash/.test(model)) generationConfig.thinkingConfig = { thinkingBudget: 0 };
  const json = await request('Gemini', `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig
    })
  }, GENERATION_TIMEOUT_MS, fetchImpl);
  const parts = json.candidates?.[0]?.content?.parts || [];
  return nonEmpty('Gemini', parts.map(p => p.text || '').join(''));
}

// --- Anthropic (bring your own key) -----------------------------------------
// Raw fetch on purpose: the app has no build step and no npm dependencies, so the SDK cannot be bundled.
export async function anthropicChat({ system, messages, settings = {}, apiKey, fetchImpl }) {
  if (!apiKey) throw new AIError('config', 'Add an Anthropic API key in Me > AI reflection.', { provider: 'Anthropic' });
  const json = await request('Anthropic', 'https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'anthropic-beta': 'server-side-fallback-2026-07-01'
    },
    body: JSON.stringify({
      model: settings.model || DEFAULTS.anthropic.model,
      max_tokens: 4000,
      output_config: { effort: 'low' },
      fallbacks: 'default',
      system,
      messages
    })
  }, GENERATION_TIMEOUT_MS, fetchImpl);
  if (json.stop_reason === 'refusal') throw new AIError('refused', 'Anthropic declined to answer this message.', { provider: 'Anthropic' });
  const text = (json.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  return nonEmpty('Anthropic', text);
}

// --- OpenAI (bring your own key) --------------------------------------------
export async function openaiChat({ system, messages, settings = {}, apiKey, fetchImpl }) {
  if (!apiKey) throw new AIError('config', 'Add an OpenAI API key in Me > AI reflection.', { provider: 'OpenAI' });
  const json = await request('OpenAI', 'https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: settings.model || DEFAULTS.openai.model,
      max_completion_tokens: MAX_OUTPUT_TOKENS,
      messages: [{ role: 'system', content: system }, ...messages]
    })
  }, GENERATION_TIMEOUT_MS, fetchImpl);
  return nonEmpty('OpenAI', json.choices?.[0]?.message?.content);
}

export const TRANSPORTS = { ollama: ollamaChat, gemini: geminiChat, anthropic: anthropicChat, openai: openaiChat };
