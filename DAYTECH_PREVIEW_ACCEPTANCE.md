# DayTech isolated preview approval and acceptance

## Owner decision

Approve only an isolated preview for release candidate `1a9fb2b3eac08f05de5d7767ffe6a7a1960bca96` or a subsequently reviewed commit on `codex/daytech-increment-6`.

| Decision | Proposal |
| --- | --- |
| Firebase target | New dedicated project with requested ID `daytech-acceptance-preview`, subject to availability. Use its `(default)` Firestore database and a distinct preview Web app. |
| Vercel target | Separate restricted project named `daytech-acceptance-preview`, used for synthetic acceptance. Keep Git auto-deploy disabled there until the owner confirms branch behaviour. |
| Exact proposed origin | `https://daytech-acceptance-preview.vercel.app`, subject to availability and protection. If unavailable, record and approve the exact replacement origin before configuring Google Auth or sharing the preview. |
| Cost | Target zero incremental spend within approved existing Vercel allowances and the isolated Firestore free quota. If a Vercel Pro plan is needed, the published base price was US$20/month before usage and taxes. Neither billing nor overages are authorised. [Vercel pricing](https://vercel.com/pricing) · [Firestore pricing](https://firebase.google.com/docs/firestore/pricing) |
| Access | Owner-controlled Firebase and Vercel administration for setup, a dedicated Firestore data identity for the preview runtime, and named acceptance reviewers admitted through Vercel Authentication. |
| Rollback | Withdraw reviewer access and the preview alias, then restore the previous protected deployment or cancel the preview deployment. Disable the preview identity and revoke its key if one was issued. Confirm the production alias and database were untouched. |

Approval would cover creation of the isolated Firebase project and its Web app, preview Google Auth, an empty preview database, preview-only rules and indexes, a limited service identity, synthetic seeding, and one protected Vercel preview deployment. Paid plans, overages, production data and secrets, production rules, live payments, TTL, public rollout and merging remain separate decisions.

## Firebase setup after approval

1. Create the dedicated project and record its exact project ID and region. Do not import existing data. Register a new Web app and record its public configuration. If changing from the proposed default database, verify the named database’s billing eligibility and obtain approval before creating it.
2. Enable Google in Firebase Authentication and set the support email. Authorise the exact protected preview host. Add only provider callback domains that Firebase requires. Do not authorise a production origin or a wildcard. Verify the popup and callback from the actual protected hostname. [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin)
3. Create Firestore in locked mode. In a dedicated local Firebase config, point the approved database to `firestore.rules` and `firestore.indexes.json`. The default database uses one `firestore` object with `rules` and `indexes` keys. A named database uses an array entry with `database`, `rules` and `indexes`. Before running the Firebase CLI, compare the explicit `--project` value and database to the approval record. Run `firebase deploy --only firestore --project <approved-preview-project> --config <preview-config>` only against that isolated project after sign-off. Wait until the required indexes are ready. [Firebase CLI configuration](https://firebase.google.com/docs/cli)
4. Create a dedicated service identity with Firestore data permissions scoped to the isolated project. Review `roles/datastore.user` as the starting predefined role and verify the effective permissions. Keep IAM management and rules or index deployment with a separate operator. Verify an actual server commit and a caller-authenticated read. Never use a production identity or broad project Owner or Editor. [Firestore IAM](https://cloud.google.com/firestore/docs/security/iam)
5. Seed only synthetic records. Use controlled Google accounts for each of the seven roles, two separate verified customers, and an inactive account. Promote staff only through trusted setup. Create synthetic enquiry, demo, lead, partner, release, pricing, origin, quote and project fixtures. Label the preview clearly and keep WaterOps restricted.

## Vercel setup after approval

1. Confirm the correct project and team in the owner dashboard. Under Git settings, record the connected repository, production branch, project auto-deployment rules, ignored builds or exclusions, and any GitHub integration that creates preview deployments. A repo-filtered and name-filtered read in the connected Vercel account returned no matching project, so DayTech's actual Git settings are unverified. Vercel's documented default is to build non-production branch pushes as previews and production-branch pushes as production. Treat branch pushes, PR updates that push commits, and merges as potentially deploying until the project is checked. [Vercel Git integration](https://vercel.com/docs/git)
2. Before deploying, enable Vercel Authentication for preview URLs and admit only named reviewers. Check the exact alias and a deployment-specific URL in a signed-out browser. Confirm protection before adding the Firebase authorised domain or seeding test records. Do not mint a bypass link.
3. Set only preview-scoped variables. Set `APP_URL` to the confirmed origin and `VITE_FEATURE_FIREBASE=true`. Fill `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` and `VITE_FIREBASE_DATABASE_ID`. Use `(default)` for the approved default database. The complete Web override is required because an incomplete override can fall back to the existing applet configuration.
4. Set `FIRESTORE_SERVICE_ACCOUNT_JSON`, `GROWTH_HASH_SECRET` and `QUOTATION_LINK_SECRET` as independent server-only preview variables. The two application secrets each need at least 32 random characters. Enter values in the provider interface rather than chat or build logs. Leave `ADMIN_ACCESS_KEY`, `GEMINI_API_KEY` and `VITE_GOOGLE_MAPS_API_KEY` unset. Set payments, calendar, WhatsApp and live voice flags to false. Verify the client bundle contains no server-only values. [Vercel environment variables](https://vercel.com/docs/environment-variables)
5. Pin the approved Git SHA and record the actual Vercel deployment ID, URL, runtime, effective flags and approval. Verify routing, response compression, hashed asset cache headers, and private response cache controls. Review access-controlled function errors with synthetic correlators and redact emails, tokens and quotation links. Set approved usage alerts and identify the person responsible for stopping an unexpected cost. Keep production aliases untouched.

## Acceptance evidence

Record date, candidate SHA, exact protected origin, synthetic identity role, expected and actual result for each group. Attach redacted screenshots and audit evidence in a restricted location.

| Group | Required scenarios |
| --- | --- |
| Authentication | Google sign-in and out, first-time customer, inactive customer, each staff role and session switching with account isolation. |
| Acquisition | Enquiry, interest and partner application, duplicate control, per-source throttling, assignment and lead isolation, terminal opt-out, admin CSV and matching audit record. |
| Publishing | Denied private draft access, review, approved evidence, prices and origins, atomic publication, revision, retirement and homepage/catalogue/detail consistency. |
| Quotations | Server totals, atomic creation and revisions, ownership, guest linking, expired and revoked links, concurrent acceptance, enquiry conversion, project initiation and audit records. |
| Infrastructure | Preview protection, route rewrites, indexes, limited service identity, token checks, trusted proxy identity, runtime errors, secret isolation, cache headers and compression. |

Live status remains pending until the owner approves and the isolated environment is configured. Local browser and emulator results are recorded separately.
