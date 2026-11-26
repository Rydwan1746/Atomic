---
name: Atomic
status: final
sources:
  - _bmad-output/planning-artifacts/prds/prd-atomic_v2-2026-11-01/prd.md
  - docs/atomic-ui-guidelines.md
  - _bmad-output/planning-artifacts/ux-designs/ux-atomic_v2-2026-11-03/DESIGN.md
updated: 2026-11-08
---

# Atomic — Experience Spine (`EXPERIENCE.md`)

> Owns information architecture, interaction behavior, microcopy, states, and user journeys. Cross-references visual tokens defined in [`DESIGN.md`](/_bmad-output/planning-artifacts/ux-designs/ux-atomic_v2-2026-11-03/DESIGN.md).

---

## 1. Foundation

- **Platform & Form-Factor:** Responsive web application (Mobile < 900px, Desktop ≥ 900px). Local-first client architecture running in modern browsers.
- **Visual Reference:** Fully specified by [`DESIGN.md`](./DESIGN.md). Paper mode (`{colors.bg-page-paper}`) and Night mode (`{colors.bg-page-night}`). Visual reference mockups in [`mockups/`](./mockups/) illustrate key screens; both spines (`DESIGN.md` and `EXPERIENCE.md`) win on conflict with any mockup or wireframe.
- **Core Philosophy:** Bring the unconscious into consciousness. Habits are votes for identity; missed days are neutral diagnostic data; reflection is unforced and calm.

---

## 2. Information Architecture

Atomic is organized into five primary surfaces accessible via hash routing (`#/today`, `#/journal`, `#/insights`, `#/chat`, `#/me`). Only one surface is active at a time.

| Surface | Route | Purpose | Key Components |
|---|---|---|---|
| **Today** | `#/today` | Daily vote dashboard, habit check-in & autopilot awareness | Greeting, Identity votes banner, **Today Switcher** (`Daily Votes` ⇄ `Habits Scorecard`), Habit cards, Stamp buttons, Scorecard rows, Unfolding Pact (`+ New Habit`), Fresh Page invitation (empty state). |
| **Journal** | `#/journal` | Daily prompt reflection & history | Daily prompt card, Ruled ledger textarea, Mood/Energy tags, Reverse-chronological entry cards on ruled ledger paper. |
| **Insights** | `#/insights` | Behavioral pattern awareness | **7-Day Rolling Pulse** (top), Discoveries feed with evidence pills and Curtain Rising unlock cards, Themes. No scheduled weekly ritual. |
| **Chat** | `#/chat` | Dual-mode introspection sanctuary | **Mirror Mode** (cool slate atmosphere, sans-serif, objective metrics) & **Future-Self Mode** (amber atmosphere, serif, Alter Ego dialogue), Persistent Privacy Chip, 120-word response limit. |
| **Me** | `#/me` | Identity portfolio, sovereignty & settings | **Zone 1 — Identity:** Identity Portfolio, Alter Ego authoring, WOOP plans. **Zone 2 — Sovereignty:** Theme, calendar export, passphrase encryption, backup, deletion. |
| **Habit Detail** | `#/habit/:id` | Deep history for one habit | 12-week contribution grid, implementation intention, two-minute version, recent linked journal notes. |

---

## 3. Voice and Tone

Microcopy principles. Brand voice and aesthetic posture live in [`DESIGN.md`](./DESIGN.md).

| Do | Don't | Why |
|---|---|---|
| *"Yesterday was a miss. Today is the day that counts."* | *"You broke your 5-day streak!"* | No shame. Never weaponize the calendar against the user. |
| *"Who are you becoming?"* | *"Enter habit name:"* | Prime identity before behavior. |
| *"Life gets busy. Would you like a 2-minute safety net?"* | *"Setup fallback required"* | Compassionate pacing, not administrative compliance. |
| *"14 votes this week for a reader"* | *"Level 4 Reader (280 XP)"* | Identity votes, not gamified points or badges. |
| *"Stays on this device."* | *"Privacy policy updated"* | Plain, honest reassurance of local data sovereignty. |
| *"Done. Tap to undo."* | *"Checked in successfully!"* | Fast one-tap capture with effortless, forgiving undo. |
| *"Noticed, not judged."* | *"Bad habit detected ⚠"* | Scorecard `−` rows are neutral self-awareness data, never accusations. |
| *"Summary sent to Ollama (Aggregated stats only)"* | *"Sending your data..."* | Privacy chip microcopy must specify exactly what is shared and to whom. |
| *"Before conversing with your future self, author their values in Me > Alter Ego."* | *"Feature locked"* | Respectful gating with a clear, actionable path forward. |

