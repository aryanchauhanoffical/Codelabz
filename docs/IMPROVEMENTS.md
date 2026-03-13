# Identified Limitation and Proposed Improvement

## The Problem: Tests Do Not Gate Production Deployments

### What the pipeline does today

When a commit is pushed to `main`, two GitHub Actions workflows fire simultaneously and independently:

- `cypress.yml` — runs the full E2E test suite
- `firebase-hosting-merge.yml` — builds and deploys to production

Neither workflow knows the other exists. The deployment does not wait for tests to pass.

```
push to main
     │
     ├──► cypress.yml           (starts running tests...)
     │
     └──► firebase-hosting-merge.yml
               │
               ▼
          npm install
          npm run build
          deploy to PRODUCTION   ← happens regardless of test outcome
```

### Why this is a real risk

If a developer pushes a commit that breaks authentication, breaks the tutorial editor, or introduces a rendering error — Cypress will catch it, but the broken code will already be live on `https://dev.codelabz.io/` by the time the test failure notification arrives.

This is not a hypothetical. It is the current behavior of the pipeline. The CI system is running tests that have no power to stop a bad deployment.

---

## The Root Cause

The `firebase-hosting-merge.yml` workflow has no `needs:` dependency declared. In GitHub Actions, unless you explicitly tell a job to wait for another, it runs immediately. The two workflows aren't even in the same file, so there's no natural dependency between them.

Additionally, `cypress.yml` is triggered on every push to every branch — not just `main`. This means tests run on work-in-progress feature branches where they may not even be relevant, consuming CI minutes unnecessarily.

---

## The Fix

### Part 1: Make the deploy wait for tests

Consolidate the test and deploy jobs into a single workflow file, or use `workflow_run` to create an explicit dependency between them.

The cleaner approach is a single workflow for the `main` branch:

```yaml
# .github/workflows/main-pipeline.yml

name: Test and Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    name: Run Cypress E2E Tests
    runs-on: ubuntu-latest
    steps:
      # ... (same steps as current cypress.yml)

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [test]          # ← this is the critical addition
    steps:
      # ... (same steps as current firebase-hosting-merge.yml)
```

The `needs: [test]` line tells GitHub Actions: do not start the deploy job until the test job completes successfully. If tests fail, the deploy job is skipped entirely.

### Part 2: Stop running E2E tests on every branch push

E2E tests are expensive — they start the Firebase Emulator, build the full app, and run a browser. Running them on every commit to every feature branch is wasteful and slows down developer feedback on branches that haven't requested review yet.

Change the trigger in `cypress.yml`:

```yaml
# Current
on: push

# Improved
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

This means:
- Tests run when a PR is opened or updated against `main` — giving reviewers confidence before merge
- Tests run after merge to `main` — as a final gate before the deploy job proceeds
- Tests do not run on every push to every feature branch

---

## What Changes After This Fix

| Scenario | Before | After |
|---|---|---|
| Tests fail on a push to `main` | Deploy happens anyway | Deploy is blocked |
| Tests pass on a push to `main` | Deploy happens | Deploy happens |
| Push to a feature branch | Full E2E suite runs | No E2E run (faster feedback) |
| PR opened against `main` | Full E2E suite runs | Full E2E suite runs |
| Developer knows about a bad deploy | After users report it | Before it goes live |

---

## Additional Improvements Worth Considering

These are lower priority but worth noting for future work:

**1. No staging environment**
Every merged PR goes directly to production. There's no intermediate environment to do final QA on. Firebase Hosting supports multiple channels — a `staging` channel could be set up that deploys from `main` while `live` only deploys after manual promotion or additional approval.

**2. No automatic rollback**
If a bad deploy makes it through, there's no automated rollback. Firebase Hosting does keep previous deploy history and supports one-click rollback from the Firebase Console, but this is a manual step. A failure detection mechanism (e.g. a smoke test after deploy) with an automatic rollback trigger would improve resilience.

**3. No dependency caching on deploy workflows**
`firebase-hosting-merge.yml` and `firebase-hosting-pull-request.yml` do not cache `node_modules`. The Cypress workflow does cache npm. Adding the same `actions/cache` step to the deploy workflows would save roughly 1–2 minutes per deploy.

**4. `npm install --legacy-peer-deps` is a warning sign**
The `--legacy-peer-deps` flag is used in all three workflows. This flag suppresses peer dependency conflicts rather than resolving them. It works, but it means the dependency tree has unresolved compatibility issues. These should be resolved properly before upgrading major dependencies becomes necessary.
