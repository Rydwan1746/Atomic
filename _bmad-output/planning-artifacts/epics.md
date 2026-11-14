---
status: final
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-atomic_v2-2026-11-01/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-atomic_v2-2026-11-08/architecture-atomic_v2-2026-11-08.md
  - _bmad-output/planning-artifacts/ux-designs/ux-atomic_v2-2026-11-03/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-atomic_v2-2026-11-03/EXPERIENCE.md
---

# atomic_v2 - Epic Breakdown

## Overview

This document provides the complete, authoritative epic and story breakdown for **Atomic v2**, decomposing requirements from the PRD, Architecture Spine (`architecture-atomic_v2-2026-11-08.md`), and UX Design Specification (`DESIGN.md` & `EXPERIENCE.md`) into implementable, verified sprint stories for development.

---

## Requirements Inventory

### Functional Requirements

FR1: Single Storage Gateway — The system MUST funnel all persistent read and write operations exclusively through a unified storage module (`storage.js`).
FR2: Event-Driven Check-in Log — The system MUST record check-in occurrences as discrete events in an event log (`state.events`) containing `id`, `habitId`, `date` (`YYYY-MM-DD`), `at` (ISO timestamp), `atApproximate` (boolean), `version` (`full` | `minimal`), and optional `mood` (1–5) and `energy` (1–5).
FR3: Dynamic Miss Computation — The system MUST compute habit misses dynamically on runtime queries with zero negative "miss records" stored in state.
FR4: Lossless Legacy Migration — The system MUST automatically detect legacy `atomicHabits` state, back up the raw string to `atomicHabits_v1_backup`, and transform all habits and completions into `schemaVersion: 2` with `atApproximate: true`.
FR5: Identity-Centric Habit Definition — Users can create, edit, archive, and delete habits with a name, identity statement, and category selection (fixed 5 categories: Health, Learning, Creativity, Mindfulness, Connection).
FR6: Implementation Intention & Two-Minute Fallback — Users can optionally specify an Implementation Intention (time and place), a Two-Minute Version text string, and a Temptation Bundle text string.
FR7: Habit Stacking & Cascading Prompts — Users can configure a habit to trigger after an existing anchor habit (`stackedAfter`). Upon completing the anchor habit, the system opens a dialog presenting stacked habits with "Log it" and "Not now" actions, cascading recursively.
FR8: Today-Only Check-In & Undo — Users can toggle check-ins exclusively for the current local calendar date (`date === today()`). Tapping a completed habit removes today's event, restoring previous streak and state.
FR9: Micro-Mood & Reflection Capture — Following a check-in, the card displays a 5-point neutral mood selector (1 = Low, 5 = High) and an optional prompt to add a note to the journal tagged with habit ID.
FR10: Never-Miss-Twice Nudge — The system MUST evaluate whether a habit was missed yesterday and remains unlogged today, displaying a calm nudge offering the two-minute version (`version: "minimal"`) preserving streak continuity, or "Not today" dismissal.
FR11: 30-Day Consistency Rate & Recovery Window — The system MUST compute and display the 30-day consistency rate (completed days / days active up to 30) and the average Recovery Time (days from miss to next check-in, displayed once >= 3 misses occur).
FR12: Weekly Identity Vote Aggregation — The system MUST sum all check-in events across the rolling last 7 days grouped by normalized identity statement and display the leading identity in the primary greeting.
FR13: 14-Day Strip & 12-Week Contribution Grid — Habit cards display a 14-day trailing check-in strip; expanding the habit detail reveals a full 12-week grid (Sunday to Saturday rows, oldest week left) with minimal check-ins rendered at 55% fill opacity and zero red fill.
FR14: Habit Scorecard — Users can log daily behaviors and assign awareness ratings: Positive (`+`), Negative (`-`), or Neutral (`=`) based on whether the action reinforces desired identity, with count summaries.
FR15: Pure Pattern Engine — The system MUST run deterministic pattern-matching functions (`insights.js`) evaluating weekday variance (>= 25% gap), time-of-day clustering (>= 60%), streak-break precursors (>= 50%), habit co-occurrences (>= 25%), and mood correlates, with sample sizes and collapsible "Why am I seeing this?" proofs.
FR16: Recurring-Theme NLP Detector — The system MUST scan all journal entries and miss notes to identify words repeated across >= 3 distinct entries (>= 4 letters, excluding stopwords), unlocking after 8 entries and listing top 10 recurring words with counts and links.
FR17: Weekly Review Protocol — The system MUST provide a Weekly Review guided flow (and 7-Day Pulse) synthesizing weekly votes, strongest unlocked insight, theme-derived reflection, and an open intention prompt saved to journal.
FR18: Alter Ego Profile — Users can define an Alter Ego profile consisting of an optional name, narrative description, 3 core values, an obstacle handling philosophy, and 3 specific behavioral habits (unlocking Future-Self chat mode).
FR19: Offline Scenario Simulator — Before an LLM provider is connected, the scenario simulator MUST generate templated self-reflection prompts mapping user scenarios to Alter Ego obstacle style and defined behaviors.
FR20: WOOP Goal & Obstacle Planning — Users can author WOOP entries (Wish, Outcome, Obstacle, Plan: "If {obstacle}, then I will {action}") with optional habit links, appearing as contextual hints on habit cards and Never-Miss-Twice nudges.
FR21: Dual Conversation Modes — The Chat interface MUST support two distinct modes: Mirror Mode (objective habit metrics and consistency in UI voice) and Future-Self Mode (Alter Ego persona adhering to user values and obstacle techniques in Identity voice), both bounded by < 120 words and single-suggestion limits.
FR22: Privacy Firewall & Payload Transparency — The system MUST default to transmitting aggregated numerical and categorical metadata only, filtering raw journal text unless explicitly opted-in per turn, strictly excluding `private: true` entries, and providing a persistent privacy chip previewing outbound JSON payloads.
FR23: Flexible Provider Adapter Architecture — Users can configure LLM providers: None (offline templated reflection), Google Gemini (primary cloud adapter via `generativelanguage.googleapis.com` with Gemini 2.5 Flash), Local Ollama (`http://localhost:11434`), or secondary BYOK (Anthropic/OpenAI), with API keys stored in client settings.
FR24: Standard RFC 5545 .ics Export — Users can export an `atomic-reminders.ics` calendar file containing daily recurring `VEVENT` entries with `RRULE:FREQ=DAILY`, accurate timezone formatting, 10-minute duration, intention-based summary, and `VALARM` notification trigger.
FR25: In-Tab Web Notifications — Users can enable optional in-tab browser notifications via native `Notification` API while the application tab remains open, requesting browser permission only after user enables a reminder.
FR26: Full-State Passphrase Encryption — Users can activate passphrase protection in Me > Privacy and Data, encrypting the entire state blob using AES-256-GCM with PBKDF2 (HMAC-SHA256, 600,000 iterations) derived key and 16-byte random salt, with keys strictly ephemeral in transient memory.

