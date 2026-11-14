# Atomic: UI Guidelines (layout and colors)

Build instructions for the Atomic frontend. Follow this file literally. Where a value is given (hex, px, ms), use it exactly.

**Status labels used below**
- **DECIDED:** chosen by the project owner.
- **DEFAULT:** my recommendation, used unless the owner changes it.

---

## 1. Direction (DECIDED)

- Visual direction: **warm paper notebook**, with a **dark-blue night theme** (not pure black).
- Purpose of the app: bring the unconscious into consciousness. The UI must invite journaling and calm the user down.
- Tech constraints: vanilla HTML/CSS/JS. No frameworks, no CDNs, no external fonts, no build step. System fonts only.

### Design principles
1. **Calm over loud.** Muted palette, whitespace, one primary action per screen.
2. **Identity first.** The identity statement is the largest text on a habit card.
3. **Hypotheses, not verdicts.** Insights use tentative wording and always show sample size.
4. **No shame states.** A miss is data. Never use red, warning icons, or failure language.
5. **Fast capture, slow reflection.** Check-in is one tap. Reflection is always optional.
6. **No gamification.** No confetti, points, leaderboards, loss-framed streak warnings, or numbered red badges.

---

## 2. Themes and color tokens

Two themes: **Paper** (light) and **Night** (dark). Define every color as a CSS custom property. Never hard-code a hex value in a component rule.

### 2.1 Theme selection (DECIDED behavior, DEFAULT implementation)
- Setting has three values: `auto` (default), `paper`, `night`.
- `auto` follows `prefers-color-scheme`.
- Apply the theme with `data-theme="paper"` or `data-theme="night"` on `<html>`. Set it in a tiny inline script in `<head>` before the stylesheet loads, to avoid a flash.
- Persist the choice in settings storage.

### 2.2 Why Night is built this way (reasoning, so future edits stay consistent)
Goal: calm, low-arousal, journal-friendly at night, with less blue-light stimulation.
- Background is a **desaturated slate navy**, not black and not royal blue. Pure black feels stark and makes white text glare. Saturated blue feels electric.
- **No pure white anywhere in Night.** Text is a warm off-white. This lowers the blue content of the brightest pixels.
- Blue accents are **muted and mid-lightness** (never bright cyan or electric blue).
- Emphasis and interactive color is **amber**, a warm hue that also pairs well with slate (complementary).
- The effect of screen blue light on melatonin depends mostly on brightness and duration, not only hue. The palette reduces the load but does not remove it. The optional warm tint (section 2.5) lets the user go further.

### 2.3 Tokens (copy as is)

```css
:root,
:root[data-theme="paper"] {
  /* Surfaces */
  --bg-page:        #FAF8F5;
  --bg-card:        #FFFFFF;
  --bg-raised:      #F3EFE8;
  --border:         #E8E4DD;

  /* Text */
  --text-primary:   #1F2937;
  --text-secondary: #6B7280;
  --text-muted:     #7A8190;

  /* Accents */
  --accent-mirror:  #4A6A8A;  /* Chat: Mirror mode */
  --accent-future:  #B7791F;  /* Chat: Future-self mode, never-miss-twice nudge */
  --action-bg:      #1F2937;  /* primary buttons */
  --action-text:    #FFFFFF;
  --insight-bg:     #EFE9FB;  /* reflection prompts, insight cards */
  --insight-text:   #4B3685;
  --insight-action: #6B4FA3;  /* "Write" buttons on insight tint */
  --focus-ring:     #B7791F;

  /* Habit grid */
  --grid-empty:     #ECE7DE;

  /* Categories: --cat-* for grid fills, --cat-*-strong for text and button fills (white text passes 4.5:1) */
  --cat-health:      #4F8A5B;  --cat-health-strong:      #3D7349;
  --cat-learning:    #3B6EA5;  --cat-learning-strong:    #3B6EA5;
  --cat-creativity:  #9B5BB5;  --cat-creativity-strong:  #9B5BB5;
  --cat-mindfulness: #C7893F;  --cat-mindfulness-strong: #9A6420;
  --cat-connection:  #C75F6A;  --cat-connection-strong:  #B04A56;
  --on-category:     #FFFFFF;  /* text on a *-strong fill */

  --overlay-scrim:  rgba(31, 41, 55, 0.40);
}

:root[data-theme="night"] {
  /* Surfaces: desaturated slate navy */
  --bg-page:        #151A24;
  --bg-card:        #1D2431;
  --bg-raised:      #252D3C;
  --border:         #2E3748;

  /* Text: warm off-white, no #FFFFFF */
  --text-primary:   #E9E6DF;
  --text-secondary: #A7AEBD;
  --text-muted:     #8A93A8;

  /* Accents */
  --accent-mirror:  #86A8CE;
  --accent-future:  #E0A94F;
  --action-bg:      #E0A94F;  /* amber primary buttons */
  --action-text:    #151A24;
  --insight-bg:     #262238;
  --insight-text:   #BBA9E8;
  --insight-action: #BBA9E8;
  --focus-ring:     #E0A94F;

  --grid-empty:     #2A3243;

  --cat-health:      #6FA77C;  --cat-health-strong:      #6FA77C;
  --cat-learning:    #7FA1CC;  --cat-learning-strong:    #7FA1CC;
  --cat-creativity:  #B58BCB;  --cat-creativity-strong:  #B58BCB;
  --cat-mindfulness: #D4A15C;  --cat-mindfulness-strong: #D4A15C;
  --cat-connection:  #D98A93;  --cat-connection-strong:  #D98A93;
  --on-category:     #151A24;  /* dark text on light category fills */

  --overlay-scrim:  rgba(0, 0, 0, 0.55);
}
```

