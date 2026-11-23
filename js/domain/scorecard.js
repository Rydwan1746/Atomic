// Habits Scorecard domain functions
// State: state.scorecard (array of behaviors)
// Item: { id, name, rating: '+' | '=' | '-', createdAt }

import { id } from '../core/ids.js';

export function addBehavior(state, { name, rating = '=' }) {
  const cleanName = (name || '').trim();
  if (!cleanName) return state;

  const item = {
    id: id('sc'),
    name: cleanName,
    rating, // '+' (positive), '=' (neutral), '-' (negative)
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    scorecard: [...(state.scorecard || []), item]
  };
}

export function setRating(state, itemId, rating) {
  const updated = (state.scorecard || []).map(item => {
    if (item.id !== itemId) return item;
    return { ...item, rating };
  });

  return {
    ...state,
    scorecard: updated
  };
}

export function removeBehavior(state, itemId) {
  return {
    ...state,
    scorecard: (state.scorecard || []).filter(item => item.id !== itemId)
  };
}

export function getTally(scorecard = []) {
  let positive = 0;
  let negative = 0;
  let neutral = 0;

  for (const item of scorecard) {
    if (item.rating === '+') positive++;
    else if (item.rating === '-') negative++;
    else neutral++;
  }

  return { positive, negative, neutral };
}

export function getStackingAnchors(state) {
  const activeHabits = (state.habits || []).filter(h => !h.archivedAt).map(h => ({
    id: h.id,
    name: h.name || h.vote,
    type: 'habit'
  }));

  const scorecardAnchors = (state.scorecard || []).filter(sc => sc.rating === '=').map(sc => ({
    id: sc.id,
    name: sc.name,
    type: 'scorecard'
  }));

  return [...activeHabits, ...scorecardAnchors];
}

