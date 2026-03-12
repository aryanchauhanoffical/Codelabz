# Environment Variables and Secrets

This document explains every sensitive value the project depends on, where it comes from, how it flows into the application, and what happens if it's missing.

---

## The Two Contexts

Secrets are handled differently depending on where the code is running:

| Context | How secrets are provided |
|---|---|
| Local development | `.env` file in the project root (never committed) |
| CI/CD (GitHub Actions) | GitHub Repository Secrets, written to `.env` at runtime |

In both cases, the application reads values through Vite's `import.meta.env` — any variable prefixed with `VITE_APP_` is automatically exposed to the frontend bundle at build time.

---

## Complete Variable Reference

### Firebase Core Configuration

These come from the Firebase Console under Project Settings → Your Apps → SDK setup.

| Variable | What it is | Required |
|---|---|---|
| `VITE_APP_FIREBASE_API_KEY` | Public API key for Firebase project identification | Yes |
| `VITE_APP_AUTH_DOMAIN` | Firebase Auth domain (e.g. `your-project.firebaseapp.com`) | Yes |
| `VITE_APP_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_APP_DATABASE_URL` | Realtime Database URL (e.g. `https://your-project-default-rtdb.firebaseio.com`) | Yes |
| `VITE_APP_FIREBASE_STORAGE_BUCKET` | Cloud Storage bucket (e.g. `your-project.appspot.com`) | Yes |
| `VITE_APP_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID for push notifications | Yes |
| `VITE_APP_FIREBASE_APP_ID` | Firebase App ID | Yes |
| `VITE_APP_FIREBASE_MEASUREMENTID` | Google Analytics measurement ID | No (analytics only) |

**Where they're used:** All of these feed directly into `src/config/index.js` to initialize Firebase:

```js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_APP_DATABASE_URL,
  // ...
};
firebase.initializeApp(firebaseConfig);
```

### Push Notifications

| Variable | What it is | Required |
|---|---|---|
| `VITE_APP_FIREBASE_FCM_VAPID_KEY` | VAPID key for Firebase Cloud Messaging (web push) | Only if push notifications are enabled |

This is used in `src/config/index.js` when requesting a push notification token from the browser. The feature is currently gated behind a `checkMessaging = false` flag — set it to `true` to enable.

### Development Mode Switch

| Variable | Values | Effect |
|---|---|---|
| `VITE_APP_USE_EMULATOR` | `true` / `false` | When `true`, all Firebase services point to local emulators instead of production |

When set to `true`, the config file redirects Firebase to localhost ports:

```
Firestore  → localhost:8080
Auth       → localhost:9099
Realtime DB → localhost:9000
```

Always use `VITE_APP_USE_EMULATOR=true` for local development. Never run tests against the real Firebase project.

### Testing

| Variable | What it is | Required |
|---|---|---|
| `CYPRESS_PROJECT_ID` | Cypress Cloud project ID for test recording | Only for cloud test reporting |
| `CYPRESS_RECORD_KEY` | Cypress Cloud secret key | Only for cloud test recording (currently disabled) |

### Backend (Cloud Functions)

The Cloud Functions require a Firebase Admin SDK service account. This is **not** an environment variable — it's a JSON file written to `functions/private/cl-dev-pk.json` at CI runtime from the `FIREBASE_SERVICE_ACCOUNT_CODELABZ` GitHub Secret.

This file is in `.gitignore` and must never be committed.

---

## Local Setup

1. Copy the sample file:
   ```bash
   cp .env.sample .env
   ```

2. Fill in each value from your Firebase Console. For local development, get values from the dev Firebase project (not production).

3. Set `VITE_APP_USE_EMULATOR=true` to use local emulators.

4. For Cloud Functions to work locally, place your service account JSON at `functions/private/cl-dev-pk.json`. Download it from Firebase Console → Project Settings → Service Accounts → Generate new private key.

---

## How GitHub Secrets Work in CI

GitHub Secrets are encrypted at rest and injected into workflow runs as environment variables. They are never printed in logs (GitHub masks them automatically).

In each workflow, the `.env` file is reconstructed from scratch:

```yaml
- name: Create .env File
  run: |
    echo "VITE_APP_FIREBASE_API_KEY=${{ secrets.VITE_APP_FIREBASE_API_KEY }}" >> .env
    echo "VITE_APP_AUTH_DOMAIN=${{ secrets.VITE_APP_AUTH_DOMAIN }}" >> .env
    # ... rest of variables
```

This approach means the `.env` file only exists during the workflow run and is never stored anywhere persistent.

To add a new secret: go to GitHub → Repository → Settings → Secrets and Variables → Actions → New repository secret. Then add the corresponding `echo` line to each workflow that needs it.

---

## Security Notes

**The Firebase API key is not truly secret.** Firebase client-side API keys are intentionally public — they identify your project but don't grant access to anything. Access control is enforced by Firestore security rules, Auth rules, and Storage rules — not by keeping the API key private. This is a common point of confusion.

**What is actually sensitive:**
- `FIREBASE_SERVICE_ACCOUNT_CODELABZ` — this JSON key grants full admin access to your Firebase project. Treat it like a password. Rotate it if it's ever exposed.
- `CYPRESS_RECORD_KEY` — grants write access to your Cypress Cloud test history.

**What is not sensitive:**
- All `VITE_APP_*` variables — these end up embedded in the JavaScript bundle sent to every user's browser anyway. Their security relies on Firebase rules, not obscurity.
