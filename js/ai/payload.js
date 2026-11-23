// Pure builder for the data that WOULD be sent. Nothing calls it yet. No journal text, ever, from here.
export function buildPayload(state, mode) {
  return { mode,
    habits: state.habits.map(h => ({ name: h.name, identity: h.identity, category: h.category })),
    alterEgo: mode === 'future' ? state.alterEgo : null };
}
