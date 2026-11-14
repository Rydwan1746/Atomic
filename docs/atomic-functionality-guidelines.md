# Atomic: Functionality Guidelines

Build instructions for Atomic's behavior and data. Follow this file literally. Visual rules are in `atomic-ui-guidelines.md`.

**Status labels**
- **DECIDED:** chosen by the project owner.
- **DEFAULT:** recommendation, used unless the owner changes it.
- **OPEN:** needs an owner decision before building that part.

---

## 1. Purpose and scope

- **Purpose (DECIDED):** bring the unconscious into consciousness. Every feature must help the user notice something about their own behavior. Features that only add tracking volume are out of scope.
- **Scope (DECIDED):** personal project now. Accounts and other users may come later if the app becomes interesting to others.
- **Consequence (DEFAULT):** local-first, with all storage behind one module so a server can replace `localStorage` later without touching feature code.
- **Tech constraints (carried over):** vanilla HTML/CSS/JS, no frameworks, no CDNs, no build step.

## 2. Existing behavior to preserve

These work today and must keep working (see `spec-compliance.md` and `habit-tracker-spec.md`):
- Add habit via collapsible form, native `required` validation (do not hand-roll empty-field checks).
- Five fixed categories in the existing dropdown order: Health, Learning, Creativity, Mindfulness, Connection.
- Daily check-in for **today only**, toggle to undo.
- Delete with `confirm()`.
- Cards newest first.
- Current streak (today or yesterday still counts) and longest streak.
- 12-week contribution grid, Sunday to Saturday rows, oldest week on the left, native `title` tooltips.
- Summary bar: total habits, longest active streak with the habit name.
- Stacking: label on cards, one native `<dialog>` listing all habits stacked after the one just completed, one **Log it** per row, one **Not now**. Logging a row removes it and keeps the dialog open until none remain. **Log it** uses the same code path as the card check-in (`toggleCheckinAndPrompt()`), so chains (A, then B, then C) keep prompting. Nested prompts queue while a dialog is open.

## 3. File and module structure (DEFAULT)

```
index.html
style.css                 tokens and base styles (see UI file)
js/
  main.js                 bootstrap, hash router, theme
  storage.js              ONLY file that touches localStorage
  crypto.js               passphrase encryption (Web Crypto)
  habits.js               habit CRUD, streaks, consistency, stacking
  events.js               check-in events
  journal.js              prompts and entries
  insights.js             pattern engine (pure functions)
  scorecard.js
  alterego.js             profile, WOOP
  chat.js                 providers, prompt building, consent
  reminders.js            .ics export, later notifications
  ui/                     one file per screen (today, journal, insights, chat, me)
```
- Use ES modules (`<script type="module" src="js/main.js">`). Modules do not load from `file://` in most browsers, so serve locally:
  ```
  python3 -m http.server 8000
  ```
  then open `http://localhost:8000`.
- `insights.js` contains pure functions (data in, results out) so it can be tested without the DOM.
- No feature module reads or writes `localStorage` directly. Everything goes through `storage.js`.

---

## 4. Data layer (build first)

### 4.1 Why
Today the app stores only ISO date strings of completions. Pattern detection, journaling, and the alter ego need timestamps, mood, context, and reasons. Move to an **event log**.

### 4.2 Storage module API (DEFAULT)
```js
storage.load()              // returns the whole state object
storage.save(state)         // persists it
storage.exportJSON()        // string
storage.importJSON(string)  // validates schemaVersion, replaces state
storage.wipe()              // deletes everything (after typed confirmation in UI)
```
Keep the API this small. A future server backend implements the same functions.

### 4.3 State schema, `schemaVersion: 2`
Key: `atomic.v2` in localStorage (when encryption is on, the value is the encrypted blob; see section 8).

