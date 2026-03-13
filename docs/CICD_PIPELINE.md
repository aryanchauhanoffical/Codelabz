# CI/CD Pipeline

This document explains the full deployment pipeline — every workflow, what triggers it, what it does, and how it connects to production.

---

## Pipeline Overview

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
   - npm install → npm run build → npm run dev
   - Waits for http://localhost:5173
   - Runs all Cypress specs in Chrome
```

---

## Workflow 2: PR Preview Deploy (`firebase-hosting-pull-request.yml`)

**Trigger:** Pull request opened, updated, or synchronized

Every PR gets its own live preview URL automatically. Reviewers can test changes in a real browser without pulling the branch locally.

```
1. Checkout → Setup Node 18 → Write .env (VITE_APP_USE_EMULATOR=false)
        ↓
2. npm install --legacy-peer-deps → npm run build
        ↓
3. Deploy to Firebase Hosting preview channel:
   - Channel ID: pr-{pull_request_number}
   - Expires: 7 days
        ↓
4. Firebase Action posts preview URL as PR comment
```

Only runs for PRs from within the same repository — forks cannot trigger this workflow (security restriction to prevent secret exposure).

---

## Workflow 3: Production Deploy (`firebase-hosting-merge.yml`)

**Trigger:** Push to `main` branch

```
1. Checkout → Setup Node 18 → Write .env (VITE_APP_USE_EMULATOR=false)
        ↓
2. npm install --legacy-peer-deps
        ↓
3. npm run build || exit 1  (build failure stops deploy immediately)
        ↓
4. Deploy to Firebase Hosting live channel
   (replaces current production site)
```

Firebase Hosting version pinned to `13.35.1` — last version supporting Node 18.

---

## Workflow 4: Stale Issue Management (`stale.yml`)

**Trigger:** Daily cron at 01:30 UTC

| Event | Condition | Action |
|---|---|---|
| Issue marked stale | Open for 30 days with no activity | Adds `stale` label + warning comment |
| Issue closed | Stale for 14 more days | Auto-closed |
| PRs | Never | PRs are never auto-closed |

---

## Secrets Table

All sensitive values are stored as GitHub Repository Secrets. Each workflow reconstructs `.env` at runtime.

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
| `GITHUB_TOKEN` | Auto-provided — PR comments and deploys |

---

## Environment Differences

| Variable | Cypress CI | PR Preview | Production |
|---|---|---|---|
| `VITE_APP_USE_EMULATOR` | `true` | `false` | `false` |
| Firebase target | Local emulator | Real Firebase project | Real Firebase project |
| Deploy channel | None | `pr-{number}` (7d expiry) | `live` |

---

## Known Limitation

The production deploy does **not** depend on Cypress tests passing. Both fire independently when something lands on `main`. A broken commit can reach production before the test failure notification arrives.

See `IMPROVEMENTS.md` for root cause analysis and the fix.
