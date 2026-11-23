# Atomic v2 — Technical & Architectural Addendum

*Companion to `prd.md`. Preserves technical specifications, schema contracts, formula thresholds, and design references for downstream architecture (`bmad-architecture`) and UX (`bmad-ux`).*

---

## 1. Storage & State Contract (`schemaVersion: 2`)

### 1.1 LocalStorage Key
- `atomic.v2` (contains either the JSON state string or the encrypted ciphertext blob).
- Legacy migration key: `atomicHabits` migrated to `atomic.v2`, with backup stored under `atomicHabits_v1_backup`.

### 1.2 Full State JSON Schema
```json
{
  "schemaVersion": 2,
  "habits": [
    {
      "id": "h_uuid",
      "name": "Read 10 pages",
      "identity": "A reader",
      "category": "Learning",
      "stackedAfter": "h_parent_uuid | null",
      "intention": {
        "time": "21:00",
        "place": "sofa"
      },
      "twoMinuteVersion": "Read one page",
      "temptationBundle": "Tea while reading",
      "createdAt": "2026-10-01T08:00:00.000Z",
      "archivedAt": null
    }
  ],
  "events": [
    {
      "id": "e_uuid",
      "habitId": "h_uuid",
      "type": "checkin",
      "date": "2026-10-16",
      "at": "2026-10-16T20:41:00.000Z",
      "atApproximate": false,
      "version": "full",
      "mood": 4,
      "energy": null
    }
  ],
  "journal": [
    {
      "id": "j_uuid",
      "at": "2026-10-16T21:05:00.000Z",
      "date": "2026-10-16",
      "kind": "miss_reason | completion_note | free",
      "habitId": "h_uuid | null",
      "prompt": "What got in the way?",
      "text": "...",
      "mood": 3,
      "energy": 2,
      "private": false
    }
  ],
  "scorecard": [
    {
      "id": "s_uuid",
      "behavior": "Scroll phone in bed",
      "rating": "-",
      "at": "2026-10-16T22:30:00.000Z"
    }
  ],
  "alterEgo": {
    "name": "The Centered Strategist",
    "description": "Calm, deliberate, acts from values rather than urgency",
    "values": ["Clarity", "Presence", "Rigor"],
    "obstacleStyle": "Pauses before responding, breathes, and simplifies",
    "behaviors": [
      "Closes all open tabs before walking away",
      "Reads a physical book when restless",
      "Says no without over-explaining"
    ],
    "updatedAt": "2026-10-16T20:00:00.000Z"
  },
  "woop": [
    {
      "id": "w_uuid",
      "habitId": "h_uuid | null",
      "wish": "Consistent evening reading",
      "outcome": "Calm mind before sleep, 20 books a year",
      "obstacle": "Picking up the phone when tired",
      "plan": "If I reach for my phone in bed, then I will open the book on my nightstand instead"
    }
  ],
  "settings": {
    "theme": "auto | paper | night",
    "warmTint": false,
    "encryptionEnabled": false,
    "ai": {
      "provider": "none | gemini | ollama | byok",
      "apiKey": null,
      "endpoint": null,
      "model": "gemini-2.5-flash"
    },
    "reminders": {
      "enabled": false
    }
  }
}
```

### 1.3 Rules & Invariants
- `date` is always the local `YYYY-MM-DD` string derived using local getters (`getFullYear()`, `getMonth()`, `getDate()`), never UTC.
- `version`: `"full"` (standard check-in) or `"minimal"` (two-minute fallback). Both count equally toward streaks and consistency.
- Misses are **computed on demand**, never stored as negative records: a miss is any date from habit `createdAt` to yesterday without a check-in event.
- At most one `checkin` event per habit per calendar `date`.
- ID generation: native `crypto.randomUUID()`.

---

## 2. Statistical Thresholds for Pattern Engine (`insights.js`)

All insights are pure functions returning hypothesis objects with explicit sample sizes.