```json
{
  "schemaVersion": 2,
  "habits": [{
    "id": "h_xxx",
    "name": "Read 10 pages",
    "identity": "A reader",
    "category": "Learning",
    "stackedAfter": "h_yyy | null",
    "intention": { "time": "21:00", "place": "sofa" },
    "twoMinuteVersion": "Read one page",
    "temptationBundle": "Tea while reading",
    "createdAt": "2026-10-01T08:00:00.000Z",
    "archivedAt": null
  }],
  "events": [{
    "id": "e_xxx",
    "habitId": "h_xxx",
    "type": "checkin",
    "date": "2026-10-16",
    "at": "2026-10-16T20:41:00.000Z",
    "atApproximate": false,
    "version": "full",
    "mood": 4,
    "energy": null
  }],
  "journal": [{
    "id": "j_xxx",
    "at": "2026-10-16T21:05:00.000Z",
    "date": "2026-10-16",
    "kind": "miss_reason | completion_note | free",
    "habitId": "h_xxx | null",
    "prompt": "What got in the way?",
    "text": "...",
    "mood": 3,
    "energy": 2
  }],
  "scorecard": [{ "id": "s_xxx", "behavior": "Scroll phone in bed", "rating": "-", "at": "..." }],
  "alterEgo": null,
  "woop": [],
  "settings": {}
}
```
Rules:
- `date` is the **local** calendar date (`YYYY-MM-DD`), never derived from UTC. Compute it with local-time getters.
- `mood` and `energy` are integers 1 to 5 or `null`.
- `version` is `"full"` or `"minimal"` (two-minute version). Both count as a check-in.
- **A miss is not stored.** A miss is a day, on or after the habit's `createdAt`, before today, with no check-in event for that habit. Compute it. The *reason* for a miss is stored as a journal entry with `kind: "miss_reason"`.
- Undo deletes today's check-in event for that habit.
- At most one check-in event per habit per `date`.
- IDs: `crypto.randomUUID()` with a short prefix.

### 4.4 Migration from `atomicHabits` (v1)
Inspect the real v1 shape in `app.js` before writing this. Known: habit objects match the spec; completions are ISO date strings.
1. On load, if `atomic.v2` is missing and `atomicHabits` exists, migrate.
2. Copy the old value to `atomicHabits_v1_backup` **before** changing anything.
3. For each habit, map its fields to the v2 habit (new fields get `null`). For each completion date string, create a `checkin` event with `date` = that string, `at` = that date at 12:00 local, `atApproximate: true`, `version: "full"`, `mood: null`, `energy: null`.
4. Write `atomic.v2`. Do **not** delete the v1 key or its backup automatically.
5. Migration must be idempotent and must never run if `atomic.v2` exists.
6. Pattern features ignore time-of-day for events with `atApproximate: true`.

### 4.5 Export and import
- **Export:** button in Me > Privacy and data. Downloads `atomic-backup-YYYY-MM-DD.json`. If encryption is on, export the encrypted blob.
- **Import:** file picker, validates `schemaVersion`, shows counts (habits, events, entries), requires confirmation before replacing data.
- Show a gentle prompt to export every 30 days. Dismissible.

---

## 5. Sections to build

Numbering is stable. Reference these numbers in commits and tasks.

### Foundation

**S1. Data layer.** Event log, storage module, migration. See section 4. Done when: v1 data migrates with no loss, the app works as before, and `storage.js` is the only file calling `localStorage`.

**S2. Backup and security.** Export/import JSON. Optional passphrase encryption (section 8).

**S3. Habit setup.** Extend the add-habit form with optional fields:
- Implementation intention: time (`<input type="time">`) and place (text). Sentence shown on card: "I will {name} at {time} in {place}."
- Two-minute version (text): a tiny fallback, e.g. "Read one page".
- Temptation bundle (text): "I only {want} while I {habit}."
- Existing required fields stay `required`. New fields are optional.

### Daily use

**S4. Check-in with mood and miss reasons.**
- Check-in toggles as today, creating or deleting the event.
- After a new check-in, show the mood picker on that card (skippable). Selecting stores `mood` on the event. Optional energy picker behind a "More" toggle.
- Miss reason: the first time the user opens the app on a day after a missed day, the Today screen offers one soft question per missed habit: "What got in the way yesterday?" with chips (Tired, Busy, Forgot, Not in the mood, Something unexpected, Other). Choosing a chip creates a `miss_reason` journal entry with `text` set to the chip and optional free text. Skippable. Ask at most once per missed day per habit. Only ask about the most recent missed day, never a backlog.

