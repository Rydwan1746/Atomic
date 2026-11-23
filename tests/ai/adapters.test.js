import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { limitWords, sendChatMessage, buildSystemPrompt } from '../../js/ai/adapters.js';

describe('Story 4.2 & 4.3: AI Adapters & Dual-Mode Chat', () => {
  it('limitWords strictly caps output to specified maximum words', () => {
    const text = Array(150).fill('word').join(' ');
    const capped = limitWords(text, 120);
    const wordCount = capped.split(/\s+/).length;
    assert.ok(wordCount <= 121); // 120 words + ellipsis
    assert.ok(capped.endsWith('...'));
  });

  it('buildSystemPrompt adapts persona to Future-Self or Mirror mode', () => {
    const mirrorPrompt = buildSystemPrompt('mirror', {});
    assert.ok(mirrorPrompt.includes('Objective Mirror'));
    assert.ok(mirrorPrompt.includes('calm, analytical'));

    const futurePrompt = buildSystemPrompt('future', {
      alterEgo: {
        name: 'The Wise Mentor',
        coreValues: ['Patience', 'Depth'],
        obstacleStrategy: 'Rest before quitting'
      }
    });
    assert.ok(futurePrompt.includes('The Wise Mentor'));
    assert.ok(futurePrompt.includes('Patience, Depth'));
    assert.ok(futurePrompt.includes('Rest before quitting'));
  });

  it('falls back to offline reflection gracefully when provider is none', async () => {
    const state = {
      habits: [{ id: 'h1', name: 'Meditate', identity: 'Calm mind' }],
      events: [{ id: 'e1', habitId: 'h1', type: 'checkin', date: '2026-05-10' }],
      alterEgo: { name: 'Sage', obstacleStrategy: 'Breathe deeply' },
      settings: { ai: { provider: 'none' } }
    };

    const replyFuture = await sendChatMessage(state, 'I feel stressed', 'future');
    assert.equal(replyFuture.ok, true);
    assert.equal(replyFuture.provider, 'offline-fallback');
    assert.ok(replyFuture.text.includes('Breathe deeply'));

    const replyMirror = await sendChatMessage(state, 'How am I doing?', 'mirror');
    assert.equal(replyMirror.ok, true);
    assert.equal(replyMirror.provider, 'offline-fallback');
    assert.ok(replyMirror.text.includes('active habit systems'));
  });
});

