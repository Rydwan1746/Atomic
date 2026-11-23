// WOOP Goal & Obstacle Planning Domain
// Story 3.2: Wish, Outcome, Obstacle, Plan: "If {obstacle}, then I will {action}"
import { id } from '../core/ids.js';

export function addWoop(state, { wish, outcome, obstacle, plan, habitId = null } = {}) {
  const w = {
    id: id('w'),
    wish: (wish || '').trim(),
    outcome: (outcome || '').trim(),
    obstacle: (obstacle || '').trim(),
    plan: (plan || '').trim(),
    habitId: habitId || null,
    createdAt: new Date().toISOString()
  };

  return {
    ...state,
    woop: [...(state.woop || []), w]
  };
}

export function removeWoop(state, woopId) {
  return {
    ...state,
    woop: (state.woop || []).filter(w => w.id !== woopId)
  };
}

export function getWoopForHabit(state, habitId) {
  if (!habitId) return null;
  return (state.woop || []).find(w => w.habitId === habitId) || null;
}

