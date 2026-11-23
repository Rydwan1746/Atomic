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

// Used when a hand-off has nothing else to say (offline, or a model that only redirected).
export function redirectText(target) {
  return target === 'future'
    ? 'That sounds like something to explore with your Future Self. I can only show you what your data says, but they can help you think through what it means. Want to take it there?'
    : 'I don\'t hold the numbers, the Objective Mirror does. Have a look there, then come back and tell me what you notice. What do you hope they show?';
}

// ---------------------------------------------------------------------------
// 3. Questions about the chat itself ("what can I ask you?") get a fixed, in-mode answer.
// ---------------------------------------------------------------------------
const HELP_PATTERNS = [
  /\bwhat\s+(can|should|could)\s+i\s+ask\b/i,
  /\bwhat\s+(can|do)\s+you\s+(do|help)\b/i,
  /\b(who|what)\s+are\s+you\b/i,
  /\bhow\s+do(es)?\s+(this|you|the\s+(mirror|chat))\s+work\b/i,
  /^\s*(help|hi|hello|hey)\s*[?!.]*\s*$/i
];

export const isHelpQuestion = (text = '') => HELP_PATTERNS.some(re => re.test(text));

export function helpText(mode) {
  return mode === 'future'
    ? 'I am the person you are becoming, drawn from your Alter Ego profile. Bring me a moment of friction, a decision, or a doubt, and I will answer from our values and our obstacle philosophy. For numbers and streaks, the Objective Mirror is better.'
    : 'I reflect what your data shows: how consistent each habit has been, your streaks, how quickly you restart after a miss, your votes this week, and any patterns detected. Try "Which habit slipped this week?" or "When do I usually check in?"';
}

// ---------------------------------------------------------------------------
// 4. Post-processing of model output.
// ---------------------------------------------------------------------------
// Small local models rarely reproduce the token exactly, so every common variant is recognised.
const TOKEN_VARIANTS = /\[\s*REDIRECT\s*[:=\-]?\s*(mirror|future)\s*\]|\bREDIRECT\s*[:=\-]\s*(mirror|future)\b/gi;
const PHRASE = {
  future: /(that'?s|that\s+is)\s+(a\s+)?question\s+for\s+your\s+future\s+self\.?/gi,
  mirror: /(that'?s|that\s+is)\s+(a\s+)?question\s+for\s+(your|the)\s+objective\s+mirror\.?/gi
};
// A leftover mode name right after the redirect phrase: "future", [future], **future**, (future), `future`.
const STRAY_MODE = /^[\s\-:]*[\[(*_`"']*\s*(future|mirror)(\s+self)?\s*[\])*_`"']*[.:]?(?=\s|$)/i;
// Below this many words of real content, a reply that redirects is treated as a pure redirect.
const ANSWER_MIN_WORDS = 4;

// Finds a redirect token. Only a redirect to the OTHER mode is honoured.
export function parseRedirect(text = '', mode = 'mirror') {
  const other = MODES[mode].other;
  for (const m of text.matchAll(TOKEN_VARIANTS)) {
    if ((m[1] || m[2]).toLowerCase() === other) return other;
  }
  return null;
}

// Signals that a question belongs to this mode, so a model redirect away from it is overruled.
export function isInScope(text = '', mode = 'mirror') {
  return mode === 'mirror' ? count(METRIC_PATTERNS, text) > 0 : count(GUIDANCE_PATTERNS, text) > 0;
}

// Splits a reply into { redirect, remainder }: did the model hand off, and what else did it say?
export function splitRedirect(raw = '', mode = 'mirror') {
  const other = MODES[mode].other;
  const viaToken = parseRedirect(raw, mode);
  let redirect = viaToken;
  let rest = raw.replace(TOKEN_VARIANTS, ' ');
  if (PHRASE[other].test(rest)) {
    redirect = other;
    PHRASE[other].lastIndex = 0;
    rest = rest.replace(PHRASE[other], m => '\u0000');
    rest = rest.replace(/\u0000(\s*)/g, (m, sp) => sp).replace(new RegExp(STRAY_MODE.source, 'i'), '');
    rest = rest.split('\n').map(l => l.replace(STRAY_MODE, '')).join('\n');
  }
  PHRASE[other].lastIndex = 0;
  return { redirect, viaToken: Boolean(viaToken), remainder: rest.replace(/\n{3,}/g, '\n\n').trim() };
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

// Removes markdown decoration and section labels that the chat bubble would show as raw text.
function stripFormatting(text) {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/^\s*(observation|reflection|question|note|answer|response|insight|summary)\s*:\s*/gim, '')
    .replace(/\n{3,}/g, '\n\n');
}

// The Future Self never reports numbers. Sentences that quote percentages or streak counts are dropped.
const METRIC_SENTENCE = /(\d+\s*%|\b\d+\s*(day|days|check-?ins?|votes?)\b|\bstreak\s+of\s+\d+)/i;

function dropMetricSentences(text) {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
  const kept = sentences.filter(s => !METRIC_SENTENCE.test(s));
  return kept.join('').trim();
}

const wordCount = t => t.split(/\s+/).filter(Boolean).length;

// Turns a raw model reply into what the user sees.
// question: the user's message. A hand-off away from a clearly in-scope question is dropped.
// Returns { text, redirect }. redirect is a mode to OFFER under the reply; the reply itself is kept.
export function cleanReply(raw = '', mode = 'mirror', question = '') {
  const stripped = String(raw || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const split = splitRedirect(stripped, mode);
  let text = stripFormatting(split.remainder).trim();
  let redirect = split.redirect && !isInScope(question, mode) ? split.redirect : null;

  if (mode === 'future') text = dropMetricSentences(text);

  // A stock "That's a question for..." line followed by a real answer is a habit small models pick up,
  // not a hand-off. Only a deliberate tag offers the switch when the model also answered.
  if (redirect && !split.viaToken && wordCount(text) >= ANSWER_MIN_WORDS) redirect = null;

  // The model only handed off (or said nothing usable): use the conversational hand-off text.
  if (wordCount(text) < ANSWER_MIN_WORDS) {
    if (redirect || (mode === 'future' && stripped)) {
      redirect = redirect || 'mirror';
      return { text: redirectText(redirect), redirect };
    }
    return { text: mode === 'future' ? helpText('future') : 'I don\'t see that in your data. What did you notice yourself?', redirect: null };
  }
  return { text: limitWords(text, MAX_WORDS), redirect };
}