**S5. Journal.**
- Prompt triggers: on a miss reason (see S4), after a completion ("How did that feel?" shown with the mood picker), and a daily rotating reflection prompt on Today.
- Prompt bank: at least 20 prompts stored in a constant array. Examples: "What made it easy on the days you did it?", "Who were you being when you skipped it?", "What did you tell yourself just before you stopped?"
- Rotation rule: choose by day-of-year, skipping prompts used in the last 14 days.
- Free write is always available from the Journal tab.
- Entries are editable and deletable. Entry framing in the UI: "a vote for {identity}".
- Entries store `kind`, `habitId`, `prompt`, `text`, `mood`, `energy`.

**S6. Never-miss-twice.**
- Condition per habit: no check-in yesterday, no check-in today, and the habit existed yesterday.
- Show the nudge (UI file 6.3) on that card. Checking in via the two-minute version creates a `version: "minimal"` event, counted as a full check-in for streaks.
- If the habit has no two-minute version, the nudge text omits it and offers a normal check-in.
- "Not today" hides the nudge until the next day (store `nudgeDismissedDate` in settings per habit).

**S7. Consistency view.**
- **Consistency rate** = days with a check-in ÷ days in the window. Window = the last 30 days, or since `createdAt` if the habit is younger. Show as a whole percent.
- Also compute **recovery time** = average number of days from a missed day to the next check-in (only with at least 3 misses; otherwise hide).
- Show consistency next to the streak on every card.
- **Identity votes** = number of check-in events in the last 7 days (rolling) across habits sharing the same identity (compare trimmed, lowercased). The Today headline shows the identity with the most votes.

### Awareness

**S8. Habit scorecard.**
- User lists daily behaviors (text) and rates each `+`, `-`, or `=` (effect on who they want to become).
- Order behaviors in the sequence of the day (drag handles are optional; up/down buttons are acceptable).
- Summary line: "{n} positive, {n} negative, {n} neutral."
- Rating history is kept, so re-rating creates a new record. Show the latest per behavior.

**S9. Pattern engine (no LLM).** Pure functions in `insights.js`. All findings are hypotheses with sample size.

| Insight | Rule | Unlock threshold |
|---|---|---|
| Weekday pattern | Completion rate per weekday for a habit. Report a weekday only if its rate differs from the habit's overall rate by at least 25 percentage points. | 21 logged days for the habit and at least 3 occurrences of that weekday |
| Time-of-day pattern | Group check-in `at` hours into morning (05-11), afternoon (12-17), evening (18-23), night (00-04). Report the dominant bucket if it holds at least 60% of check-ins. Skip events with `atApproximate: true`. | 15 events with real timestamps |
| Streak-break precursor | For each streak break, record the weekday and the previous day's mood (if any). Report a weekday that accounts for at least 50% of breaks. | at least 4 breaks |
| Recovery time | See S7. | at least 3 misses |
| Co-occurrence | For habits A and B: compare B's completion rate on days A was done vs not done. Report if the gap is at least 25 points. | at least 10 days in each group |
| Mood vs completion | Compare average mood on days a habit was done vs the habit's miss-day journal moods. | at least 10 mood values in each group |

- Wording template: "{Habit} seems to slip on {weekday}s: missed {k} of {n}." Always include `k of n`.
- Locked insights display their unlock progress ("12 of 21 days logged").
- Never present correlation as cause. Add the "Why am I seeing this?" expander that shows the rule and the numbers used.
- Recompute on screen open, not on every write.

**S10. Recurring-theme detector (local).**
- Source text: journal entries and miss-reason texts.
- Lowercase, split on non-letters, drop words under 4 letters, drop a stopword list (at least 100 common English words, stored in a constant).
- Show a word only if it appears in at least 3 different entries. Show the top 10 with counts and a link to the entries that contain it.
- Unlock at 8 entries.
- Wording: "Words that keep showing up: tired (6 entries), busy (5 entries)." No interpretation.

**S11. Weekly review.**
- Available from Sunday 18:00 local until the next Sunday 18:00, if the user has at least 3 days of data in the past 7.
- Card sequence: (1) votes and consistency this week, (2) the strongest unlocked insight (or the most frequent miss reason), (3) one reflection question chosen from journal themes, (4) "Choose one intention for next week" (free text, saved as a journal entry `kind: "free"` with `prompt: "Weekly intention"`).
- Completed reviews are saved and listed under Insights > Weekly review.

### Identity and reflection