### NonFunctional Requirements

NFR1: Aesthetic & Tone / Zero-Shame — Warm paper notebook palette (`--bg-page: #FAF8F5`) for light mode, desaturated slate navy (`--bg-page: #151A24`) for night mode, warm amber accents (`--accent-future: #E0A94F`). Dual-font hierarchy (Georgia/Palatino serif for identity/journal/future-self; System sans-serif for UI/stats/mirror). Zero-shame copy with factual second-person tone. Gamified scoring, confetti, XP, loss-framed streak warnings, and red notification badges are strictly prohibited.
NFR2: Local Sovereignty & Data Privacy — 100% of user data resides in client-controlled browser storage (`localStorage` key `atomic.v2`). Zero external fonts, zero third-party telemetry, zero remote tracking pixels, zero developer-operated cloud backend in v1.
NFR3: Cryptographic Rigor — Key derivation via PBKDF2 with HMAC-SHA256 and 600,000 iterations; AES-256-GCM symmetric encryption with 16-byte salt and 12-byte IV per save. Derived keys remain strictly in transient memory.
NFR4: Performance & Zero-Build Vanilla Footprint — Native browser ECMAScript modules (`<script type="module" src="js/main.js">`) without npm build steps, bundlers, compilers, or CDN runtime scripts. Initial page load < 200ms. Automated tests run via Node.js built-in `node:test` runner.
NFR5: Reliability, Quota & Quarantine Safety — All storage read/write operations wrapped in strict try/catch blocks; unparseable or corrupted state sets `storage.error` and halts saving to prevent data overwrite, surfacing an emergency JSON backup export prompt.

### Additional Requirements

- AD-1: Strict Layered Unidirectional Dependency Boundary (`UI` -> `Domain` -> `Core`; `UI` -> `AI` -> `Core`). Core and Domain modules have zero DOM dependencies.
- AD-2: Unified Storage Gateway (`js/core/storage.js`) as the sole reader/writer of `localStorage['atomic.v2']`, with idempotent v1 backup and migration.
- AD-3: Append-Only Check-in Event Log with Zero Stored Miss Records; streaks, 30-day rates, and identity votes dynamically projected at runtime.
- AD-4: Strict Local Calendar Date Strings (`YYYY-MM-DD`) derived from local date getters (UTC date getters forbidden for calendar dates) and today-only check-in enforcement.
- AD-5: Client-Side Privacy Firewall (`js/ai/firewall.js`), Google Gemini (`gemini-2.5-flash`) as primary cloud adapter, local Ollama adapter, and BYOK adapter with direct browser fetch.
- AD-6: Full-State PBKDF2 / AES-256-GCM Envelope with Ephemeral In-Memory Keys.
- AD-7: Deterministic Pure Statistical Pattern Engine with standardized `{ id, type, unlocked, sampleSize, message, proof }` contracts and collapsible proof disclosures.
- AD-8: Greenfield Starter Structure: Zero-dependency native browser ES2022+ modules, vanilla CSS with custom properties, and unit test harness in `tests/run.js` using `node:test` and `node:assert/strict`.

### UX Design Requirements

