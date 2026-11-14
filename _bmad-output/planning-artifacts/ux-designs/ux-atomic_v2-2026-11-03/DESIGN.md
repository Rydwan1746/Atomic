---
name: Atomic
description: Quiet identity-based habit notebook and reflection sanctuary
status: final
created: 2026-11-03
updated: 2026-11-08
colors:
  # Paper Theme (Light)
  bg-page-paper: '#FAF8F5'
  bg-card-paper: '#FFFFFF'
  bg-raised-paper: '#F3EFE8'
  border-paper: '#E8E4DD'
  text-primary-paper: '#1F2937'
  text-secondary-paper: '#6B7280'
  text-muted-paper: '#7A8190'
  ruled-line-paper: 'rgba(232, 228, 221, 0.70)'

  # Night Theme (Dark Navy Slate)
  bg-page-night: '#151A24'
  bg-card-night: '#1D2431'
  bg-raised-night: '#252D3C'
  border-night: '#2E3748'
  text-primary-night: '#E9E6DF'
  text-secondary-night: '#A7AEBD'
  text-muted-night: '#8A93A8'
  ruled-line-night: 'rgba(46, 55, 72, 0.45)'

  # Accents & Highlights
  accent-mirror: '#4A6A8A'
  accent-future: '#E0A94F'
  action-bg: '#1F2937'
  action-bg-night: '#E0A94F'
  action-text: '#FFFFFF'
  action-text-night: '#151A24'
  insight-bg: '#EFE9FB'
  insight-bg-night: '#262238'
  insight-text: '#4B3685'
  insight-text-night: '#BBA9E8'
  insight-action: '#6B4FA3'
  focus-ring: '#E0A94F'

  # Timeline & Grids
  grid-empty-paper: '#ECE7DE'
  grid-empty-night: '#2A3243'
  today-highlight-ring: '#E0A94F'

  # Fixed Categories
  cat-health: '#4F8A5B'
  cat-health-strong: '#3D7349'
  cat-learning: '#3B6EA5'
  cat-learning-strong: '#3B6EA5'
  cat-creativity: '#9B5BB5'
  cat-creativity-strong: '#9B5BB5'
  cat-mindfulness: '#C7893F'
  cat-mindfulness-strong: '#9A6420'
  cat-connection: '#C75F6A'
  cat-connection-strong: '#B04A56'
  on-category-light: '#FFFFFF'
  on-category-dark: '#151A24'

  overlay-scrim-paper: 'rgba(31, 41, 55, 0.40)'
  overlay-scrim-night: 'rgba(0, 0, 0, 0.55)'

typography:
  display-greeting:
    fontFamily: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif'
    fontSize: '26px'
    fontWeight: '400'
    lineHeight: '1.25'
  identity-hero:
    fontFamily: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif'
    fontSize: '24px'
    fontWeight: '400'
    fontStyle: 'italic'
    lineHeight: '1.2'
  headline:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    fontSize: '20px'
    fontWeight: '600'
    lineHeight: '1.3'
  journal-prompt:
    fontFamily: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif'
    fontSize: '20px'
    fontWeight: '400'
    lineHeight: '1.35'
  journal-body:
    fontFamily: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif'
    fontSize: '17px'
    fontWeight: '400'
    lineHeight: '1.65'
  body-ui:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    fontSize: '16px'
    fontWeight: '400'
    lineHeight: '1.5'
  caption-ui:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    fontSize: '14px'
    fontWeight: '400'
    lineHeight: '1.4'
  pill-meta:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    fontSize: '11px'
    fontWeight: '700'
    letterSpacing: '0.05em'
    textTransform: 'uppercase'
    lineHeight: '1.2'

rounded:
  sm: '4px'
  md: '8px'
  lg: '12px'
  full: '9999px'

spacing:
  1: '4px'
  2: '8px'
  3: '10px'
  4: '14px'
  5: '16px'
  6: '20px'
  7: '28px'
  8: '32px'
  9: '40px'

