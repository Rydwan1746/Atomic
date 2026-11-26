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

Every functional requirement in the PRD (FR-1 to FR-26) is built. The notes below say where the build differs from or adds to the PRD text; the details are in the "As-Built Notes" of `addendum.md`.

- **Data layer (FR-1 to FR-4):** single storage gateway, check-in event log, misses computed on demand, migration from the v1 `atomicHabits` key with a raw backup.
- **Habits (FR-5 to FR-7):** create, edit (Today > More > Edit, or the habit's page), archive and restore (history is kept), delete. Identity, category, intention, two-minute version, temptation bundle, stacking with cascading "Log it" prompts; stacking loops are refused.
- **Daily check-in (FR-8, FR-9):** today only, undo, 1 to 5 mood and 1 to 5 energy, an optional note saved to the Journal.
- **Journal (FR-9b):** a ruled notebook page (17px text on a 28px grid) that grows line by line as you write, in both themes. Past entries use the same lines.
- **Never-miss-twice (FR-10):** nudge with the two-minute version and any linked WOOP plan after a missed day.
- **Metrics and grids (FR-11 to FR-13):** 30-day consistency, average recovery time, 14-day strip, 12-week grid, and "X votes this week for {identity}" leading the Today greeting.
- **Scorecard (FR-14).**
- **Patterns (FR-15):** weekday slips, time-of-day clusters, habits done together, what comes the day before a streak breaks (a low mood, low energy or a skipped habit), and mood on days with a habit versus without. Each shows its sample and dates; locked patterns show progress.
- **Recurring journal themes (FR-16).**
- **Weekly review (FR-17):** opens every Sunday at 18:00, needs 3 days of check-ins, four steps, saved to the Journal, once per week.
- **Alter Ego (FR-18), offline scenario simulator (FR-19), WOOP plans (FR-20).**
- **AI reflection (FR-21 to FR-23):** see [AI reflection](#ai-reflection).
- **Calendar export (FR-24):** one daily event per habit with an intention time, in your time zone, 10 minutes long, with an on-time alarm.
- **In-tab reminders (FR-25):** per habit, at the intention time, only while Atomic is open in a tab.
- **Passphrase protection (FR-26):** optional; encrypts everything stored on the device and asks for the passphrase when Atomic opens. There is no recovery if the passphrase is lost.
- **Backups:** JSON export and import, and a separate encrypted backup file.

### Known limits

- Data lives in one browser on one device. Clearing site data, or Safari removing it after a long period without visits, deletes it: export backups.
- In-tab reminders need the tab open. Use the calendar export for reminders when Atomic is closed.
- The calendar file names your time zone (for example `Europe/Paris`) without a `VTIMEZONE` block. Google, Apple and Outlook calendars accept this; a strict calendar app may not.
- With passphrase protection on, each save is written a few milliseconds later than without it. Closing the tab in that instant can lose the very last change.

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

### Tone, hand-offs and guardrails

Both modes talk conversationally: a short answer in their own voice, then one question back to you. Neither refuses a question outright. Each answers what it can from its own side, and when the other mode could help more, it says so in its own words and a **Continue with your Future Self →** or **Check with the Objective Mirror →** button appears under the reply. The button carries your question across.

Every message goes through `js/ai/index.js`, in this order:

1. **Distress check:** messages that suggest self-harm or acute distress get a fixed message pointing to real people and emergency services. Nothing is sent to any model. This is the only hard stop.
2. **Scope check** (`js/ai/guardrails.js`): a question that clearly belongs to the other mode (a streak question to the Future Self, a motivation question to the Mirror) always gets the switch button. With a model connected, the model still answers it in its own lane; offline, you get a short hand-off message.
3. **Firewall** (`js/ai/firewall.js`): each mode gets only its own context. The Mirror gets aggregated numbers and no Alter Ego. The Future Self gets the Alter Ego, identity statements, habit names and WOOP plans, and no numbers. Journal text is sent only if you tick "Include my recent journal text" for that one message (the box resets after sending). Entries marked "Never send to AI" are never sent.
4. **System prompt** (`js/ai/prompts.js`): describes the mode's voice and lane, a 120-word limit, at most one suggestion, a crisis rule, and how to hand off with a `[REDIRECT:mirror|future]` tag. The data is written as plain sentences rather than JSON, so small local models read the numbers correctly.
5. **Reply cleaning** (`js/ai/guardrails.js`): turns a hand-off tag into the switch button while keeping the rest of the answer, ignores a hand-off away from a question that is clearly in scope, removes the stock "That's a question for…" line small models tend to copy into every reply, strips markdown and "Observation:" labels, trims to 120 words, and removes any sentence with numbers from Future Self replies.

Small local models follow these instructions less reliably than large ones. `llama3.2` (3B) works; a 7B or 8B model such as `qwen2.5:7b` or `llama3.1:8b` gives noticeably more natural replies if your computer can run it.

The privacy chip above the chat shows exactly what the next message will send. **Me > AI reflection > What was sent** keeps a local log of the last 30 requests and their payloads.

## Project structure

    index.html            page shell
    style.css             design tokens (Paper and Night themes), layout, components
    js/main.js            bootstrap, hash router (#/today, #/journal, #/insights, #/chat, #/me)
    js/core/              storage.js (only file that touches localStorage), dates.js, ids.js, crypto.js
    js/domain/            pure logic: habits, streaks, missed days, journal, insights, weekly-review,
                          scorecard, alter-ego, woop, reminders
    js/ai/                index.js (pipeline), firewall.js (payloads), prompts.js, guardrails.js,
                          adapters.js (Ollama, Gemini, Anthropic, OpenAI transports)
    js/data/              prompts.js (journal prompt bank)
    js/ui/                one file per screen, plus components.js, theme.js, ai-settings.js and protection.js
    tests/                node:test suites for core, domain and ai

Rules: `core/`, `domain/` and `ai/` contain no DOM code. Only `storage.js` reads or writes `localStorage`. Only `js/ai/adapters.js` makes network requests.

## Your data

- Stored in this browser under the key `atomic.v2` (`schemaVersion: 2`). Old `atomicHabits` data is migrated on first load and a raw copy is kept under `atomicHabits_v1_backup`.
- Unencrypted by default. Turn on **Me > Passphrase protection** to encrypt it (AES-256-GCM, key derived with PBKDF2, 600,000 iterations). The key is kept only in memory and the passphrase cannot be recovered.
- Data belongs to the address Atomic is opened from: `localhost:8000` and a deployed copy have separate data. Move it with Export and Import JSON backup.
- Use Me > Export JSON backup regularly. Clearing browser data deletes your habits and journal.
- If stored data cannot be read (for example a newer schema version), saving is paused so nothing is overwritten.

## Deploying

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Themes

Paper (warm light) and Night (desaturated slate navy with warm off-white text and amber accents, designed to be calm and low-glare in the evening). Colors are CSS variables in `style.css`; change them there, never inline.

## Conventions

- Calendar dates are local `YYYY-MM-DD` strings, never derived from UTC.
- A miss is not stored; it is a day with no check-in, computed on demand.
- Copy tone: quiet, no exclamation marks, no red, no shame language.
