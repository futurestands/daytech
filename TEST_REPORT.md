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

# Strategic Increment 3 — verification and rollout

Feature commit `cc6d461` on `codex/daytech-platform-foundation`.

| Check | Result |
| --- | --- |
| TypeScript 7.0.2 | Passed |
| Vite 8.3.8 production build | Passed |
| Vitest 5.1.2 | 26 passed |
| Firestore emulator 1.22.0 | 15 passed |
| Playwright production preview with locally cached Chromium | 8 passed |
| Targeted secret-pattern scan | Passed |
| CycloneDX 1.6 / dependency licence scan | 695 locked components, 540 installed-manifest licences, 155 unverified transitive or unavailable entries |
| Browser screenshots and overflow checks | Homepage in desktop light and mobile dark, product detail, Academy, Partners and Free Tools |

The emulator uses isolated records. Tests cover private draft denial, role-restricted publication, unapproved pricing and origin rejection, competing publications, retirement, WaterOps restriction, assigned-lead isolation, admin-only exports, opt-outs and current-cohort counts. Vitest covers dangerous CSV prefixes and embedded delimiters. Playwright covers all eleven product URLs and the release-rendering fixture. There was no live preview or external Google sign-in test. Overflow checks at the captured sizes do not constitute a full accessibility audit.

The initial main JS file decreased from 1,102.48 to 524.08 kB minified (52.5%) and from 337.38 to 163.33 kB gzip (51.6%). Firebase now loads with authenticated routes and acquisition modules that use it. The deferred Firestore chunk is 581.97 kB minified (174.65 kB gzip). Both still trigger Vite's chunk warning. Homepage imagery remains the existing illustrative WebP set.

## Rollout risks and operational requirements

