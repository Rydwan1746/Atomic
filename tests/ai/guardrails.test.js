import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectCrisis, classifyScope, parseRedirect, cleanReply, limitWords, redirectText, isHelpQuestion, helpText, MAX_WORDS
} from '../../js/ai/guardrails.js';

const words = t => t.split(/\s+/).filter(Boolean).length;

describe('AI guardrails: crisis detection', () => {
  for (const msg of [
    'I want to kill myself', 'thinking about suicide', 'I keep self-harming',
    "I don't want to live anymore", 'Everyone would be better off without me', 'I want to die'
  ]) {
    it(`flags "${msg}"`, () => assert.equal(detectCrisis(msg), true));
  }
  for (const msg of ['This habit is killing my mornings', 'I died laughing at my streak', 'How is my reading going?']) {
    it(`does not flag "${msg}"`, () => assert.equal(detectCrisis(msg), false));
  }
});

describe('AI guardrails: scope routing', () => {
  it('sends identity and emotional questions from the Mirror to the Future Self', () => {
    assert.equal(classifyScope('What would my future self do about this?', 'mirror'), 'future');
    assert.equal(classifyScope('I feel like giving up, give me some motivation', 'mirror'), 'future');
    assert.equal(classifyScope('What is the purpose of all this?', 'mirror'), 'future');
  });

  it('sends metric questions from the Future Self to the Mirror', () => {
    assert.equal(classifyScope('What is my current streak for reading?', 'future'), 'mirror');
    assert.equal(classifyScope('How many check-ins did I do this week?', 'future'), 'mirror');
    assert.equal(classifyScope('What percentage of days did I meditate?', 'future'), 'mirror');
  });

  it('keeps in-scope questions in their own mode', () => {
    assert.equal(classifyScope('How consistent have I been with deep work?', 'mirror'), null);
    assert.equal(classifyScope('Which weekday do I slip on?', 'mirror'), null);
    assert.equal(classifyScope('How do I handle tired evenings?', 'future'), null);
    assert.equal(classifyScope('I skipped the gym again. What do we do now?', 'future'), null);
  });

  it('leaves mixed questions to the model', () => {
    assert.equal(classifyScope('I feel bad about my streak breaking', 'mirror'), null);
    assert.equal(classifyScope('I feel bad about my streak breaking', 'future'), null);
  });
});

describe('AI guardrails: replies seen from a small local model', () => {
  // Real replies from llama3.2 before the fix: stock redirect line, garbled token, then an answer anyway.
  const seen = [
    ["That's a question for your Future Self. **future**\n\nObservation: Your \"Dresser mon lit\" habit has been inactive for the last 2 days.", 'Your "Dresser mon lit" habit'],
    ["That's a question for your Future Self. [future]\n\nObservation: You haven't checked in today.", "You haven't checked in today."],
    ["That's a question for your Future Self. future\n\nObservation: You haven't checked in with any of your habits today.", "You haven't checked in"]
  ];
  for (const [raw, kept] of seen) {
    it(`keeps the answer and removes the stock line: ${kept}`, () => {
      const r = cleanReply(raw, 'mirror', 'What can i ask you?');
      assert.ok(r.text.startsWith(kept), r.text);
      assert.equal(r.redirect, null);
      assert.equal(/question for your future self|observation:|\bfuture\b/i.test(r.text), false, r.text);
    });
  }

  it('recognises garbled hand-off tokens', () => {
    assert.equal(parseRedirect('REDIRECT: future', 'mirror'), 'future');
    assert.equal(parseRedirect('[REDIRECT future]', 'mirror'), 'future');
  });
});

describe('AI guardrails: questions about the chat', () => {
  it('spots help questions without catching real ones', () => {
    for (const q of ['What can i ask you?', 'What can you do?', 'Who are you?', 'hi']) assert.equal(isHelpQuestion(q), true, q);
    for (const q of ['What can I do about tired evenings?', 'Are you okay with me skipping?']) assert.equal(isHelpQuestion(q), false, q);
  });
  it('describes each mode in its own voice', () => {
    assert.ok(/data/.test(helpText('mirror')));
    assert.ok(/becoming/.test(helpText('future')));
  });
});

describe('AI guardrails: reply cleaning', () => {
  it('honours a redirect token only towards the other mode', () => {
    assert.equal(parseRedirect("That's a question for your Future Self. [REDIRECT:future]", 'mirror'), 'future');
    assert.equal(parseRedirect('[redirect: mirror]', 'future'), 'mirror');
    assert.equal(parseRedirect('[REDIRECT:mirror]', 'mirror'), null);
    assert.equal(parseRedirect('No token here', 'mirror'), null);
  });

  it('uses the conversational hand-off text when the model only redirected', () => {
    const r = cleanReply('Great question! [REDIRECT:future]', 'mirror', 'Give me some motivation');
    assert.equal(r.redirect, 'future');
    assert.equal(r.text, redirectText('future'));
  });

  it('keeps the answer and adds an offer when the model answers and hands off', () => {
    const r = cleanReply('Reading happened on 3 of the last 7 days, mostly in the evening. Your Future Self could help you think about why evenings work. [REDIRECT:future]', 'mirror', 'Why do I even bother?');
    assert.equal(r.redirect, 'future');
    assert.ok(r.text.startsWith('Reading happened on 3 of the last 7 days'));
    assert.equal(r.text.includes('[REDIRECT'), false);
  });

  it('drops a hand-off away from a clearly in-scope question', () => {
    const r = cleanReply('Your streak is 3 days. [REDIRECT:future]', 'mirror', 'What is my current streak?');
    assert.equal(r.redirect, null);
    assert.ok(r.text.includes('streak is 3 days'));
  });

  it('caps replies at the word limit, ending on a sentence where possible', () => {
    const long = Array(40).fill('This is a five word sentence.').join(' ');
    const out = limitWords(long);
    assert.ok(words(out) <= MAX_WORDS);
    assert.ok(out.endsWith('.'));
    assert.ok(words(cleanReply(long, 'mirror').text) <= MAX_WORDS);
  });

  it('strips markdown and reasoning tags', () => {
    const r = cleanReply('<think>internal</think>## Summary\n**Reading** is steady.', 'mirror');
    assert.equal(r.text.includes('<think>'), false);
    assert.equal(r.text.includes('**'), false);
    assert.equal(r.text.includes('##'), false);
    assert.ok(r.text.includes('Reading is steady.'));
  });

  it('drops metric sentences from Future Self replies', () => {
    const r = cleanReply('You have an 82% consistency rate. We rest before we quit. What is one small step tonight?', 'future');
    assert.equal(r.text.includes('82%'), false);
    assert.ok(r.text.includes('We rest before we quit.'));
  });

  it('redirects a Future Self reply that was only metrics', () => {
    const r = cleanReply('Your streak of 12 days is strong. You did 40 check-ins.', 'future');
    assert.equal(r.redirect, 'mirror');
  });

  it('keeps numbers in Mirror replies', () => {
    const r = cleanReply('Reading: 82% over 30 days.', 'mirror');
    assert.ok(r.text.includes('82%'));
  });
});
