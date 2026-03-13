# Architecture Overview

Codelabz is a collaborative tutorial platform where developers write, publish, and co-edit step-by-step technical tutorials. This document explains how the system is structured, what technology choices were made, and why.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite 5 | UI rendering and fast development builds |
| UI Library | Material-UI v5 (MUI) | Component design system |
| State Management | Redux + Redux-Thunk | Centralized app state |
| Firebase Integration | react-redux-firebase | Binds Firebase auth/data to Redux store |
| Backend | Firebase Cloud Functions (Node.js) | Server-side logic and triggers |
| Primary Database | Firebase Firestore | Document store for users, orgs, tutorials |
| Realtime Database | Firebase Realtime DB | Collaborative editor sync (Firepad) |
| Auth | Firebase Authentication | Email/password + OAuth providers |
| File Storage | Firebase Cloud Storage | Tutorial images and assets |
| Hosting | Firebase Hosting | SPA deployment |
| Collaborative Editing | Firepad + CodeMirror + Yjs | Real-time multi-user editing |
| Search | Elasticlunr | Client-side full-text search |
| Testing | Cypress | End-to-end browser tests |
| Component Docs | Storybook | Isolated component development |

There is no traditional Express or REST API server. All data operations go directly through the Firebase SDK from the frontend, and all server-side logic runs through Cloud Functions triggered by database events or HTTP calls.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        React SPA (Vite)                             │
│                                                                     │
│   Components → Redux Actions → Firebase SDK                         │
│                     │                                               │
└─────────────────────┼───────────────────────────────────────────────┘
                      │
        ┌─────────────┼──────────────────┐
        ▼             ▼                  ▼
  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐
  │Firestore │  │ Realtime DB  │  │ Cloud Functions  │
  │          │  │              │  │                  │
  │ users    │  │ user handles │  │ email triggers   │
  │ orgs     │  │ org handles  │  │ org setup        │
  │ tutorials│  │ editor notes │  │ handle registry  │
  │ comments │  │ (Firepad)    │  │ scheduled cleanup│
  └──────────┘  └──────────────┘  └─────────────────┘
        │             │
        └──── real-time listeners ────► Redux reducers ────► UI re-render
```

---

## Data Flow

Every user action follows this path:

1. User interacts with a React component
2. Component dispatches a Redux action (`src/store/actions/`)
3. The action creator receives `getFirebase` and `getFirestore` via thunk middleware
4. Firebase SDK reads or writes data to Firestore or Realtime DB
5. Real-time listeners push updates back into Redux state
6. Connected components re-render with fresh data

For server-side operations (sending emails, registering handles), Cloud Functions intercept Firestore/Auth events and execute logic that cannot safely run on the client.

---

## Key Architectural Decisions

**Why no backend server?**
Firebase provides auth, database, storage, and serverless functions in one platform. For this scale, it eliminates maintaining a separate API server, handling deployments, or managing infrastructure.

**Why two databases (Firestore + Realtime DB)?**
Firestore handles structured document queries well — user profiles, tutorial metadata, organization settings. Firepad (the collaborative editor library) requires Firebase Realtime DB specifically for its low-latency synchronization protocol. Both are used intentionally for what they do best.

**Why Redux alongside react-redux-firebase?**
react-redux-firebase automatically syncs Firebase auth and Firestore data into Redux. Custom reducers (auth, org, tutorials, etc.) handle UI-specific state that doesn't map cleanly to Firestore documents — loading states, editor cursor positions, or error messages.

**Why Elasticlunr for search?**
There is no Algolia or dedicated search backend. Tutorials are indexed client-side on app load using Elasticlunr, a lightweight full-text search library. This works well for a tutorial library of moderate size.

---

## Firestore Data Model

```
cl_user/{uid}
  - email, displayName, photoURL, handle, createdAt, updatedAt

cl_user_presence/{uid}
  - online status, last seen

cl_user_sessions/{uid}
  - session tracking

cl_org_general/{org_handle}
  - name, description, photoURL, website, social links
  - subcollection: cl_org_metrics/metrics
  - subcollection: cl_org_users/users

tutorials/{tutorial_id}
  - title, summary, featured_image, icon
  - isPublished, owner, editors, tut_tags
  - upVotes, downVotes, createdAt
  - steps[] with: title, duration, content, images, visibility

cl_mail/{doc}
  - used by Firebase Extension for transactional emails
```

**Realtime Database:**
```
cl_user_handle/{handle}       → uniqueness registry
cl_org_handle/{org_handle}    → uniqueness registry
notes/{tutorial_id}/{step_id} → Firepad collaborative content
```

---

## Security Rules Note

All three rule files (`firestore.rules`, `database.rules.json`, `storage.rules`) currently allow unrestricted read/write — intentional for local development with the Firebase Emulator. These must be tightened before any production traffic handles sensitive user data beyond what Firebase Authentication already protects.
