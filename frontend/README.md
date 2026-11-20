# Lectra

Interactive lecture Q&A platform. React (Vite) front end on Firebase (Authentication, Firestore, Hosting).
This is the Sprint 1 foundation: sign-up and login, roles, lectures, session codes and joining a lecture.

## Set up Firebase (once per team)

1. Go to https://console.firebase.google.com and create a project (for example `lectra`).
2. **Build > Authentication > Get started.** Enable the **Email/Password** and **Google** providers.
3. **Build > Firestore Database > Create database.** Start in production mode and choose a region close to your users.
4. **Project settings > Your apps > Web (`</>`).** Register an app and copy the config values.
5. In this folder, copy `.env.example` to `.env.local` and paste the values in.
6. Set a budget alert (Google Cloud console > Billing > Budgets) before you go any further.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run build      # production build into dist/
```

## Deploy rules and hosting

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # pick your project
firebase deploy --only firestore   # rules and indexes
firebase deploy --only hosting     # after npm run build
```

The lecturer dashboard query needs the index in `firestore.indexes.json`. If you skip the deploy,
Firestore shows a link in the browser console that creates the same index.

## Make an admin

Admins can't be chosen at signup. In the Firestore console open `users/{uid}` and change `role` to `admin`.

## What is in Sprint 1

| Task | Where |
|---|---|
| T-06 Register and login (email, Google) | `src/pages/Register.jsx`, `Login.jsx`, `src/AuthContext.jsx` |
| T-07 Role selection, role stored in profile | `src/pages/ChooseRole.jsx`, `Register.jsx` |
| T-08 Route guards and Firestore rules | `src/ProtectedRoute.jsx`, `firestore.rules` |
| T-09 Create lecture page | `src/pages/CreateLecture.jsx`, `src/lib/lectures.js` |
| T-10 Session code and uniqueness check | `src/lib/sessionCode.js`, `createLecture()` (transaction) |
| T-11 Student join screen and code lookup | `src/pages/StudentHome.jsx`, `joinLecture()` |
| T-12 Test plan and unit tests in CI | `docs/TEST_PLAN.md`, `*.test.js`, `.github/workflows/ci.yml` |

## Data model used so far

See the "Firebase Data Model" tab of the project plan. Implemented: `users`, `lectures`,
`lectures/{id}/participants`, `sessionCodes`.

## Known gaps (planned)

- The lecture room is a placeholder. The live question feed is Sprint 2.
- Firestore rules are not yet covered by automated tests. Add them with the Firebase Emulator Suite
  (`@firebase/rules-unit-testing`) in Sprint 1 or 2. Manual checks are listed in `docs/TEST_PLAN.md`.
- Anyone signed in can read a lecture document if they know its id, which includes `sessionCode`.
  Ids are random, but consider moving the code out of the public lecture document later.