### 2.4 Color rules
- Category colors are used **only** for: category pill, grid fills, check-in button, completed-state border. Never for navigation or chrome.
- **Never use red.** A missed day is the `--grid-empty` color. The never-miss-twice nudge uses `--accent-future`.
- Selected/active state in navigation: `--text-primary` plus bold. No colored backgrounds.
- Contrast: all text must meet WCAG AA (4.5:1 normal, 3:1 large). The values above were chosen to pass; re-check any value you change. Never convey meaning by color alone (always pair with text or tooltip).

### 2.5 Optional warm evening tint (DEFAULT, off by default)
Setting: "Warm evening tint" (toggle, in Me > Settings). When on, add a fixed overlay:
```css
.warm-tint { position: fixed; inset: 0; pointer-events: none; z-index: 9999;
  background: rgba(255, 170, 60, 0.07); mix-blend-mode: multiply; }
```
Only render the element when the toggle is on. It must never block clicks.

---

## 3. Typography (DECIDED: serif for the user's own voice)

```css
--font-ui:    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-voice: Georgia, "Iowan Old Style", "Palatino Linotype", serif;
```
- **UI text** (labels, buttons, navigation, stats): `--font-ui`.
- **Voice text** (identity statements, journal entries, Future-self chat replies, reflection prompts, the Today greeting): `--font-voice`. The rule: serif means "this is your voice or about your identity"; sans means "this is the tool".
- Size scale (px): 12, 14, 16, 20, 24, 28. Do not add sizes.
- Journal body: 17px, line-height 1.65. Chat bubbles: 16px, line-height 1.5.
- Identity statement on a habit card: 24px, serif, italic. Habit name: 14px sans, secondary color.
- Category pill and stat labels: 11 to 12px, uppercase, letter-spacing 0.05em, weight 700.
- Minimum body text size: 14px. Never go below 12px.

---

## 4. Layout and navigation

### 4.1 Navigation (DECIDED: 5 sections)

| Tab | Contents |
|---|---|
| **Today** | Greeting, identity votes, habit cards, reflection prompt |
| **Journal** | Prompts, entries, mood history |
| **Insights** | Discoveries, scorecard, themes, weekly review |
| **Chat** | Mirror and Future-self modes |
| **Me** | Identity statements, alter ego profile, WOOP, reminders, privacy, settings, export |

- **Below 900px:** bottom tab bar, 64px high, 5 equal items (text labels, optional simple icon). Fixed to the bottom, with `padding-bottom: env(safe-area-inset-bottom)`. Page content gets bottom padding of 64px + safe area.
- **900px and above:** left sidebar, 220px wide, same 5 items stacked. Content column centered, max-width 760px.
- Only one tab visible at a time. Use hash routing (`#/today`, `#/journal`, `#/insights`, `#/chat`, `#/me`) so the back button works and screens are linkable.

### 4.2 Page frame
- Page padding: 28px 20px (mobile), 40px 32px (desktop).
- Vertical gap between stacked blocks: 14px (mobile), 20px (desktop).
- Card: radius 12px, 1px `--border`, background `--bg-card`, padding 16px (mobile) or 20px (desktop). Shadow only in Paper: `0 1px 2px rgba(0,0,0,0.05)`. No shadows in Night.
- Radii: 4px (chips), 8px (buttons, inputs), 12px (cards), 9999px (pills, mood dots).

### 4.3 Responsive breakpoints
- `max-width: 480px`: contribution grid cells 8px with 2px gap (carried over from the existing app); streak row stacks vertically.
- `min-width: 900px`: sidebar navigation replaces bottom bar.
- Test widths: 360, 390, 768, 1280.

### 4.4 Touch and spacing
- Every tappable element is at least 44x44px.
- Keep at least 8px between adjacent tappable elements.

---

## 5. Screens