---

## 4. Component Patterns

Behavioral rules. Visual specs live in `DESIGN.md` § Components (`{components}`).

### 4.1 The Check-In Stamp Button
- **Visual Reference:** [`mockups/key-today.html`](./mockups/key-today.html) illustrates the habit card layout, checked and unchecked stamp states, and the 14-day timeline.
- **Placement:** Upper-right corner of each habit card, separated from identity title.
- **Interaction:**
  - One tap stamps the vote. Active press scales down (`transform: scale(0.94)`) to provide tactile resistance against accidental mis-taps.
  - Tapping the card body or identity title navigates to detail view (`#/habit/:id`); it does *not* trigger a stamp.
  - Upon stamping, the button blooms with category ink, and the "Today" cell on the timeline fills.
  - After stamping, the mood picker smoothly reveals underneath over 280ms (`opacity: 0 -> 1`, `transform: translateY(-4px) -> translateY(0)`). Zero layout jumping.
  - Immediate undo: Tapping the stamped button immediately unchecks the habit and reverts the mood picker without penalty.

### 4.2 The 14-Day Timeline with Anchor
- **Behavior:** Renders the last 14 calendar days ending on "Today".
- **Visual Anchor:** The 14th cell ("Today") is highlighted with a 2px amber accent ring (`{colors.today-highlight-ring}`).
- **Cell Tooltips:** Native descriptive title on hover/focus (e.g. `Fri 3 Nov: done` or `not done`).
- **Minimal Check-in:** Check-ins marked as the two-minute version render with a 55% tint opacity.

### 4.3 The Unfolding Pact (Habit Creation)
- **Trigger:** Tapping `+ New Habit` on the Today screen.
- **Pacing Rhythm:**
  - **Beat 1 (Identity):** *"Who are you becoming?"* (Serif). User enters identity (e.g., *"A reader"*). Pressing `Enter` folds this answer into a quiet summary breadcrumb (`Becoming: A reader`) and reveals Beat 2.
  - **Beat 2 (The Vote):** *"What is one small daily vote for that person?"* (e.g., *"Read 10 pages"*). Pressing `Enter` advances.
  - **Beat 3 (Domain):** Five quiet category chips (`Health`, `Learning`, `Creativity`, `Mindfulness`, `Connection`). Tapping a chip immediately advances.
  - **Beat 3b (Stacking Anchor — Optional):** A quiet secondary question: *"Stack this vote after an existing routine?"* The picker lists both active identity habits AND behaviors the user has flagged as stacking anchors in the Habits Scorecard.
  - **Beat 4 (The Safety Net Fork):** Displays the compassionate fork:  
    *"Life gets busy and energy dips. Would you like to set a 2-minute safety net for tough days? (Optional, but recommended so you never miss twice)."*  
    - If user clicks `Add safety net`: Expands two quiet fields (Two-minute version & Implementation intention), then finishes.
    - If user clicks `I'm ready — create habit`: Instantly creates the habit card on the Today screen with a gentle bloom.
- **Keyboard Ergonomics:** `Enter` key advances automatically; `Esc` cancels back to Today; tapping previous summary lines allows instant in-place editing.

### 4.4 The Ruled Journal Ledger (Option B)
- **Visual Reference:** [`mockups/key-journal.html`](./mockups/key-journal.html) illustrates the 28px ruled lines on Paper mode, daily prompt card, and past ledger card.
- **Behavior:** Applied across both the active reflection draft area and the historical entry cards.
- **Rhythm:** Background rules locked to `28px` grid. Textarea auto-grows with content. Body text sits comfortably on the lines without drifting.
- **Theme Adaptation:** Warm sepia tone (`{colors.ruled-line-paper}`) in Paper mode; muted low-contrast slate (`{colors.ruled-line-night}`) in Night mode.

