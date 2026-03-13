# CI/CD Pipeline

This document explains the full deployment pipeline for Codelabz — every automated workflow, what triggers it, what it does, and how it connects to production.

---

## Pipeline Overview

The project has three core workflows that form the CI/CD pipeline, plus two maintenance workflows. All of them live in `.github/workflows/`.

```
Developer writes code
        │
        ├─── git push (any branch) ──────────────────────────────────►
        │                                                   cypress.yml
        │                                              (E2E tests run on
        │                                               Firebase Emulator)
        │
        ├─── Open Pull Request ──────────────────────────────────────►
        │                                      firebase-hosting-pull-request.yml
        │                                      (Preview deploy, 7-day link
        │                                       posted as PR comment)
        │
        └─── PR merged to main ──────────────────────────────────────►
                                               firebase-hosting-merge.yml
                                               (Production deploy to
                                                https://dev.codelabz.io/)
```

---

## Workflow 1: Cypress E2E Tests (`cypress.yml`)

**Trigger:** Every push to any branch
**File:** `.github/workflows/cypress.yml`

This is the primary CI check. It spins up the full Firebase Emulator suite locally and runs the Cypress test suite against a real built version of the app.

**Steps in order:**

```
1. Checkout repository
        ↓
2. Setup Node.js 18
        ↓
3. Restore npm cache (keyed to package-lock.json hash)
        ↓
4. Write .env file from GitHub Secrets
        ↓
5. Write Firebase service account JSON to functions/private/
        ↓
6. Install Cloud Functions dependencies
        ↓
7. Install Firebase CLI globally
        ↓
8. Start Firebase Emulators with --import=./testdata
   (sleep 15s to let emulators initialize)
        ↓
9. Run Cypress via cypress-io/github-action@v6:
   - Installs frontend deps
   - Builds app (npm run build)
   - Starts dev server (npm run dev)
   - Waits for http://localhost:5173
   - Runs all Cypress specs in Chrome
```

The emulator is started with seed data from `testdata/` so tests run against a known, predictable state every time.

**Note:** `CYPRESS_RECORD_KEY` is present in the secrets but currently commented out in the workflow — cloud recording to Cypress Dashboard is disabled.

---

## Workflow 2: PR Preview Deploy (`firebase-hosting-pull-request.yml`)

**Trigger:** Pull request opened, updated, or synchronized
**File:** `.github/workflows/firebase-hosting-pull-request.yml`

Every PR gets its own live preview URL automatically. This lets reviewers and maintainers test changes in a real browser without pulling the branch locally.

**Steps:**

```
1. Checkout repository
        ↓
2. Setup Node.js 18
        ↓
3. Write .env from GitHub Secrets (VITE_APP_USE_EMULATOR=false)
        ↓
4. npm install --legacy-peer-deps
        ↓
5. npm run build (Vite production build)
        ↓
6. Deploy to Firebase Hosting preview channel:
   - Channel ID: pr-{pull_request_number}
   - Expires: 7 days after last update
        ↓
7. Firebase Action posts preview URL as a comment on the PR
```

The `--legacy-peer-deps` flag is required because some dependencies have peer dependency conflicts that haven't been resolved yet.

**Only runs for PRs from within the same repository** — forks cannot trigger this workflow (this is a security restriction to prevent secret exposure from untrusted contributors).

---

## Workflow 3: Production Deploy (`firebase-hosting-merge.yml`)

**Trigger:** Push to `main` branch
**File:** `.github/workflows/firebase-hosting-merge.yml`

This is the deployment to production. It runs whenever commits land on `main`, whether from a merged PR or a direct push.

**Steps:**

```
1. Checkout repository
        ↓
2. Setup Node.js 18
        ↓
3. Write .env from GitHub Secrets (VITE_APP_USE_EMULATOR=false)
        ↓
4. npm install --legacy-peer-deps
        ↓
5. npm run build || exit 1
   (build failure stops the deploy immediately)
        ↓
6. Deploy to Firebase Hosting live channel
   (replaces the current production site)
```

Firebase Hosting version is pinned to `13.35.1` — the comment in the workflow explains this is the last version supporting Node 18.

---

## Workflow 4: Stale Issue Management (`stale.yml`)

**Trigger:** Daily cron at 01:30 UTC
**File:** `.github/workflows/stale.yml`

Keeps the issue tracker clean automatically.

| Event | Condition | Action |
|---|---|---|
| Issue marked stale | Open for 30 days with no activity | Adds `stale` label + warning comment |
| Issue closed | Stale for 14 more days with no activity | Auto-closed |
| PRs | Never | PRs are never auto-closed (`days-before-pr-close: -1`) |

---

## Secrets Used Across Workflows

All sensitive values are stored as GitHub Repository Secrets. No secrets are committed to the repository. Each workflow reconstructs the `.env` file at runtime by echoing secrets into it.

| Secret | Used in |
|---|---|
| `VITE_APP_FIREBASE_API_KEY` | All three CI/CD workflows |
| `VITE_APP_AUTH_DOMAIN` | All three CI/CD workflows |
| `VITE_APP_DATABASE_URL` | All three CI/CD workflows |
| `VITE_APP_FIREBASE_PROJECT_ID` | All three CI/CD workflows + deploy target |
| `VITE_APP_FIREBASE_MESSAGING_SENDER_ID` | All three CI/CD workflows |
| `VITE_APP_FIREBASE_APP_ID` | All three CI/CD workflows |
| `VITE_APP_FIREBASE_MEASUREMENTID` | All three CI/CD workflows |
| `VITE_APP_FIREBASE_FCM_VAPID_KEY` | All three CI/CD workflows |
| `FIREBASE_SERVICE_ACCOUNT_CODELABZ` | Cypress (written to disk) + deploy actions |
| `CYPRESS_PROJECT_ID` | Cypress workflow |
| `CYPRESS_RECORD_KEY` | Cypress workflow (currently disabled) |
| `GITHUB_TOKEN` | Auto-provided by GitHub — used for PR comments and deploys |

---

## Environment Differences

| Variable | Cypress CI | PR Preview | Production |
|---|---|---|---|
| `VITE_APP_USE_EMULATOR` | `true` | `false` | `false` |
| Firebase target | Local emulator | Real Firebase project | Real Firebase project |
| Deploy channel | None | `pr-{number}` (7d expiry) | `live` |

---

## Known Limitation

The production deploy (`firebase-hosting-merge.yml`) does **not** depend on the Cypress test workflow passing. Both are triggered independently when something is pushed to `main`. This means a commit that breaks tests can still reach production.

See `IMPROVEMENTS.md` for a detailed explanation and the proposed fix.
