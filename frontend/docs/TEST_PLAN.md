# Lectra Test Plan (Sprint 1)

## Scope

Authentication, roles, lecture creation, session codes, joining a lecture, Firestore security rules.

## Automated (run in CI on every push and pull request)

| Area | File | What it checks |
|---|---|---|
| Session codes | `src/lib/sessionCode.test.js` | Length, allowed characters, no confusing characters, normalising typed input, format validation, retry when a code is taken, giving up after max tries |
| Roles and guards | `src/lib/roles.test.js` | Which roles can open which screens, home page per role, admin cannot be self-assigned |

Run locally with `npm test`.

## Manual checks (before each Sprint Review)

Use two browsers or one normal and one private window. Use the Firebase Emulator Suite or a test project.

| # | Check | Expected |
|---|---|---|
| 1 | Register as lecturer with a new email | Account created, lands on "My lectures" |
| 2 | Register again with the same email | Clear "already exists" message |
| 3 | Register with a 5-character password | Rejected with a clear message |
| 4 | Log in with a wrong password | "Email or password is incorrect." |
| 5 | Log in with Google for the first time | Goes to role selection, then to the matching home page |
| 6 | Log out, open `/lecturer` directly | Redirected to login |
| 7 | Log in as student, open `/lecturer` and `/lecturer/new` | Redirected to the student home page |
| 8 | Log in as lecturer, open `/student` | Redirected to the lecturer home page |
| 9 | Lecturer creates a lecture | A 6-character code is shown and the lecture is listed |
| 10 | Create 20 lectures quickly | All codes are different |
| 11 | Student joins with the code in lowercase with a space | Opens the lecture |
| 12 | Student joins with a wrong code | "Code not found." |
| 13 | Lecturer ends the lecture, student joins with its code | "This lecture has ended." |

## Firestore rules checks (emulator or console Rules Playground)

| # | Action | Expected |
|---|---|---|
| R1 | Signed-out read of any document | Denied |
| R2 | Student creates a lecture | Denied |
| R3 | Student writes `role: lecturer` to their own profile | Denied |
| R4 | User creates a profile with `role: admin` | Denied |
| R5 | Lecturer B edits or deletes lecturer A's lecture | Denied |
| R6 | Anyone lists all `sessionCodes` | Denied |
| R7 | Lecturer creates a `sessionCodes` document that points to someone else's lecture | Denied |
| R8 | Student writes a participant document for another uid | Denied |
| R9 | Student joins a completed lecture | Denied |

## Not yet covered

Automated rules tests (emulator), end-to-end browser tests, load tests (Sprint 5).

## Bug tracking

Log bugs as cards on the team board with: steps to reproduce, expected result, actual result, screenshot.