**S12. Alter ego profile.** Stored in `state.alterEgo`:
```json
{ "name": "optional", "description": "...", "values": ["", "", ""],
  "obstacleStyle": "How they handle setbacks", "behaviors": ["", "", ""], "updatedAt": "..." }
```
- All fields editable. Require at least the description and 3 behaviors to enable Future-self chat.
- Prompt the user with examples next to each field. Do not generate it with an LLM.

**S13. Scenario simulator.**
- User writes a situation. Output is a Future-self response.
- **Before the LLM exists (DEFAULT):** templated reflection questions built from the profile, e.g. "Your future self handles obstacles by {obstacleStyle}. Which of your three behaviors ({behaviors}) fits this situation? What is the smallest version of it you could do now?" Never invent actions the user did not define.
- **With the LLM (S15):** the scenario goes to Future-self mode.

**S14. WOOP planner.**
- Four text fields: **Wish**, **Outcome**, **Obstacle**, **Plan** ("If {obstacle}, then I will {action}"). Optional link to a habit.
- The saved Plan appears as a hint on the linked habit card and in the nudge for that habit.

### AI layer

**S15. Chat (two modes).**
- **Mirror:** reflects patterns from the user's data. Uses aggregated stats by default.
- **Future self:** answers as the alter ego, based on `state.alterEgo` plus identity statements.
- Behavior rules for both modes (put these in the system prompt):
  - Ask questions and reflect more than prescribe. Maximum one suggestion per reply.
  - Never claim to know what the user did unless it is in the data provided. Say "I don't see that in your data" otherwise.
  - Never invent behaviors for the future self beyond the profile; stay within the user's own stated values and behaviors.
  - Not a therapist. If the user's message suggests self-harm or acute distress, stop the persona, respond with brief supportive language, and encourage contacting a trusted person or a local professional or emergency service.
  - Plain, short replies (under 120 words by default).
- Chat history is stored locally (encrypted if encryption is on) and can be cleared per conversation and all at once.

**S16. Provider settings (OPEN: owner picks the default).** Supported options in order of privacy:
1. **None** (default until configured): the chat tab shows templated reflection only.
2. **Local Ollama:** requests go to `http://localhost:11434`. Desktop only. Private.
3. **Bring-your-own API key:** requests go straight from the browser to the provider. The developer never receives data. Do not ship any key in the code. For Anthropic's API from a browser, the request needs the header `anthropic-dangerous-direct-browser-access: true` (verify in the current API docs before building).
4. **In-browser model (WebLLM or transformers.js):** later, optional. Needs WebGPU and a large download.
- **Avoid** a developer-run backend proxy while the app is personal, because it would put sensitive journal data on a server.
- The API key is stored in the settings object and is encrypted with everything else when encryption is on. Show a warning that anything in the browser can be read by scripts running on the page.

**S17. Privacy controls.**
- **Default payload:** aggregated stats only (consistency rates, insight findings, habit names, identity statements, alter ego profile). No journal text.
- **Raw journal text** is sent only if the user ticks "Include journal text" for **that message**. The tick resets after sending.
- **Preview:** the privacy chip opens a panel showing the exact payload that will be sent, before sending.
- **Per-entry exclusion:** each journal entry has "Never send to AI" (stored as `private: true`); such entries are excluded even when "Include journal text" is on.
- Log (locally) what was sent and when, viewable in Me > Privacy and data.
- Delete-all-data button: requires typing `DELETE`.

### Reminders

**S18. Reminder scheduling.**
- Each habit with an `intention.time` can have reminders on or off.
- Reminder text uses the intention: "Reading at 21:00 on the sofa?" If none, "{name} today?". No generic "Don't forget" copy.

**S19. Delivery (build in this order).**
1. **.ics export (DEFAULT, build first):** one file with one `VEVENT` per reminder-enabled habit. Each has a daily `RRULE:FREQ=DAILY`, `DTSTART` at the intention time in the user's timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`, written as `TZID`), a 10-minute duration, `SUMMARY` set to the reminder text, and a `VALARM` with `TRIGGER:PT0M` and `ACTION:DISPLAY`. Escape commas, semicolons, and newlines per RFC 5545. Download as `atomic-reminders.ics`. Re-exporting after changes needs the user to re-import; tell them.
2. **In-tab reminders:** `Notification` API plus a timer while the tab is open. Ask for permission only after the user turns on a reminder. Label this as "works only while Atomic is open".
3. **PWA with service worker:** manifest, offline cache, installable. Background push needs a push service and a server, so it is deferred to S20.
4. **Personal push (OPEN):** a Telegram bot or ntfy topic for the owner's own phone. Acceptable because the app is personal; revisit before multi-user.