UX-DR1: Color Tokens & Paper/Night Dual Themes — Semantic CSS custom properties for Paper (`#FAF8F5`) and Night (`#151A24`) palettes, warm amber highlights (`#E0A94F`), cool slate (`#4A6A8A`), fixed 5 category colors (Health, Learning, Creativity, Mindfulness, Connection), and prohibited red styling.
UX-DR2: Dual Typography Hierarchy — Serif (`--font-voice`: Georgia, Palatino) for identity statements, journal prompts/body, and Future-Self dialogue; System sans-serif (`--font-ui`) for tool labels, buttons, metrics, and Mirror Mode.
UX-DR3: Responsive Layout & Navigation Chrome — Mobile bottom navigation bar (64px + safe area inset, 5 destinations, 4px warm amber dot indicator); Desktop fixed 220px left sidebar with serif "Atomic" wordmark and rounded capsule active tabs.
UX-DR4: Habit Card & Tactile Stamp Button — Habit card with identity hero title, 44x44px stamp button with `transform: scale(0.94)` active resistance, category ink bloom, 1-tap undo, and card body click routing to Habit Detail.
UX-DR5: 14-Day Trailing Timeline with Anchor — 14-day history strip on habit cards with 2px amber highlight ring on Today's cell, tooltip dates, and 55% tint opacity for minimal check-ins.
UX-DR6: Smooth Mood Picker Reveal — 5-point neutral mood selector (1 to 5) gliding smoothly underneath the stamp button over 280ms (`opacity: 0 -> 1`, `translateY(-4px) -> 0`) without layout jumps.
UX-DR7: Unfolding Pact Multi-Beat Creation Flow — 4-beat dialog for habit creation: Beat 1 (Identity: "Who are you becoming?"), Beat 2 (Vote: "What is one small daily vote?"), Beat 3 (Domain chip picker), Beat 3b (Stacking anchor picker), Beat 4 (Compassionate safety net fork for two-minute version and implementation intention).
UX-DR8: Today Switcher (Daily Votes <-> Habits Scorecard) — 180ms cross-fade between Daily Votes and Habits Scorecard on `#/today`; Scorecard rows with `+`, `=`, `−` ratings, slate "Noticed, not judged" microcopy for `−`, promote-to-identity ghost action for `+`, and stacking-anchor ghost action for `=`.
UX-DR9: Ruled Journal Ledger — 28px locked background rule grid matching line-height, auto-growing textarea, daily prompt card, and reverse-chronological entry history cards.
UX-DR10: Never-Miss-Twice Nudge Row — Contextual intervention card when yesterday was missed: "Yesterday was a miss. Today is the day that counts. Try the two-minute version: {twoMinuteVersion}" with "Do 2-min version" (minimal event) and "Not today" dismissal.
UX-DR11: Curtain Rising Unlock System for Insights — Cold start (< 7 days) roadmap displaying upcoming insight thresholds and 6px progress bars; unlocked discovery cards featuring tentative observations, evidence pills with raw date inspection, and "Reflect in Journal" bridges.
UX-DR12: 7-Day Rolling Pulse Ambient Card — Pinned top card on Insights showing rolling 7-day votes across identities; ambient, unscheduled, and never overdue.
UX-DR13: Dual-Mode Chat Atmosphere & Privacy Chip — Mirror Mode (cool slate, sans-serif) vs Future-Self Mode (warm amber, serif), Alter Ego authoring prerequisite gate, hard 120-word limit with reflection bridge, and persistent privacy chip previewing outbound JSON payload.
UX-DR14: Me Surface Identity Portfolio & Sovereignty — Zone 1 (Identity cards with all-time votes & 30d consistency, Alter Ego profile authoring, WOOP planner) and Zone 2 (Theme switcher, RFC 5545 calendar export, passphrase vault toggle, backup status chip, deliberate typed "DELETE" confirmation).
UX-DR15: Habit Detail Deep History View — Dedicated route `#/habit/:id` displaying 12-week Sunday-to-Saturday contribution grid (minimal check-ins at 55% tint), implementation intention statement, and linked journal notes.
UX-DR16: Accessibility & Interaction Floor — WCAG AA color contrast compliance, explicit `aria-label` and `title` attributes on stamp buttons, timeline cells, and mood buttons, `prefers-reduced-motion` instantaneous transitions, and >= 44x44px touch targets.

---

### FR Coverage Map

- **FR1 (Single Storage Gateway):** Epic 1 — Story 1.1 (Storage Foundation)
- **FR2 (Event-Driven Check-in Log):** Epic 1 — Story 1.1 (Storage Foundation), Story 1.4 (Today Dashboard Check-in)
- **FR3 (Dynamic Miss Computation):** Epic 1 — Story 1.1 (Storage Foundation), Epic 2 — Story 2.3 (Consistency Metrics & Recovery Window)
- **FR4 (Lossless Legacy Migration):** Epic 1 — Story 1.2 (Legacy Migration & Quarantine)
- **FR5 (Identity-Centric Habit Definition):** Epic 1 — Story 1.3 (Unfolding Pact Habit Creation)
- **FR6 (Implementation Intention & 2-Minute Fallback):** Epic 1 — Story 1.3 (Unfolding Pact Habit Creation)
- **FR7 (Habit Stacking & Cascading Prompts):** Epic 1 — Story 1.3 (Unfolding Pact), Story 1.5 (Mood & Stacking Dialog)
- **FR8 (Today-Only Check-In & Undo):** Epic 1 — Story 1.4 (Today Dashboard Check-in & Undo)
- **FR9 (Micro-Mood & Reflection Capture):** Epic 1 — Story 1.5 (Mood & Stacking Dialog), Story 1.6 (Ruled Stationery Journal)
- **FR10 (Never-Miss-Twice Nudge):** Epic 2 — Story 2.1 (Never-Miss-Twice Interventions)
- **FR11 (30-Day Consistency Rate & Recovery Window):** Epic 2 — Story 2.3 (Consistency Metrics & Recovery Window)
- **FR12 (Weekly Identity Vote Aggregation):** Epic 2 — Story 2.4 (7-Day Rolling Pulse & Vote Aggregation)
- **FR13 (14-Day Strip & 12-Week Contribution Grid):** Epic 2 — Story 2.3 (14-Day Strip & 12-Week Grid)
- **FR14 (Habit Scorecard):** Epic 2 — Story 2.2 (Habits Scorecard & Awareness Ratings)
- **FR15 (Pure Pattern Engine):** Epic 2 — Story 2.5 (Deterministic Statistical Pattern Engine)
- **FR16 (Recurring-Theme NLP Detector):** Epic 2 — Story 2.6 (Recurring-Theme NLP & Reflection Bridge)
- **FR17 (Weekly Review Protocol):** Epic 2 — Story 2.4 (7-Day Rolling Pulse), Story 2.6 (Reflection Bridge & Weekly Synthesis)
- **FR18 (Alter Ego Profile):** Epic 3 — Story 3.1 (Alter Ego Authoring & Identity Portfolio)
- **FR19 (Offline Scenario Simulator):** Epic 3 — Story 3.3 (Offline Scenario Simulator)
- **FR20 (WOOP Goal & Obstacle Planning):** Epic 3 — Story 3.2 (WOOP Goal Planner & Contextual Hints)
- **FR21 (Dual Conversation Modes):** Epic 4 — Story 4.3 (Dual-Mode Chat Interface)
- **FR22 (Privacy Firewall & Transparency Chip):** Epic 4 — Story 4.1 (Privacy Firewall & Payload Builder), Story 4.3 (Dual-Mode Chat)
- **FR23 (Flexible Provider Adapter Architecture):** Epic 4 — Story 4.2 (Gemini, Ollama & BYOK Adapters)
- **FR24 (Standard RFC 5545 .ics Export):** Epic 5 — Story 5.1 (RFC 5545 Calendar Reminders)
- **FR25 (In-Tab Web Notifications):** Epic 5 — Story 5.1 (RFC 5545 Calendar Reminders & Notifications)
- **FR26 (Full-State Passphrase Encryption):** Epic 5 — Story 5.2 (PBKDF2/AES-256-GCM Encryption Vault)