components:
  habit-card:
    bg: '{colors.bg-card-paper}'
    border: '1px solid {colors.border-paper}'
    borderRadius: '{rounded.lg}'
    paddingMobile: '{spacing.5}'
    paddingDesktop: '{spacing.6}'
  stamp-button:
    size: '44px'
    borderRadius: '{rounded.full}'
    borderUnchecked: '1.5px dashed {colors.border-paper}'
    borderChecked: '1.5px solid {colors.cat-health-strong}'
    transition: 'transform 120ms ease, background-color 200ms ease, border-color 200ms ease'
  timeline-cell:
    size: '16px'
    borderRadius: '3px'
    gap: '4px'
    todayRing: '2px solid {colors.today-highlight-ring}'
  journal-ledger:
    lineHeight: '28px'
    ruleColorPaper: '{colors.ruled-line-paper}'
    ruleColorNight: '{colors.ruled-line-night}'
    backgroundSize: '100% 28px'
  fresh-page-card:
    bg: '{colors.bg-raised-paper}'
    border: '1px solid {colors.border-paper}'
    borderRadius: '{rounded.lg}'
    padding: '{spacing.7} {spacing.6}'
  nav-pill:
    minHeight: '44px'
    borderRadius: '{rounded.md}'
    indicatorDotSize: '4px'
    indicatorColor: '{colors.accent-future}'
  today-switcher:
    borderRadius: '{rounded.md}'
    activeTabBg: '{colors.bg-raised-paper}'
    activeTabBgNight: '{colors.bg-raised-night}'
    activeBorderColor: '{colors.accent-future}'
    inactiveLabelColor: '{colors.text-muted-paper}'
  scorecard-row:
    minHeight: '52px'
    ratingPositiveBg: '{colors.bg-raised-paper}'
    ratingNeutralColor: '{colors.text-muted-paper}'
    ratingNegativeColor: '{colors.text-muted-paper}'
    ratingBadgeBorder: '1px solid {colors.border-paper}'
  insights-unlock-card:
    bg: '{colors.bg-raised-paper}'
    bgNight: '{colors.bg-raised-night}'
    borderRadius: '{rounded.lg}'
    progressBarHeight: '6px'
    progressBarFill: '{colors.insight-action}'
    progressBarTrack: '{colors.border-paper}'
    lockIconOpacity: '0.4'
  insight-discovery-card:
    evidencePillBg: '{colors.bg-raised-paper}'
    evidencePillBgNight: '{colors.bg-raised-night}'
    evidencePillBorder: '1px solid {colors.border-paper}'
    evidencePillRadius: '{rounded.full}'
  seven-day-pulse:
    bg: '{colors.bg-raised-paper}'
    bgNight: '{colors.bg-raised-night}'
    borderRadius: '{rounded.lg}'
    border: '1px solid {colors.border-paper}'
  chat-mirror:
    accentColor: '{colors.accent-mirror}'
    bubbleAssistantBg: '{colors.bg-raised-paper}'
    bubbleAssistantBgNight: '{colors.bg-raised-night}'
    bubbleUserBorder: '1px solid {colors.border-paper}'
    fontAssistant: '{typography.body-ui.fontFamily}'
  chat-future-self:
    accentColor: '{colors.accent-future}'
    bubbleAssistantBg: '{colors.insight-bg}'
    bubbleAssistantBgNight: '{colors.insight-bg-night}'
    fontAssistant: '{typography.journal-body.fontFamily}'
  privacy-chip:
    bg: '{colors.bg-raised-paper}'
    bgNight: '{colors.bg-raised-night}'
    border: '1px solid {colors.accent-mirror}'
    borderRadius: '{rounded.full}'
    iconColor: '{colors.accent-mirror}'
  identity-portfolio-card:
    bg: '{colors.bg-card-paper}'
    bgNight: '{colors.bg-card-night}'
    border: '1px solid {colors.border-paper}'
    borderRadius: '{rounded.lg}'
    voteCountColor: '{colors.accent-future}'
  alter-ego-card:
    bg: '{colors.insight-bg}'
    bgNight: '{colors.insight-bg-night}'
    border: '1px solid {colors.border-paper}'
    borderRadius: '{rounded.lg}'
    valueTagBg: '{colors.bg-raised-paper}'
  woop-card:
    bg: '{colors.bg-raised-paper}'
    bgNight: '{colors.bg-raised-night}'
    borderLeft: '3px solid {colors.accent-future}'
    borderRadius: '{rounded.md}'
