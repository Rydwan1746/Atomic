# Atomic

An identity-based habit tracker. Its purpose is to bring the unconscious into consciousness: help you notice your own behavior, not just count it. Vanilla HTML, CSS, and JavaScript. No frameworks, no build step, no CDNs. The only network requests are the optional AI chat calls you turn on yourself.

What gets built is defined by the PRD in `_bmad-output/planning-artifacts/prds/prd-atomic_v2-2026-11-01/` (`prd.md` plus `addendum.md`), with the architecture decisions in `_bmad-output/planning-artifacts/architecture/` and the build guidelines in `docs/`.

## Run it

ES modules do not load from `file://`, so serve the folder:

    cd atomic
    python3 -m http.server 8000

Open http://localhost:8000. If the page is blank, check the browser console and confirm you opened it through `http://localhost`, not by double-clicking `index.html`.

## Tests

    node tests/run.js

Requires Node 20 or newer. No packages to install.

## Status

Tracked against the PRD's functional requirements (FR). "Partial" lists what is missing.

### Done

- **Data layer (FR-1 to FR-4):** single storage gateway, check-in event log, misses computed on demand, migration from the v1 `atomicHabits` key with a raw backup.
- **Habit setup (FR-6, FR-7):** identity, category, implementation intention, two-minute version, temptation bundle, stacking with cascading "Log it" prompts.
- **Daily check-in (FR-8, FR-9):** today only, undo, 1 to 5 mood, after-check-in note saved to the Journal.
- **Never-miss-twice (FR-10):** nudge with the two-minute version after a missed day.
- **Metrics and grids (FR-11, FR-13):** 30-day consistency, average recovery time, 14-day strip, 12-week grid.
- **Scorecard (FR-14), recurring journal themes (FR-16).**
- **Alter Ego profile (FR-18), offline scenario simulator (FR-19), WOOP plans with habit-card hints (FR-20).**
- **AI reflection (FR-21 to FR-23):** see [AI reflection](#ai-reflection) below.
- **Calendar export (FR-24):** `atomic-reminders.ics` with daily repeating events.
- **Backups:** JSON export and import, and an encrypted (PBKDF2 + AES-256-GCM) backup file.

### Partial

- **Habits (FR-5):** add and delete only. Editing and archiving are missing.
- **Weekly identity votes (FR-12):** counted, but the Today greeting does not show "X votes this week for {identity}".
- **Pattern engine (FR-15):** weekday slips, time-of-day clusters and co-occurring habits work. Streak-break precursors, mood correlates and progress toward locked patterns are missing.
- **Weekly review (FR-17):** always available. The PRD limits it to Sunday 18:00 onward and to users with 3 or more days of activity.
- **In-tab notifications (FR-25):** permission and notification code exists in `js/domain/reminders.js`, but nothing in the interface turns it on.
- **Encryption (FR-26):** only the backup file can be encrypted. Saved data in the browser is not encrypted, and there is no passphrase prompt at startup.

### Not started

- **Lined notebook journal (FR-9b):** ruled lines, taller page, auto-growing writing area on a 28px grid.
- **Energy picker:** events have an `energy` field that is always empty.

### Known issues

- Journal entry dates are taken from UTC (`toISOString()`), so an entry written late in the evening can land on the next day. The architecture requires local dates.

## AI reflection

Chat has two modes with separate jobs:

- **The Objective Mirror** reports what your data shows: consistency, streaks, recovery time, weekly votes, detected patterns. It does not coach, reassure or talk about identity.
- **Dialogue with Future Self** speaks as your Alter Ego, from its description, values, obstacle philosophy, behaviors and your WOOP plans. It does not quote numbers. It unlocks once the Alter Ego has a description and 3 behaviors.

### Providers

Pick one in **Me > AI reflection**. The default is **Off**.

| Provider | Where requests go | Key |
|---|---|---|
| Off | Nowhere. Chat gives offline reflections built from your own data. | None |
| Local Ollama | `http://localhost:11434` on your computer. Nothing leaves the device. | None |
| Google Gemini | `generativelanguage.googleapis.com`, straight from the browser | Yours |
| Anthropic Claude | `api.anthropic.com`, straight from the browser | Yours |
| OpenAI | `api.openai.com`, straight from the browser | Yours |

API keys are kept in memory for the open tab unless you tick "Remember keys on this device". If any provider fails (Ollama not running, bad key, timeout), Chat shows a short notice and answers with an offline reflection instead. Nothing breaks and your message is kept.

### Setting up Ollama

1. Install Ollama from https://ollama.com and start it (the desktop app starts it automatically, or run `ollama serve`).
2. Download a model: `ollama pull llama3.2`. Any chat model works; type its name in the Model field.
3. In Atomic, open **Me > AI reflection**, choose **Local Ollama**, and press **Test connection**. It lists the installed models.
4. If Atomic is opened from anything other than `localhost` or `127.0.0.1` (for example a hosted copy), Ollama blocks the browser request. Start Ollama with that address allowed, for example `OLLAMA_ORIGINS="https://your-host.example" ollama serve`.

### Privacy and guardrails

Every message goes through `js/ai/index.js`, in this order:

1. **Distress check:** messages that suggest self-harm or acute distress get a fixed message pointing to real people and emergency services. Nothing is sent to any model.
2. **Scope check:** clear-cut questions for the other mode (a metrics question to the Future Self, a motivation question to the Mirror) are redirected with a **Switch to …** button that carries your question across. Nothing is sent.
3. **Firewall** (`js/ai/firewall.js`): each mode gets only its own context. The Mirror gets aggregated numbers and no Alter Ego. The Future Self gets the Alter Ego, identity statements, habit names and WOOP plans, and no numbers. Journal text is sent only if you tick "Include my recent journal text" for that one message (the box resets after sending). Entries marked "Never send to AI" are never sent.
4. **System prompt** (`js/ai/prompts.js`): states the mode's role and boundaries, a 120-word limit, one suggestion at most, a crisis rule, and a `[REDIRECT:mirror|future]` token for out-of-scope questions.
5. **Reply cleaning** (`js/ai/guardrails.js`): turns redirect tokens into the switch button, strips markdown, trims to 120 words, and removes any sentence with numbers from Future Self replies.

The privacy chip above the chat shows exactly what the next message will send. **Me > AI reflection > What was sent** keeps a local log of the last 30 requests and their payloads.

## Project structure

    index.html            page shell
    style.css             design tokens (Paper and Night themes), layout, components
    js/main.js            bootstrap, hash router (#/today, #/journal, #/insights, #/chat, #/me)
    js/core/              storage.js (only file that touches localStorage), dates.js, ids.js, crypto.js
    js/domain/            pure logic: habits, streaks, missed days, journal, insights, scorecard,
                          alter-ego, woop, reminders
    js/ai/                index.js (pipeline), firewall.js (payloads), prompts.js, guardrails.js,
                          adapters.js (Ollama, Gemini, Anthropic, OpenAI transports)
    js/data/              prompts.js (journal prompt bank)
    js/ui/                one file per screen, plus components.js, theme.js and ai-settings.js
    tests/                node:test suites for core, domain and ai

Rules: `core/`, `domain/` and `ai/` contain no DOM code. Only `storage.js` reads or writes `localStorage`. Only `js/ai/adapters.js` makes network requests.

## Your data

- Stored in this browser under the key `atomic.v2` (`schemaVersion: 2`). Old `atomicHabits` data is migrated on first load and a raw copy is kept under `atomicHabits_v1_backup`.
- It is not encrypted in the browser yet. Anyone with access to the browser profile can read it.
- Use Me > Export JSON backup regularly. Clearing browser data deletes your habits and journal.
- If stored data cannot be read (for example a newer schema version), saving is paused so nothing is overwritten.

## Themes

Paper (warm light) and Night (desaturated slate navy with warm off-white text and amber accents, designed to be calm and low-glare in the evening). Colors are CSS variables in `style.css`; change them there, never inline.

## Conventions

- Calendar dates are local `YYYY-MM-DD` strings, never derived from UTC.
- A miss is not stored; it is a day with no check-in, computed on demand.
- Copy tone: quiet, no exclamation marks, no red, no shame language.