---

## Epic List

### Epic 1: Foundation, Daily Identity Voting & Journal Sanctuary
Enable users to define identity-centric habits, complete today-only check-ins with tactile stamp feedback and forgiving undo, capture micro-moods, stack routines, and reflect in a private ruled ledger journal, backed by an append-only event log and lossless legacy migration.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9

### Epic 2: Autopilot Awareness, Scorecard & Pure Pattern Insights
Enable users to uncover unconscious behavioral tendencies, track daily routines with the Habits Scorecard, rescue skipped habits via Never-Miss-Twice two-minute fallbacks, inspect 30-day consistency rates and 12-week contribution grids, and review mathematical discoveries with full proof transparency.
**FRs covered:** FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17

### Epic 3: Identity Architecture, Alter Ego & WOOP Obstacle Planning
Enable users to articulate their aspired future self through an Alter Ego profile, simulate obstacle handling offline without external dependencies, author WOOP goal plans, and receive contextual habit hints.
**FRs covered:** FR18, FR19, FR20

### Epic 4: Dual-Mode AI Reflection Sanctuary & Privacy Firewall
Provide users with an introspective conversational interface supporting objective data reflection (Mirror Mode) and archetypal identity coaching (Future-Self Mode), guarded by a client-side privacy firewall, transparent payload preview chip, and flexible provider adapters (Google Gemini 2.5 Flash, Ollama, BYOK).
**FRs covered:** FR21, FR22, FR23

### Epic 5: Reminders, Calendar Integration & Cryptographic Data Sovereignty
Empower users with total data sovereignty through client-side RFC 5545 `.ics` reminder exports, in-tab notification timers, and zero-knowledge full-state passphrase encryption (PBKDF2 / AES-256-GCM), alongside verified JSON backup/restore and deliberate two-stage deletion.
**FRs covered:** FR24, FR25, FR26

---

## Epic 1: Foundation, Daily Identity Voting & Journal Sanctuary

### Story 1.1: Project Scaffold, ES Module Infrastructure & Local Storage Gateway

As a habit builder,
I want a clean, zero-dependency browser-native application with a centralized storage engine,
So that my habit data is reliably persisted in local storage with schema integrity and high performance.

**Acceptance Criteria:**

**Given** a browser opening `index.html` via standard HTTP server
**When** the page boots without any build steps or bundlers
**Then** `js/main.js` loads as a native ES module, registers global hash routing (`#/today`, `#/journal`, `#/insights`, `#/chat`, `#/me`), and applies the design tokens from `DESIGN.md` in `style.css`
**And** `js/core/storage.js` provides `storage.load()` and `storage.save()`, reading and writing strictly to `localStorage['atomic.v2']`
**And** initial state schema version is `2` containing empty arrays for `habits`, `events`, `journal`, `scorecard`, `woop`, and default `settings`
**And** all date operations in `js/core/dates.js` derive strictly from local calendar getters (`getFullYear()`, `getMonth() + 1`, `getDate()`) returning `YYYY-MM-DD` strings without UTC midnight offset bugs
**And** running `node tests/run.js` executes unit tests in `tests/core/dates.test.js` and `tests/core/storage.test.js` using Node's built-in `node:test` runner and passes with zero dependencies.

### Story 1.2: Lossless Legacy V1 Migration & Storage Error Quarantine

As a returning Atomic user,
I want my existing habit completions automatically migrated to schema version 2 without data loss,
So that my historical consistency records are preserved while gaining v2 event-log capabilities.

**Acceptance Criteria:**

**Given** `localStorage` contains legacy `atomicHabits` or `atomic.state` data and no `atomic.v2` key exists
**When** the application initializes `storage.load()`
**Then** the raw legacy string is backed up into `localStorage['atomicHabits_v1_backup']`
**And** legacy habits and date completions are transformed into `schemaVersion: 2` `state.habits` and `state.events` with `atApproximate: true` and `version: "full"`
**And** the migration is idempotent: subsequent reloads read `atomic.v2` without modifying the backup
**And** if storage contains corrupted JSON that cannot be parsed, `storage.error` is set, `storage.save()` aborts all writes to prevent destructive overwriting, and the UI displays a calm diagnostic notice with an emergency JSON export link.