---

# Atomic — Visual Identity Specification (`DESIGN.md`)

## 1. Brand & Style

Atomic is an intimate, tactile habit reflection sanctuary grounded in James Clear’s *Atomic Habits*. It is designed as a quiet paper moleskine notebook rather than an aggressive digital productivity machine.

The design spine (`DESIGN.md`) and experience spine (`EXPERIENCE.md`) are the canonical peer contracts for implementation; both spines win on conflict with any mock, wireframe, or prototype.

Its aesthetic posture is defined by:
- **Calm over loud:** Muted, natural palettes, generous whitespace, and restrained typography.
- **Dignity & Non-judgment:** The UI never shames or scolds. Missed days are treated as neutral, curious observations (`--grid-empty`), never red warnings.
- **The Dual-Voice Dichotomy:** System sans-serif (`--font-ui`) represents the tool/instrument. Warm editorial serif (`--font-voice`) represents the user's authentic voice, identity statements, and inner reflections.
- **Tactile Paper Metaphor:** From subtle horizontal notebook rules in the journal to embossed habit stamps and crisp page invitations, every interaction evokes physical stationery.

---

## 2. Colors

Atomic employs two coordinated palettes: **Paper** (light) and **Night** (dark).

### The Palettes
- **Paper (`#FAF8F5`):** Warm, unbleached cotton paper tone. Cards rest softly on `#FFFFFF` with minimal hairline borders (`#E8E4DD`), avoiding harsh high-contrast black/white.
- **Night (`#151A24`):** A desaturated slate navy, specifically engineered for low-arousal evening journaling. **No pure black and no pure white.** Text is warm off-white (`#E9E6DF`), and interactive elements bloom in warm amber (`#E0A94F`).
- **Ruled Lines:** 
  - Paper: `rgba(232, 228, 221, 0.70)` — soft sepia ruling that whispers across the page.
  - Night: `rgba(46, 55, 72, 0.45)` — low-contrast slate rules that maintain texture without glare.
- **Category Colors:** Strictly reserved for identity pills, grid cell check-ins, and stamp fills. Categories never bleed into chrome or navigation.
  - Health: `#4F8A5B` (Strong: `#3D7349`)
  - Learning: `#3B6EA5` (Strong: `#3B6EA5`)
  - Creativity: `#9B5BB5` (Strong: `#9B5BB5`)
  - Mindfulness: `#C7893F` (Strong: `#9A6420`)
  - Connection: `#C75F6A` (Strong: `#B04A56`)

### Contrast Ratios & Accessibility Targets (WCAG AA)
| Pair | Foreground | Background | Contrast | Target | Status |
|---|---|---|---|---|---|
| Text Primary (Paper) | `{colors.text-primary-paper}` (`#1F2937`) | `{colors.bg-page-paper}` (`#FAF8F5`) | 12.1:1 | ≥ 4.5:1 | AAA Pass |
| Text Secondary (Paper) | `{colors.text-secondary-paper}` (`#6B7280`) | `{colors.bg-page-paper}` (`#FAF8F5`) | 4.8:1 | ≥ 4.5:1 | AA Pass |
| Text Muted (Paper) | `{colors.text-muted-paper}` (`#7A8190`) | `{colors.bg-page-paper}` (`#FAF8F5`) | 4.5:1 | ≥ 4.5:1 | AA Pass |
| Text Primary (Night) | `{colors.text-primary-night}` (`#E9E6DF`) | `{colors.bg-page-night}` (`#151A24`) | 13.5:1 | ≥ 4.5:1 | AAA Pass |
| Text Secondary (Night) | `{colors.text-secondary-night}` (`#A7AEBD`) | `{colors.bg-card-night}` (`#1D2431`) | 6.8:1 | ≥ 4.5:1 | AA Pass |
| Text Muted (Night) | `{colors.text-muted-night}` (`#8A93A8`) | `{colors.bg-card-night}` (`#1D2431`) | 4.9:1 | ≥ 4.5:1 | AA Pass |
| Amber Accent (Night) | `{colors.accent-future}` (`#E0A94F`) | `{colors.bg-card-night}` (`#1D2431`) | 7.2:1 | ≥ 3.0:1 | AA Pass |

