import * as S from '../core/storage.js';
import * as INS from '../domain/insights.js';
import { h, catVars } from './components.js';

let expandedProofs = new Set();
let reviewModalOpen = false;

export function render(el) {
  const st = S.load();
  const redraw = () => render(el);

  const pulse = INS.getRollingPulse(st);
  const patternsData = INS.evaluatePatterns(st);
  const themesData = INS.getRecurringThemes(st);
  const weeklyReview = INS.getWeeklyReview(st);

  // 1. 7-Day Rolling Pulse Card
  const pulseCard = h('article', { class: 'card', style: 'border-left: 4px solid var(--accent-future)' },
    h('div', { class: 'pill' }, '7-Day Rolling Pulse'),
    h('h2', { class: 'voice', style: 'font-size:22px;margin:2px 0' },
      pulse.totalVotes > 0
        ? `${pulse.totalVotes} identity vote${pulse.totalVotes === 1 ? '' : 's'} in the last 7 days`
        : 'No votes in the last 7 days'
    ),
    h('p', { class: 'sub' }, 'Ambient pulse across all active identities. Never overdue.'),
    pulse.identities.length ? h('div', { style: 'display:flex;flex-direction:column;gap:8px;margin-top:6px' },
      pulse.identities.map(item => h('div', {
        class: 'item',
        style: catVars(item.category) + ';display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg-raised);border-radius:8px'
      },
        h('div', {},
          h('span', { class: 'voice', style: 'font-weight:600' }, item.identity),
          h('div', { class: 'sub', style: 'font-size:12px' }, item.habits.join(' · '))
        ),
        h('span', { class: 'chip', style: 'font-weight:700' }, `${item.votes} vote${item.votes === 1 ? '' : 's'}`)
      ))
    ) : h('p', { class: 'sub voice' }, 'Cast your first daily vote on Today to bring your pulse alive.')
  );

  // 2. Statistical Patterns / Curtain Rising
  let patternsSection;

  if (patternsData.coldStart) {
    patternsSection = h('section', { class: 'card' },
      h('div', { class: 'pill' }, 'Curtain Rising · Learning Your Rhythms'),
      h('h3', { class: 'voice' }, 'Patterns unlock as you log more days.'),
      h('p', { class: 'sub' }, `Logged ${patternsData.totalLoggedDays} of 7 days needed for first observations.`),
      h('div', { style: 'display:flex;flex-direction:column;gap:12px;margin-top:8px' },
        patternsData.milestones.map(m => {
          const pct = Math.round((m.current / m.daysRequired) * 100);
          return h('div', {},
            h('div', { style: 'display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px' },
              h('span', {}, m.name),
              h('span', { class: 'sub' }, `${m.current} / ${m.daysRequired} days`)
            ),
            h('div', { style: 'height:6px;background:var(--grid-empty);border-radius:3px;overflow:hidden' },
              h('div', { style: `height:100%;width:${pct}%;background:var(--accent-future);border-radius:3px` })
            )
          );
        })
      )
    );
  } else {
    patternsSection = h('section', { style: 'display:flex;flex-direction:column;gap:12px' },
      h('h3', { class: 'voice' }, 'Behavioral Pattern Discoveries'),
      patternsData.patterns.length ? patternsData.patterns.map(p => {
        const isExpanded = expandedProofs.has(p.id);
        return h('article', { class: 'card' },
          h('div', { class: 'pill' }, p.type.replace('_', ' ').toUpperCase()),
          h('p', { style: 'font-size:16px;font-weight:500' }, p.message),
          h('div', { class: 'acts' },
            h('button', {
              class: 'btn-text chip',
              type: 'button',
              onclick: () => {
                if (isExpanded) expandedProofs.delete(p.id);
                else expandedProofs.add(p.id);
                redraw();
              }
            }, `Based on ${p.sampleSize.n} days · ${isExpanded ? 'Hide calculation' : 'Tap to inspect dates'}`),
            h('a', {
              class: 'ghost-link',
              href: '#/journal',
              style: 'font-size:13px;align-self:center'
            }, 'Reflect in Journal →')
          ),
          isExpanded && h('div', {
            style: 'background:var(--bg-raised);padding:10px 12px;border-radius:8px;font-size:12px;margin-top:6px;display:flex;flex-direction:column;gap:4px'
          },
            h('strong', {}, 'Mathematical Proof:'),
            h('div', {}, `Calculation: ${p.sampleSize.k} of ${p.sampleSize.n} instances.`),
            p.proof.dates && p.proof.dates.length ? h('div', { class: 'sub' }, `Exact dates: ${p.proof.dates.join(', ')}`) : null
          )
        );
      }) : h('div', { class: 'empty' }, 'No strong slips or clusters detected yet. Keep voting consistently!')
    );
  }

  // 3. Recurring-Theme NLP Section
  const themesSection = h('section', { class: 'card' },
    h('div', { class: 'pill' }, 'Recurring Themes NLP'),
    h('h3', { class: 'voice' }, 'What occupies your reflection?'),
    themesData.unlocked ? (
      themesData.themes.length ? h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px' },
        themesData.themes.map(th => h('span', { class: 'chip', style: 'padding:4px 10px;font-size:13px' },
          `#${th.word} (${th.count} entries)`
        ))
      ) : h('p', { class: 'sub' }, 'No repeated keywords across 3+ entries yet.')
    ) : (
      h('p', { class: 'sub' }, `Theme tokenizer unlocks after 8 journal entries. (${themesData.entryCount} / 8 entries so far).`)
    )
  );

  // 4. Weekly Review Protocol Bridge Card
  const weeklyReviewCard = h('article', { class: 'card prompt' },
    h('div', { class: 'pill' }, 'Sunday Weekly Review Protocol'),
    h('h3', { class: 'voice', style: 'font-size:18px' }, 'Synthesize your week.'),
    h('p', {}, weeklyReview.reflectionPrompt),
    h('div', { class: 'acts' },
      h('button', {
        class: 'btn primary',
        type: 'button',
        onclick: () => { openWeeklyReviewModal(weeklyReview, st, redraw); }
      }, 'Run Weekly Review')
    )
  );

  el.replaceChildren(...[
    h('h1', { class: 'greet' }, 'Insights & Discovery'),
    pulseCard,
    patternsSection,
    themesSection,
    weeklyReviewCard
  ]);
}