### Story 1.3: Unfolding Pact Habit Creation & Management

As an intentional habit builder,
I want a contemplative, multi-beat creation ritual grounded in identity,
So that my daily behaviors are explicitly tied to who I am becoming and protected by a safety net.

**Acceptance Criteria:**

**Given** the user is on the Today screen (`#/today`)
**When** the user taps `+ New Habit`
**Then** the Unfolding Pact dialog opens presenting Beat 1: *"Who are you becoming?"* in serif typography (`--font-voice`)
**And** entering an identity folds the answer into a breadcrumb summary (`Becoming: A reader`) and advances to Beat 2: *"What is one small daily vote for that person?"*
**And** entering a vote advances to Beat 3: category selection presenting the 5 canonical chips (`Health`, `Learning`, `Creativity`, `Mindfulness`, `Connection`)
**And** Beat 3b presents an optional stacking anchor picker listing active habits and scorecard routines
**And** Beat 4 presents the compassionate fork: *"Life gets busy. Would you like to set a 2-minute safety net for tough days?"* allowing optional entry of a two-minute version and implementation intention (`"I will {vote} at {time} in {place}"`)
**And** clicking `I'm ready — create habit` persists the habit via `habits.createHabit(state, habitData)` with a prefixed UUID `h_<uuid>`, createdAt timestamp, and renders the new habit card on Today with a gentle bloom animation
**And** users can edit or archive existing habits from their detail view, with archive setting `archivedAt` timestamp.

### Story 1.4: Today Dashboard, Tactile Stamp Check-in & Forgiving Undo

As a daily user,
I want to cast my identity vote with a tactile stamp button and have effortless undo,
So that tracking takes less than 10 seconds and accidental taps never penalize my record.

**Acceptance Criteria:**

**Given** one or more active habits exist on the Today screen
**When** the Today screen renders
**Then** the header displays the leading identity vote greeting in serif: *"X votes this week for {identity}"*
**And** each habit card renders the identity hero statement, habit name, and a 44x44px stamp button in the upper right
**And** clicking the stamp button triggers an active tactile compression (`transform: scale(0.94)`), blooms with category ink, and records a check-in event in `state.events` with `type: 'checkin'`, `date: today()`, `at: new Date().toISOString()`, and `version: 'full'`
**And** check-in is restricted strictly to today (`date === today()`); no UI or API permits logging for past or future dates
**And** tapping anywhere on the card body outside the stamp button navigates to `#/habit/:id`
**And** if a stamped button is clicked again during the same day, the check-in event is permanently deleted from `state.events`, the button reverts to dashed border unchecked state, and previous streak status is restored with zero penalty.

### Story 1.5: Micro-Mood Capture & Habit Stacking Dialog

As a mindful user,
I want to log how my habit felt immediately after checking in and be prompted for stacked routines,
So that I connect emotional awareness to my habits and maintain routine momentum.

**Acceptance Criteria:**

**Given** a habit has just been checked in on the Today screen
**When** the stamp animation completes
**Then** the 5-point neutral mood selector smoothly glides into view underneath the stamp button over 280ms (`opacity: 0 -> 1`, `translateY(-4px) -> 0`) without jumping the card layout
**And** tapping a mood button (1 = Low to 5 = High) updates the check-in event in `state.events` with `mood: N` in place
**And** if the checked habit has child habits configured with `stackedAfter: anchorHabit.id`, a native `<dialog>` smoothly opens displaying the stacked habit with *"Ready for the next one?"* and distinct *"Log it"* and *"Not now"* buttons
**And** tapping *"Log it"* creates a check-in event for the child habit and recursively evaluates any subsequent stacked habits.

### Story 1.6: Ruled Stationery Journal & Habit-Tagged Notes

As a reflective thinker,
I want a quiet, ruled stationery journal with daily prompts and habit-linked notes,
So that I can capture deeper insights without leaving my habit tracking sanctuary.

**Acceptance Criteria:**

**Given** the user navigates to `#/journal`
**When** the journal view renders
**Then** the top displays today's reflective prompt card in serif typography (`--font-voice`) with an input textarea styled with a locked 28px background rule grid (`--ruled-line-paper` / `--ruled-line-night`) that auto-grows with content
**And** the user can tag an entry with an optional habit ID, select mood/energy ratings, and toggle a `private` boolean flag
**And** saving an entry persists a record in `state.journal` with `id: j_<uuid>`, `at: new Date().toISOString()`, `date: today()`, and `kind: 'free'` (or `'completion_note'`)
**And** past journal entries render in reverse chronological order on ruled ledger cards with date pills, habit chips, and full keyboard accessibility.

---

## Epic 2: Autopilot Awareness, Scorecard & Pure Pattern Insights

### Story 2.1: Never-Miss-Twice Nudges & Two-Minute Fallback Recovery

As a habit practitioner who missed yesterday,
I want a calm, non-judgmental recovery nudge offering the two-minute version of my habit,
So that I maintain behavioral momentum and prevent a single miss from becoming a negative spiral.

**Acceptance Criteria:**

**Given** an active habit was created prior to yesterday, has no check-in event for yesterday, and is not yet logged today
**When** the Today screen renders
**Then** the habit card surfaces a Never-Miss-Twice nudge row below the title: *"Yesterday was a miss. Today is the day that counts. Try the two-minute version: {twoMinuteVersion}."*
**And** the nudge presents two actions: *"Do 2-min version"* and *"Not today"* with zero red badge styling, zero warning icons, and zero guilt copy
**And** clicking *"Do 2-min version"* creates a check-in event with `version: "minimal"`, marks the habit complete for today, and preserves current streak continuity
**And** clicking *"Not today"* suppresses the nudge for the remainder of the calendar day without punitive messaging.