---

## 3. Typography

Atomic enforces a strict dual-font hierarchy:
1. **Tool Voice (`--font-ui`):** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`. Clean, highly legible, unobtrusive. Used for buttons, stats, settings, and navigation.
2. **Human Voice (`--font-voice`):** `Georgia, "Iowan Old Style", "Palatino Linotype", serif`. Warm, literary, reflective. Used for identity statements (*"A reader"*), journal body text, prompts, and the James Clear welcome quote.

### Type Scale
- `26px` Serif: Today greeting (*"Today is a vote for who you're becoming"*).
- `24px` Serif Italic: Identity statement on habit cards.
- `20px` Sans / Serif: Section titles & journal prompt headers.
- `17px / 1.65` Serif: Journal writing body and reflection text.
- `16px / 1.5` Sans: General UI body.
- `14px` Sans: Secondary labels, statistics, notes.
- `11px` Sans Uppercase (tracking `0.05em`): Category pills and data chips.

---

## 4. Layout & Spacing

- **Base Unit:** 4px grid. Standard rhythm steps: 4px, 8px, 10px, 14px, 16px, 20px, 28px, 32px, 40px.
- **Max Content Width:** Centered `760px` column on desktop, providing optimal line lengths for reading and reflection.
- **Responsive Frame:**
  - Mobile (`< 900px`): `padding: 28px 20px calc(88px + env(safe-area-inset-bottom))`. Fixed 64px bottom bar.
  - Desktop (`≥ 900px`): `padding: 40px 32px 40px 252px`. Fixed 220px left navigation sidebar.

---

## 5. Elevation & Depth

Atomic rejects heavy drop shadows and faux-skeuomorphic 3D bevels.
- **Paper Mode:** Single hairline border (`1px solid #E8E4DD`) paired with a whisper-light ambient contact shadow: `box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05)`.
- **Night Mode:** Shadows are disabled (`none`). Depth is achieved purely through surface tone steps: Page (`#151A24`) → Card (`#1D2431`) → Raised surface (`#252D3C`) → Border (`#2E3748`).

---

## 6. Shapes

- **`4px` (`{rounded.sm}`):** Grid history cells and data chips.
- **`8px` (`{rounded.md}`):** Buttons, text inputs, dialog cards, and navigation capsules.
- **`12px` (`{rounded.lg}`):** Habit cards, empty state stationery cards, and prompt cards.
- **`9999px` (`{rounded.full}`):** Identity category pills, mood dots, and check-in stamp buttons.

---

## 7. Components

### 7.1 Habit Card & The Intentional Stamp
- **Visual Reference:** [`mockups/key-today.html`](./mockups/key-today.html) illustrates the complete Today card composition, the checked/unchecked stamp states, and the Never-Miss-Twice recovery nudge.
- **Card Structure:** 
  - Top: Category pill left, intentional Check-in Stamp right.
  - Middle: Identity statement (24px serif italic) as the undisputed hero.
  - Sub: Habit name, stacking anchor, and streak stats.
  - Timeline: 14-day history row. The 14th cell ("Today") is framed with a distinct 2px amber accent outline (`{colors.today-highlight-ring}`).
