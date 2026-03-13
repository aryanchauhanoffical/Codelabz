# AI Assisted Tutorial Generator

## The Problem It Solves

Creating a tutorial on Codelabz today requires a significant amount of manual effort before a single line of actual content is written. A contributor opens the `NewTutorial` modal, fills in a title and summary, picks tags, creates the tutorial, then manually adds steps one at a time — each with a title and duration — before they can start writing content in the editor.

For experienced developers who want to share knowledge, this upfront structure work is friction. For newer contributors who are unsure how to break a topic into well-paced steps, it's a barrier that causes them to either abandon the effort or produce tutorials with poor structure.

The deeper problem is that the blank-canvas editor is intimidating. When someone sits down to write "Introduction to Redux Toolkit", they know the subject well, but they don't necessarily know how many steps to use, how to sequence the concepts, or how to word each step title in a way that's useful to a reader.

The result: fewer tutorials get created, and the ones that do get created are unevenly structured.

---

## The Value for Users

**For tutorial authors:**
- Type a topic, get a fully structured skeleton — title, summary, step titles, estimated durations, and starter content per step — in under ten seconds.
- The generated structure is a starting point, not a finished product. Every part is editable. Authors aren't locked into anything the AI suggests.
- No expertise in content design required. The AI handles "how should I structure this?" so the author can focus on "what do I know about this topic?"

**For tutorial readers:**
- Tutorials created with AI assistance have consistent, well-paced structure. Steps don't suddenly jump from beginner to advanced without transitions.
- Estimated durations are more accurate because the AI bases them on content volume rather than a manual guess.

**For the platform:**
- More tutorials get published. Lower barrier to creation means more content, which means more reasons for readers to come back.
- Improved content quality at scale without requiring editorial review of every tutorial.

---

## How It Integrates With the Existing System

The feature does not replace anything in the current creation flow. It adds one new entry point — an **"Generate with AI"** button in the `NewTutorial` modal — that takes the title and topic the user has already typed and returns a complete tutorial scaffold.

### Current creation flow:
```
NewTutorial modal (title + summary + tags + owner)
        ↓
createTutorial() → writes to tutorials collection
        ↓
addNewTutorialStep() → writes "Step One" with blank content
        ↓
User navigates to editor, manually adds and fills steps
```

### New flow with AI Generator:
```
NewTutorial modal (title + topic intent)
        ↓
"Generate with AI" button clicked
        ↓
AI returns scaffold (summary, tags, N steps with titles + starter content)
        ↓
User reviews and edits the scaffold in-modal (step titles, remove/add)
        ↓
"Create Tutorial" — same createTutorial() action, same Firestore write
        ↓
Editor opens with all steps already created and pre-filled
        ↓
User refines content in the Firepad editor as normal
```

The `createTutorial` action, the Firestore data model, the step subcollection, and the Firepad editor require **zero changes**. The AI generator is purely additive — it feeds into the existing creation pipeline.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND — NewTutorial Modal (src/components/Tutorials/NewTutorial)│
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Existing fields: title, summary, owner, tags               │   │
│  │                                                             │   │
│  │  NEW: "Generate with AI" button                             │   │
│  │       Topic intent field (optional freeform)                │   │
│  │       Audience level selector (beginner/intermediate/adv)   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                      │                                              │
│                      │ user clicks Generate                         │
│                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  AIGeneratorPreview component (new)                         │   │
│  │                                                             │   │
│  │  Shows generated scaffold:                                  │   │
│  │  - Suggested title (editable)                               │   │
│  │  - Summary (editable)                                       │   │
│  │  - Tags (editable chips)                                    │   │
│  │  - Step list with drag-to-reorder                           │   │
│  │    Each step: title + duration + content preview            │   │
│  │  - Add/remove steps inline                                  │   │
│  │                                                             │   │
│  │  [Regenerate]  [Accept and Create]                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS callable
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CLOUD FUNCTION — generateTutorialScaffold (new)                    │
│  functions/cloud_functions/aiGeneratorFunction.js                   │
│                                                                     │
│  Input:                                                             │
│  { title, topic, audience, language, uid, org_handle }             │
│                                                                     │
│  Steps:                                                             │
│  1. Validate request — auth required (context.auth)                │
│  2. Rate limit check — read ai_usage/{uid} from Firestore          │
│     (max 10 generations per day per user)                           │
│  3. Build structured prompt (see Prompt Design section)             │
│  4. Call Claude API — claude-sonnet-4-6 with structured output     │
│  5. Parse and validate response JSON                                │
│  6. Log usage to ai_usage/{uid} (for rate limiting + analytics)     │
│  7. Return scaffold to client                                       │
│                                                                     │
│  Output:                                                            │
│  { title, summary, tags[], steps[{ title, duration, content }] }   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS API call
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CLAUDE API (Anthropic)                                             │
│  Model: claude-sonnet-4-6                                           │
│                                                                     │
│  Receives structured prompt with:                                   │
│  - Tutorial topic and title                                         │
│  - Target audience level                                            │
│  - Output format specification (JSON schema)                        │
│  - Platform context (what Codelabz tutorials look like)             │
│                                                                     │
│  Returns structured JSON:                                           │
│  - Validated against expected schema before reaching client         │
└─────────────────────────────────────────────────────────────────────┘
                             │ scaffold returned to frontend
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND — User reviews scaffold                                   │
│  Edits, reorders, removes unwanted steps                            │
│  Clicks "Accept and Create"                                         │
│             ↓                                                       │
│  Same createTutorial() Redux action                                 │
│  + loop of addNewTutorialStep() for each AI-generated step          │
│             ↓                                                       │
│  Firepad editor pre-populated with step content                     │
│  via firepad.setText(content) on ready event (already in Editor)    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Editor → AI Service → Backend