### Story 2.2: Habits Scorecard & Awareness Ratings

As an awareness seeker,
I want to log my daily micro-routines on a Habits Scorecard and rate their identity alignment,
So that I bring unconscious automatic habits into conscious awareness without self-judgment.

**Acceptance Criteria:**

**Given** the user is on the Today screen (`#/today`)
**When** the user clicks the Today Switcher tab `Habits Scorecard`
**Then** the content smoothly transitions via a 180ms cross-fade to the Scorecard ledger view without URL route change
**And** users can add daily behaviors (e.g., *"Morning coffee"*, *"Checked phone in bed"*) and assign awareness ratings: `+` (Positive), `-` (Negative), or `=` (Neutral)
**And** rating a behavior as `-` displays the quiet slate caption: *"Noticed, not judged."* with zero red coloration
**And** rating a behavior as `+` reveals a ghost action: *"Promote to identity habit →"*, which opens the Unfolding Pact pre-filled with the behavior name
**And** rating a behavior as `=` reveals a ghost action: *"Use as stacking anchor →"*, making that routine selectable in the Unfolding Pact Beat 3b stacking picker
**And** the top of the Scorecard displays the summary tally: *"{n} positive, {n} negative, {n} neutral"*.

### Story 2.3: Consistency Metrics, Recovery Window & 14-Day / 12-Week Grids

As an analytical tracker,
I want to see my 30-day consistency rate, average recovery window, and visual contribution grids,
So that I see tangible empirical proof of my identity votes over time.

**Acceptance Criteria:**

**Given** active habits with past check-in events
**When** habit cards render on Today or in the Habit Detail view (`#/habit/:id`)
**Then** `js/domain/streaks.js` calculates:
  - Current streak (consecutive calendar days ending today or yesterday)
  - 30-day consistency rate: integer percentage of active days completed over the last 30 calendar days
  - Average Recovery Time: average calendar days elapsed between a missed day and the subsequent check-in (displayed once $\ge 3$ misses have occurred)
**And** the habit card displays a 14-day trailing strip ending on Today's cell, with Today highlighted by a 2px amber accent ring (`--today-highlight-ring`)
**And** expanding to Habit Detail reveals a full 12-week grid (Sunday-to-Saturday columns, oldest week on the left)
**And** check-in cells with `version: "minimal"` render with a 55% fill tint, empty cells render in neutral `--grid-empty`, and red color is strictly forbidden across all grid states.

### Story 2.4: 7-Day Rolling Pulse & Identity Vote Aggregation

As a habit builder,
I want an ambient weekly pulse showing votes cast across all my identities,
So that I see a holistic picture of my personal evolution without feeling pressured by rigid schedules.

**Acceptance Criteria:**

**Given** check-in events logged over the preceding 7 calendar days
**When** the user visits the Insights surface (`#/insights`)
**Then** the top of the view features the **7-Day Rolling Pulse** card
**And** the card dynamically aggregates check-in events across `[today() - 6 days, today()]` grouped by normalized identity statement
**And** displays total votes cast per identity with category color indicators
**And** the Pulse card is always ambiently available, updates silently in the background, and is never gated by day of week or marked "overdue".

### Story 2.5: Deterministic Statistical Pattern Engine & Proof Cards

As an introspective user,
I want algorithmic discovery cards that highlight my behavioral patterns with verifiable proof,
So that I learn when and why I slip without opaque AI hallucinations.

**Acceptance Criteria:**

**Given** habit event history in `state.events`
**When** `js/domain/insights.js` evaluates patterns
**Then** pure synchronous functions evaluate:
  - Weekday Slip ($\ge 25\%$ consistency gap between a specific weekday and average)
  - Time-of-Day Rhythm ($\ge 60\%$ check-ins clustering in morning, afternoon, or evening)
  - Streak-Break Precursor ($\ge 50\%$ correlation with a specific preceding behavior or skip)
  - Habit Co-occurrence ($\ge 25\%$ joint completion likelihood)
**And** when fewer than 7 days of logs exist, the Insights surface renders the **Curtain Rising** roadmap showing upcoming milestones and live 6px progress bars instead of an empty state
**And** each unlocked discovery card adheres to `{ id, type, unlocked, sampleSize: { k, n }, message, proof }` and features an evidence pill: `Based on N days · Tap to inspect dates`
**And** expanding the pill reveals the exact date list and mathematical calculation, accompanied by a bridge action: `Reflect in Journal →` which opens the journal with a pre-seeded contextual prompt.

### Story 2.6: Recurring-Theme NLP Tokenizer & Weekly Reflection Bridge

As a journaling user,
I want recurring words in my reflections detected and synthesized into weekly review prompts,
So that I notice mental roadblocks and recurring emotional themes across my habit journey.

**Acceptance Criteria:**

**Given** $\ge 8$ total journal entries or miss notes in `state.journal`
**When** the recurring theme engine runs in `js/domain/insights.js`
**Then** all entry text is tokenized into lowercase words, filtered to remove words $< 4$ letters and common English stopwords
**And** words appearing across $\ge 3$ distinct entries are surfaced in the top 10 recurring themes list with occurrence counts and entry links
**And** from Sunday 18:00 local time through the following week, the Weekly Review flow guides users through (1) weekly identity votes, (2) strongest unlocked pattern, (3) theme-derived reflection prompt, and (4) an open intention saved to the journal.

