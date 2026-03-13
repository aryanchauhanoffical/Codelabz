# Environment Variables and Secrets

Every sensitive value the project depends on, where it comes from, how it flows into the application, and what happens if it's missing.

---

## The Two Contexts

| Context | How secrets are provided |
|---|---|
| Local development | `.env` file in the project root (never committed) |
| CI/CD (GitHub Actions) | GitHub Repository Secrets, written to `.env` at runtime |

In both cases, the application reads values through Vite's `import.meta.env` — any variable prefixed with `VITE_APP_` is automatically exposed to the frontend bundle at build time.

---

## Complete Variable Reference

### Firebase Core

From the Firebase Console under Project Settings → Your Apps → SDK setup.

| Variable | What it is | Required |
|---|---|---|
| `VITE_APP_FIREBASE_API_KEY` | Public API key for project identification | Yes |
| `VITE_APP_AUTH_DOMAIN` | Firebase Auth domain | Yes |
| `VITE_APP_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_APP_DATABASE_URL` | Realtime Database URL | Yes |
| `VITE_APP_FIREBASE_STORAGE_BUCKET` | Cloud Storage bucket | Yes |
| `VITE_APP_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID | Yes |
| `VITE_APP_FIREBASE_APP_ID` | Firebase App ID | Yes |
| `VITE_APP_FIREBASE_MEASUREMENTID` | Google Analytics measurement ID | No (analytics only) |

All of these feed directly into `src/config/index.js:13-22` to initialize Firebase.

### Push Notifications

| Variable | What it is |
|---|---|
| `VITE_APP_FIREBASE_FCM_VAPID_KEY` | VAPID key for web push notifications |

Used when requesting a push token from the browser. Gated behind `checkMessaging = false` in `src/config/index.js` — set to `true` to enable.

### Development Mode Switch

| Variable | Values | Effect |
|---|---|---|
| `VITE_APP_USE_EMULATOR` | `true` / `false` | Redirects all Firebase services to local emulator ports |

Always use `true` locally. Never run tests against the real Firebase project.

### Testing

| Variable | What it is |
|---|---|
| `CYPRESS_PROJECT_ID` | Cypress Cloud project ID |
| `CYPRESS_RECORD_KEY` | Cypress Cloud secret key (currently disabled in CI) |

### Backend (Cloud Functions)

The Cloud Functions require a Firebase Admin SDK service account JSON file written to `functions/private/cl-dev-pk.json`. In CI it comes from the `FIREBASE_SERVICE_ACCOUNT_CODELABZ` GitHub Secret. Locally, download it from Firebase Console → Project Settings → Service Accounts → Generate new private key.

This file is gitignored and must never be committed.

---

## Local Setup

```bash
cp .env.sample .env
# Fill in each value from your Firebase Console
# Set VITE_APP_USE_EMULATOR=true
# Place service account JSON at functions/private/cl-dev-pk.json
```

---

## How GitHub Secrets Flow Into the App

```
GitHub Secrets
      │
      ▼ (CI workflow — .env written at runtime)
  import.meta.env.VITE_APP_*   ← read in src/config/index.js
      │
      ▼
  firebaseConfig object
      │
      ▼
  firebase.initializeApp(firebaseConfig)
```

The `.env` file is generated fresh on every CI run and never stored anywhere persistent.

---

## Security Notes

**The Firebase API key is not truly secret.** Firebase client-side API keys are intentionally public — they identify your project but grant no access on their own. Access control is enforced by Firestore rules, Auth rules, and Storage rules — not by keeping the key private. This is a common point of confusion.

**What is actually sensitive:**
- `FIREBASE_SERVICE_ACCOUNT_CODELABZ` — grants full admin access to your Firebase project. Rotate it immediately if exposed.
- `CYPRESS_RECORD_KEY` — grants write access to your Cypress Cloud test history.

**What is not sensitive:**
- All `VITE_APP_*` variables — these end up embedded in the JavaScript bundle sent to every user's browser. Their security depends on Firebase rules, not obscurity.