### Later (only if the app grows)

**S20. Accounts and sync.** Server, auth, per-user storage, implementing the `storage.js` API remotely. Background push notifications live here.

**S21. Multi-user encryption model.** End-to-end encryption of journal, alter ego, and chat so the server stores only ciphertext. Key derived from the user's passphrase.

**S22. Onboarding and settings.** First-run flow (create first habit, write identity statement, choose theme, set reminder), preferences, data deletion.

---

## 6. Build order and definition of done

| Phase | Sections | Done when |
|---|---|---|
| 1. Foundation | S1, S2, S3, S4, S5 | v1 data migrated, export/import works, journal entries save, mood captured |
| 2. Awareness | S6, S7, S8, S9, S10, S11 | never-miss-twice shows, consistency displays, insights unlock with correct thresholds, weekly review works |
| 3. Reminders | S18, S19 (steps 1 and 2) | `.ics` imports into Google or Apple Calendar and fires daily |
| 4. Identity | S12, S13, S14 | alter ego profile saved, templated scenario simulator works |
| 5. AI | S15, S16, S17 | chat works with one provider, preview matches what is actually sent, journal text never sent without consent |
| 6. Growth | S19 (steps 3 and 4), S20, S21, S22 | only if the app is opened to others |

Build the UI per `atomic-ui-guidelines.md` in each phase. Do not start a phase until the previous one is done.

---

## 7. Cross-cutting rules

### 7.1 Streak and date logic (carried over)
- Use local-date strings and date objects. Compute day differences using milliseconds divided by 86,400,000 after normalizing both dates to local midnight.
- Current streak: consecutive days with a check-in ending today, or ending yesterday if today has none yet.
- Longest streak: longest run of consecutive days over all history.
- Time zone changes and DST can shift local midnight; normalize with `new Date(y, m, d)` rather than adding milliseconds to a timestamp.

### 7.2 Testing
Write plain test scripts (no framework) for the pure functions:
- Streaks: gaps, today-not-yet-logged, DST boundary dates.
- Consistency window for a habit younger than 30 days.
- Every threshold in S9 (below, at, and above the limit).
- Migration: v1 sample in, v2 state out, idempotent on a second run.
- Run with `node tests/run.js`.

### 7.3 Error handling
- Wrap every storage read and write in `try/catch`. On failure, keep the app usable in memory and show a message: "Couldn't save. Export a backup now."
- If `localStorage` is unavailable (private mode), run in memory and warn once.
- Never silently drop data on schema mismatch: refuse to load, show the schema version, and offer export of the raw value.

### 7.4 Privacy defaults
- No analytics, no third-party requests, no external fonts or CDNs.
- No network request is ever made unless the user triggers a chat message with a configured provider.
- Journal and chat content are never logged to the console.

---

## 8. Encryption (S2, DEFAULT)

- Off by default. Turned on in Me > Privacy and data with a passphrase.
- Key derivation: PBKDF2 with SHA-256, at least 600,000 iterations, random 16-byte salt stored beside the data.
- Cipher: AES-GCM 256-bit, random 12-byte IV generated fresh for **every** encryption.
- Encrypt the whole state blob (habits, events, journal, scorecard, alter ego, WOOP, settings including the API key) and chat history.
- The derived key is held in memory only. The app asks for the passphrase on each launch, with a "Lock" button in Me.
- State clearly in the UI: **a forgotten passphrase cannot be recovered**. Prompt the user to export a backup when they enable encryption.
- A wrong passphrase shows "That passphrase didn't work" and never reveals whether data exists.

---

## 9. Open decisions (answer before building the related section)

1. **Default AI provider** (S16): Ollama, bring-your-own key, or none until later.
2. **Personal push** (S19 step 4): Telegram, ntfy, or skip.
3. **Week start:** Sunday (matches the existing grid) or Monday. Default is Sunday.
4. **Encryption default:** optional (default) or required for journal data.
5. **Habit category list:** keep the five fixed categories, or allow custom categories later.
