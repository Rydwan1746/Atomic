// Flexible Provider Adapters (Gemini 2.5 Flash, Ollama, BYOK, Offline Fallback)
// Story 4.2 & 4.3

export function limitWords(text, maxWords = 120) {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(' ') + '...';
}

export function buildSystemPrompt(mode, payload) {
  if (mode === 'future') {
    const ae = payload.alterEgo || {};
    return [
      `You are ${ae.name || 'the user’s Future Self'}, an introspective, compassionate mentor who embodies their highest aspired values.`,
      `Values: ${(ae.coreValues || []).join(', ') || 'intentionality, presence'}.`,
      `Obstacle philosophy: "${ae.obstacleStrategy || 'take the smallest faithful step'}".`,
      `Archetype behaviors: ${(ae.behaviors || []).join('; ')}.`,
      `Rules:`,
      `- Speak in warm, grounding serif voice.`,
      `- Never scold, shame, or use exclamation marks excessively.`,
      `- Strictly keep your response under 100 words.`,
      `- End with a single reflective question or a 2-minute actionable challenge.`
    ].join(' ');
  }

  return [
    `You are the Objective Mirror, an analytical, quiet behavioral companion for Atomic Habits v2.`,
    `Tone: calm, analytical, neutral, sans-serif UI voice. Zero fluff.`,
    `Habit metrics provided: ${JSON.stringify(payload.habits || [])}.`,
    `Rules:`,
    `- Report objective consistency rates, streaks, and patterns without judgment.`,
    `- Strictly keep your response under 100 words.`,
    `- End with a single reflective observation or question.`
  ].join(' ');
}

export async function sendChatMessage(state, userMessage, mode = 'mirror') {
  const provider = state.settings?.ai?.provider || 'none';
  const apiKey = state.settings?.ai?.apiKey || '';
  const payload = {
    userMessage,
    mode,
    habits: state.habits,
    alterEgo: state.alterEgo
  };

  const systemInstruction = buildSystemPrompt(mode, payload);

  // 1. Google Gemini (gemini-2.5-flash)
  if (provider === 'gemini' && apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser: ${userMessage}` }] }
          ],
          generationConfig: {
            maxOutputTokens: 250,
            temperature: 0.7
          }
        })
      });

      if (!resp.ok) {
        throw new Error(`Gemini API returned status ${resp.status}`);
      }

      const json = await resp.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        ok: true,
        provider: 'gemini',
        text: limitWords(rawText, 120),
        mode
      };
    } catch (err) {
      // Fall through to offline fallback
    }
  }

  // 2. Local Ollama (http://localhost:11434)
  if (provider === 'ollama') {
    try {
      const resp = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: state.settings?.ai?.ollamaModel || 'llama3.2',
          prompt: `${systemInstruction}\n\nUser: ${userMessage}`,
          stream: false
        })
      });

      if (resp.ok) {
        const json = await resp.json();
        return {
          ok: true,
          provider: 'ollama',
          text: limitWords(json.response || '', 120),
          mode
        };
      }
    } catch (err) {
      // Fall through to offline fallback
    }
  }

  // 3. Offline / Templated Fallback
  if (mode === 'future') {
    const ae = state.alterEgo;
    const name = ae?.name || 'Your Future Self';
    const strat = ae?.obstacleStrategy || 'pause and take the 2-minute version';
    const fallbackText = `I hear you. Remember who we are becoming: someone anchored in ${ae?.coreValues?.join(', ') || 'clarity and consistency'}. When friction appears, our rule is simple: "${strat}". What is one small vote you can cast in the next two minutes?`;
    return {
      ok: true,
      provider: 'offline-fallback',
      text: limitWords(fallbackText, 120),
      mode
    };
  }

  // Mirror mode offline fallback
  const totalVotes = (state.events || []).filter(e => e.type === 'checkin').length;
  const habitCount = (state.habits || []).filter(h => !h.archivedAt).length;
  const mirrorText = `Reflecting your empirical record: you have ${habitCount} active habit systems with ${totalVotes} total votes cast. Patterns solidify through repetition. What single habit requires your attention today?`;
  return {
    ok: true,
    provider: 'offline-fallback',
    text: limitWords(mirrorText, 120),
    mode
  };
}