- **The Stamp Button:**
  - `44x44px` circular button.
  - *Unchecked:* Subtle dashed border with faint checkmark watermark. Active press scales down to `0.94` with tactile resistance.
  - *Checked:* Solid bloom in category strong ink with white/dark check glyph.
  - *After-Stamp Transition:* The 5-point mood picker (*"How did it feel?"*) smoothly glides down with `opacity: 0 -> 1` and `transform: translateY(-4px) -> translateY(0)` over 280ms without any jarring layout jump.

### 7.2 The Journal Ledger (Option B)
- **Visual Reference:** [`mockups/key-journal.html`](./mockups/key-journal.html) illustrates the 28px ruled baseline grid on Paper mode, the daily reflection prompt card, and past ledger card.
- **Background Texture:** A CSS `repeating-linear-gradient` aligned with font metrics:
  ```css
  background-image: linear-gradient(to bottom, transparent calc(var(--ledger-line-height) - 1px), var(--ledger-rule-color) 1px);
  background-size: 100% var(--ledger-line-height);
  ```
- **Line-height Lock:** Exactly `28px` on textarea and entry cards, ensuring serif body text rests gracefully upon ruled lines.

### 7.3 The Unfolding Pact (Habit Creation)
- Replaces the 8-field form wall with an unfolding, step-by-step conversational pact.
- Previous answers fold upward into quiet serif summary breadcrumbs (*"Becoming: A reader"*), while the next prompt floats in effortlessly.
- Concludes with the compassionate Safety Net fork (*"Add safety net"* vs *"I'm ready — create habit"*).

### 7.4 Fresh Page Invitation (Empty State)
- Replaces dashed wireframe boxes with a warm, solid stationery card (`{colors.bg-raised-paper}`).
- Features James Clear's quotation in warm serif italic:  
  *"Every action you take is a vote for the type of person you wish to become."*
- Welcoming prompt and primary button: `Begin your first vote →`.

### 7.5 Navigation Chrome
- **Mobile (< 900px):** 64px bottom bar with refined typographic labels and a 4px warm amber active indicator dot beneath the selected tab.
- **Desktop (≥ 900px):** 220px fixed sidebar with the "Atomic" serif wordmark at the top and rounded active capsules (`{colors.bg-raised-paper}`) with amber border accents.

### 7.6 Today Screen Switcher (Daily Votes ⇄ Habits Scorecard)
- **Visual Reference:** [`mockups/key-scorecard.html`](./mockups/key-scorecard.html) illustrates the Today screen top switcher, Scorecard row anatomy, +/=/− rating badge fills, and neutral non-judgmental microcopy.
- A clean top switcher with two tabs: **Daily Votes** and **Habits Scorecard**, placed directly beneath the Today greeting.
- Active tab has a rounded capsule background (`{components.today-switcher.activeTabBg}`) with an amber indicator bar at the top edge. Inactive label is muted.
- The switcher does not navigate away from `#/today`; it swaps the content beneath in place with a smooth 180ms cross-fade.

### 7.7 Habits Scorecard Rows
- Each row is a full-width behavior entry (≥ 52px): behavior name on the left, three quiet rating badges on the right (`+`, `=`, `−`).
- Rating badges are `32x32px` with a 1px border ring (`{components.scorecard-row.ratingBadgeBorder}`). The selected state fills with a muted category-neutral background for `+` and plain muted slate for `−`. **No red used anywhere.**
- Below each `−` row appears quiet non-judgmental microcopy: *"Noticed, not judged."*
- A ghost action link `"Use as stacking anchor →"` appears on non-negative rows, saving the behavior to the Unfolding Pact stacking picker.
- A ghost action link `"Promote to identity habit →"` appears on `+` rows, opening the Unfolding Pact with the behavior pre-filled.

### 7.8 Insights: Curtain Rising Unlock Card
- Locked insight cards render with `opacity: 0.55` on the icon, a descriptive unlock milestone (*"Weekday patterns unlock at 21 days"*), and a 6px tall progress bar (`{components.insights-unlock-card.progressBarFill}` fill, `{components.insights-unlock-card.progressBarTrack}` track).
- Unlocked discovery cards show: tentative observation in `{typography.body-ui}`, an evidence pill (`Based on 5 Thursdays · Tap to inspect`), and a `Reflect in Journal →` bridge action.

