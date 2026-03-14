# Identified Limitation and Proposed Improvement

## The Problem: Tests Do Not Gate Production Deployments

### What happens today

When a commit is pushed to `main`, two workflows fire simultaneously and independently:

- `cypress.yml` — runs the full E2E test suite
- `firebase-hosting-merge.yml` — builds and deploys to production

Neither knows the other exists. The deployment does not wait for tests.

```
push to main
     │
     ├──► cypress.yml           (starts running tests...)
     │
     └──► firebase-hosting-merge.yml
               │
               ▼
          npm install + build
          deploy to PRODUCTION   ← happens regardless of test outcome
```

### Why this is a real risk

If a commit breaks authentication, the tutorial editor, or introduces a rendering error — Cypress will catch it, but the broken code will already be live by the time the failure notification arrives. This is the current behavior. The CI system is running tests that have no power to stop a bad deployment.

---

## The Root Cause

`firebase-hosting-merge.yml` has no `needs:` dependency declared. In GitHub Actions, unless you explicitly tell a job to wait for another, it starts immediately. The two workflows are in separate files, so there's no natural dependency between them.

Additionally, `cypress.yml` triggers on every push to every branch, including WIP commits on feature branches where they're irrelevant. This wastes CI minutes and slows feedback loops.

---

## The Fix

### Part 1: Make the deploy wait for tests

Consolidate into a single workflow for `main`:

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
      # ... same steps as current cypress.yml

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [test]          # ← this is the only critical addition
    steps:
      # ... same steps as current firebase-hosting-merge.yml
```

`needs: [test]` tells GitHub Actions: do not start the deploy job until the test job completes successfully. If tests fail, deploy is skipped entirely.

### Part 2: Stop running E2E tests on every branch push

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

Tests run on PRs against `main` (pre-merge confidence) and on pushes to `main` (pre-deploy gate). Not on every feature branch commit.

---

## Impact

| Scenario | Before | After |
|---|---|---|
| Tests fail on push to `main` | Deploy happens anyway | Deploy is blocked |
| Tests pass on push to `main` | Deploy happens | Deploy happens |
| Push to a feature branch | Full E2E suite runs | No E2E run (faster) |
| PR opened against `main` | Full E2E suite runs | Full E2E suite runs |
| Bad deploy caught | After users report it | Before it goes live |

---

## Secondary Improvements Worth Noting

**1. No staging environment**
Every merged PR goes directly to production. Firebase Hosting supports multiple channels — a `staging` channel could accept merges to `main` while `live` only deploys after additional approval or smoke test pass.

**2. No automatic rollback**
Firebase Hosting keeps deploy history and supports one-click rollback from the Console, but this is a manual step. A smoke test after deploy with automatic rollback on failure would close this gap.

**3. No dependency caching on deploy workflows**
`firebase-hosting-merge.yml` and `firebase-hosting-pull-request.yml` do not cache `node_modules`. Adding the same `actions/cache` step from `cypress.yml` would save 1–2 minutes per deploy.

**4. `--legacy-peer-deps` in all workflows**
This flag suppresses peer dependency conflicts rather than resolving them. It works, but it means the dependency tree has unresolved compatibility issues that will complicate future major upgrades.
