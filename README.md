# Table of Content 📑

1. [CodeLabz](#codelabz)
2. [Deployment](#deployment)
3. [Local Development](#local-development)
4. [Useful Commands](#useful-commands)
5. [Community](#community)
6. [Contribute](#contribute)
7. [FAQs (Frequently Asked Questions)](#faqs)

# CodeLabz

**CodeLabz** is a platform where the users can engage with online tutorials and the organizations can create tutorials for the users. The platform will be developed using ReactJS frontend library and the backend will be developed using the Google Cloud Firestore and Google Firebase Real-Time database.

# Deployment

You can see the app live at [https://dev.codelabz.io/](https://dev.codelabz.io/)

# Local Development

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag is required because the project contains peer dependency conflicts.

### 2. Configure Environment Variables

```bash
cp .env.sample .env
```

Then fill in your Firebase credentials in `.env`:

```
VITE_APP_FIREBASE_API_KEY=...
VITE_APP_AUTH_DOMAIN=...
VITE_APP_FIREBASE_PROJECT_ID=...
VITE_APP_FIREBASE_MESSAGING_SENDER_ID=...
VITE_APP_FIREBASE_APP_ID=...
VITE_APP_FIREBASE_MEASUREMENTID=...
VITE_APP_DATABASE_URL=...
VITE_APP_FIREBASE_STORAGE_BUCKET=...
VITE_APP_FIREBASE_FCM_VAPID_KEY=...
VITE_APP_USE_EMULATOR=false
```

You can get these values from your [Firebase project console](https://console.firebase.google.com/).

### 3. Run Development Server

```bash
npm run dev
```

Application runs at **http://localhost:5173**

### Running with Firebase Emulators (recommended for local dev)

This lets you run the full app locally without needing real Firebase credentials.

**Terminal 1** — start emulators with test data:

```bash
npm run emulator-import
```

**Terminal 2** — start the frontend pointed at the emulators:

```bash
VITE_APP_USE_EMULATOR=true npm run dev
```

> Make sure to start the emulators **before** the frontend, otherwise login/signup will not work.

---

# Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Create optimized production build |
| `npm run preview` | Preview the production build locally |
| `npm run emulator` | Start Firebase emulators |
| `npm run emulator-import` | Start emulators and load test data |
| `npm run storybook` | Start Storybook component explorer on :6006 |
| `npm run cy:open` | Open Cypress E2E test runner |
| `npm run lint` | Run ESLint on `src/` |
| `npm run format` | Run Prettier formatter |

---

# Community

Join and communicate with other members on our community. We communicate on gitter.

[![Gitter](https://badges.gitter.im/scorelab/CodeLabz.svg)](https://gitter.im/scorelab/CodeLabz?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

# Contribute

Contributions are always welcome!

See [CONTRIBUTING.md](./CONTRIBUTING.md) for ways to get started.

Please adhere to this project's [code of conduct](./code_of_conduct.md).

# FAQs

### 1. Do I need to purchase Blaze plan to run the app ?

### Answer -

No, you don't need to purchase Blaze plan to run the app. You need to purchase it only if you want to deploy firebase cloud functions.

<hr/>

### 2. `npm install` command is not executing successfully in my system.

### Answer -

First of all make sure that your are using version 14 of node. If the problem still persists try `npm install --legacy-peer-deps`.

<hr/>

### 3. Login/Signup is not working.

<img src="https://files.gitter.im/5eb21f15d73408ce4fe2cb37/Jl4t/image.png" width="600">

### Solution :-

This problem generally arises when you have not setuped/started the Firebase emulators.

1. [Setup firebase emulator](https://github.com/scorelab/Codelabz/blob/master/CONTRIBUTING.md#firebase-setup).
2. [Start the Emulators](https://github.com/scorelab/Codelabz/blob/master/CONTRIBUTING.md#run-firebase-emulator)
3. Run the app using `npm run dev`.

> 📝**NOTE** : Remember to start the emulators before running the app.

- To start emulators - `firebase emulators:start --import=firebase.json --project <your-project-id>`. <br/>
- In some case all the emulator will not start. So you can execute a separate command for a particular emulator<br/>
For example if auth emulator is not starting you can use this command - <br/> `firebase emulators:start --import=firebase.json --project <your-project-id> --only auth`.
<hr/>

### 4. I am creating new account and it says that confirmation mail is sent to my email but I didn't got any mail.

### Answer :-

This feature is not implemented completely and we are currently working on this. If you still want to login/signup, you can try login/signup with google option.

<hr/>

### 5. I have done the environment setup, but when I start the app it is showing white/blank screen.

### Solution :-

This problem can arise in multiple scenarios :-

1. Check the browser console and see what error are you getting there and try to fix it.
2. Make sure that you have created `.env` file and placed all values to the keys.
3. In some cases it can also arise due to any active ad-blocker extension in your browser. So make sure to turn it off.
<hr/>

### 6. make command not found

![image](https://user-images.githubusercontent.com/88550925/224977291-25101480-608b-41e6-a0b6-f03ff23f66b4.png)

### Solution :-

The Make Command Not Found error indicates that the make utility is either not installed on the system or it’s not present in the PATH variable.

Follow this link to fix this issue.
[Click here](https://www.technewstoday.com/fix-make-command-not-found/)

### 7. I want to contribute but don't know where to start.

### Answer :-

1. First of all try to make yourself comfortable with the app and explore its functionalities.
2. Have a look into issues that are already raised and are not assigned to anyone and ask the mentors to get it assigned it to you.
3. If you want to work on a new issue, first try to discuss it in the gitter channel with the mentors and then raise the issue.
<hr/>

### ❓ Got more questions, ask it in our [gitter channel](https://matrix.to/#/#scorelab_CodeLabz:gitter.im) and we will love ❤ to answer them.