### 4.5 The Fresh Page Invitation (Empty State)
- **Behavior:** Rendered when no habits exist.
- **Elements:**
  - James Clear quotation in `{typography.identity-hero}`.
  - Warm invitation text.
  - Primary call-to-action button: `Begin your first vote →`, which directly triggers the Unfolding Pact.

### 4.6 Today Switcher: Daily Votes ⇄ Habits Scorecard
- **Visual Reference:** [`mockups/key-scorecard.html`](./mockups/key-scorecard.html) illustrates the top switcher in Habits Scorecard mode, +/=/− rating badge states, and neutral non-judgmental microcopy.
- **Trigger:** Clean two-tab switcher directly beneath the Today greeting and identity banner.
- **Switching Behavior:** A 180ms cross-fade swaps the main content (habit cards ⇄ scorecard rows). No navigation away from `#/today`.
- **Scorecard Row Interaction:**
  - Each row captures a behavior name + rating badge (`+`, `=`, `−`). Min-height 52px touch target.
  - `−` (Negative) rating: Badge fills in muted slate. Quiet microcopy appears below: *"Noticed, not judged."* **No red coloring.**
  - `+` (Positive) rating: Badge fills in calm raised-page background. Ghost link appears: *"Promote to identity habit →"* — opens Unfolding Pact with the behavior pre-filled.
  - `=` (Neutral) rating: Ghost link appears: *"Use as stacking anchor →"* — saves the routine to the Unfolding Pact's Beat 3b stacking picker.

### 4.7 Insights: Curtain Rising Unlock System
- **Cold Start Behavior:** When fewer than 7 days of data exist, Insights shows a progress roadmap of upcoming insight milestones rather than an empty void.
  - Each locked card displays: what the insight will reveal, the unlock threshold, and a live progress bar.
  - Example: *"Weekday patterns unlock at 21 days. 12 of 21 so far."* + 6px progress bar.
- **Unlocked Discovery Card Anatomy:**
  1. Tentative observation: *"Reading seems to slip on Thursdays: missed 4 of 5."*
  2. Evidence pill: `Based on 5 Thursdays · Tap to inspect dates` (tapping shows raw date list).
  3. Bridge action: `Reflect in Journal →` (opens Journal with pre-filled prompt).

### 4.8 Insights: 7-Day Rolling Pulse Card
- A passive summary card pinned at the top of the Insights surface.
- Shows: votes cast per identity in the rolling last 7 calendar days.
- **Never gated by day of week, never scheduled, never overdue.** It updates silently in the background and is always available as an ambient glance.

### 4.9 Chat: Dual-Mode Introspection Sanctuary
- **Visual Reference:** [`mockups/key-chat.html`](./mockups/key-chat.html) illustrates the side-by-side comparison of Mirror Mode (cool slate) vs Future-Self Mode (warm amber), assistant font differentiation, and persistent privacy chip.
- **Mirror Mode:**
  - Frame accent: cool slate (`{colors.accent-mirror}`).
  - Label: *"The Objective Mirror."*
  - AI persona: calm, objective, analytical. Responds in sans-serif UI voice.
  - Sends: aggregated behavioral stats, streak data, and pattern summaries. Never raw journal text.
- **Future-Self Mode:**
  - Frame accent: warm amber (`{colors.accent-future}`).
  - Label: *"Dialogue with Your Future Self."*
  - AI persona: grounded in the user's defined Alter Ego values and obstacle strategy. Responds in serif voice.
  - Alter Ego gate: If no Alter Ego profile exists, shows a stationery card: *"Before conversing with your future self, author their values in Me > Alter Ego."*
- **The 120-Word Rule:** Every AI response is hard-limited to 120 words. Every response ends with either a reflective question or an action bridge: `Take this into today →` or `Write in Journal`.
- **Privacy Chip (Always-On):** Pinned above the input field at all times in both modes. Displays: `🔒 Aggregated stats only (0 raw journal entries shared) · Tap to preview payload`. Tapping shows the exact JSON payload before any message is sent.