| Pattern Type | Detection Rule | Unlock Threshold | Output Wording Template |
| :--- | :--- | :--- | :--- |
| **Weekday Slip** | Completion rate on weekday $W$ differs from overall habit rate by $\ge 25\%$. | 21 logged habit days & $\ge 3$ occurrences of $W$ | *"{Habit} seems to slip on {weekday}s: missed {k} of {n}."* |
| **Time-of-Day Rhythm** | $\ge 60\%$ of real check-ins land in one bucket (Morning: 05–11, Afternoon: 12–17, Evening: 18–23, Night: 00–04). | 15 real-timestamp check-ins (`atApproximate: false`) | *"{Habit} is usually a {bucket} habit ({k} of {n} check-ins)."* |
| **Streak-Break Precursor** | A specific weekday accounts for $\ge 50\%$ of streak breaks. | At least 4 streak breaks recorded | *"{Habit} streaks tend to break on {weekday}s ({k} of {n} breaks)."* |
| **Recovery Window** | Average days from miss to subsequent check-in. | At least 3 misses | *"Average recovery time after a missed day: {d} days."* |
| **Habit Co-occurrence** | Habit B's completion rate differs by $\ge 25\%$ on days Habit A was done vs. skipped. | At least 10 days in each comparison bucket | *"{Habit B} is more likely to happen on days you do {Habit A}."* |
| **Mood Correlate** | Difference in average mood on completion days vs. miss days. | At least 10 mood ratings in both groups | *"Your mood averages {m1} on completion days vs. {m2} on missed days."* |

---

## 3. Recurring-Theme NLP Algorithm (`insights.js`)

- Source corpus: all journal entries and miss-reason notes.
- Tokenization: lowercase, regex split on non-alphabetic characters (`/[^a-z]+/`).
- Filter: remove tokens $< 4$ characters and match against a fixed stopword list of 100+ standard English words.
- Surface criterion: token appears in $\ge 3$ distinct journal/miss entries.
- Top limit: top 10 tokens displayed with entry counts and clickable deep links to matching entries.
- Unlock threshold: requires at least 8 total journal/miss entries.

---

## 4. Cryptographic Specifications (`crypto.js`)

- **Scope:** Complete state JSON encrypted into an opaque ciphertext payload when passphrase lock is enabled.
- **Key Derivation:** PBKDF2 with HMAC-SHA256, 600,000 iterations.
- **Salt:** 16 cryptographically secure random bytes generated via `crypto.getRandomValues()`, stored in plaintext alongside ciphertext.
- **Cipher:** AES-256-GCM with fresh 12-byte random IV per save.
- **Key Retention:** Symmetric key kept strictly in transient JavaScript execution memory; never written to `localStorage`, `sessionStorage`, or IndexedDB.
- **Recovery:** Zero recovery mechanism. UI explicitly states forgotten passphrases result in total data loss.

---

## 5. AI Prompt Architecture, Guardrails & Local Ollama Specs (`chat.js`, `adapters.js`)

### 5.1 System Persona Directives & Distinct Roles

#### Mode A: The Objective Mirror
```
You are the Objective Mirror in Atomic v2, an identity-based habit tracker.
Your mission: Provide an objective, factual, non-judgmental reflection of the user's empirical habit data, streaks, and check-in history.

ROLE BOUNDARIES & GUARDRAILS:
1. Stick strictly to empirical metrics, check-in percentages, recovery windows, and observed patterns.
2. Speak in calm, analytical UI voice (sans-serif framing). Zero fluff, no moralizing, no cheerleading.
3. Keep responses concise and strictly under 120 words.
4. OUT-OF-SCOPE REDIRECTION: If the user asks for identity philosophy, life coaching, emotional reassurance, or "what should my future self do?", you MUST refuse and redirect:
   "That's a question for your Future Self."
   Output format for redirection: Include the redirection token [REDIRECT:future] so the UI renders the switch button.
```

