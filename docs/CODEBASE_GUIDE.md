# Codebase Guide

A folder-by-folder map of the repository. Use this as a reference when navigating the codebase — it explains what every major directory and file does so you can find anything without reading everything.

---

## Root Directory

```
Codelabz/
├── src/                        Frontend React application
├── functions/                  Firebase Cloud Functions (backend)
├── public/                     Static assets served as-is
├── cypress/                    End-to-end test specs
├── .storybook/                 Storybook configuration
├── .github/                    GitHub Actions workflows
├── testdata/                   Seed data for local Firebase Emulator
├── designs/                    Design assets and references
├── docs/                       Project documentation (you are here)
│
├── package.json                Frontend dependencies and npm scripts
├── vite.config.js              Vite build configuration
├── firebase.json               Firebase project config (hosting, emulators)
├── firestore.rules             Firestore security rules
├── database.rules.json         Realtime DB security rules
├── storage.rules               Cloud Storage security rules
├── cypress.config.js           Cypress test runner config
├── .env.sample                 Template for required environment variables
├── Dockerfile                  Container build config
└── docker-compose.yml          Local container orchestration
```

---

## Frontend Source (`src/`)

### Entry Points

| File | Purpose |
|---|---|
| `src/main.jsx` | App entry point — mounts React, wraps with Redux Provider and Firebase |
| `src/App.jsx` | Root component — sets up MUI theme and router |
| `src/routes.jsx` | All React Router route definitions with auth guards applied |

### `src/config/`
Firebase initialization. `index.js` reads environment variables, builds the `firebaseConfig` object, initializes all Firebase services, and conditionally points them at the local emulator when `VITE_APP_USE_EMULATOR=true`. If Firebase isn't connecting, this is the first file to check.

### `src/auth/`
Route guard HOCs (Higher-Order Components). These wrap route components to enforce access rules:

| HOC | Allows access when |
|---|---|
| `UserIsAuthenticated` | User is logged in |
| `UserIsNotAuthenticated` | User is not logged in |
| `UserIsAllowedUserDashboard` | Logged in AND completed registration (has a handle) |
| `UserIsNotAllowedUserDashboard` | Logged in but has NOT completed registration |
| `UserIsAllowOrgManager` | User is an org member with manager permissions |

These are applied directly in `routes.jsx` by wrapping the component: `UserIsAuthenticated(Dashboard)`.

### `src/store/`
The Redux layer. Everything that reads or writes Firebase data goes through here.

```
store/
├── index.js              Store setup — configures thunk middleware with getFirebase/getFirestore
├── actions/
│   ├── actionTypes.js    All action type constants (single source of truth)
│   ├── authActions.js    Login, logout, signup, email verification, password reset
│   ├── tutorialsActions.js  Tutorial CRUD, steps, tags, search indexing, notifications
│   ├── orgActions.js     Organization create, update, members, permissions
│   ├── profileActions.js User profile updates, avatar, follow/unfollow
│   └── tutorialPageActions.js  Comments, post views, feed interactions
└── reducers/
    ├── authReducer/      Login/signup loading and error state
    ├── profileReducer/   User profile data
    ├── orgReducer/       Organization general data and user list
    ├── tutorialsReducer/ Tutorial list, current tutorial, editor state, images
    ├── tutorialPageReducers/ Tutorial view state, comments, feeds
    └── notificationReducers/ In-app notification list and read state
```

**Pattern used throughout:** Action creators are async functions that receive `dispatch`, `getState`, `getFirebase`, and `getFirestore` as arguments. Firebase reads/writes happen inside these functions, then `dispatch()` is called with the result to update Redux state.

### `src/components/`
Every UI feature has its own folder. Each folder typically contains an `index.jsx` for the main component and sub-components alongside it.

| Folder | What it renders |
|---|---|
| `AuthPage/` | Login, Signup, Forgot Password pages |
| `Dashboard/` | Post-login landing page |
| `Editor/` | Tutorial step editor (CodeMirror + Firepad) |
| `HomePage/` | Public landing page |
| `MyFeed/` | Personalized tutorial feed |
| `NavBar/` | Top navigation bar |
| `Organization/` | Org profile page, settings, member management |
| `Profile/` | User profile view and edit |
| `Tutorials/` | Tutorial browse, search, card grid, NewTutorial modal |
| `TutorialPage/` | Tutorial reader with step navigation and comments |
| `UserDashboard/` | User's own tutorials and activity |
| `ManageUsers/` | Admin panel for user management |
| `Notification/` | In-app notification dropdown |
| `ErrorPages/` | 404 and generic error views |
| `Forms/` | Reusable form primitives |
| `util/` | Shared small UI utilities |

### `src/helpers/`
Stateless utility functions used across components.

| File | What it does |
|---|---|
| `themes.jsx` | MUI theme object (colors, typography, breakpoints) |
| `validations.jsx` | Form field validation rules (email, password, handle format) |
| `elasticlunr.jsx` | Client-side search index setup and query helpers |
| `avatarName.jsx` | Generates initials-based avatar from display name |
| `spinner.jsx` | Loading spinner component |
| `errorMsgHandler.jsx` | Maps Firebase error codes to human-readable messages |

---

## Backend (`functions/`)

Firebase Cloud Functions. These run server-side on Google's infrastructure.

```
functions/
├── index.js                  Exports all functions to Firebase
├── onCallFunctions.js        HTTP callable: resendVerificationEmail, sendPasswordUpdateEmail
├── onCreateFunctions.js      Triggers: sendVerificationEmail (user signup), createOrganization
├── onWriteFunctions.js       Triggers: registerUserHandle (ensures handle uniqueness in RT DB)
├── onUpdateFunctions.js      Triggers: updateOrgUser (syncs org member permissions)
├── pubSubFunctions.js        Scheduled: deleteTutorialSteps (runs every 7 days, cleans up)
├── auth.js                   Firebase Admin SDK initialization
└── validators/               Input validation utilities for function arguments
```

**How functions are triggered:**

- `onCall` functions are invoked directly from the frontend via `firebase.functions().httpsCallable('functionName')`
- `onCreate/onWrite/onUpdate` functions fire automatically when Firestore or Auth documents change
- `pubSub` functions run on a cron schedule defined in `firebase.json`

---

## Tests (`cypress/`)

End-to-end tests that run a real browser against a locally running app connected to the Firebase Emulator. Test specs are in `cypress/e2e/`. Test data is seeded from `testdata/` via `firebase emulators:start --import=./testdata`.

---

## Important Files to Know by Heart

If you're contributing, these are the files you'll touch most often:

1. `src/routes.jsx` — adding or modifying routes
2. `src/store/actions/` — any data operation
3. `src/components/{feature}/index.jsx` — feature UI
4. `functions/index.js` — server-side logic entry
5. `src/config/index.js` — Firebase setup (rarely changed)
6. `.env.sample` — reference for all required environment variables
