// General prompts: about the day and the person. None of them assume a habit was done or skipped.
export const PROMPTS = [
  'What made your day?', 'What are the highlights of today?', 'What went better than you expected?',
  'What made you smile today?', 'What is one thing you are glad you did today?',
  'How did today go, in your own words?', 'What is one thing you noticed about yourself today?',
  'What took most of your energy today?', 'When did you feel most like yourself today?',
  'What is on your mind that you have not said out loud?', 'What are you looking forward to?',
  'What small win are you not giving yourself credit for?', 'What are you proud of that nobody saw?',
  'What are you grateful for right now?', 'What was hard today, and what helped?',
  'What did you do on autopilot today?', 'Whose expectations were you carrying today?',
  'What would make tomorrow lighter?'
];
// Habit-linked prompts. Shown only after a completion or a skip, never as the daily prompt.
export const HABIT_PROMPTS = {
  done: ['How did that feel?', 'What made it easy this time?'],
  missed: ['What got in the way?', 'What did you tell yourself just before you let it go?']
};
export const promptForToday = (shift = 0) => {
  const n = new Date(), doy = Math.floor((n - new Date(n.getFullYear(), 0, 0)) / 86400000);
  return PROMPTS[(doy + shift) % PROMPTS.length];
};
