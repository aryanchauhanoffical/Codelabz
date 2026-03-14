# AI Assisted Tutorial Generator

## 1. Feature Overview

This feature integrates Google Gemini to assist users while writing tutorials.

The system analyzes the content of a tutorial step and generates structured
improvement suggestions such as better titles, explanations, code snippets,
or formatting enhancements.

---

## 2. Problem

Writing high-quality tutorials requires significant effort.

New contributors often struggle with:
- structuring explanations
- improving titles
- providing useful code examples
- formatting content clearly

---

## 3. Solution

An AI assistant powered by Google Gemini generates suggestions
directly inside the tutorial editor.

Users can accept or reject each suggestion.
Accepted suggestions are inserted into the tutorial content.

---

## 4. System Architecture

```
Tutorial Editor
      ↓
AI Suggestions Button  (EditControls.jsx)
      ↓
AiSuggestionPanel  (Drawer UI)
      ↓
Redux thunk  →  Firebase Cloud Function
      ↓
Gemini API  (Gemini 1.5 Flash)
      ↓
Structured JSON Suggestions
      ↓
Suggestions Panel UI  (accept / reject cards)
      ↓
User Accept / Reject
      ↓
Firestore analytics storage  (ai_suggestions collection)
```

---

## 5. Backend

**Cloud Functions** (`functions/cloud_functions/aiSuggestions.js`)

### `generateTutorialSuggestions`
- Auth protected — requires signed-in user
- Receives tutorial step content from the frontend
- Sends structured prompt to Gemini 1.5 Flash
- Parses structured JSON suggestions from Gemini response
- Stores the session in Firestore `ai_suggestions` collection
- Returns `{ suggestions, suggestion_session_id }` to the client

### `recordSuggestionResult`
- Records whether the user accepted or rejected each suggestion
- Stores analytics data in `ai_suggestions/{session_id}.accepted_ids` / `rejected_ids`

---

## 6. Database Schema

```
ai_suggestions/{session_id}

├── suggestion_session_id  string   ← same as document ID
├── tutorial_id            string
├── step_id                string
├── uid                    string   ← Firebase Auth UID
├── suggestions[]
│     id          string
│     type        "title" | "content" | "code" | "formatting"
│     suggestion  string  (plain text for title, HTML for others)
│     explanation string
├── accepted_ids  string[]
├── rejected_ids  string[]
└── createdAt     Timestamp
```

---

## 7. Frontend

**Redux** (`src/store/actions/aiActions.js`, `src/store/reducers/aiReducer.js`)

State shape:
```
state.ai = {
  loading,
  error,
  suggestions[],
  accepted_ids[],
  rejected_ids[],
  suggestion_session_id,
  tutorial_id,
  step_id
}
```

Main actions:

| Action | Description |
|--------|-------------|
| `requestAiSuggestions` | Calls Cloud Function, stores results in Redux |
| `acceptAiSuggestion` | Title → updates step title; others → appends HTML to step content |
| `rejectAiSuggestion` | Removes suggestion from UI, records to Firestore |
| `clearAiSuggestions` | Resets AI state (called on panel close) |

---

## 8. UI

**Component:** `src/components/Tutorials/subComps/AiSuggestionPanel.jsx`

Features:
- Generate suggestions button (disabled if no step content)
- Loading indicator while Gemini processes
- Suggestion cards with type badge (Title / Content / Code / Format)
- One-sentence explanation per suggestion
- Accept (✓) and Reject (✗) actions per card
- Regenerate button once suggestions are consumed

---

## 9. Integration

The editor toolbar (`EditControls.jsx`) includes an **AI Suggestions** button that opens
the `AiSuggestionPanel` drawer and triggers suggestion generation.

```
[Add Step]  [Add Images]  [✨ AI Suggestions]  [Remove Step]
```

---

## 10. Setup

### Get a Gemini API key

Go to https://aistudio.google.com → **Get API Key** → create a key in a Google Cloud project.

### Configure Firebase Functions

```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

For local development, add to `functions/.env`:
```
GEMINI_API_KEY=your_key_here
```

### Install dependencies and deploy

```bash
cd functions && npm install --legacy-peer-deps
firebase deploy --only functions
```

### Free tier limits (Gemini 1.5 Flash)

| Resource | Limit |
|----------|-------|
| Requests per minute | 60 |
| Requests per day | 1,500 |
| Input tokens per minute | 1,000,000 |

For production scale, upgrade to a paid Gemini API plan.

---

## 11. Files Changed

| File | Change |
|------|--------|
| `functions/cloud_functions/aiSuggestions.js` | New — Gemini Cloud Function handlers |
| `functions/index.js` | Exports two new `onCall` functions |
| `functions/package.json` | Added `@google/generative-ai` dependency |
| `src/store/actions/actionTypes.js` | Added 6 AI action type constants |
| `src/store/actions/aiActions.js` | New — request, accept, reject, clear actions |
| `src/store/reducers/aiReducer.js` | New — AI suggestions state reducer |
| `src/store/reducers/index.js` | Added `ai: aiReducer` to root reducer |
| `src/store/actions/index.js` | Exported AI actions |
| `src/components/Tutorials/subComps/AiSuggestionPanel.jsx` | New — Drawer UI with suggestion cards |
| `src/components/Tutorials/subComps/EditControls.jsx` | Added "AI Suggestions" button |
| `src/components/Tutorials/index.jsx` | Wired panel open/close state |