### 4.10 Me: Identity Portfolio & Sovereignty
- **Zone 1 — Identity Portfolio (Top Half):**
  - **Identity Cards:** One card per active voted-for identity. Displays the identity name in serif, all-time vote count (amber), and 30-day consistency percentage.
  - **Alter Ego Authoring:** A calm, purple-tinted card with three fields: *Core Values* (up to 3), *Behavioral Archetype* (free text), and *Obstacle Strategy* (If/Then: *"When blocked, I will..."*).
  - **WOOP Planner:** Left amber-bordered cards. Each WOOP: Wish, Outcome, Obstacle, and Plan (*"If [Obstacle], then I will [Action]"*).
- **Zone 2 — Sovereignty (Bottom Half):**
  - Appearance: Theme (Paper / Night / Auto) + Warm Evening Tint toggle.
  - Calendar Reminders: RFC 5545 `.ics` export with one-tap generation.
  - Zero-Knowledge Vault: Optional passphrase encryption with AES-256-GCM / PBKDF2.
  - Backup status chip (*"Last backup: 3 days ago"*) with gentle 30-day reminder badge.
  - Two-stage deliberate deletion: requires typing `DELETE` in a text prompt before proceeding.

### 4.11 Navigation Chrome & Tab Bar / Sidebar (`nav-pill`)
- **Behavior:**
  - On mobile (`< 900px`): Persistent bottom bar with 5 destinations (`Today`, `Journal`, `Insights`, `Chat`, `Me`). Active destination is marked with a 4px warm amber dot indicator centered below the label. Tap targets are ≥ 44x44px.
  - On desktop (`≥ 900px`): Left sidebar (220px width) with serif "Atomic" wordmark. Active tab displays as a rounded capsule (`{components.nav-pill.borderRadius}`) with `{colors.bg-raised-paper}` background and amber left border indicator.
  - Keyboard accessibility: Standard tab key traversal, arrow keys between navigation destinations, and `Enter` / `Space` to activate. Active route has `aria-current="page"`.

### 4.12 Habit Card Anatomy & Interaction Separation (`habit-card`)
- **Behavior:**
  - Card body click vs Stamp click: Tapping anywhere on the card body, identity title, or stats navigates to the Habit Detail view (`#/habit/:id`). Only clicking directly on the 44x44px stamp button records a vote.
  - Visual hierarchy: Identity statement (*"A reader"*) sits in `{typography.identity-hero}` as the visual anchor. Habit action (*"Read 10 pages"*) sits underneath in secondary size.
  - Stacking badge: If a habit is stacked after another habit or Scorecard routine, a quiet stacking chip appears beneath the habit title: *"Stacked after: Morning coffee"*. Tapping the chip navigates to that anchor routine.

---

## 5. State Patterns