#### Mode B: Dialogue with Future Self
```
You are the user's Future Self in Atomic v2, embodying their highest aspired Alter Ego values, narrative, and obstacle handling philosophy.
Your mission: Provide grounded wisdom, perspective, and compassionate accountability based on who the user is becoming.

ROLE BOUNDARIES & GUARDRAILS:
1. Speak from the user's defined Alter Ego profile (Values, Obstacle Strategy, Archetype Behaviors).
2. Speak in reflective, warm Identity Voice (serif framing).
3. Keep responses concise and strictly under 120 words.
4. OUT-OF-SCOPE REDIRECTION: If the user asks for raw statistical metrics, exact check-in calculations, or database streak tallies, you MUST refuse and redirect:
   "That's a question for your Objective Mirror."
   Output format for redirection: Include the redirection token [REDIRECT:mirror] so the UI renders the switch button.
```

### 5.2 Contextual Payload Construction for Local Ollama
The contextual payload is assembled locally by `buildSafePayload()` and fed directly to Ollama:
- **Habits Context:** Active habits, identities, categories, current streaks, 30-day consistency rates.
- **Journal Context:** Recent journal entries and miss-reason notes (entries with `private: true` are strictly filtered out; only non-private entries are included).
- **Alter Ego Context (Future-Self Mode):** Name, narrative description, 3 core values, obstacle philosophy, and 3 specific behaviors.
- **UI Decoupling:** In the UI, the Future Self input box displays a calm, generic prompt (*"Ask your future self anything..."*). Trait lists are never rendered in the input field.

### 5.3 Local On-Device Adapter (Ollama) & Graceful Fallback
- **Endpoint:** `http://localhost:11434/api/generate` (or `/api/chat`).
- **Transport:** HTTP POST with loopback fetch.
- **Payload Schema:**
  ```json
  {
    "model": "llama3.2",
    "prompt": "{systemInstruction}\n\nUser: {userMessage}",
    "stream": false,
    "options": {
      "temperature": 0.7,
      "num_predict": 250
    }
  }
  ```
- **Error Handling & Graceful Fallback:**
  - Network timeouts (e.g. 5-second `AbortController`) or connection-refused errors are caught silently without throwing.
  - Returns a graceful fallback object: `{ ok: true, provider: "offline-fallback", text: "...", mode: mode, offlineNotice: true }`.
  - UI displays an unobtrusive toast/status indicator: *"Local model offline at localhost:11434. Falling back to offline reflection."*

---

## 6. Physical Notebook Journal Specifications (`journal.js`, `style.css`)

### 6.1 Ruled Line Rendering & Typography Sync
- **Rhythm & Line Spacing:** The background grid uses a repeating linear gradient with a `28px` cadence:
  ```css
  background-image: repeating-linear-gradient(
    transparent,
    transparent 27px,
    var(--ruled-line) 27px,
    var(--ruled-line) 28px
  );
  ```
- **Line Alignment:** The writing `textarea` and rendered entry cards MUST have:
  - `font-size: 17px;`
  - `line-height: 28px;`
  - `padding-top: 6px;` (or calculated baseline offset)
  Ensuring text baseline aligns precisely with the 28px ruled lines without drifting over multi-line text.
- **Dynamic Auto-Expansion:** Textarea automatically adjusts its height on `input` events (`textarea.style.height = textarea.scrollHeight + 'px'`). As height expands, the background repeating gradient continues generating new lines dynamically.
- **Taller Page Proportions:** Minimum height for the active journaling canvas is set to `min-height: 340px` (with historical entry cards maintaining comfortable breathing room) to provide a generous physical notebook feel.
- **Theme Palette Tokens:**
  - `--ruled-line-paper: rgba(180, 150, 120, 0.22);` (warm sepia rule in Paper mode)
  - `--ruled-line-night: rgba(255, 255, 255, 0.08);` (muted slate rule in Night mode)
