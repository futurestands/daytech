# Milestone 1 verification

## Repository and environment

GitHub `main` resolved to `002da6f783aaa8d30d838117461922182bc3263a` through both Git and the API. The existing clone passed Git connectivity checks. The original patch applied without conflicts to local branch `codex/daytech-milestone-1`. A push dry run succeeded.

GitHub and npm registry DNS resolved. No Git, npm, proxy environment variable, or WinHTTP proxy setting was detected. The registry responded to an IPv4 curl request. Node 24.15.0, npm 11.12.1, and Java 21 were available. `npm.cmd ping --fetch-retries=0 --fetch-timeout=15000` failed with `read ECONNRESET`. Bun 1.3.14 failed `bun install --frozen-lockfile` with `UnknownLockfileVersion` for the tracked v2 lockfile. Large downloads returned curl error 28 with partial transfers. Bun 1.4.5 accepted the original lockfile. Its bulk install stalled on downloads, so the missing SDK, nested dependency and Windows native packages used for verification were recovered from exact archives checked against the lockfile integrity hashes. The dependency manifest and lockfile are unchanged. The Firestore emulator archive was resumed and verified against Firebase's published SHA-256.

## Checks

| Check | Result |
| --- | --- |
| TypeScript 7.0.2, `node node_modules/typescript/bin/tsc --noEmit` | Passed |
| Vite 8.3.8, `node node_modules/vite/bin/vite.js build` | Passed |
| Vitest 5.1.2, `node node_modules/vitest/vitest.mjs run` | 12 passed in 2 suites |
| Firestore emulator 1.22.0, `node node_modules/vitest/vitest.mjs run --config vitest.firestore.config.ts` | 9 passed in 1 suite |

Vite reports the existing `__dirname` compatibility warning for a future native config-loader default and a 1,410.23 kB minified main bundle (399.74 kB gzip). Live Google sign-in and production deployment require separate environment verification. No live Firebase resources were changed.

- Reviewed the changed files. The additions contain blank environment placeholders and synthetic test fixtures. A targeted scan found no added private keys, GitHub tokens, Google API keys, AWS access keys or JWTs.
- `git diff --check` passed. Bun transpilation parsed all changed TypeScript and TSX files. This checks syntax only.
- The application suite exercises verified and active staff roles, production fallback rejection, customer ownership, and valid and expired quotation links.
- The emulator suite uses the isolated `demo-daytech-milestone` project. It covers client-only self-registration, administrator metadata access, quote permissions for all seven roles, customer isolation and inactive accounts.

## Reproduce the verification

Run from the existing repository checkout on Node 24 and a Bun version that supports lockfile version 2. Use Java 21 and a Firebase CLI for the emulator.

```powershell
git fetch origin main
git status --short --branch
bun install --frozen-lockfile
bun run lint
bun run build
bun run vitest run
npx --yes firebase-tools emulators:exec --only firestore --project demo-daytech-milestone --config firebase.test.json "bun run vitest run --config vitest.firestore.config.ts"
```

Run the existing branch directly. The original patch has already been applied. If the registry or emulator distribution endpoint continues to reset or time out, use a connection that can reach both `registry.npmjs.org` and `storage.googleapis.com`; retain the Bun cache and do not regenerate the lockfile.

After all checks pass, commit the changes, push `codex/daytech-milestone-1` and open a PR into `main` with the results. Production Firebase rules require a separate approval.
