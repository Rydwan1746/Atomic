// AI reflection pipeline. The chat screen calls ask(); nothing else talks to a provider.
//
// Order of checks for every message:
//   1. Acute distress  -> fixed supportive reply, persona dropped, nothing sent anywhere.
//   2. Scope check: a question that clearly belongs to the other mode is flagged so a "Switch to ..."
//      offer is always shown. With a model connected, the model still answers what it can in its own lane.
//   3. Build the mode's firewall payload and system prompt.
//   4. Provider 'none' -> offline reply: help text, a conversational hand-off, or a templated reflection.
//   5. Call the provider. Clean the reply (hand-off detection, word limit, Future-Self metric filter).
//   6. Any provider failure -> offline reply with notice 'unavailable'. The app never breaks.
import { buildSafePayload } from './firewall.js';
import { buildSystemPrompt } from './prompts.js';
import { TRANSPORTS, DEFAULTS, PROVIDERS, AIError } from './adapters.js';
import { detectCrisis, classifyScope, cleanReply, redirectText, limitWords, isHelpQuestion, helpText, CRISIS_TEXT, MAX_WORDS } from './guardrails.js';

export { PROVIDERS, DEFAULTS };

const HISTORY_TURNS = 6;
const STOCK_REDIRECT = /question for (your|the) (future self|objective mirror)/i;
const KEY_PROVIDERS = ['gemini', 'anthropic', 'openai'];

// --- Settings ---------------------------------------------------------------
// Normalises old and new settings shapes into one object. Does not mutate the input.
export function aiSettings(state) {
  const raw = state?.settings?.ai || {};
  const provider = raw.provider === 'byok' ? (raw.vendor || 'anthropic') : (raw.provider || 'none');
  return {
    provider: PROVIDERS[provider] ? provider : 'none',
    ollama: {
      endpoint: raw.ollama?.endpoint || raw.endpoint || DEFAULTS.ollama.endpoint,
      model: raw.ollama?.model || raw.ollamaModel || DEFAULTS.ollama.model
    },
    gemini: { model: raw.gemini?.model || DEFAULTS.gemini.model },
    anthropic: { model: raw.anthropic?.model || DEFAULTS.anthropic.model },
    openai: { model: raw.openai?.model || DEFAULTS.openai.model },
    rememberKeys: Boolean(raw.rememberKeys),
    keys: raw.rememberKeys ? { ...(raw.keys || {}) } : {}
  };
}

// --- API keys ---------------------------------------------------------------
// Keys live in memory for this tab by default. They are written to storage only when the user ticks
// "Remember on this device" (and are then encrypted with everything else if encryption is on).
const sessionKeys = {};

export function setApiKey(provider, key) {
  if (!KEY_PROVIDERS.includes(provider)) return;
  if (key) sessionKeys[provider] = key; else delete sessionKeys[provider];
}

export function getApiKey(state, provider) {
  return sessionKeys[provider] || aiSettings(state).keys[provider] || '';
}

export const needsKey = provider => KEY_PROVIDERS.includes(provider);

// --- Offline reflection -----------------------------------------------------
function mirrorFallback(payload) {
  const c = payload.context || {};
  const habits = c.habits || [];
  if (!habits.length) return 'I don\'t see any habits in your data yet. Add one on Today and the Mirror will have something to reflect.';
  const lines = habits.slice(0, 3).map(h =>
    `${h.name}: ${h.consistency30dPercent}% over the last 30 days, current streak ${h.currentStreakDays} ${h.currentStreakDays === 1 ? 'day' : 'days'}.`);
  const pattern = c.patterns?.[0]?.finding;
  return limitWords([
    `In the last 7 days you cast ${c.totals?.checkInsLast7Days ?? 0} votes across ${habits.length} ${habits.length === 1 ? 'habit' : 'habits'}.`,
    ...lines,
    pattern ? `One pattern stands out: ${pattern}` : '',
    'Which of these numbers surprises you?'
  ].filter(Boolean).join(' '), MAX_WORDS);
}

function futureFallback(payload, message) {
  const ae = payload.context?.alterEgo || {};
  const values = ae.coreValues?.length ? ae.coreValues.join(', ') : 'clarity and consistency';
  const strategy = ae.obstacleStrategy || 'take the smallest faithful step';
  const behavior = ae.behaviors?.[0];
  return limitWords([
    `I hear you. We are someone anchored in ${values}.`,
    message ? 'When friction like this shows up, our rule is simple:' : 'Our rule for hard moments is simple:',
    `"${strategy}".`,
    behavior ? `Remember what we do: ${behavior}.` : '',
    'What is one small vote you can cast in the next two minutes?'
  ].filter(Boolean).join(' '), MAX_WORDS);
}