| State | Surface | Treatment |
|---|---|---|
| **First-Run (0 Habits)** | Today | Renders **Fresh Page Invitation** stationery card with Clear quote and `Begin your first vote →`. |
| **Yesterday Missed** | Today Card | Surfaces **Never-Miss-Twice Nudge**: *"Yesterday was a miss. Today is the day that counts. Try the two-minute version: {twoMinuteVersion}."* Buttons: `Do 2-min version` (logs minimal event) and `Not today`. No red warnings. |
| **Done Today** | Today Card | Stamp button filled in category ink. Mood picker smoothly visible (*"How did it feel? [1][2][3][4][5]"*). Button reads *"Done. Tap to undo"*. |
| **Empty Journal** | Journal | Warm card: *"Nothing written yet. Your first entry can be one sentence."* With today's prompt ready above. |
| **Active Stacking** | Today | After checking in a habit with stacked followers, stacking dialog gently offers: *"Ready for the next one? Log it / Not now"*. |
| **Storage Error** | Me | Non-blocking inline banner: *"Stored data could not be read. Saving paused to protect history."* With one-click JSON backup export. |
| **Insights Cold Start (< 7 days)** | Insights | Full **Curtain Rising** unlock roadmap replaces empty state. Each locked card shows milestone, data progress, and a warm 6px progress bar. Never an error or empty void. |
| **Empty Scorecard** | Today (Scorecard tab) | Warm instructional card: *"Your Scorecard is a compass. List all your daily routines, from waking up to going to sleep. Rate each one honestly: does it strengthen who you want to become?"* + `Add first behavior →` button. |
| **Alter Ego Not Set (Future-Self Mode)** | Chat | Stationery gate card: *"Before conversing with your future self, author their values in Me > Alter Ego."* + `Set up Alter Ego →` bridge button. |
| **AI Provider Not Set (Chat)** | Chat | Quiet placeholder: *"AI reflection is off. You can enable it with Google Gemini (recommended, free 1-click key) or local Ollama in Me > Settings, or use offline reflection."* |
| **Chat Offline / Local AI Unavailable** | Chat | Inline notification above input: *"Local reflection server unreachable at localhost:11434. Responses paused. Your entries remain safely stored locally."* Input disabled with retry link. |
| **Vault Locked (Encrypted Session)** | Me / App Entry | If passphrase vault is enabled and session expired: Prompt card *"Enter passphrase to open your habit notebook"*. Decryption occurs purely in-memory via PBKDF2/WebCrypto; no cloud fallback. |
| **Habit Detail: Cold Load (0 check-ins)** | Habit Detail | Empty 12-week grid renders quiet empty cells with message: *"Every long journey begins with a single vote. Cast your first vote today."* |
| **Insights: Full Unlock State** | Insights | All Curtain Rising cards convert to active Discovery cards with full correlation charts, day-of-week trends, and journal reflection bridges. |

---

## 6. Interaction Primitives

- **Touch & Tap:** Every tap target is strictly ≥ 44x44px. Touch targets maintain ≥ 8px clearance.
- **Press Feedback:** Interactive stamps and buttons exhibit subtle active scaling (`transform: scale(0.94)`).
- **Undo Window:** Stamped habits can be undone at any time during the day by re-tapping the stamp.
- **Banned Interactions:** No confetti explosions, no shake animations on misses, no streak loss warnings, no auto-advancing carousels, no modal dialog traps.

---

## 7. Accessibility Floor

- **Color Contrast:** All text meets WCAG AA (minimum 4.5:1 for normal text, 3:1 for large text). Category colors are never used alone to convey status without text or shape cues.
- **Screen Reader Support (`aria`):**
  - Timeline cells have explicit `title` and `aria-label` (`"Fri 3 Nov: done"`).
  - Mood buttons declare `aria-label="Mood 3 of 5, selected"`.
  - Check-in stamp declares `aria-label="Mark done: Read 10 pages for A reader"`.
- **Reduced Motion (`prefers-reduced-motion: reduce`):**
  - Transitions (`transform`, `opacity`) are instantly applied (`transition: none !important`). Mood picker appears immediately without animation.

---

## 8. Inspiration & Anti-patterns

- **Inspiration — James Clear (*Atomic Habits*):** Identity-based habits (*"Every action is a vote"*), the 2-minute rule, habit stacking, and the cardinal rule of never missing twice.
- **Inspiration — Don Norman (*The Design of Everyday Things*):** Visceral aesthetics (warm paper stationery), clear perceived affordances (stamps with press resistance), and natural error forgiveness (one-tap undo).
- **Anti-pattern Rejected — Gamification:** No XP, levels, confetti, badges, or competitive scoreboards. Atomic is a quiet mirror, not an arcade game.
- **Anti-pattern Rejected — Guilt & Shame:** No red badges, broken streak warning banners, or accusatory language. A missed day is purely neutral diagnostic data.

---

## 9. Responsive & Platform

- **Mobile Viewport (`< 900px`):**
  - Bottom navigation bar: 64px high + `env(safe-area-inset-bottom)`.
  - Refined typographic tab labels with an active amber indicator dot centered beneath the selected tab.
  - Single-column card flow with 14px vertical gap.
