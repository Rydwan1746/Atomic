---
status: draft
stepsCompleted: []
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-atomic_v2-2026-11-01/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-atomic_v2-2026-11-08/architecture-atomic_v2-2026-11-08.md
  - _bmad-output/planning-artifacts/ux-designs/ux-atomic_v2-2026-11-03/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-atomic_v2-2026-11-03/EXPERIENCE.md
---

# atomic_v2 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for atomic_v2, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Single Storage Gateway — The system MUST funnel all persistent read and write operations exclusively through a unified storage module (storage.js).
FR2: Event-Driven Check-in Log — The system MUST record check-in occurrences as discrete events in an event log (state.events) containing id, habitId, date (local YYYY-MM-DD), at (ISO timestamp), atApproximate (boolean), version (full | minimal), and optional mood (1–5) and energy (1–5).
FR3: Dynamic Miss Computation — The system MUST compute habit misses dynamically on runtime queries with zero negative "miss records" stored in state.
FR4: Lossless Legacy Migration — The system MUST automatically detect legacy atomicHabits state, back up the raw string to atomicHabits_v1_backup, and transform all habits and completions into schemaVersion: 2 with atApproximate: true.
FR5: Identity-Centric Habit Definition — Users can create, edit, archive, and delete habits with a name, identity statement, and category selection (fixed 5 categories: Health, Learning, Creativity, Mindfulness, Connection).
FR6: Implementation Intention & Two-Minute Fallback — Users can optionally specify an Implementation Intention (time and place), a Two-Minute Version text string, and a Temptation Bundle text string.
FR7: Habit Stacking & Cascading Prompts — Users can configure a habit to trigger after an existing anchor habit (stackedAfter). Upon completing the anchor habit, the system opens a dialog presenting stacked habits with "Log it" and "Not now" actions, cascading recursively.
FR8: Today-Only Check-In & Undo — Users can toggle check-ins exclusively for the current local calendar date (date === today()). Tapping a completed habit removes today's event, restoring previous streak and state.
FR9: Micro-Mood & Reflection Capture — Following a check-in, the card displays a 5-point neutral mood selector (1 = Low, 5 = High) and an optional prompt to add a note to the journal tagged with habit ID.
FR9b: Physical Notebook Journal with Dynamic Lined Pages — The Journal writing area MUST present a tactile physical notebook aesthetic with horizontal ruled lines on a 28px grid matching line-height, taller viewport proportions (min 320px), dynamic line expansion as text grows, and warm paper styling tokens (--ruled-line-paper / --ruled-line-night).
FR10: Never-Miss-Twice Nudge — The system MUST evaluate whether a habit was missed yesterday and remains unlogged today, displaying a calm nudge offering the two-minute version (version: "minimal") preserving streak continuity, or "Not today" dismissal.
FR11: 30-Day Consistency Rate & Recovery Window — The system MUST compute and display the 30-day consistency rate (completed days / days active up to 30) and the average Recovery Time (days from miss to next check-in, displayed once >= 3 misses occur).
FR12: Weekly Identity Vote Aggregation — The system MUST sum all check-in events across the rolling last 7 days grouped by normalized identity statement and display the leading identity in the primary greeting.
FR13: 14-Day Strip & 12-Week Contribution Grid — Habit cards display a 14-day trailing check-in strip; expanding the habit detail reveals a full 12-week grid (Sunday to Saturday rows, oldest week left) with minimal check-ins rendered at 55% fill opacity and zero red fill.
FR14: Habit Scorecard — Users can log daily behaviors and assign awareness ratings: Positive (+), Negative (-), or Neutral (=) based on whether the action reinforces desired identity, with count summaries.
FR15: Pure Pattern Engine — The system MUST run deterministic pattern-matching functions (insights.js) evaluating weekday variance (>= 25% gap), time-of-day clustering (>= 60%), streak-break precursors (>= 50%), habit co-occurrences (>= 25%), and mood correlates, with sample sizes and collapsible "Why am I seeing this?" proofs.
FR16: Recurring-Theme NLP Detector — The system MUST scan all journal entries and miss notes to identify words repeated across >= 3 distinct entries (>= 4 letters, excluding stopwords), unlocking after 8 entries and listing top 10 recurring words with counts and links.
FR17: Weekly Review Protocol — The system MUST provide a Weekly Review guided flow (and 7-Day Pulse) synthesizing weekly votes, strongest unlocked insight, theme-derived reflection, and an open intention prompt saved to journal.
FR18: Alter Ego Profile & Prompt Representation — Users can define an Alter Ego profile consisting of an optional name, rich narrative description, 3 core values, an obstacle handling philosophy, and 3 specific behavioral habits; the Future-Self chat prompt box MUST display a concise generic placeholder without cluttering traits on screen, while all attributes are injected into model context behind the scenes.
FR19: Offline Scenario Simulator — Before an LLM provider is connected, the scenario simulator MUST generate templated self-reflection prompts mapping user scenarios to Alter Ego obstacle style and defined behaviors.
FR20: WOOP Goal & Obstacle Planning — Users can author WOOP entries (Wish, Outcome, Obstacle, Plan: "If {obstacle}, then I will {action}") with optional habit links, appearing as contextual hints on habit cards and Never-Miss-Twice nudges.
FR21: Distinct Chat Roles, Guardrails & Bidirectional Redirection — The Chat interface MUST enforce two distinct modes with strict guardrails: Objective Mirror (factual habit metrics, non-judgmental UI voice; refuses coaching/philosophy) and Dialogue with Future Self (mentorship on identity, values, obstacle navigation; refuses raw metric computations); out-of-scope queries trigger redirection text and an interactive switch button (Switch to Future Self → / Switch to Objective Mirror →).
FR22: Context Injection & Privacy Firewall — Chat prompts dynamically ingest local active habits, check-in history, non-private journal reflections, and future-self traits; entries marked private: true or tagged #private are strictly excluded; persistent privacy chip previews outbound context.
FR23: Local LLM via Ollama & Graceful Offline Fallback — Primary local LLM integration via Ollama (http://localhost:11434) for private, on-device chat responses; if Ollama is unreachable or errors, system displays a non-blocking toast and seamlessly falls back to static templated reflection without interrupting input or data entry; cloud options (Gemini 2.5 Flash, BYOK) remain optional in Settings.
FR24: Standard RFC 5545 .ics Export — Users can export an atomic-reminders.ics calendar file containing daily recurring VEVENT entries with RRULE:FREQ=DAILY, accurate timezone formatting, 10-minute duration, intention-based summary, and VALARM notification trigger.
FR25: In-Tab Web Notifications — Users can enable optional in-tab browser notifications via the native Notification API while the application tab remains open.
FR26: Full-State Passphrase Encryption — Users can activate passphrase protection in Me > Privacy and Data using PBKDF2/AES-256-GCM client-side encryption.

### NonFunctional Requirements

NFR1: Aesthetic & Tone / Zero-Shame — Warm paper notebook palette (--bg-page: #FAF8F5) for light mode, desaturated slate navy (--bg-page: #151A24) for night mode, warm amber accents (--accent-future: #E0A94F). Dual-font hierarchy (Georgia/Palatino serif for identity/journal/future-self; System sans-serif for UI/stats/mirror). Physical notebook journal canvas with 28px horizontal ruled line grid. Zero-shame copy with factual second-person tone. Gamified scoring, confetti, XP, loss-framed streak warnings, and red notification badges are strictly prohibited.
NFR2: Local Sovereignty & Data Privacy — 100% of user data resides in client-controlled browser storage (localStorage key atomic.v2). Zero external fonts, zero third-party telemetry, zero remote tracking pixels, zero developer-operated cloud backend in v1.
NFR3: Cryptographic Rigor — Key derivation via PBKDF2 with HMAC-SHA256 and 600,000 iterations; AES-256-GCM symmetric encryption with 16-byte salt and 12-byte IV per save. Derived keys remain strictly in transient memory.
NFR4: Performance & Zero-Build Vanilla Footprint — Native browser ECMAScript modules (<script type="module" src="js/main.js">) without npm build steps, bundlers, compilers, or CDN runtime scripts. Initial page load < 200ms. Automated tests run via Node.js built-in node:test runner.
NFR5: Reliability, Quota & Graceful AI Degradation — All storage read/write operations wrapped in strict try/catch blocks; corrupted state halts saving and surfaces emergency JSON backup export prompt. Chat network/daemon failures (e.g. Ollama offline) trigger non-blocking notices and fall back cleanly to static templated reflection without throwing uncaught exceptions or blocking user input.

### Additional Requirements

- AD-1: Strict Layered Unidirectional Dependency Boundary (UI -> Domain -> Core; UI -> AI -> Core). Core and Domain modules have zero DOM dependencies.
- AD-2: Unified Storage Gateway (js/core/storage.js) as the sole reader/writer of localStorage['atomic.v2'], with idempotent v1 backup and migration.
- AD-3: Append-Only Check-in Event Log with Zero Stored Miss Records; streaks, 30-day rates, and identity votes dynamically projected at runtime.
- AD-4: Strict Local Calendar Date Strings (YYYY-MM-DD) derived from local date getters (UTC date getters forbidden for calendar dates) and today-only check-in enforcement.
- AD-5: Client-Side Privacy Firewall (js/ai/firewall.js), Google Gemini (gemini-2.5-flash) as cloud adapter, local Ollama adapter (http://localhost:11434), and BYOK adapter with direct browser fetch.
- AD-6: Full-State PBKDF2 / AES-256-GCM Envelope with Ephemeral In-Memory Keys.
- AD-7: Deterministic Pure Statistical Pattern Engine with standardized { id, type, unlocked, sampleSize, message, proof } contracts and collapsible proof disclosures.
- AD-8: Greenfield Starter Structure: Zero-dependency native browser ES2022+ modules, vanilla CSS with custom properties, and unit test harness in tests/run.js using node:test and node:assert/strict.

### UX Design Requirements

UX-DR1: Color Tokens & Paper/Night Dual Themes — Semantic CSS custom properties for Paper (#FAF8F5) and Night (#151A24) palettes, warm amber highlights (#E0A94F), cool slate (#4A6A8A), fixed 5 category colors (Health, Learning, Creativity, Mindfulness, Connection), and prohibited red styling.
UX-DR2: Dual Typography Hierarchy — Serif (--font-voice: Georgia, Palatino) for identity statements, journal prompts/body, and Future-Self dialogue; System sans-serif (--font-ui) for tool labels, buttons, metrics, and Mirror Mode.
UX-DR3: Responsive Layout & Navigation Chrome — Mobile bottom navigation bar (64px + safe area inset, 5 destinations, 4px warm amber dot indicator); Desktop fixed 220px left sidebar with serif "Atomic" wordmark and rounded capsule active tabs.
UX-DR4: Habit Card & Tactile Stamp Button — Habit card with identity hero title, 44x44px stamp button with transform: scale(0.94) active resistance, category ink bloom, 1-tap undo, and card body click routing to Habit Detail.
UX-DR5: 14-Day Trailing Timeline with Anchor — 14-day history strip on habit cards with 2px amber highlight ring on Today's cell, tooltip dates, and 55% tint opacity for minimal check-ins.
UX-DR6: Smooth Mood Picker Reveal — 5-point neutral mood selector (1 to 5) gliding smoothly underneath the stamp button over 280ms (opacity: 0 -> 1, translateY(-4px) -> 0) without layout jumps.
UX-DR7: Unfolding Pact Multi-Beat Creation Flow — 4-beat dialog for habit creation: Beat 1 (Identity: "Who are you becoming?"), Beat 2 (Vote: "What is one small daily vote?"), Beat 3 (Domain chip picker), Beat 3b (Stacking anchor picker), Beat 4 (Compassionate safety net fork for two-minute version and implementation intention).
UX-DR8: Today Switcher (Daily Votes <-> Habits Scorecard) — 180ms cross-fade between Daily Votes and Habits Scorecard on #/today; Scorecard rows with +, =, − ratings, slate "Noticed, not judged" microcopy for −, promote-to-identity ghost action for +, and stacking-anchor ghost action for =.
UX-DR9: Ruled Physical Notebook Journal — 28px locked background rule grid matching line-height, dynamic line expansion as text grows, taller viewport canvas (min 320px), auto-growing textarea, daily prompt card, and reverse-chronological entry history cards.
UX-DR10: Never-Miss-Twice Nudge Row — Contextual intervention card when yesterday was missed: "Yesterday was a miss. Today is the day that counts. Try the two-minute version: {twoMinuteVersion}" with "Do 2-min version" (minimal event) and "Not today" dismissal.
UX-DR11: Curtain Rising Unlock System for Insights — Cold start (< 7 days) roadmap displaying upcoming insight thresholds and 6px progress bars; unlocked discovery cards featuring tentative observations, evidence pills with raw date inspection, and "Reflect in Journal" bridges.
UX-DR12: 7-Day Rolling Pulse Ambient Card — Pinned top card on Insights showing rolling 7-day votes across identities; ambient, unscheduled, and never overdue.
UX-DR13: Dual-Mode Chat Atmosphere, Guardrails & Redirection — Mirror Mode (cool slate, sans-serif) vs Future-Self Mode (warm amber, serif), simplified generic prompt box ("Ask your future self anything..."), interactive redirection switch buttons (Switch to Future Self → / Switch to Objective Mirror →), Alter Ego prerequisite gate, hard 120-word limit, and persistent privacy chip previewing outbound JSON payload.
UX-DR14: Me Surface Identity Portfolio & Sovereignty — Zone 1 (Identity cards with all-time votes & 30d consistency, Alter Ego profile authoring, WOOP planner) and Zone 2 (Theme switcher, RFC 5545 calendar export, passphrase vault toggle, backup status chip, deliberate typed "DELETE" confirmation).
UX-DR15: Habit Detail Deep History View — Dedicated route #/habit/:id displaying 12-week Sunday-to-Saturday contribution grid (minimal check-ins at 55% tint), implementation intention statement, and linked journal notes.
UX-DR16: Accessibility & Interaction Floor — WCAG AA color contrast compliance, explicit aria-label and title attributes on stamp buttons, timeline cells, and mood buttons, prefers-reduced-motion instantaneous transitions, and >= 44x44px touch targets.

### FR Coverage Map

{{requirements_coverage_map}}

## Epic List

{{epics_list}}

<!-- Repeat for each epic in epics_list (N = 1, 2, 3...) -->

## Epic {{N}}: {{epic_title_N}}

{{epic_goal_N}}

<!-- Repeat for each story (M = 1, 2, 3...) within epic N -->

### Story {{N}}.{{M}}: {{story_title_N_M}}

As a {{user_type}},
I want {{capability}},
So that {{value_benefit}}.

**Acceptance Criteria:**

<!-- for each AC on this story -->

**Given** {{precondition}}
**When** {{action}}
**Then** {{expected_outcome}}
**And** {{additional_criteria}}

<!-- End story repeat -->