### 5.1 Today
Top to bottom:
1. **Date line:** "Friday, 16 October", 13px, secondary.
2. **Greeting:** "Today is a vote for who you're becoming." Serif, 26px, line-height 1.25.
3. **Identity votes strip:** `--insight-bg` background, radius 10px, padding 12px 14px, e.g. "14 votes this week for *a reader*" (identity in serif italic). Shows the identity with the most check-ins in the last 7 days. Hidden if there are 0 habits.
4. **Habit cards**, newest first (carried over from the existing app). Each card, top to bottom:
   - Category pill (`--cat-*-strong` text, 11px uppercase).
   - Identity statement (serif italic 24px).
   - Habit name + stack label, 14px secondary (e.g. "Read 10 pages · stacked after Morning coffee"). Add the done state: "· done today".
   - Last-14-days row of 16px squares (3px radius, 4px gap). On the habit detail view this expands to the 12-week grid (7 rows, Sunday to Saturday, oldest week left, native `title` tooltip per cell).
   - Stats line: "Streak **3** · Consistency **86%**" (13px, secondary labels, primary numbers).
   - **Check-in button** (full width, min-height 44px). Not done: fill `--cat-*-strong`, text `--on-category`, label "Mark done today". Done: transparent, 1.5px border and text in `--cat-*-strong`, label "Done. Tap to undo".
   - After a check-in, show "How did it feel?" with the **mood picker** (section 6.1). Skippable. Stays visible on that card for the rest of the day.
   - If the never-miss-twice condition is active: show the **nudge row** above the button (section 6.3).
   - Delete lives in the card's overflow menu (not a visible button), uses `confirm()` as before.
5. **Reflection prompt card** (section 6.4), one per day, at the bottom.
6. **Add habit:** a "+ New Habit" button above the list, opening the collapsible form (existing behavior: native `required`, hidden button while open, Cancel button). Add the new form fields described in the functionality file (intention, two-minute version, temptation bundle).
7. **Empty state** (no habits): dashed-border card, title "No habits tracked yet", subtitle "Start by defining a new habit and the identity you want to reinforce."

### 5.2 Journal
- Top: today's prompt card with a text area (17px serif, min-height 140px, auto-grow). Buttons: "Save" (primary action), "Not now" (text button).
- Optional row under the text area: mood picker, energy picker, linked-habit select.
- Below: reverse-chronological entries as cards: date, type chip (Miss reason, Completion note, Free write), linked habit chip, mood dot, text (serif).
- Filter chips (by habit, by type, by mood). Horizontal scroll on mobile.
- Privacy chip (section 6.6) in the top right.
- Empty state: "Nothing written yet. Your first entry can be one sentence."

### 5.3 Insights
- **Discoveries feed:** vertical list of insight cards (section 6.5).
- **Locked cards:** show what unlocks and the data progress, e.g. "Weekday patterns unlock at 21 days. 12 of 21 so far." with a progress bar (6px high, `--insight-action` fill on `--border` track).
- Sub-sections as a segmented control at the top: **Patterns | Themes | Scorecard | Weekly review**.
- **Scorecard:** list of daily behaviors with a three-way control (+, -, =), each button 44x44px with an aria-label ("Positive", "Negative", "Neutral").
- **Weekly review:** a swipeable sequence of 3 to 4 full-width cards (stats, one pattern, one reflection question, "Choose one intention for next week"). Available Sunday evening and afterwards until the next review.

### 5.4 Chat
- Mode switch at the top: two segments, **Mirror** and **Future self**.
- The screen accent changes with the mode: send button, user-message border, mode label use `--accent-mirror` or `--accent-future`.
- Message bubbles: assistant on `--bg-raised`, user on `--bg-card` with 1px border. Radius 12px. Future-self replies use `--font-voice`; Mirror replies use `--font-ui`.
- Persistent **privacy chip** above the input (section 6.6). Tapping it opens a preview of exactly what will be sent.
- Input: multiline, min-height 44px, send button 44x44px.
- "Ask my future self about a situation" button opens a scenario input (single text area, then switches to Future-self mode).
- First-run state: shows the setup requirement ("Define your future self first") linking to Me > Alter ego.

### 5.5 Me
Grouped list with sections: Identity statements, Alter ego profile, WOOP plans, Reminders, Privacy and data (provider, key, encryption, export/import, delete all), Appearance (theme, warm tint), About. Each item is a full-width row, 56px high, with a chevron, opening a sub-screen.

---

## 6. Components

### 6.1 Mood picker
- Five circular buttons, 44px, 10px gap, in one row. No emoji, no faces. Neutral spectrum: unselected = 1px `--border` ring on `--bg-card`; selected = filled `--cat-*-strong` of the habit (or `--action-bg` in Journal).
- Aria labels: "Mood 1 of 5" ... "Mood 5 of 5, selected". Left end label "Low", right end label "High" (12px, secondary).
- Energy picker uses the same component with different labels.

