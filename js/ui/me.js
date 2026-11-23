import * as S from '../core/storage.js';
import { h, announce } from './components.js';
import { applyTheme } from './theme.js';
import * as AE from '../domain/alter-ego.js';
import * as WOOP from '../domain/woop.js';
import { generateIcs } from '../domain/reminders.js';
import { encryptState, decryptState, isEncrypted } from '../core/crypto.js';

let simulatorOutput = null;

export function render(el) {
  const st = S.load();
  const redraw = () => render(el);

  // --- ZONE 1: Identity Architecture & Portfolio ---
  const portfolio = AE.getIdentityPortfolio(st);
  const alterEgo = st.alterEgo || {};
  const woopList = st.woop || [];
  const habits = (st.habits || []).filter(habit => !habit.archivedAt);

  // 1. Identity Portfolio Section
  const portfolioSection = h('section', { class: 'card' },
    h('div', { class: 'pill' }, 'Zone 1 · Identity Portfolio'),
    h('h2', { class: 'voice', style: 'font-size:22px;margin:2px 0' }, 'Who You Are Becoming'),
    h('p', { class: 'sub' }, 'Every check-in is an empirical vote cast for an identity.'),
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
    ) : h('div', { class: 'empty' }, 'No active identities yet. Add your first habit on Today!')
  );

  // 2. Alter Ego Profile Authoring Card
  let aeName = alterEgo.name || '';
  let aeNarrative = alterEgo.narrative || '';
  let aeValues = (alterEgo.coreValues || []).join(', ');
  let aeObstacle = alterEgo.obstacleStrategy || '';
  let aeBehaviors = (alterEgo.behaviors || []).join('\n');

  const alterEgoCard = h('section', { class: 'card', style: 'border:1px solid var(--accent-future)' },
    h('div', { class: 'pill' }, 'Alter Ego Archetype Authoring'),
    h('h3', { class: 'voice' }, 'Define Your Future Self'),
    h('p', { class: 'sub' }, 'Unlocks Future-Self AI guidance and scenario simulation.'),
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
        h('button', { class: 'btn primary', type: 'submit' }, 'Save Alter Ego Profile')
      )
    )
  );

  // 3. WOOP Planner Card
  let wWish = '', wOutcome = '', wObstacle = '', wPlan = '', wHabitId = '';
  const woopCard = h('section', { class: 'card' },
    h('div', { class: 'pill' }, 'WOOP Obstacle Planner'),
    h('h3', { class: 'voice' }, 'Wish · Outcome · Obstacle · Plan'),
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
      h('label', {}, 'Wish (What do you want to achieve?)',
        h('input', { required: true, placeholder: 'e.g. Daily morning reading', oninput: e => { wWish = e.target.value; } })
      ),
      h('label', {}, 'Outcome (What is the best feeling or result?)',
        h('input', { placeholder: 'e.g. Expansive knowledge and calm morning', oninput: e => { wOutcome = e.target.value; } })
      ),
      h('label', {}, 'Obstacle (What internal friction arises?)',
        h('input', { placeholder: 'e.g. Scrolling social media on waking', oninput: e => { wObstacle = e.target.value; } })
      ),
      h('label', {}, 'Plan (Canonical: "If [obstacle], then I will [action]")',
        h('input', { required: true, placeholder: 'If I reach for phone, then I will open my book', oninput: e => { wPlan = e.target.value; } })
      ),
      h('label', {}, 'Link to Active Habit (optional hint trigger)',
        h('select', { onchange: e => { wHabitId = e.target.value; } },
          h('option', { value: '' }, '— No linked habit —'),
          habits.map(habit => h('option', { value: habit.id }, habit.name || habit.vote))
        )
      ),
      h('div', { class: 'acts', style: 'margin-top:10px' },
        h('button', { class: 'btn primary', type: 'submit' }, 'Create WOOP Plan')
      )
    ),
    woopList.length ? h('div', { style: 'display:flex;flex-direction:column;gap:8px;margin-top:14px' },
      h('strong', {}, 'Active WOOP Plans:'),
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
    h('div', { class: 'pill' }, 'Offline Scenario Simulator'),
    h('h3', { class: 'voice' }, 'Simulate a Tough Moment'),
    h('p', { class: 'sub' }, 'Deterministic reflection grounded in your Alter Ego values without cloud dependencies.'),
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
      }, 'Simulate Response')
    ),
    simulatorOutput ? h('div', {
      style: 'background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px;margin-top:10px;white-space:pre-wrap;font-family:var(--font-voice);line-height:1.6'
    },
      simulatorOutput,
      h('div', { class: 'acts', style: 'margin-top:10px' },
        h('a', { class: 'btn primary', href: '#/journal', style: 'text-decoration:none' }, 'Take into Journal →')
      )
    ) : null
  );

  // --- ZONE 2: Sovereignty, Data & Privacy ---
  const lastBackupStr = st.settings.lastBackupAt
    ? `Last backup: ${Math.max(0, Math.round((Date.now() - new Date(st.settings.lastBackupAt).getTime()) / (1000 * 60 * 60 * 24)))} days ago`
    : 'No backup downloaded yet';

  const sovereigntySection = h('section', { class: 'card' },
    h('div', { class: 'pill' }, 'Zone 2 · Data Sovereignty & Vault'),
    h('h2', { class: 'voice', style: 'font-size:22px;margin:2px 0' }, 'Client-Side Sovereignty'),
    h('p', { class: 'sub' }, '100% stored on this device. Zero developer-operated backend.'),

    // Appearance
    h('strong', { style: 'margin-top:8px' }, 'Appearance'),
    h('label', {}, 'Theme',
      h('select', { onchange: e => { st.settings.theme = e.target.value; S.save(st); applyTheme(); } },
        ['auto', 'paper', 'night'].map(v => h('option', { value: v, selected: st.settings.theme === v }, v))
      )
    ),

    // Calendar Export
    h('strong', { style: 'margin-top:8px' }, 'Calendar Reminders (RFC 5545)'),
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

    // Zero-Knowledge Passphrase Vault
    h('strong', { style: 'margin-top:8px' }, 'Zero-Knowledge Passphrase Vault (PBKDF2 / AES-256-GCM)'),
    h('p', { class: 'sub' }, 'Encrypts the full state using 600,000 iterations of PBKDF2. Keys strictly ephemeral.'),
    h('div', { class: 'acts' },
      h('button', {
        class: 'btn',
        type: 'button',
        onclick: async () => {
          const pass = prompt('Enter a secure passphrase to encrypt your state:');
          if (!pass) return;
          try {
            const encrypted = await encryptState(st, pass);
            const blob = new Blob([encrypted], { type: 'text/plain' });
            const a = h('a', { href: URL.createObjectURL(blob), download: `atomic-vault-encrypted-${new Date().toISOString().slice(0, 10)}.bin` });
            a.click();
            alert('Encrypted vault exported successfully! Keep your passphrase safe; no recovery is possible without it.');
          } catch (err) {
            alert('Encryption failed: ' + err.message);
          }
        }
      }, 'Export Encrypted Vault Backup'),
      h('label', { class: 'btn', style: 'display:inline-flex;align-items:center;cursor:pointer' },
        'Restore Encrypted Vault',
        h('input', {
          type: 'file',
          class: 'sr',
          onchange: async e => {
            try {
              const file = e.target.files[0];
              if (!file) return;
              const text = await file.text();
              if (!isEncrypted(text)) {
                alert('File is not an atomic:vault:v1 encrypted container.');
                return;
              }
              const pass = prompt('Enter the passphrase for this vault:');
              if (!pass) return;
              const decryptedState = await decryptState(text, pass);
              S.save(decryptedState);
              alert('Vault restored successfully!');
              location.reload();
            } catch (err) {
              alert('Decryption failed: ' + err.message);
            }
          }
        })
      )
    ),

    // Standard Backup & Restore
    h('strong', { style: 'margin-top:8px' }, 'JSON Backup & Restore'),
    h('span', { class: 'chip' }, lastBackupStr),
    h('div', { class: 'acts' },
      h('button', {
        class: 'btn',
        type: 'button',
        onclick: () => {
          const a = h('a', {
            href: URL.createObjectURL(new Blob([S.exportJSON()], { type: 'application/json' })),
            download: `atomic-backup-${new Date().toISOString().slice(0, 10)}.json`
          });
          a.click();
          st.settings.lastBackupAt = new Date().toISOString();
          S.save(st);
          announce('Backup downloaded');
          redraw();
        }
      }, 'Export JSON backup'),
      h('label', { class: 'btn', style: 'display:inline-flex;align-items:center;cursor:pointer' },
        'Import JSON backup',
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
                location.reload();
              }
            } catch (err) { alert(err.message); }
          }
        })
      )
    ),

    // Deliberate Two-Stage Deletion
    h('strong', { style: 'margin-top:8px;color:#B04A56' }, 'Danger Zone'),
    h('button', {
      class: 'btn',
      type: 'button',
      style: 'align-self:flex-start;color:#B04A56;border-color:#B04A56',
      onclick: () => {
        if (prompt('Type DELETE to erase all data on this device.') === 'DELETE') {
          S.wipe();
          location.reload();
        }
      }
    }, 'Delete all data (Type DELETE)')
  );

  el.replaceChildren(...[
    h('h1', { class: 'greet' }, 'Me: Identity & Sovereignty'),
    portfolioSection,
    alterEgoCard,
    woopCard,
    simulatorCard,
    sovereigntySection
  ]);
}
