import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  addBehavior,
  setRating,
  removeBehavior,
  getTally,
  getStackingAnchors
} from '../../js/domain/scorecard.js';

describe('Story 2.2: Habits Scorecard domain', () => {
  const emptyState = () => ({
    habits: [],
    events: [],
    journal: [],
    scorecard: [],
    settings: {}
  });

  it('addBehavior adds a behavior with default rating =', () => {
    const st = emptyState();
    const next = addBehavior(st, { name: 'Morning coffee' });
    assert.equal(next.scorecard.length, 1);
    const item = next.scorecard[0];
    assert.match(item.id, /^sc_/);
    assert.equal(item.name, 'Morning coffee');
    assert.equal(item.rating, '=');
    assert.ok(item.createdAt);
  });

  it('addBehavior ignores blank names', () => {
    const st = emptyState();
    const next = addBehavior(st, { name: '   ' });
    assert.equal(next.scorecard.length, 0);
  });

  it('setRating updates rating to +, -, or =', () => {
    let st = emptyState();
    st = addBehavior(st, { name: 'Late night snacking' });
    const id = st.scorecard[0].id;

    st = setRating(st, id, '-');
    assert.equal(st.scorecard[0].rating, '-');

    st = setRating(st, id, '+');
    assert.equal(st.scorecard[0].rating, '+');
  });

  it('removeBehavior deletes item by id', () => {
    let st = emptyState();
    st = addBehavior(st, { name: 'Item 1' });
    st = addBehavior(st, { name: 'Item 2' });
    const id1 = st.scorecard[0].id;

    st = removeBehavior(st, id1);
    assert.equal(st.scorecard.length, 1);
    assert.equal(st.scorecard[0].name, 'Item 2');
  });

  it('getTally counts positive, negative, and neutral ratings', () => {
    const items = [
      { id: '1', rating: '+' },
      { id: '2', rating: '+' },
      { id: '3', rating: '-' },
      { id: '4', rating: '=' },
      { id: '5', rating: '=' },
      { id: '6', rating: '=' }
    ];
    const tally = getTally(items);
    assert.deepEqual(tally, { positive: 2, negative: 1, neutral: 3 });
  });

  it('getStackingAnchors combines active habits and neutral scorecard routines', () => {
    const st = {
      habits: [
        { id: 'h1', name: 'Floss', archivedAt: null },
        { id: 'h2', name: 'Old habit', archivedAt: '2026-01-01T00:00:00.000Z' }
      ],
      scorecard: [
        { id: 'sc1', name: 'Morning coffee', rating: '=' },
        { id: 'sc2', name: 'Phone scrolling', rating: '-' },
        { id: 'sc3', name: 'Daily walk', rating: '+' }
      ]
    };

    const anchors = getStackingAnchors(st);
    assert.equal(anchors.length, 2);
    assert.deepEqual(anchors.map(a => a.id), ['h1', 'sc1']);
  });
});