```
Step 1: User input
─────────────────
User types in NewTutorial modal:
  title:    "Building REST APIs with Express and Node.js"
  topic:    "I want to cover setup, routing, middleware, and error handling"
  audience: "intermediate"
  language: "javascript"

        ↓ click "Generate with AI"

Step 2: Client calls Cloud Function
────────────────────────────────────
firebase.functions().httpsCallable('generateTutorialScaffold')({
  title:     "Building REST APIs with Express and Node.js",
  topic:     "setup, routing, middleware, error handling",
  audience:  "intermediate",
  language:  "javascript"
})

        ↓ arrives at Cloud Function

Step 3: Cloud Function validates and rate-limits
─────────────────────────────────────────────────
- Checks context.auth.uid exists (reject if unauthenticated)
- Reads ai_usage/{uid} from Firestore
  → if usage.daily_count >= 10: return error "Daily limit reached"
  → else: continue

        ↓

Step 4: Prompt construction
────────────────────────────
const prompt = `
You are a technical curriculum designer for Codelabz, a developer tutorial platform.

Generate a complete tutorial scaffold for the following:
Title: ${title}
Topic details: ${topic}
Target audience: ${audience}
Primary language/technology: ${language}

Return a JSON object matching this exact schema:
{
  "title": string,
  "summary": string (2-3 sentences, what the reader will learn),
  "tags": string[] (4-6 relevant technology tags),
  "steps": [
    {
      "title": string (clear, action-oriented step title),
      "duration": number (estimated minutes to complete, integer),
      "content": string (markdown content, 150-300 words of starter content
                         that the author will expand. Include a brief intro,
                         one code example where relevant, and a closing note.)
    }
  ]
}

Rules:
- Between 4 and 8 steps
- Total tutorial duration should be 20-60 minutes
- Steps must flow logically from setup to advanced usage
- Code examples must be syntactically correct ${language}
- Do not include a step just for introduction or just for conclusion
- Every step should deliver standalone learning value
`;

        ↓

Step 5: Claude API call
────────────────────────
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 4096,
  messages: [{ role: "user", content: prompt }]
});

        ↓ Claude returns JSON string

Step 6: Parse and validate
───────────────────────────
const scaffold = JSON.parse(response.content[0].text);

Validation checks:
  - scaffold.steps.length is between 2 and 10
  - every step has title (string), duration (number), content (string)
  - total duration is reasonable (< 180 minutes)
  - no step content is empty

If validation fails → return error to client with fallback message

        ↓

Step 7: Log usage
──────────────────
await firestore.collection("ai_usage").doc(uid).set({
  daily_count: FieldValue.increment(1),
  last_used: FieldValue.serverTimestamp(),
  total_count: FieldValue.increment(1)
}, { merge: true });

        ↓ returns scaffold to client

Step 8: Client displays preview
─────────────────────────────────
AIGeneratorPreview renders scaffold.
User edits step titles, reorders, deletes "Advanced Error Handling" step.
Clicks "Accept and Create".

        ↓

Step 9: Tutorial creation (existing code path)
───────────────────────────────────────────────
createTutorial({
  title: scaffold.title,
  summary: scaffold.summary,
  tags: scaffold.tags,
  owner: selectedOrg,
  created_by: userHandle
})(firebase, firestore, dispatch, history);

Then for each step in scaffold.steps (after tutorial_id is known):
  addNewTutorialStep({ tutorial_id, title: step.title, time: step.duration, id })

Then the editor opens. For each step, the existing ready handler:
  firepad.on("ready", () => {
    if (firepad.isHistoryEmpty()) {
      firepad.setText(step.content);   // pre-fills with AI content
    }
  });

This already works — the Editor component already supports this
via the data prop passed to firepad.setText().
```

---

## New Firestore Collections

### `ai_usage/{uid}`

Tracks per-user AI generation usage for rate limiting and analytics.

```
ai_usage/{uid}
  uid:           string
  daily_count:   number   (resets daily via scheduled function)
  total_count:   number
  last_used:     timestamp
  last_reset:    timestamp
```

### `ai_generations/{generation_id}`

Optional audit log of AI-generated content. Useful for moderation (detecting abuse or poor-quality generation) and for improving the prompt over time.