- **Desktop Viewport (`≥ 900px`):**
  - Fixed 220px left navigation sidebar.
  - "Atomic" wordmark in serif at the top of the sidebar.
  - Selected tab indicated by rounded capsule (`{colors.bg-raised-paper}`) with amber indicator edge.
  - Main content centered in 760px column with 20px vertical gap.

---

## 10. Key User Flows

### Flow 1: Daily Check-In & Micro-Reflection (Marcus, 9:30 PM)
1. Marcus opens Atomic on his mobile browser.
2. The Today screen displays his habit: *"Read 10 pages · A reader"*.
3. The 14-day timeline highlights today's cell with an amber ring.
4. Marcus taps the intentional Stamp button in the top-right corner.
5. **Climax:** The stamp blooms with category ink; the today cell fills; the 5-point mood picker smoothly glides into view without jumping the card.
6. Marcus taps Mood 4 ("Focused"). The header quietly updates: *"15 votes this week for a reader"*.
7. *Failure/Undo Path:* If Marcus accidentally tapped the wrong habit, he taps the stamped button again within the session. The vote instantly unchecks, the mood selector gracefully hides, and the event is erased from local storage with zero penalty.

### Flow 2: Never-Miss-Twice Recovery (Sarah, 7:15 AM)
1. Sarah missed her morning meditation yesterday.
2. She opens Atomic; the "Mindfulness" card displays the Never-Miss-Twice nudge row:  
   *"Yesterday was a miss. Today is the day that counts. Try the two-minute version: Sit quietly for 1 minute."*
3. **Climax:** Relieved that she doesn't have to do a full 20-minute session, Sarah sits for one minute and taps *"Do the 2-minute version"*.
4. The stamp fills, the cell logs with a 55% minimal-check-in tint, and Sarah's momentum is saved.
5. *Failure/Skip Path:* If Sarah genuinely cannot perform even the 2-minute version today, she taps *"Not today"*. The nudge dims gently into a quiet missed state without shame, alarms, or red highlights.

### Flow 3: Creating a Habit via The Unfolding Pact (David, Sunday Afternoon)
1. David opens Atomic and taps `+ New Habit`.
2. The card poses the first question: *"Who are you becoming?"*
3. David types *"A calm writer"* and hits `Enter`.
4. His answer smoothly tucks into a summary breadcrumb (`Becoming: A calm writer`), and prompt 2 appears: *"What is one small daily vote for that person?"*
5. David types *"Write 100 words"* and hits `Enter`.
6. He taps the `Creativity` category chip.
7. In Beat 3b, the stacking picker shows: *"Morning coffee (Scorecard anchor)"* — David taps it to stack his new habit after his existing morning coffee routine.
8. **Climax:** The card asks: *"Life gets busy. Would you like to set a 2-minute safety net for tough days?"* David selects `Add safety net`, enters *"Write 1 sentence"*, and clicks finish.
9. The new habit card settles onto his Today screen, stacked after Morning coffee, ready for its first vote.
10. *Failure/Correction Path:* At any point before saving, David can tap any earlier summary breadcrumb to revise his identity or vote text without restarting the flow, or press `Esc` to cancel back to Today.

### Flow 4: Scorecard Autopilot Awareness (Marcus, Thursday Night)
1. Marcus notices he feels vaguely off-track. He switches to the **Habits Scorecard** tab on Today.
2. He reviews his day and rates *"Checked phone on waking"* as `−`.
3. **Climax:** Quiet microcopy appears beneath: *"Noticed, not judged."* No red, no alarm.
4. He rates *"Morning coffee"* as `=` and sees the ghost link: *"Use as stacking anchor →"*.  He saves it as an anchor for his future habit.
5. He rates *"Gym session"* as `+` and taps *"Promote to identity habit →"*, which opens the Unfolding Pact with *"Gym session"* pre-filled.
6. *Failure/Re-rating Path:* Marcus accidentally tapped `−` on Morning coffee. Tapping `=` immediately updates the rating state with zero confirmation modals or friction.

