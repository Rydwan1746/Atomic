import * as S from '../core/storage.js';
import { h, announce } from './components.js';
import { applyTheme } from './theme.js';
import * as AE from '../domain/alter-ego.js';
import * as WOOP from '../domain/woop.js';
import { generateIcs, icsHabitCount } from '../domain/reminders.js';
import { encryptState, decryptState, isEncrypted } from '../core/crypto.js';
import { aiSettingsCard } from './ai-settings.js';
import { protectionSection } from './protection.js';
import { downloadBackup, persistenceStatus, requestPersistence } from './backup.js';

let simulatorOutput = null;
let tab = 'you';   // 'you' | 'ai' | 'data'
const TABS = { you: 'You', ai: 'AI', data: 'Data & privacy' };

export function render(el) {
  const st = S.load();
  const redraw = () => render(el);
  const q = (location.hash.split('?')[1] || '');
  if (TABS[q]) { tab = q; history.replaceState(null, '', '#/me'); }

  // --- ZONE 1: Identity Architecture & Portfolio ---
  const portfolio = AE.getIdentityPortfolio(st);
  const alterEgo = st.alterEgo || {};
  const woopList = st.woop || [];
  const habits = (st.habits || []).filter(habit => !habit.archivedAt);

  // 1. Identity Portfolio Section
  const portfolioSection = h('section', { class: 'card' },
    h('div', { class: 'pill' }, 'Your identities'),
    h('h2', { class: 'voice', style: 'font-size:22px;margin:2px 0' }, 'Who you are becoming'),
    h('p', { class: 'sub' }, 'Every check-in is a vote for one of these.'),
    portfolio.length ? h('div', { style: 'display:flex;flex-direction:column;gap:10px;margin-top:8px' },
      portfolio.map(item => h('div', {
        class: 'item',
        style: 'display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg-raised);border-radius:10px'
      },
        h('div', {},
          h('div', { class: 'voice', style: 'font-size:18px;font-weight:600' }, item.identity),
          h('div', { class: 'sub', style: 'font-size:13px' }, item.habits.join(', '))
        ),
        h('div', { style: 'text-align:right' },
          h('div', { style: 'font-weight:700;color:var(--accent-future)' }, `${item.totalVotes} votes`),
          h('div', { class: 'sub', style: 'font-size:12px' }, `${item.consistencyPct}% 30d`)
        )
      ))
    ) : h('div', { class: 'empty' }, 'No identities yet. Add your first habit on Today.')
  );

  // 2. Alter Ego Profile Authoring Card
  let aeName = alterEgo.name || '';
  let aeNarrative = alterEgo.narrative || '';
  let aeValues = (alterEgo.coreValues || []).join(', ');
  let aeObstacle = alterEgo.obstacleStrategy || '';
  let aeBehaviors = (alterEgo.behaviors || []).join('\n');

  const alterEgoCard = h('section', { class: 'card', style: 'border:1px solid var(--accent-future)' },
    h('div', { class: 'pill' }, 'Your future self'),
    h('h3', { class: 'voice' }, 'Describe who you are becoming'),
    h('p', { class: 'sub' }, 'A description and 3 behaviors unlock Future-Self chat. Scenario simulation works with any profile.'),
    h('form', {
      onsubmit: e => {
        e.preventDefault();
        const updated = AE.saveAlterEgo(st, {
          name: aeName,
          narrative: aeNarrative,
          coreValues: aeValues.split(',').map(s => s.trim()).filter(Boolean),
          obstacleStrategy: aeObstacle,
          behaviors: aeBehaviors.split('\n').map(s => s.trim()).filter(Boolean)
        });
        S.save(updated);
        announce('Alter Ego profile saved');
        redraw();
      }
    },
      h('label', {}, 'Alter Ego Name (optional)',
        h('input', {
          value: aeName,
          placeholder: 'e.g. The Focused Scholar, The Steadfast Maker',
          oninput: e => { aeName = e.target.value; }
        })
      ),
      h('label', {}, 'Narrative Description',
        h('textarea', {
          rows: 3,
          placeholder: 'How does this person show up? What is their essence?',
          value: aeNarrative,
          oninput: e => { aeNarrative = e.target.value; }
        })
      ),
      h('label', {}, 'Core Values (up to 3, comma separated)',
        h('input', {
          value: aeValues,
          placeholder: 'e.g. Craft, Patience, Clarity',
          oninput: e => { aeValues = e.target.value; }
        })
      ),
      h('label', {}, 'Obstacle Handling Philosophy',
        h('input', {
          value: aeObstacle,
          placeholder: 'e.g. When blocked, I write one bad sentence to break the dam',
          oninput: e => { aeObstacle = e.target.value; }
        })
      ),
      h('label', {}, '3 Core Behavioral Habits (one per line)',
        h('textarea', {
          rows: 3,
          placeholder: '1. Put phone in another room\n2. Open document immediately\n3. Walk for 5 minutes',
          value: aeBehaviors,
          oninput: e => { aeBehaviors = e.target.value; }
        })
      ),
      h('div', { class: 'acts', style: 'margin-top:10px' },
        h('button', { class: 'btn primary', type: 'submit' }, 'Save')
      )
    )
  );

  // 3. WOOP Planner Card
  let wWish = '', wOutcome = '', wObstacle = '', wPlan = '', wHabitId = '';
  const woopCard = h('section', { class: 'card' },
    h('div', { class: 'pill' }, 'Plans for obstacles (WOOP)'),
    h('h3', { class: 'voice' }, 'Wish, outcome, obstacle, plan'),
    h('form', {
      onsubmit: e => {
        e.preventDefault();
        if (!wWish || !wPlan) return;
        const newSt = WOOP.addWoop(st, {
          wish: wWish,
          outcome: wOutcome,
          obstacle: wObstacle,
          plan: wPlan,
          habitId: wHabitId || null
        });
        S.save(newSt);
        wWish = ''; wOutcome = ''; wObstacle = ''; wPlan = '';
        announce('WOOP plan created');
        redraw();
      }
    },
      h('label', {}, 'Wish: what do you want?',
        h('input', { required: true, placeholder: 'e.g. Daily morning reading', oninput: e => { wWish = e.target.value; } })
      ),
      h('label', {}, 'Outcome: what would it feel like?',
        h('input', { placeholder: 'e.g. Expansive knowledge and calm morning', oninput: e => { wOutcome = e.target.value; } })
      ),
      h('label', {}, 'Obstacle: what usually gets in the way?',
        h('input', { placeholder: 'e.g. Scrolling social media on waking', oninput: e => { wObstacle = e.target.value; } })
      ),
      h('label', {}, 'Plan: "If [obstacle], then I will [action]"',
        h('input', { required: true, placeholder: 'If I reach for phone, then I will open my book', oninput: e => { wPlan = e.target.value; } })
      ),
      h('label', {}, 'Show it on a habit (optional)',
        h('select', { onchange: e => { wHabitId = e.target.value; } },
          h('option', { value: '' }, 'No habit'),
          habits.map(habit => h('option', { value: habit.id }, habit.name || habit.vote))
        )
      ),
      h('div', { class: 'acts', style: 'margin-top:10px' },
        h('button', { class: 'btn primary', type: 'submit' }, 'Save plan')
      )
    ),
    woopList.length ? h('div', { style: 'display:flex;flex-direction:column;gap:8px;margin-top:14px' },
      h('strong', {}, 'Your plans'),
      woopList.map(item => h('div', {
        class: 'scorecard-row',
        style: 'padding:10px 14px'
      },
        h('strong', {}, item.wish),
        h('p', { class: 'voice', style: 'font-size:14px' }, item.plan),
        h('div', { class: 'acts', style: 'justify-content:space-between;align-items:center' },
          item.habitId ? h('span', { class: 'chip' }, 'Linked to habit') : h('span', {}),
          h('button', {
            class: 'btn-text',
            type: 'button',
            onclick: () => {
              const newSt = WOOP.removeWoop(st, item.id);
              S.save(newSt);
              redraw();
            }
          }, 'Delete')
        )
      ))
    ) : null
  );

  // 4. Offline Scenario Simulator
  let simText = '';
  const simulatorCard = h('section', { class: 'card prompt' },
    h('div', { class: 'pill' }, 'Practice a hard moment'),
    h('h3', { class: 'voice' }, 'What would your future self do?'),
    h('p', { class: 'sub' }, 'A reflection built only from your future self\'s values and behaviors. Works offline.'),
    h('textarea', {
      rows: 2,
      placeholder: 'Describe a temptation or friction right now (e.g. Feeling drained and wanting to skip today)...',
      oninput: e => { simText = e.target.value; }
    }),
    h('div', { class: 'acts' },
      h('button', {
        class: 'btn primary',
        type: 'button',
        onclick: () => {
          const sim = AE.simulateScenario(st.alterEgo, simText);
          simulatorOutput = sim.prompt;
          redraw();
        }
      }, 'Reflect')
    ),
    simulatorOutput ? h('div', {
      style: 'background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px;margin-top:10px;white-space:pre-wrap;font-family:var(--font-voice);line-height:1.6'
    },
      simulatorOutput,
      h('div', { class: 'acts', style: 'margin-top:10px' },
        h('a', { class: 'btn primary', href: '#/journal', style: 'text-decoration:none' }, 'Write about it in Journal →')
      )
    ) : null
  );

  // --- Data & privacy ---
  const lastBackupStr = st.settings.lastBackupAt
    ? `Last backup: ${Math.max(0, Math.round((Date.now() - new Date(st.settings.lastBackupAt).getTime()) / 864e5))} days ago`
    : 'No backup downloaded yet';

  const storageLine = h('p', { class: 'sub' }, 'Checking whether this browser will keep your data…');
  persistenceStatus().then(status => {
    storageLine.replaceChildren(...({
      granted: ['This browser has agreed to keep Atomic\'s data. Backups still protect you if the device is lost.'],
      denied: ['This browser may clear Atomic\'s data when space is low or after a long time without a visit. ',
        h('button', { class: 'ghost-link', type: 'button', onclick: async () => { await requestPersistence(); redraw(); } }, 'Ask it to keep my data')],
      unsupported: ['This browser cannot promise to keep site data, so regular backups are your safety net.']
    })[status]);
  });

  const settingsCard = h('section', { class: 'card' },
    h('div', { class: 'pill' }, 'Settings'),
    h('strong', {}, 'Appearance'),
    h('label', {}, 'Theme',
      h('select', { onchange: e => { st.settings.theme = e.target.value; S.save(st); applyTheme(); } },
        ['auto', 'paper', 'night'].map(v => h('option', { value: v, selected: st.settings.theme === v }, v))
      )
    ),

    h('strong', { style: 'margin-top:8px' }, 'Calendar reminders'),
    h('p', { class: 'sub' }, icsHabitCount(st)
      ? `A daily calendar event for ${icsHabitCount(st) === 1 ? 'your 1 habit' : `each of your ${icsHabitCount(st)} habits`} with an intention time. These remind you even when Atomic is closed. After changing a habit, download and import the file again.`
      : 'Give a habit an intention time (Edit habit) to export it as a daily calendar reminder.'),
    h('div', { class: 'acts' },
      h('button', {
        class: 'btn',
        type: 'button',
        onclick: () => {
          const ics = generateIcs(st);
          const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
          const a = h('a', { href: URL.createObjectURL(blob), download: 'atomic-reminders.ics' });
          a.click();
          announce('Calendar .ics export generated');
        }
      }, 'Download atomic-reminders.ics')
    ),

  );

  const privacyCard = h('section', { class: 'card' },
    h('div', { class: 'pill' }, 'Privacy'),
    h('p', { class: 'sub' }, 'Everything stays on this device. Atomic has no server and no account.'),
    ...protectionSection(redraw).map((x, i) => (i === 0 ? h('strong', {}, 'Passphrase protection') : x))
  );

  const backupCard = h('section', { class: 'card' },
    h('div', { class: 'pill' }, 'Backups'),
    storageLine,
    h('span', { class: 'chip', style: 'align-self:flex-start' }, lastBackupStr),
    h('strong', {}, 'Backup file'),
    h('p', { class: 'sub' }, 'A copy of everything as a JSON file. Use it to move to another browser or device. Not encrypted.'),
    h('div', { class: 'acts' },
      h('button', {
        class: 'btn',
        type: 'button',
        onclick: () => { downloadBackup(); redraw(); }
      }, 'Download backup'),
      h('label', { class: 'btn', style: 'display:inline-flex;align-items:center;cursor:pointer' },
        'Restore from backup',
        h('input', {
          type: 'file',
          accept: 'application/json',
          class: 'sr',
          onchange: async e => {
            try {
              const text = await e.target.files[0].text();
              const j = JSON.parse(text);
              if (confirm(`Replace current data with ${j.habits?.length ?? 0} habits, ${j.events?.length ?? 0} check-ins, ${j.journal?.length ?? 0} entries?`)) {
                S.importJSON(text);
                await S.flush();
                location.reload();
              }
            } catch (err) { alert(err.message); }
          }
        })
      )
    ),

    h('strong', { style: 'margin-top:8px' }, 'Encrypted backup file'),
    h('p', { class: 'sub' }, 'A backup file protected by its own passphrase, safe to keep in cloud storage or email to yourself.'),
    h('div', { class: 'acts' },
      h('button', {
        class: 'btn',
        type: 'button',
        onclick: async () => {
          const pass = prompt('Choose a passphrase for this backup file:');
          if (!pass) return;
          try {
            const encrypted = await encryptState(st, pass);
            const blob = new Blob([encrypted], { type: 'text/plain' });
            const a = h('a', { href: URL.createObjectURL(blob), download: `atomic-backup-encrypted-${new Date().toLocaleDateString('en-CA')}.bin` });
            a.click();
            alert('Encrypted backup downloaded. Keep its passphrase safe: the file cannot be opened without it.');
          } catch (err) {
            alert('Encryption failed: ' + err.message);
          }
        }
      }, 'Export encrypted backup'),
      h('label', { class: 'btn', style: 'display:inline-flex;align-items:center;cursor:pointer' },
        'Restore encrypted backup',
        h('input', {
          type: 'file',
          class: 'sr',
          onchange: async e => {
            try {
              const file = e.target.files[0];
              if (!file) return;
              const text = await file.text();
              if (!isEncrypted(text)) {
                alert('This file is not an Atomic encrypted backup.');
                return;
              }
              const pass = prompt('Passphrase for this backup file:');
              if (!pass) return;
              const decryptedState = await decryptState(text, pass);
              S.importJSON(JSON.stringify(decryptedState));
              await S.flush();
              alert('Backup restored.');
              location.reload();
            } catch (err) {
              alert('Decryption failed: ' + err.message);
            }
          }
        })
      )
    ),

  );

  const deleteCard = h('section', { class: 'card' },
    h('div', { class: 'pill' }, 'Delete everything'),
    h('p', { class: 'sub' }, 'Erases all habits, check-ins, journal entries and settings on this device. This cannot be undone, so download a backup first if you might want it back.'),
    h('button', {
      class: 'btn',
      type: 'button',
      style: 'align-self:flex-start',
      onclick: () => {
        if (prompt('Type DELETE to erase all data on this device.') === 'DELETE') {
          S.wipe();
          location.reload();
        }
      }
    }, 'Delete all data')
  );

  const tabs = h('div', { class: 'switcher', role: 'tablist', 'aria-label': 'Me sections' },
    Object.entries(TABS).map(([k, label]) => h('button', {
      type: 'button', role: 'tab', 'aria-selected': String(tab === k),
      class: 'switcher-tab ' + (tab === k ? 'active' : 'inactive'),
      onclick: () => { tab = k; redraw(); }
    }, label)));

  const sections = {
    you: [portfolioSection, alterEgoCard, woopCard, simulatorCard],
    ai: [aiSettingsCard(st, redraw)],
    data: [settingsCard, privacyCard, backupCard, deleteCard]
  };

  el.replaceChildren(h('h1', { class: 'greet' }, 'Me'), tabs, ...sections[tab]);
}