```
ai_generations/{generation_id}
  generation_id:   string
  uid:             string   (who requested it)
  input_title:     string
  input_topic:     string
  input_audience:  string
  output:          map      (the full scaffold that was returned)
  was_accepted:    boolean  (did user click "Accept"? — set client-side)
  tutorial_id:     string   (nullable — set when tutorial is created)
  model:           string   ("claude-sonnet-4-6")
  latency_ms:      number
  createdAt:       timestamp
```

---

## New Cloud Function

**Function name:** `generateTutorialScaffold`
**Type:** `onCall` (HTTPS callable — same pattern as `resendVerificationEmail`)
**File:** `functions/cloud_functions/aiGeneratorFunction.js`

**New environment variable needed:**
```
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

Added to `functions/.env` (not the frontend `.env` — this key must never reach the client bundle).

**New npm dependency in `functions/package.json`:**
```json
"@anthropic-ai/sdk": "^0.39.0"
```

---

## New Frontend Components

### `AIGeneratorButton`
A button added to `NewTutorial/index.jsx` below the summary field. Disabled until `title` is non-empty. Shows a loading spinner during the API call.

### `AIGeneratorPreview`
A new component rendered as a second screen within the `NewTutorial` modal after the scaffold is returned.

- Renders each step as a card with an editable title, duration field, and collapsed content preview
- Drag-to-reorder via `@dnd-kit` or a simple up/down arrow pair
- "Add Step" button appends a blank step
- "Remove" on any step card removes it
- "Regenerate" button calls the Cloud Function again with the same inputs
- "Accept and Create" button triggers the existing `createTutorial` → `addNewTutorialStep` flow

### New Redux state (in `tutorialsReducer`)

```js
// in tutorialsReducer/aiReducer.js (new)
{
  loading: false,
  error: null,
  scaffold: null   // the returned scaffold object, or null
}
```

Action types to add to `actionTypes.js`:
```
GENERATE_SCAFFOLD_START
GENERATE_SCAFFOLD_SUCCESS
GENERATE_SCAFFOLD_FAIL
CLEAR_SCAFFOLD
```

---

## Rate Limiting and Cost Control

AI API calls cost real money. Without guardrails, a single automated script could call `generateTutorialScaffold` thousands of times and generate a large unexpected bill.

**Per-user rate limit:** 10 generations per day. The limit is enforced server-side in the Cloud Function (not client-side) by reading `ai_usage/{uid}.daily_count` before calling the Claude API.

**Daily reset:** A scheduled Pub/Sub function (similar to the existing `deleteTutorialSteps` job) runs at midnight UTC and resets `daily_count` to 0 for all documents in `ai_usage`.

**Token budget:** `max_tokens: 4096` is set on the Claude API call. A typical scaffold uses 800–1500 tokens. The cap prevents runaway responses from a prompt injection attempt.

**Auth guard:** The Cloud Function checks `context.auth` and rejects unauthenticated requests immediately, before any Firestore reads or API calls are made.

---

## What Does Not Change

- `createTutorial()` action — unchanged
- `addNewTutorialStep()` action — unchanged
- `Editor` component — unchanged (already supports `data` prop for pre-fill)
- Firestore `tutorials` and `steps` data model — unchanged
- All existing routes — unchanged
- The `NewTutorial` modal form stays; the AI path is additive, not a replacement

A user who never clicks "Generate with AI" has an experience identical to today.

---

## Example Output

**Input:**
```
Title:    "Testing React Components with Vitest"
Topic:    "unit testing, mocking, component rendering, coverage"
Audience: "intermediate"
```

**AI-generated scaffold (abridged):**
```json
{
  "title": "Testing React Components with Vitest",
  "summary": "Learn to write reliable unit tests for React components using Vitest and Testing Library. This tutorial covers the complete testing workflow from setup to coverage reporting, with practical examples you can apply to any React project.",
  "tags": ["react", "vitest", "testing", "testing-library", "javascript"],
  "steps": [
    {
      "title": "Setting Up Vitest in a React Project",
      "duration": 8,
      "content": "Vitest is a Vite-native test runner that shares configuration with your build tool..."
    },
    {
      "title": "Writing Your First Component Test",
      "duration": 10,
      "content": "A component test verifies that a component renders the right output given specific props..."
    },
    {
      "title": "Mocking Dependencies and API Calls",
      "duration": 12,
      "content": "Real components rarely exist in isolation. They import utilities, call APIs, and depend on context..."
    },
    {
      "title": "Testing User Interactions with fireEvent",
      "duration": 10,
      "content": "Static rendering tests tell you a component displays correctly. Interaction tests tell you it behaves correctly..."
    },
    {
      "title": "Measuring Test Coverage",
      "duration": 6,
      "content": "Coverage reports show which lines of your code are exercised by tests and which are not..."
    }
  ]
}
```

Total: 5 steps, 46 minutes. The author accepts it, removes the coverage step (out of scope for their post), and clicks Create. The editor opens with four pre-filled steps ready to refine.
