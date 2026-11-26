import * as S from '../core/storage.js';
import * as INS from '../domain/insights.js';
import { h, catVars, announce } from './components.js';
import { reviewStatus, buildReview, completeReview } from '../domain/weekly-review.js';

const PATTERN_LABELS = {
  weekday_slip: 'Weekday slip', time_of_day_cluster: 'Time of day', co_occurrence: 'Habits together',
  streak_break_precursor: 'Before a streak breaks', mood_correlate: 'Mood'
};

function progressList(items) {
  return h('div', { style: 'display:flex;flex-direction:column;gap:12px;margin-top:8px' },
    items.map(m => {
      const pct = Math.round((m.current / m.daysRequired) * 100);
      return h('div', {},
        h('div', { style: 'display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px' },
          h('span', {}, m.name),
          h('span', { class: 'sub' }, `${m.current} / ${m.daysRequired} ${m.unit || 'days'}`)),
        h('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': String(pct), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': m.name },
          h('div', { style: `width:${pct}%` })));
    }));
}

let expandedProofs = new Set();
let reviewModalOpen = false;

export function render(el) {
  const st = S.load();
  const redraw = () => render(el);

  const pulse = INS.getRollingPulse(st);
  const patternsData = INS.evaluatePatterns(st);
  const themesData = INS.getRecurringThemes(st);
  const review = reviewStatus(st);

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
      progressList(patternsData.milestones)
    );
  } else {
    patternsSection = h('section', { style: 'display:flex;flex-direction:column;gap:12px' },
      h('h3', { class: 'voice' }, 'Behavioral Pattern Discoveries'),
      patternsData.patterns.length ? patternsData.patterns.map(p => {
        const isExpanded = expandedProofs.has(p.id);
        return h('article', { class: 'card' },
          h('div', { class: 'pill' }, PATTERN_LABELS[p.type] || p.type),
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
      }) : h('div', { class: 'empty' }, 'Nothing stands out yet. Patterns appear here when the data shows something clear.'),
      patternsData.locked?.length ? h('section', { class: 'card' },
        h('div', { class: 'pill' }, 'Still learning'),
        h('p', { class: 'sub' }, 'These patterns unlock as more data comes in.'),
        progressList(patternsData.locked)) : null
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

  // 4. Weekly Review (FR-17): opens Sunday 18:00, needs 3 days of activity, once per week.
  const when = d => d.toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit' });
  const weeklyReviewCard = h('article', { class: 'card prompt' },
    h('div', { class: 'pill' }, 'Weekly review'),
    review.status === 'locked' ? [
      h('h3', { class: 'voice', style: 'font-size:18px' }, 'Your first review is on its way.'),
      h('p', {}, `It opens once you have ${review.needed} days of check-ins. You have ${review.activeDays} so far.`)
    ] : review.status === 'done' ? [
      h('h3', { class: 'voice', style: 'font-size:18px' }, 'This week is reviewed.'),
      review.completed.intention && h('p', {}, `Your intention: ${review.completed.intention}`),
      h('p', { class: 'sub' }, `The next review opens ${when(review.window.nextOpensAt)}.`)
    ] : [
      h('h3', { class: 'voice', style: 'font-size:18px' }, 'Your week is ready to look back on.'),
      h('p', { class: 'sub' }, `Four short steps. Open until ${when(review.window.nextOpensAt)}.`),
      h('div', { class: 'acts' },
        h('button', { class: 'btn primary', type: 'button', onclick: () => openWeeklyReview(st, redraw) }, 'Start weekly review'))
    ]
  );

  el.replaceChildren(...[
    h('h1', { class: 'greet' }, 'Insights & Discovery'),
    pulseCard,
    patternsSection,
    themesSection,
    weeklyReviewCard
  ]);
}

function openWeeklyReview(st, redraw) {
  const r = buildReview(st);
  const dlg = h('dialog', { class: 'dlg dlg-wide', 'aria-labelledby': 'review-title' });
  const reflection = h('textarea', { class: 'ruled', style: 'min-height:112px', 'aria-label': r.reflectionPrompt, placeholder: 'A few lines, if you like.' });
  const intention = h('input', { 'aria-label': 'One intention for the week ahead', placeholder: 'e.g. Read before I pick up my phone', autocomplete: 'off' });
  const step = (n, title, ...body) => h('section', { class: 'review-step' }, h('div', { class: 'pill' }, `Step ${n} of 4`), h('h3', { class: 'voice' }, title), ...body);

  dlg.append(
    h('h2', { id: 'review-title' }, 'Weekly review'),
    step(1, r.steps[0].title,
      h('p', {}, r.topIdentity
        ? `${r.totalWeeklyVotes} ${r.totalWeeklyVotes === 1 ? 'vote' : 'votes'} in the last 7 days. Most of them for ${r.topIdentity.identity}.`
        : 'No votes in the last 7 days. That is information too, not a verdict.'),
      r.habits.length ? h('ul', { class: 'review-list' }, r.habits.map(x => h('li', {}, `${x.name}: ${x.consistency}% of days over the last 30`))) : null),
    step(2, r.steps[1].title,
      h('p', {}, r.strongestPattern ? r.strongestPattern.message : 'No clear pattern yet. Keep logging and the Mirror will have more to show.')),
    step(3, r.steps[2].title, h('p', { class: 'voice' }, r.reflectionPrompt), reflection),
    step(4, r.steps[3].title, intention),
    h('div', { class: 'acts', style: 'margin-top:14px;justify-content:flex-end' },
      h('button', { class: 'btn', type: 'button', onclick: () => dlg.close() }, 'Not now'),
      h('button', { class: 'btn primary', type: 'button', onclick: () => {
        S.save(completeReview(S.load(), { reflection: reflection.value, intention: intention.value, prompt: r.reflectionPrompt }));
        announce('Weekly review saved to your journal');
        dlg.close();
        redraw();
      } }, 'Finish and save to Journal'))
  );
  dlg.addEventListener('close', () => dlg.remove());
  document.body.appendChild(dlg);
  dlg.showModal();
}