---

## Epic 3: Identity Architecture, Alter Ego & WOOP Obstacle Planning

### Story 3.1: Alter Ego Profile Authoring & Identity Portfolio

As a forward-looking individual,
I want to author an Alter Ego profile defining my ideal future self's values and obstacle philosophy,
So that my daily habit system is anchored to an inspiring, concrete vision of who I am becoming.

**Acceptance Criteria:**

**Given** the user navigates to the Me tab (`#/me`)
**When** the page renders Zone 1 (Identity)
**Then** the user sees their Identity Portfolio cards displaying all active voted-for identities, total votes, and 30-day consistency percentages
**And** the Alter Ego authoring section provides form fields for:
  - Alter Ego Name (optional)
  - Narrative Description (rich text)
  - Core Values (up to 3 values)
  - Obstacle Handling Philosophy / Style (e.g., *"When blocked, I write one bad sentence to break the dam"*)
  - 3 Core Behaviors characteristic of this archetype
**And** saving persists the profile in `state.alterEgo` with an `updatedAt` timestamp and unlocks Future-Self reflection mode across the app.

### Story 3.2: WOOP Goal & Obstacle Planning with Habit Hints

As a goal-oriented user,
I want to formulate WOOP obstacle plans and link them to my habits,
So that I have an immediate pre-committed action whenever obstacles arise.

**Acceptance Criteria:**

**Given** the user is in Me > WOOP Planner (`#/me`)
**When** authoring a new WOOP plan
**Then** the interface captures Wish, Outcome, Obstacle, and Plan in the canonical format: *"If {obstacle}, then I will {action}"*
**And** allows selecting an optional linked habit from active habits
**And** saving creates a record in `state.woop` with ID `w_<uuid>`
**And** the plan statement appears as a contextual hint on the linked habit card during Never-Miss-Twice recovery nudges.

### Story 3.3: Offline Scenario Simulator & Templated Identity Reflection

As a user without an active AI connection,
I want to simulate challenging situations and receive reflection prompts based on my Alter Ego,
So that I can overcome obstacles using my defined values without requiring internet access or API keys.

**Acceptance Criteria:**

**Given** an Alter Ego profile has been authored and AI provider is set to `'none'` (or network is offline)
**When** the user accesses the scenario simulator from Chat or Me
**Then** the user can describe a current friction or temptation scenario (e.g., *"Feeling tired and tempted to scroll social media"*)
**And** the system deterministically maps the input scenario to the user's defined Alter Ego obstacle philosophy and 3 archetype behaviors
**And** outputs a structured, warm self-inquiry prompt in serif typography without calling any external network endpoint or hallucinating ungrounded advice.

---

## Epic 4: Dual-Mode AI Reflection Sanctuary & Privacy Firewall

### Story 4.1: Aggregated Payload Builder & Client-Side Privacy Firewall

As a privacy-conscious user,
I want my habit reflections guarded by a strict local privacy firewall that only transmits aggregated metadata,
So that my intimate personal journal entries are never exposed to external AI providers without my explicit consent.

**Acceptance Criteria:**

**Given** habit, consistency, pattern, and journal data in local state
**When** preparing an outbound AI payload in `js/ai/payload.js`
**Then** the payload builder compiles strictly aggregated numerical and categorical metadata: habit names, identity statements, 30-day consistency rates, active pattern summaries, and Alter Ego profile parameters
**And** raw journal text is excluded by default
**And** including journal text requires explicit single-turn user opt-in for that specific prompt
**And** entries marked `private: true` are hard-blocked by `js/ai/firewall.js` and NEVER included under any circumstance
**And** the persistent privacy chip pinned above the input field displays: `🔒 Aggregated stats only (0 raw journal entries shared) · Tap to preview payload`
**And** tapping the chip displays the exact JSON payload in a modal preview before any network request is initiated.

### Story 4.2: Provider Adapter Architecture: Google Gemini, Ollama & BYOK

As a user choosing my AI infrastructure,
I want flexible options to connect Google Gemini (primary cloud), local Ollama, or BYOK endpoints,
So that I can use free-tier high-speed cloud intelligence or air-gapped on-device privacy.

**Acceptance Criteria:**

**Given** the user configures AI settings in Me > Settings
**When** the user selects a provider:
  - **Google Gemini (Primary Cloud Adapter):** Configured with Gemini 2.5 Flash (`generativelanguage.googleapis.com`), sends standard browser HTTPS POST requests with native CORS support, supporting 1-click Google AI Studio keys
  - **Local Ollama:** Sends direct HTTP POST requests to `http://localhost:11434/api/generate` with zero data leaving the local machine
  - **Secondary BYOK:** Supports direct browser fetch to Anthropic (`api.anthropic.com`) or OpenAI (`api.openai.com`) endpoints using user-provided API keys
  - **None (Default):** Directs requests to the offline scenario simulator
**Then** API keys are stored in `state.settings.ai` (encrypted if passphrase vault is active)
**And** if an endpoint is unreachable or CORS fails, a non-blocking toast displays a calm notice: *"AI service unreachable. Your entries remain safely stored locally."* with an input retry link.

### Story 4.3: Dual-Mode Chat Interface with Atmosphere Toggling & Privacy Preview

As an introspective user,
I want to toggle between Mirror Mode (objective metrics) and Future-Self Mode (Alter Ego coaching),
So that I can inspect my behavioral reality or dialogue with my aspired identity in distinct atmospheric spaces.

**Acceptance Criteria:**

