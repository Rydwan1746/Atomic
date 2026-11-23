import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  saveAlterEgo,
  isAlterEgoConfigured,
  getIdentityPortfolio,
  simulateScenario
} from '../../js/domain/alter-ego.js';

describe('Story 3.1 & 3.3: Alter Ego & Identity Portfolio', () => {
  it('saveAlterEgo persists profile fields and sets updatedAt', () => {
    const st = { alterEgo: null };
    const next = saveAlterEgo(st, {
      name: 'The Builder',
      narrative: 'Shows up daily with focus',
      coreValues: ['Focus', 'Integrity', 'Patience', 'ExcessValue'],
      obstacleStrategy: 'Take one small step',
      behaviors: ['Write code', 'Breathe', 'Rest', 'ExcessBehavior']
    });

    const ae = next.alterEgo;
    assert.equal(ae.name, 'The Builder');
    assert.equal(ae.narrative, 'Shows up daily with focus');
    assert.equal(ae.coreValues.length, 3);
    assert.deepEqual(ae.coreValues, ['Focus', 'Integrity', 'Patience']);
    assert.equal(ae.obstacleStrategy, 'Take one small step');
    assert.equal(ae.behaviors.length, 3);
    assert.ok(ae.updatedAt);
    assert.equal(isAlterEgoConfigured(ae), true);
  });

  it('getIdentityPortfolio groups all-time votes and calculates 30d consistency', () => {
    const t = '2026-05-10';
    const state = {
      habits: [
        { id: 'h1', identity: 'Maker', name: 'Build', category: 'Creativity', createdAt: '2026-05-01T00:00:00.000Z' }
      ],
      events: [
        { id: 'e1', habitId: 'h1', type: 'checkin', date: '2026-05-08' },
        { id: 'e2', habitId: 'h1', type: 'checkin', date: '2026-05-09' },
        { id: 'e3', habitId: 'h1', type: 'checkin', date: '2026-05-10' },
      ]
    };

    const portfolio = getIdentityPortfolio(state, t);
    assert.equal(portfolio.length, 1);
    assert.equal(portfolio[0].identity, 'Maker');
    assert.equal(portfolio[0].totalVotes, 3);
    assert.ok(portfolio[0].consistencyPct > 0);
  });

  it('simulateScenario deterministically maps scenario to Alter Ego strategy and behaviors', () => {
    const ae = {
      name: 'Scholar',
      coreValues: ['Curiosity', 'Calm'],
      obstacleStrategy: 'Sit quietly for 60 seconds without reacting',
      behaviors: ['Read 1 paragraph', 'Drink water', 'Take 3 breaths']
    };

    const sim = simulateScenario(ae, 'Feeling tired and distracted');
    assert.equal(sim.name, 'Scholar');
    assert.ok(sim.prompt.includes('Sit quietly for 60 seconds without reacting'));
    assert.ok(sim.prompt.includes('Read 1 paragraph'));
    assert.ok(sim.prompt.includes('Feeling tired and distracted'));
  });
});

