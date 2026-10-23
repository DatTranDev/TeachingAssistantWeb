# Security flow update — 2026-10-23

Primary tasks: recover the current account, change a signed-in account password, and use class/group realtime features with the same permissions as the HTTP API. Keep the existing Vietnamese/English copy, form primitives, routes and responsive layout.

| State                         | Expected behavior                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| Valid/invalid OTP             | Submit a purpose-bound challenge; invalid input keeps the form available                            |
| Verified reset                | Keep the five-minute credential only in the memory store; navigate without token/OTP URL parameters |
| Missing/expired reset         | Request a new code; never submit a password-only reset                                              |
| Pending/reset race            | Disable pending submission and reject repeated use server-side                                      |
| Signed-in password change     | Require current/new/confirmed passwords; sign out all devices after success                         |
| Expired access JWT            | Share one same-origin cookie-backed refresh between HTTP/socket consumers                           |
| Revoked session               | Clear local authentication and reject stale refresh responses                                       |
| Network/service failure       | Settle every waiting request and retain the local session for retry                                 |
| Socket reconnect              | Send the current JWT and rejoin authorized rooms                                                    |
| Unauthorized room or mutation | Backend rejects access; clients cannot broadcast authoritative data                                 |
| Oversize/busy upload          | Preflight 10 MiB images/25 MiB files and handle server 413/429 feedback                             |

Backend contract: `/service/verifyCode` accepts `purpose: password-reset | email-verification`; only password reset returns `{ resetToken, expiresAt }`. `/user/changepassword` requires that credential. `/user/password` requires an access JWT and the current password. Passwords must be at least six characters and at most 72 UTF-8 bytes. Reset credentials never enter URLs, local/session storage, logs or cookies. Realtime mutations are published by the backend after authorized HTTP writes. HTTP/socket refresh is serialized and cannot restore a previous account after a sign-out/account switch.

Node is pinned to 24.22.1 with a startup guard. Next/eslint-config-next are patched to 16.4.2 and Axios is patched within 1.x. The Next ESLint root resolver uses a tinyglobby-backed compatibility adapter to remove its vulnerable braces chain; the actual Next resolver/link rule remains tested. Final npm audit reports zero findings; no rules or audit exceptions were added.

Verification: five local tests (`npm run test:security`) and TypeScript PASS. Selected ESLint PASS with zero errors and two warnings (existing profile image and full-page login navigation); Impeccable detector returned no findings. A fresh clean Git archive of source commit 4306028 passed `npm ci --no-fund`, `npm run test:security`, `npm run type-check` and `npm run build -- --webpack`, with zero audit findings. The production build used Node 24.22.1 and did not copy any local environment file. The phone-width browser DOM check used a loopback fake API and confirmed OTP → reset, a credential-free URL, masked new-password fields and no horizontal overflow. Screenshot capture was unavailable; further preview startup was blocked by automatic tool policy. This is partial browser verification, not complete visual acceptance. Live API, SMTP, Firebase and device acceptance were not run.

The working tree contained unrelated landing/config/layout/CSS changes and a staged proxy-to-middleware rename before this task. They are preserved and excluded from this security commit. Build verification of the commit itself uses a clean Git archive, so those working-tree changes cannot mask missing sources.

Deploy backend and updated clients together. Older clients without a reset purpose/credential or socket JWT will be rejected. This task publishes source commits; it does not certify deployment or production service behavior.

Attendance events now include the stored student, attendance-session identity and per-index statuses. Both teacher attendance screens ignore other sessions; the live screen derives its tiles from the query cache and refetches after an authorized event. Timer subscriptions are cleaned up and reset on live-state changes.