export function offlineReply(payload, mode, message) {
  return mode === 'future' ? futureFallback(payload, message) : mirrorFallback(payload);
}

// --- History ----------------------------------------------------------------
// Only real user/model turns of the same mode are replayed. Crisis, redirect and offline replies are not.
function historyFor(chatHistory = [], mode) {
  const turns = chatHistory
    .filter(m => m.mode === mode && (m.role === 'user' || (m.role === 'assistant' && m.source === 'model')))
    // Replies saved before the hand-off fix repeat a stock redirect line; replaying them teaches it back.
    .filter(m => !(m.role === 'assistant' && STOCK_REDIRECT.test(m.text)))
    .slice(-HISTORY_TURNS)
    .map(m => ({ role: m.role, content: m.text }));
  while (turns.length && turns[0].role !== 'user') turns.shift();
  return turns;
}

// --- Main entry -------------------------------------------------------------
// Returns {
//   text, mode,
//   source: 'model' | 'offline' | 'redirect' | 'crisis',
//   redirect: 'mirror' | 'future' | null,
//   notice: null | 'off' | 'unavailable',
//   error: string | null,          // why the provider failed (for the notice)
//   provider, model,
//   sent: null | { provider, model, payload }   // what left the device, for the local audit log
// }
export async function ask(state, { message, mode = 'mirror', includeJournal = false, fetchImpl } = {}) {
  const text = String(message || '').trim();
  const base = { mode, redirect: null, notice: null, error: null, provider: null, model: null, sent: null };

  if (detectCrisis(text)) return { ...base, source: 'crisis', text: CRISIS_TEXT };

  const scope = classifyScope(text, mode);
  const payload = buildSafePayload(state, mode, { includeJournalOptIn: includeJournal });
  const settings = aiSettings(state);
  const provider = settings.provider;
  const offline = () => scope
    ? { source: 'redirect', redirect: scope, text: redirectText(scope) }
    : { source: 'offline', text: isHelpQuestion(text) ? helpText(mode) : offlineReply(payload, mode, text) };

  if (provider === 'none') return { ...base, notice: 'off', ...offline() };

  const providerSettings = settings[provider] || {};
  const system = buildSystemPrompt(mode, payload);
  const messages = [...historyFor(state.chatHistory, mode), { role: 'user', content: text }];

  try {
    const raw = await TRANSPORTS[provider]({
      system, messages, settings: providerSettings, apiKey: getApiKey(state, provider), fetchImpl
    });
    const cleaned = cleanReply(raw, mode, text);
    const redirect = cleaned.redirect || scope;
    return {
      ...base,
      source: cleaned.text === redirectText(redirect) ? 'redirect' : 'model',
      redirect,
      text: cleaned.text,
      provider,
      model: providerSettings.model || null,
      sent: { provider, model: providerSettings.model || null, payload }
    };
  } catch (err) {
    const reason = err instanceof AIError ? err.message : 'The AI provider failed unexpectedly.';
    const configError = err instanceof AIError && err.kind === 'config';
    return {
      ...base,
      notice: 'unavailable',
      error: reason,
      provider,
      model: providerSettings.model || null,
      // A config error means nothing was sent; any other failure may have reached the provider.
      sent: configError ? null : { provider, model: providerSettings.model || null, payload },
      ...offline()
    };
  }
}

// Human-readable notice for a failed or disabled provider.
export function noticeText(result, state) {
  if (result.notice === 'off') return 'AI reflection is off, so this is an offline reflection. You can connect local Ollama or an API key in Me > AI.';
  if (result.notice !== 'unavailable') return '';
  if (result.provider === 'ollama') {
    const endpoint = aiSettings(state).ollama.endpoint;
    return `Local model unreachable at ${endpoint}. Showing an offline reflection instead. ${result.error || ''}`.trim();
  }
  return `${PROVIDERS[result.provider] || 'The AI provider'} did not answer. Showing an offline reflection instead. ${result.error || ''}`.trim();
}

// Local audit log entry. Stored on this device only, viewable in Me > AI.
export function auditEntry(result) {
  if (!result.sent) return null;
  return {
    at: new Date().toISOString(),
    provider: result.sent.provider,
    model: result.sent.model,
    mode: result.mode,
    ok: result.source === 'model' || result.source === 'redirect',
    journalEntriesShared: result.sent.payload.journalSnippets.length,
    payload: result.sent.payload
  };
}