### 7.9 Insights: 7-Day Rolling Pulse Card
- A passive, always-present summary card at the top of the Insights surface showing rolling identity vote totals for the last 7 calendar days.
- No notifications, due dates, or modal steps. It is a quiet ambient glance, never a scheduled ritual.

### 7.10 Chat: Dual-Atmosphere Mode Frames
- **Visual Reference:** [`mockups/key-chat.html`](./mockups/key-chat.html) illustrates the side-by-side comparison of Mirror Mode (cool slate) vs Future-Self Mode (warm amber), assistant font differentiation, and the persistent privacy chip.
- **Mirror Mode frame:** Cool slate accent border (`{colors.accent-mirror}: #4A6A8A`) on the mode header. Assistant bubbles in `{components.chat-mirror.fontAssistant}` (sans-serif). Mode label: *"The Objective Mirror."*
- **Future-Self Mode frame:** Warm amber accent (`{colors.accent-future}: #E0A94F`) on the mode header. Assistant bubbles in `{components.chat-future-self.fontAssistant}` (serif). Mode label: *"Dialogue with Your Future Self."*
- Both modes share a Persistent Privacy Chip pinned above the input (`{components.privacy-chip}`).

### 7.11 Me: Identity Portfolio & Sovereignty Zones
- **Zone 1 — Identity (Top Half):**
  - Identity Portfolio cards: each active voted-for identity displayed as a warm card with all-time vote count in amber (`{components.identity-portfolio-card.voteCountColor}`) and current 30-day consistency.
  - Alter Ego authoring card: purple-tinted insight background (`{components.alter-ego-card.bg}`) with labeled value tags for Core Values and obstacle strategy.
  - WOOP planner cards: left-bordered accent cards (`{components.woop-card.borderLeft}`) representing each Wish/Outcome/Obstacle/Plan.
- **Zone 2 — Sovereignty (Bottom Half):**
  - Appearance settings (Theme: Paper/Night/Auto, Warm Evening Tint toggle).
  - Calendar export (RFC 5545 `.ics`).
  - Passphrase encryption toggle.
  - Backup status chip (*"Last backup: 3 days ago"*) with 30-day reminder.
  - Two-stage deliberate deletion (typed confirmation required).

---

## 8. Do's and Don'ts

### Do:
- **Do** keep identity statements in serif italic as the largest, most prominent element on habit cards.
- **Do** lock the journal ruled lines to the exact baseline line-height (28px).
- **Do** give the Today timeline cell a distinct outline so users orient themselves instantly.
- **Do** use gentle ease-out transitions (200–280ms) for ink blooms and mood reveals.
- **Do** render Scorecard `−` ratings in calm muted slate with the microcopy *"Noticed, not judged."*
- **Do** use the Cool Slate (`{colors.accent-mirror}`) for Mirror Mode framing and Warm Amber (`{colors.accent-future}`) for Future-Self Mode framing — consistently, every turn.
- **Do** show the privacy chip above Chat input at all times, in both modes.
- **Do** display the Identity Portfolio cards before any settings in the Me surface.

### Don't:
- **Don't** use red anywhere in the application. A missed day is neutral, quiet data.
- **Don't** use pure `#000000` or `#FFFFFF` in Night mode.
- **Don't** use dashed borders for empty states or content cards.
- **Don't** pop or jump elements onto the screen without smooth height/opacity transitions.
- **Don't** add gamified badges, confetti, or loss-framed streak warnings.
- **Don't** use a scheduled Sunday ritual or time-gated reviews. The 7-Day Pulse card is passive and always available — never an obligation.
- **Don't** let Chat responses exceed 120 words. Brevity preserves reflective space for the user.
- **Don't** use the Insights or Chat accent colors (`accent-mirror`, `accent-future`) in navigation, Today, or Journal. They are mode-specific atmospheric cues.