**Given** the user navigates to `#/chat`
**When** the chat interface loads
**Then** a clean mode toggle allows switching between **Mirror Mode** and **Future-Self Mode**
**And** **Mirror Mode** applies a cool slate atmosphere (`--accent-mirror: #4A6A8A`), labels the view *"The Objective Mirror"*, and responds in concise sans-serif UI voice focused on empirical stats, streak consistency, and pattern proofs
**And** **Future-Self Mode** applies a warm amber atmosphere (`--accent-future: #E0A94F`), labels the view *"Dialogue with Your Future Self"*, and responds in warm serif typography (`--font-voice`) embodying the user's defined Alter Ego values and obstacle philosophy
**And** if Alter Ego has not been authored, Future-Self mode displays a stationery gate card: *"Before conversing with your future self, author their values in Me > Alter Ego"* with a direct link
**And** every AI response is strictly constrained to $< 120$ words, offers at most one actionable suggestion, and concludes with an action bridge: `Take this into today →` or `Write in Journal`.

---

## Epic 5: Reminders, Calendar Integration & Cryptographic Data Sovereignty

### Story 5.1: RFC 5545 .ics Calendar Reminder Export & In-Tab Notifications

As a busy professional,
I want to export my habit schedule as an RFC 5545 `.ics` calendar file and receive optional in-tab prompts,
So that my existing calendar triggers my habits without requiring persistent background daemon processes.

**Acceptance Criteria:**

**Given** habits configured with implementation intention times (`intention.time`)
**When** the user clicks *"Export Calendar Reminders (.ics)"* in Me > Reminders
**Then** `js/domain/calendar.js` generates a valid standard RFC 5545 `.ics` file containing daily recurring `VEVENT` entries with:
  - `RRULE:FREQ=DAILY`
  - Accurate local timezone formatting (`TZID`)
  - 10-minute duration
  - Summary: `"Atomic Vote: {habit.name} ({habit.identity})"`
  - `VALARM` notification trigger set to event start
**And** the browser triggers a file download of `atomic-reminders.ics`
**And** when the application tab is active, users can optionally toggle in-tab browser notifications via native `Notification` API, requesting browser permission only upon explicit toggle activation.

### Story 5.2: Full-State PBKDF2 / AES-256-GCM Encryption Vault

As a privacy advocate on a shared device,
I want to seal my entire habit notebook behind a passphrase-derived cryptographic vault,
So that no unauthorized person can read my habits or reflections even with physical access to browser storage.

**Acceptance Criteria:**

**Given** plaintext state in `localStorage['atomic.v2']`
**When** the user activates passphrase protection in Me > Privacy and Data
**Then** the user is prompted to set and confirm a passphrase
**And** `js/core/crypto.js` derives a symmetric key using Web Cryptography API PBKDF2 (HMAC-SHA256, 600,000 iterations, 16-byte random salt)
**And** encrypts the entire serialized JSON state using AES-256-GCM with a fresh 12-byte random IV per save
**And** the ciphertext is stored in `localStorage['atomic.v2']`, and the derived `CryptoKey` resides strictly in transient JavaScript memory (never written to `localStorage`, `sessionStorage`, cookies, or IndexedDB)
**And** upon subsequent app launches, if ciphertext is detected, `storage.js` pauses loading and presents the modal prompt: *"Enter passphrase to open your habit notebook"*
**And** entering the correct passphrase decrypts the state into memory; entering an incorrect passphrase displays: *"Passphrase does not match. Try again or restore from an unencrypted backup."* with zero backdoor recovery.

### Story 5.3: Verified JSON Backup, Safe Restore & Deliberate Two-Stage Deletion

As a self-sovereign user,
I want to export raw JSON backups, safely restore my data, and have deliberate protection against accidental deletion,
So that I retain total ownership of my habit history with zero risk of catastrophic accidental data loss.

**Acceptance Criteria:**

**Given** the user is in Me > Sovereignty (`#/me`)
**When** reviewing backup status
**Then** a backup status chip displays the elapsed time since last export (e.g., *"Last backup: 3 days ago"*) with a gentle reminder badge if $> 30$ days
**And** clicking *"Download JSON Backup"* downloads a formatted `atomic-backup-YYYY-MM-DD.json` snapshot
**And** uploading a valid backup JSON file validates schema integrity (`schemaVersion: 2`) before merging or restoring state
**And** if the user clicks *"Delete All Data"*, a modal forces deliberate two-stage confirmation requiring the user to type `DELETE` into a confirmation field before clearing storage, preventing accidental wipeouts.

---

## Validation Summary

- **FR Coverage:** 26 / 26 Functional Requirements mapped and fully specified with testable Acceptance Criteria (100% coverage).
- **NFR Coverage:** NFR1 (Aesthetic & Zero-Shame), NFR2 (Local Sovereignty & Privacy), NFR3 (Cryptographic Rigor), NFR4 (Zero-Build ES Modules), and NFR5 (Reliability & Quarantine) governed across all stories.
- **Architecture Invariants:** AD-1 through AD-8 strictly enforced across module boundaries, storage singleton, append-only event log, local date arithmetic, firewall isolation, and pure statistical pattern engine.
- **UX Design Contract:** All 16 UX-DRs from `DESIGN.md` and `EXPERIENCE.md` incorporated into story acceptance criteria.
- **Dependency Flow:** Stories are strictly ordered within epics without forward dependencies; entities and tables are created only when required by stories.
- **Development Readiness:** Sized and specified for immediate pickup by developer agent Amelia (`bmad-agent-dev`) or sprint planning (`bmad-sprint-planning`).
