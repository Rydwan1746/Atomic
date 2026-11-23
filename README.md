# Atomic

An identity-based habit tracker. Its purpose is to bring the unconscious into consciousness: help you notice your own behavior, not just count it. Vanilla HTML, CSS, and JavaScript. No frameworks, no build step, no CDNs, no network requests.

Requirements and design decisions live in `atomic-requirements.md` (the source of truth for what gets built).

## Run it

ES modules do not load from `file://`, so serve the folder:

    cd atomic
    python3 -m http.server 8000

Open http://localhost:8000. If the page is blank, check the browser console and confirm you opened it through `http://localhost`, not by double-clicking `index.html`.

## What works now (Phase 1, partial)

- Habits: add (name, identity, category, optional stack-after), delete, newest first.
- Daily check-in for today only, with undo, current streak, consistency rate, and a last-14-days grid.
- Mood picker (1 to 5) after a check-in.
- Stacking dialog: after a check-in, one dialog offers every habit stacked after it.
- Journal: a regular journal with an optional starting question ("What made your day?"), optional mood, per-entry "Never send to AI" flag, delete.
- Habit notes: after a check-in, or after "Skip today", a dismissible popup asks one short question; the answer is saved to the Journal tagged with that habit.
- Me: theme (auto, paper, night), export and import a JSON backup, delete all data.
- Setup fields: intention (time, place), two-minute version, temptation bundle.
- Habit detail (tap a card's identity): 12-week grid, streak, longest streak, consistency, setup fields, recent notes.
- Never-miss-twice: after a missed day, a nudge offers the two-minute version (counts as a check-in).
- Forgotten-day popup: once per day, asks the reason for yesterday's missed habits.
- Insights and Chat are placeholders. `js/ai/` is a stub only.

## Not built yet

Pattern engine, themes, scorecard, weekly review, alter ego, WOOP, reminders (.ics), encryption, energy picker. AI is intentionally not built (see below).

## Tests

    node tests/run.js

## Project structure

    index.html            page shell
    style.css             design tokens (Paper and Night themes), layout, components
    js/main.js            bootstrap, hash router (#/today, #/journal, #/insights, #/chat, #/me)
    js/core/              storage.js (only file that touches localStorage), dates.js, ids.js
    js/domain/            habits.js (data operations), streaks.js (pure functions)
    js/data/              prompts.js (journal prompt bank)
    js/ui/                one file per screen, plus components.js and theme.js

Rules: `core/` and `domain/` contain no DOM code. Only `storage.js` reads or writes `localStorage`.

## Your data

- Stored in this browser under the key `atomic.state` (`schemaVersion: 1`). It never leaves the device.
- It is not encrypted yet, and anyone with access to the browser profile can read it.
- Use Me > Export backup regularly. Clearing browser data deletes your habits and journal.
- If stored data cannot be read (for example a newer schema version), saving is paused so nothing is overwritten, and Me shows the reason.

## AI

Not implemented on purpose. The state reserves `chatHistory`, `settings.ai`, and a `private` flag on journal entries. No provider code, API key handling, or network calls exist. The approach will be decided before it is built (see section 11 of the requirements).

## Themes

Paper (warm light) and Night (desaturated slate navy with warm off-white text and amber accents, designed to be calm and low-glare in the evening). Colors are CSS variables in `style.css`; change them there, never inline.

## Conventions

- Calendar dates are local `YYYY-MM-DD` strings, never derived from UTC.
- A miss is not stored; it is a day with no check-in, computed on demand.
- Copy tone: quiet, no exclamation marks, no red, no shame language.