### 6.2 Contribution grid
- Cell 10px (16px in the Today 14-day row), radius 2px (3px for 16px), `--grid-empty` for no check-in, `--cat-*` for a check-in. Minimal-version (two-minute) check-ins use the same color at 55% opacity.
- Each cell has `title="Fri 16 Oct: done"` (or "not done").

### 6.3 Never-miss-twice nudge
- A row inside the card, background `--bg-raised`, 1px `--accent-future` border, radius 8px, padding 10px 12px.
- Copy: "Yesterday was a miss. Today is the day that counts. Try the two-minute version: *{twoMinuteVersion}*." Buttons: "Do the 2-minute version" (counts as a check-in), "Not today" (hides the nudge until tomorrow).
- No red. No exclamation marks.

### 6.4 Reflection prompt card
- Background `--insight-bg`, radius 12px, padding 14px 16px. Question in serif 17px, `--insight-text`.
- Buttons: "Write" (fill `--insight-action`, text `--bg-card` in Paper or `#151A24` in Night), "Not now" (text button).

### 6.5 Insight card
- Card with: one plain-language finding (serif 17px), a small single-color chart or number (max 120px tall), a sample-size chip ("Based on 9 Mondays"), and a "Why am I seeing this?" expander.
- Wording rule: findings use "seems", "tends to", "so far". Never "always", "never", "you are".

### 6.6 Privacy chip
- Pill, 12px text, 28px high, border 1px, icon optional. States: "Stays on this device" or "Summary sent to {provider}" or "Journal text included (this message)". Appears in Journal and Chat headers.

### 6.7 Buttons
- **Primary action:** `--action-bg` / `--action-text`, 8px radius, min-height 44px, weight 600.
- **Secondary:** transparent, 1px `--border`, `--text-primary`.
- **Text button:** no border, `--text-secondary`.
- **Destructive** (delete all data): same as secondary, with the label stating the action. No red; require a typed confirmation instead.
- Disabled: 45% opacity, `cursor: not-allowed`.

### 6.8 Forms
- Inputs: 8px radius, 1px `--border`, background `--bg-card`, padding 0.55rem 0.75rem, 16px font (prevents iOS zoom). Use native `required` for required fields; do not hand-roll validation messages for them.
- Focus: 2px `--focus-ring` outline with 2px offset on every focusable element. Never remove outlines.

### 6.9 Dialogs
- Use native `<dialog>`. Max-width 440px, width 90%, radius 12px. Backdrop `--overlay-scrim`. Close on Escape and backdrop click.
- The stacking prompt stays invitational (title, body, one "Log it" per row, one "Not now"). No guilt language.

---

## 7. Motion
- Grid cell fill on check-in: 150ms ease-in-out, scale 0.9 to 1. No other celebration.
- Tab content change: 120ms opacity fade.
- New insight unlocked: a single 600ms pulse on the Insights tab label. No number badge.
- Form collapse/expand: 250ms (existing).
- Respect `prefers-reduced-motion: reduce`: disable all of the above except instant state changes.

---

## 8. Accessibility checklist
- Landmarks: `<header>`, `<nav aria-label="Main">`, `<main>`.
- All interactive elements are real `<button>` or `<a>` elements.
- Dynamic updates (new chat message, insight unlock, form errors) go in an `aria-live="polite"` region.
- Every icon-only button has an `aria-label`.
- Keyboard: Tab order follows visual order; dialogs trap focus (native `<dialog>` does this); Escape closes dialogs.
- Text must remain usable at 200% zoom with no horizontal scroll (except inside the grid container, which scrolls on its own).

---

## 9. Copy and tone
- Voice: quiet, curious, second person, short sentences.
- Misses: "Yesterday was a miss." Not "You failed", "Streak lost", "Oops".
- Insights: tentative ("seems", "so far") and always with the sample size.
- Never: exclamation marks in system messages, all-caps words (except the 11px labels), emoji.
- Reminders and nudges mention the habit's own intention ("Reading at 21:00 on the sofa?") rather than "Don't forget!".

---

## 10. Reference mockups
Today screen, both directions: https://claude.ai/artifact/4LWhV6Lvrhy2YFQCyjwwdE
- Board A (Paper) is the approved direction.
- Board B (dashboard) is rejected. Do not copy its layout.
- The Night theme has **not** been mocked yet. Build it from section 2.3 and compare against board A for layout.

## 11. Do / Don't summary
- Do: serif for identity and journal text, amber for emphasis in Night, dark slate navy surfaces, sample sizes on every insight, 44px touch targets.
- Don't: pure black, pure white in Night, red anywhere, emoji, streak-loss warnings, numbered badges, external fonts or CDNs, category colors on navigation.