function openWeeklyReviewModal(review, st, redraw) {
  const modal = document.createElement('div');
  modal.className = 'dlg';

  const ta = h('textarea', { placeholder: 'Write your weekly synthesis and open intention...' });
  const saveBtn = h('button', {
    class: 'btn primary',
    type: 'button',
    onclick: () => {
      const text = ta.value.trim();
      if (text) {
        st.journal.push({
          id: `j_${Date.now()}`,
          at: new Date().toISOString(),
          date: new Date().toISOString().slice(0, 10),
          kind: 'free',
          habitId: null,
          prompt: review.reflectionPrompt,
          text,
          mood: null,
          energy: null,
          private: false
        });
        S.save(st);
      }
      if (modal.parentNode) modal.parentNode.removeChild(modal);
      redraw();
    }
  }, 'Save to Journal');

  const cancelBtn = h('button', {
    class: 'btn',
    type: 'button',
    onclick: () => { if (modal.parentNode) modal.parentNode.removeChild(modal); }
  }, 'Close');

  modal.appendChild(h('h2', {}, 'Weekly Review Synthesis'));
  modal.appendChild(h('p', { class: 'sub' }, review.reflectionPrompt));
  if (review.topIdentity) {
    modal.appendChild(h('p', { style: 'font-size:14px' },
      `Leading identity: ${review.topIdentity.identity} (${review.topIdentity.votes} votes)`
    ));
  }
  modal.appendChild(ta);
  modal.appendChild(h('div', { class: 'acts', style: 'margin-top:14px;justify-content:flex-end' }, saveBtn, cancelBtn));

  document.body.appendChild(modal);
}

