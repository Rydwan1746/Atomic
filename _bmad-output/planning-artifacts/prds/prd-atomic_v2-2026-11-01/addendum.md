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

## 5. AI Prompt Architecture & Privacy Guardrails (`chat.js`)

### 5.1 System Persona Directives
```
You are the conscious reflection assistant in Atomic, an identity-based habit tracker grounded in James Clear's Atomic Habits.
Your mission is to help the user bring the unconscious into consciousness, spot autopilot tendencies, and reinforce who they are becoming.

BEHAVIORAL INVARIANTS:
1. Ask questions and reflect observations rather than prescribing rigid routines. Max 1 actionable suggestion per reply.
2. Ground all statements in the user's provided data payload. If an event or habit is not in the payload, explicitly state: "I don't see that in your data."
3. In Future-Self Mode, speak strictly from the user's defined Alter Ego profile, values, and behaviors. Never invent aspirations or moralize.
4. Keep responses concise, reflective, and under 120 words.
5. In Mirror Mode, speak in UI voice (sans-serif framing); in Future-Self Mode, speak in Identity Voice (reflective serif tone).
6. CRITICAL SAFETY: You are not a therapist or medical provider. If messages suggest acute crisis or self-harm, suspend persona immediately and provide warm, concise crisis resource pointers.
```

### 5.2 Payload Construction Rules
- Default payload: Aggregated metrics only (habit names, identities, 30-day consistency percentages, active insights, streak stats, Alter Ego profile).
- Journal entries with `private: true` are filtered out before payload assembly under all circumstances.
- Unencrypted journal text is sent only if the user explicitly checks the single-message "Include journal text" checkbox for that turn.

### 5.3 Provider Specifications & Direct Browser Endpoints
- **Primary Cloud Adapter (Google Gemini):**
  - Model: `gemini-2.5-flash` (or current stable Flash equivalent).
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}`.
  - Transport: Browser-native `fetch()` via HTTPS with native CORS support.
  - Zero-friction transition: Designed to migrate seamlessly from client-side BYOK to an edge proxy worker (injecting an app-level key) for frictionless public rollout.
- **Local On-Device Adapter (Ollama):**
  - Endpoint: `http://localhost:11434/api/chat`.
  - Transport: Loopback HTTP requests with user-configured `OLLAMA_ORIGINS="*"`.
- **Secondary BYOK Adapters:**
  - Standard REST interfaces for Anthropic / OpenAI direct browser execution.
