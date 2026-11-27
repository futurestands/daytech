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

# Milestone 2 verification to date

Milestone 1 was merged before branching. Milestone 2 starts from merge commit `0932cbd2c27a8eb6a4789497a10585f470f0e20f`. The existing test suites and access constraints are preserved. Changes to the Firestore rules were exercised in the local emulator only.

| Check | Result |
| --- | --- |
| TypeScript 7.0.2 | Passed |
| Vite 8.3.8 production build | Passed |
| Vitest 5.1.2 API regression tests | 18 passed |
| Firestore 1.22.0 emulator | 13 passed |
| Playwright 1.65.1 production preview | 3 passed using locally cached Chromium through `DAYTECH_TEST_CHROMIUM` |

API tests cover unavailable persistence, server-side UGX discount and VAT calculations, signed quotations, staff access, and sitemap and robots rewrite targets. Emulator tests cover the three acquisition collections, duplicate writes to a reference, denial of a guest claim, and assigned-customer acceptance and rejection while financial fields stay locked. Browser tests verify concurrent form submission suppression with a mocked API, direct administrative route loading, and real local production image serving with optional integrations disabled. GitHub Actions pins Bun 1.4.5 and uses an isolated emulator.

## Bundle measurements

The main JavaScript file decreased from 1,410.23 kB to 1,098.70 kB minified, a 22.1% reduction. Its gzip size decreased from 399.74 kB to 336.19 kB, a 15.9% reduction. The new initial HTML references 1,114.04 kB minified or 341.97 kB gzip across the main file and two module preloads. Deferred route and user-triggered voice chunks are outside these initial totals. The Vite native configuration warning is resolved. The main bundle still exceeds Vite's default chunk warning threshold.

## Open work and manual configuration

- Replace browser-authorised staff quotation writes with trusted persistence, including atomic line items, version history, enquiry conversion and project initiation. The UI validation endpoint checks totals but Firestore does not require its use.
- Replace snapshot-bearing signed links with revocable, version-bound records. Add an audited guest-linking workflow and durable retry idempotency and abuse controls for public acquisition. The current duplicate guard applies to concurrent UI submits and reuse of a persisted reference.
- Complete customer onboarding and settings and test full browser-to-Firestore workflows. The browser suite uses fixture responses for public configuration and contact submission.
- Verify actual Vercel routing and Google sign-in in an approved preview and confirm authorised domains and the named Firestore database. Set the server-only quotation signing secret. Disable voice visibility with `VITE_FEATURE_LIVE_VOICE=false` where the integration is unavailable.
- Production rules deployment requires separate owner approval. No paid services were enabled.

## Strategic platform foundation

Branch `codex/daytech-platform-foundation` starts at the approved `0932cbd` merge and replays reviewed PR #2 increment `988a31d` for compatibility. Draft PR #2 and its in-progress local quotation files remain separate.

TypeScript and Vite build passed. Vitest passed 18 API tests, Firestore emulator passed 13 tests, and Playwright passed 4 production-preview tests using locally cached Chromium. The new browser test covers direct Schools and Rentals routes and the product-specific contact handoff. Product and partner interest use the existing contact workflow. There is no dedicated waiting-list workflow or live production verification. The initial main bundle is 1,101.02 kB minified and 336.74 kB gzip. The existing chunk-size warning remains.

# DayTech strategic platform increment 2

## Integration sequence

Reviewed remote main at `0932cbd`, draft PR #2 at `988a31d`, and the prior strategic head at `b242a05`. The strategic branch already contains the patch-equivalent copy `b1530ac` of PR #2's reviewed increment. Preserve the uncommitted trusted quotation implementation in the separate Milestone 2 checkout. Shared conflict areas include Express routes, AdminPage, Firestore rules, dependency manifests, the REST adapter and emulator tests. The REST adapter was reused from that checkout without editing or staging its files.

Review and finish Milestone 2 independently. After owner approval, integrate the strategic branch against the merged baseline, omit the patch-equivalent replay, reconcile the shared REST adapter and rules, then rerun both branches' full checks. No merge, history rewrite, PR closure or production deployment occurred.

## Implemented and verified

Feature commit `fe4290c` contains the homepage, responsive hero, growth endpoints, admin lead panel, private rules, browser tools and regression tests. Use `git show --stat fe4290c` for the changed-file list. TypeScript and the Vite production build passed. Bun 1.4.5 accepted the frozen lockfile in lockfile-only mode. Vitest passed 18 API tests. Firestore emulator passed 14 tests. Playwright passed 7 tests against the production build with cached Chromium. The real local emulator regression covers concurrent posting, exactly one stored registration, bearer role checks, absent public reads, server-only storage and a stale staff update. The Playwright suite opens all 11 product pages, verifies no pending launch links and exercises invoice, profit and QR output. A separate Chromium check found no horizontal overflow and verified hero CTA tab order at 390, 768 and 1440 px in both themes. Full accessibility auditing and live credential verification remain open.

The existing hero JPEG is 820,159 bytes. Responsive WebP derivatives are 20,150 bytes at 480w, 53,994 bytes at 900w and 84,546 bytes at 1320w. The main JS chunk changed from 1,101.02 kB minified and 336.74 kB gzip to 1,102.48 kB and 337.38 kB. The tools are a separate 25.20 kB chunk. The large main chunk remains. Firebase is imported through the root provider and the navbar and homepage import catalogue data. Measuring finer-grained preload changes remains open.

## Cost and outstanding acceptance criteria

A successful new registration normally uses two Firestore document reads and two writes, including the quota record. A repeat normally uses one read. Updating a lead uses two writes and one or two reads. Listing consumes reads proportional to the number of returned leads. Conflict retries can add reads. Client-only tools have no database or paid service dependency. These are operation counts, not a monthly bill estimate. Document the expected submission volumes, retention policy and Firestore allowance before enabling collection. No paid feature was enabled.

Provision an approved preview with a dedicated Firebase database, server-only `FIRESTORE_SERVICE_ACCOUNT_JSON` and stable `GROWTH_HASH_SECRET` before real registrations. Preserve collection privacy. Verify the platform forwarding header in preview and keep rate counters and audit records on an approved retention schedule. [Vercel request headers](https://vercel.com/docs/headers/request-headers)

Product release publishing, approved pricing and origin management, historical funnel analytics, enrolment and advanced partner workflows remain pending. Partner invitations are an admin stage without automated email delivery. The responsive photograph derives from the existing illustration. Rights review and sourcing of additional sector photography remain pending. The recommended next increment is protected draft-to-release publishing with approved origin and pricing checks, followed by preview verification and scalable lead reporting.
