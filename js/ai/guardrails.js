// Guardrails for the two chat modes. Pure functions, no network, no storage.
//
// Responsibilities are split on purpose:
//   - The Objective Mirror reports what is in the data. No coaching, no reassurance, no identity philosophy.
//   - The Future Self speaks from the user's Alter Ego profile. No metrics, no streak or percentage talk.
// Each mode only receives the context it needs (see firewall.js), the system prompts state the boundaries
// (see prompts.js), and the checks below enforce them in code where a model cannot be trusted to.

export const MAX_WORDS = 120;

export const MODES = {
  mirror: { label: 'Objective Mirror', other: 'future' },
  future: { label: 'Future Self', other: 'mirror' }
};

// ---------------------------------------------------------------------------
// 1. Acute distress. Checked before anything else; the persona is dropped and no model is called.
// ---------------------------------------------------------------------------
const CRISIS_PATTERNS = [
  /\b(kill|hurt|harm|cut)(ing)?\s+my\s*self\b/i,
  /\bsuicid/i,
  /\bself[-\s]?harm/i,
  /\bend(ing)?\s+(my|it)\s+(life|all)\b/i,
  /\b(want|wanted|going)\s+to\s+die\b/i,
  /\b(don'?t|do not)\s+want\s+to\s+(live|be alive|be here)\b/i,
  /\bno\s+(reason|point)\s+(to|in)\s+(live|living|going on)\b/i,
  /\bbetter\s+off\s+(dead|without me)\b/i
];

export const CRISIS_TEXT = [
  'I am stepping out of the reflection role for a moment.',
  'What you wrote sounds heavy, and you deserve support from a real person right now.',
  'Please reach out to someone you trust, or contact a local crisis line or a mental health professional.',
  'If you are in immediate danger, call your local emergency number.',
  'Atomic is not a therapist, but your habits and notes will be here when you are ready.'
].join(' ');

export function detectCrisis(text = '') {
  return CRISIS_PATTERNS.some(re => re.test(text));
}

// ---------------------------------------------------------------------------
// 2. Scope routing. Conservative: only clear-cut questions are redirected without asking the model.
//    Mixed or ambiguous questions go to the model, which can still redirect with a [REDIRECT:...] token.
// ---------------------------------------------------------------------------
const METRIC_PATTERNS = [
  /\bstreaks?\b/i,
  /\d+\s*%|\bpercent(age)?s?\b/i,
  /\bconsistency\s+(rate|score|percentage|number)\b/i,
  /\bhow\s+consistent\s+(have|was|am|were)\s+i\b/i,
  /\bhow\s+(many|often)\b/i,
  /\b(stats|statistics|metrics|numbers|tally|tallies)\b/i,
  /\bcheck[-\s]?ins?\b/i,
  /\b(completion|success)\s+rate\b/i,
  /\b(longest|current)\s+(run|streak)\b/i,
  /\brecovery\s+(time|window)\b/i,
  /\bmy\s+(data|record|history|patterns?)\b/i
];

const GUIDANCE_PATTERNS = [
  /\bfuture\s+self\b/i,
  /\balter\s+ego\b/i,
  /\b(advice|advise|guidance|mentor)\b/i,
  /\bmotivat/i,
  /\b(meaning|purpose)\b/i,
  /\bwho\s+(am\s+i|should\s+i\s+be|do\s+i\s+want\s+to\s+be|am\s+i\s+becoming)\b/i,
  /\b(inspire|encourage|reassure)\s+me\b/i,
  /\bi\s+(feel|am\s+feeling|'m\s+feeling)\b/i,
  /\b(sad|anxious|lonely|overwhelmed|stressed|scared|hopeless|worthless)\b/i,
  /\bbelieve\s+in\s+(me|myself)\b/i,
  /\b(my\s+values|philosophy|mindset)\b/i,
  /\bwhat\s+would\s+(you|my\s+future\s+self|future\s+me)\s+do\b/i
];

const count = (patterns, text) => patterns.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);

// Returns 'future', 'mirror' or null. null means: this mode can answer it.
export function classifyScope(text = '', mode = 'mirror') {
  const metric = count(METRIC_PATTERNS, text);
  const guidance = count(GUIDANCE_PATTERNS, text);
  if (mode === 'mirror' && guidance > 0 && metric === 0) return 'future';
  if (mode === 'future' && metric > 0 && guidance === 0) return 'mirror';
  return null;
}

export function redirectText(target) {
  return target === 'future'
    ? 'That is a question for your Future Self. The Objective Mirror only reflects what your data shows.'
    : 'That is a question for your Objective Mirror. Your Future Self speaks to who you are becoming, not to the numbers.';
}

// ---------------------------------------------------------------------------
// 3. Post-processing of model output.
// ---------------------------------------------------------------------------
const REDIRECT_TOKEN = /\[\s*REDIRECT\s*:\s*(mirror|future)\s*\]/i;

// Finds a redirect token. Only a redirect to the OTHER mode is honoured.
export function parseRedirect(text = '', mode = 'mirror') {
  const m = text.match(REDIRECT_TOKEN);
  if (!m) return null;
  const target = m[1].toLowerCase();
  return target === MODES[mode].other ? target : null;
}

// Trims to the word limit, preferring to end on a full sentence.
export function limitWords(text, maxWords = MAX_WORDS) {
  if (!text) return '';
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return trimmed;
  const cut = words.slice(0, maxWords).join(' ');
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '),
    /[.?!]$/.test(cut) ? cut.length - 1 : -1);
  if (lastStop > cut.length * 0.6) return cut.slice(0, lastStop + 1);
  return cut + '…';
}

// Removes markdown decoration that the chat bubble would show as raw characters.
function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ');
}

// The Future Self never reports numbers. Sentences that quote percentages or streak counts are dropped.
const METRIC_SENTENCE = /(\d+\s*%|\b\d+\s*(day|days|check-?ins?|votes?)\b|\bstreak\s+of\s+\d+)/i;

function dropMetricSentences(text) {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
  const kept = sentences.filter(s => !METRIC_SENTENCE.test(s));
  return kept.join('').trim();
}

// Turns a raw model reply into what the user sees.
// Returns { text, redirect } where redirect is the mode to offer, or null.
export function cleanReply(raw = '', mode = 'mirror') {
  let text = String(raw || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const redirect = parseRedirect(text, mode);
  if (redirect) return { text: redirectText(redirect), redirect };
  text = text.replace(new RegExp(REDIRECT_TOKEN.source, 'gi'), '').trim();
  text = stripMarkdown(text);
  if (mode === 'future') {
    const filtered = dropMetricSentences(text);
    if (!filtered) return { text: redirectText('mirror'), redirect: 'mirror' };
    text = filtered;
  }
  return { text: limitWords(text, MAX_WORDS), redirect: null };
}