### Flow 5: Discovering an Autopilot Pattern (Elena, Insights Tab)
1. Elena navigates to Insights. At the top, the **7-Day Pulse** shows: *"18 votes cast this week across 3 identities."*
2. She scrolls to see an unlocked Discovery card: *"Deep Work seems to slip on Thursdays: missed 4 of 5."*
3. She taps the evidence pill: `Based on 5 Thursdays · Tap to inspect dates` — the raw date list confirms the pattern.
4. **Climax:** She taps `Reflect in Journal →`; the Journal opens with the pre-seeded prompt: *"Why do Thursdays feel heavier for deep work?"*
5. Elena writes a reflection and leaves with new self-awareness.
6. *Cold Start/Failure Path:* If fewer than 7 days of logs exist, Elena sees the Curtain Rising roadmap instead of empty voids, clearly showing that Weekday patterns unlock after 21 logged days with a live progress bar.

### Flow 6: Mirror Mode Consultation (Elena, Chat Tab)
1. Elena opens Chat and selects **Mirror Mode**.
2. The frame shifts to a cool slate atmosphere. Label: *"The Objective Mirror."*
3. Privacy chip shows: `🔒 Aggregated stats only (0 raw journal entries shared)`.
4. Elena types: *"How consistent have I actually been with deep work this month?"*
5. **Climax:** The AI responds in calm, analytical sans-serif voice (max 120 words): *"Over 30 days, Deep Work has an 82% consistency rate (18 check-ins). Your check-ins cluster between 08:00 and 10:00. After missed days, your average recovery time is 2.3 days. What is happening on that second day?"*
6. Elena taps `Write in Journal` to begin reflecting.
7. *Offline/Failure Path:* If the local Ollama daemon is unreachable, the input remains enabled for drafting while a non-blocking toast informs: *"Local model offline. Entries remain safely saved in your local journal."*

### Flow 7: Future-Self Dialogue (Alex, Chat Tab)
1. Alex opens Chat, selects **Future-Self Mode**.
2. The frame shifts to warm amber atmosphere. Label: *"Dialogue with Your Future Self."*
3. Alex types: *"I'm sitting at my desk feeling totally blocked and want to scroll Twitter."*
4. **Climax:** Drawing on Alex's Alter Ego values (*Presence, Courage, Craft*) and obstacle strategy, the reply comes in warm serif: *"Remember that perfection is just fear in a suit. What is the worst, most messy sentence you could put on paper right now? Write just that one."*
5. Alex closes the app inspired and logs a micro-win.
6. *Gated State Path:* If Alex has not yet authored an Alter Ego in Me, the chat displays a quiet stationery invitation card: *"Before conversing with your future self, author their values in Me > Alter Ego"* with a direct bridge button.

### Flow 8: Authoring the Identity Portfolio (Elena, Me Tab)
1. Elena opens Me. The first thing she sees is her **Identity Portfolio**: two warm cards — *"A focused creator: 41 all-time votes · 72% last 30 days"* and *"A calm mind: 28 votes · 55% last 30 days"*.
2. She taps *"Set up Alter Ego"* — the purple-tinted Alter Ego card opens.
3. She enters: Core Values: *Presence, Courage, Craft.* Obstacle Strategy: *"When blocked, I write one bad sentence to break the dam."*
4. **Climax:** Future-Self Mode in Chat is now unlocked and anchored to Elena's defined principles.

### Flow 9: Vault Sealing & Data Sovereignty (David, Me Tab)
1. David navigates to `#/me` to back up his year-long habit notebook.
2. In Zone 2 (Sovereignty), he reviews the backup status: *"Last backup: 14 days ago"*.
3. He toggles on **Zero-Knowledge Vault**; the system prompts him for a passphrase.
4. **Climax:** David enters a secure passphrase; WebCrypto derives an AES-256-GCM key via PBKDF2 (100,000 iterations), encrypts the local IndexedDB state, and downloads an encrypted snapshot `.json` alongside an RFC 5545 `.ics` calendar file.
5. *Failure/Recovery Path:* If David enters an incorrect passphrase during a future session unlock, a calm notice appears: *"Passphrase does not match. Try again or restore from an unencrypted backup."* No cloud recovery exists, preserving strict zero-knowledge sovereignty.