- Required server-only variables are `FIRESTORE_SERVICE_ACCOUNT_JSON` and `GROWTH_HASH_SECRET`. Use the existing Firebase public config variables for the isolated project and named database, and keep production untouched until separately authorised.
- Install and verify `firestore.indexes.json` in an approved isolated project. The emulator does not establish that production composite indexes or Firebase IAM are configured. Confirm actual token, role, trusted proxy and service identity behaviour in preview.
- A normal registration uses about two reads and two writes, a duplicate about two reads and one quota write, and an already cached rejection no database reads in that warm instance. A list or export reads at most 51 rows plus applicable index costs, and an export adds one audit write. The analytics page runs seven indexed counts on request. A first release uses separate draft/proposal, approval, projection and audit writes. As a planning scenario, 100 distinct registrations use about 200 reads and 200 writes before retries, review, analytics and storage. Region, index scans, database eligibility and actual traffic determine charges. Expiration timestamps are set, but no billable TTL or paid service was enabled. [Firestore billing](https://firebase.google.com/docs/firestore/pricing)
- Cohort metrics describe current stages and demo request creation. Transition audit records exist, but the dashboard does not calculate a historical unique-event funnel. Product cards on the homepage/catalogue still show catalogue information. Product detail consumes the approved projection.
- Metadata checks leave platform-specific or unavailable licences unverified. MPL and CC BY reviews and photographic rights evidence remain open. The provenance register and draft proprietary policy are not conclusions about legal title.
- Growth retention, deletion and suppression need owner approval and an authorised maintenance process. Distributed sources can still create quota reads. Limited-scope IAM and further edge controls remain rollout checks.

## Integration sequence

Draft PR #2 stays independent. Shared areas are Express registration, admin content, Firestore rules, the REST adapter, package manifests, and the emulator suites. Finish and review quotation work on its own branch. After owner approval, integrate against the merged baseline, discard the patch-equivalent replay, reconcile adapter methods and custom rules, then run both suites and test data migration in isolation. No merge, PR closure, production Firebase change or manual deployment occurred.

## Changed files
- `.github/workflows/verify.yml`
- `e2e/acquisition.pw.ts`
- `firestore.indexes.json`
- `firestore.rules`
- `scripts/check-secrets.ts`
- `scripts/generate-sbom.ts`
- `server/app.ts`
- `server/growthRoutes.test.ts`
- `server/growthRoutes.ts`
- `server/lib/firestoreStore.ts`
- `server/publishingRoutes.ts`
- `src/App.tsx`
- `src/components/GrowthLeadPanel.tsx`
- `src/components/ProductPublishingPanel.tsx`
- `src/lib/firebase/firestoreService.ts`
- `src/pages/AdminPage.tsx`
- `src/pages/ClientPortalPage.tsx`
- `src/pages/ProductDetailPage.tsx`
- `tests/firestore.emulator.ts`

## Increment 3 follow-up verification

- TypeScript and the Vite production build passed. Vitest passed 26 unit tests. The local Firestore Emulator passed 15 tests. Playwright passed 10 tests using the built site behind Express. The browser read a synthetic emulator release through the real public API and received a 401 from the draft endpoint. The staff approval and publication phases were verified separately through real Express handlers and the emulator with synthetic identities.
- The security regression covers missing release evidence, unapproved pricing and origin, draft disclosure, unauthorised publishing and history access, concurrent publication, and preservation of the prior revision after retirement. Lead isolation, audited exports, CSV escaping, and terminal opt-outs remain covered by the existing suites.
- The browser confirmed the favicon MIME type and keyboard operation of the labelled footer currency selector. Mobile checks used a 390 by 844 viewport. The favicon asset is excluded from the Vercel SPA rewrite. Vercel behaviour still needs an isolated preview check.
- The secret-pattern scan and direct dependency licence metadata check passed. The generated CycloneDX SBOM contains 695 locked components, with 540 licences identified from installed manifests. The remaining 155 need evidence on their distribution platforms. The dependency audit exited nonzero with eight high-severity advisories in the existing lockfile involving `@fastify/busboy`, `@grpc/grpc-js`, `path-to-regexp` and `undici`. Triage reachable runtime paths and verify updates before commercial release. Preserve existing notices and obtain commercial photography rights evidence.
- Draft PR #2 is open at `988a31d`. Its committed changes are already patch-equivalent to work on this strategic branch. Preserve the separate uncommitted quotation work, review it in its own branch, then integrate only new quotation changes, reconciling Firestore rules and adapter methods. Rerun both suites, including guest ownership, trusted totals and revocation, and verify data migration in isolation before merging.
- Local validation used existing tooling, loopback services and synthetic data. No paid service, TTL policy, production Firebase rules change or deployment was performed. Real Google sign-in, production IAM and indexes, and all live commercial workflows remain outside this verification.

### Cold mobile production build comparison

Three fresh Chromium contexts per build at 390 by 844, 150 ms latency, 1.6 Mbit/s download and 4× CPU slowdown. Browser cache was disabled. Express served the local production files without compression. External requests, including Google Fonts, were blocked to isolate the run. The browser logged one failed resource load per run from that block and no uncaught application errors. All six measured local responses returned HTTP 200 in each run.

| Median or observed metric | Before | After |
| --- | ---: | ---: |
| Largest Contentful Paint | 6,484 ms | 5,964 ms |
| Cumulative Layout Shift | 0 | 0 |
| Hero request start | 4,220 ms | 246 ms |
| Initial JavaScript transfer | 533,837 bytes | 533,814 bytes |
| Firestore bundle on homepage | No | No |

Each capture requested one hero image and had no horizontal overflow. LCP still exceeded five seconds in the measured after runs. The stylesheet requests three Google font families and the local measurements do not quantify their live latency. The figures describe the local lab only.
## Strategic Increment 4 integration

The integration branch starts from the strategic branch, which already contains the patch-equivalent acquisition work from `988a31d`. It applies the verified quotation changes from `73f847a` and uses the strategic Firestore adapter for publishing, growth and quotations. Draft PR #2 remains separate.

On Windows with Node 24.15.0 and Bun 1.4.5, frozen installation, TypeScript, production build, 26 unit tests, 16 isolated Firestore emulator tests, 10 Express-backed Playwright tests, the secret scan and the direct-dependency licence check passed. The quotation tests exercise atomic revisions, retry idempotency, server totals, expired and revoked links, concurrent acceptance, verified guest linking and project conversion. Publication tests reject inconsistent approval records and confirm catalogues consume approved status. Real Firebase identities and the deployed Vercel handler require an isolated preview.

Bun audited 515 packages at the high and critical threshold and returned zero findings. The generated SBOM contains 556 locked components and 445 installed-manifest licence records. Before commercial distribution, finish the shipped-asset notice inventory, the conditional licences and photograph rights review. See [Increment 4 security and preview](INCREMENT_4_READINESS.md) for advisory evidence and release gates.

The main client build changed from 524.11 kB to 399.39 kB minified and from 163.35 kB to 121.79 kB gzip after removing the sole animation-library use. The deferred Firestore bundle remains outside the homepage request path.
## Strategic Increment 5 release candidate

The candidate starts at Increment 4 commit `da9b558`, including its reconciled quotation implementation from `73f847a`. The trusted quotation persistence, server routes, Firestore rules and dependency lockfile are unchanged from that baseline. The approved admin motion commit was replayed once. The separate prototype is available for review and its code and sample data are excluded from the release build.

Local verification includes TypeScript, the production build, 26 unit tests, 16 Firestore emulator tests and 11 Playwright tests. A separate dev-browser run exercised the admin navigation, real-count chart controls and reduced motion using a synthetic local API fixture. The production browser suite checks the portal's keyboard navigation, the original public illustration, the removal of legacy public images, and notice availability. A real production Firebase session was outside scope.

The release does not add Motion or any other runtime dependency. The admin-only style chunk is about 0.85 kB uncompressed. The main entry is 400.53 kB minified compared with 399.39 kB at the baseline. The notice generator gathered 112 distinct installed notices from 228 runtime dependency manifests and includes pinned upstream supplements. See [the third-party inventory](THIRD_PARTY_INVENTORY.md) for licensing review limitations and [the draft retention procedure](DAYTECH_RETENTION_PROCEDURE.md) for owner approval steps.
## Strategic Increment 6

Local verification passed TypeScript, the production build, 30 unit tests, 16 Firestore emulator tests and 11 Playwright tests. The read-only retention command classified seven records in a dedicated loopback emulator and reported zero writes. The secret-pattern scan passed, and Bun found zero high or critical findings across 515 audited packages. The generated SBOM lists 556 locked components, with 445 installed-manifest licence entries and pinned upstream supplements in the public notice file.

GitHub Actions run 46005548446 verifies Increment 5. Increment 6 was kept local while deployment triggers and preview approval are unresolved. Its main client artefact hash matches the approved baseline.

### Hosting safeguards follow-up

The local successor passed TypeScript, production build, 34 unit tests, 16 Firestore emulator tests and 11 Playwright tests. The dependency audit found zero high or critical findings, and the secret-pattern scan passed. A synthetic Vercel preview build rejected incomplete configuration and built with the complete synthetic settings. The local deployment exclusion test verified the exact Increment 6 branch, nested CI and development names, and unchanged automatic deployment eligibility for `main`. No provider-side deployment or remote CI was triggered. See [the hosting decision report](DAYTECH_HOSTING_DECISION.md).

See [the release acceptance report](DAYTECH_RELEASE_ACCEPTANCE.md) for the seven-run mobile comparisons, licence evidence, controlled preview status and release sequence.
