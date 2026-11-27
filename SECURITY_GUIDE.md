# Firebase authentication and administrator provisioning

In Firebase Console, select project `daytech-bba8f`, open **Authentication → Sign-in method**, and confirm Google is enabled. Open **Authentication → Settings → Authorized domains** and add the exact host `daytech-lsw4g3h36-futurestands-projects.vercel.app` if that preview is still used. Add the verified stable production hostname separately. Use bare hostnames. For local Google sign-in, add `localhost` to the development Firebase project and use its web configuration locally.

Set `VITE_FEATURE_FIREBASE=true` in the applicable Vercel environment. If overriding the checked-in web settings, provide `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` together. Use the same VITE settings for the server runtime and frontend build. Include `VITE_FIREBASE_DATABASE_ID` when the override uses a named database. Redeploy through the normal review process after changing build-time values. Test the Google popup, account creation and portal sign-in on each authorised hostname.

## Initial administrator

1. Verify the intended administrator's Google identity out of band. Have them sign in once so the platform creates a client profile.
2. Compare the verified email, enabled account state and UID in Firebase Authentication with the selected `users/{uid}` Firestore document in the same project and database.
3. An authorised Firebase operator updates only that active document's role to `super_admin` and sets `updatedAt` to a Firestore timestamp. Record the operator, target UID and reason in the change record. The operator action requires approval for production.
4. Ask the administrator to sign out and sign back in, then verify access. Review existing privileged UIDs and deployment history before applying the new rules because legacy roles may have been assigned through the previous bootstrap flow.

Staff APIs on production and Vercel require an active, verified Firebase staff account. Configure `QUOTATION_LINK_SECRET` independently with at least 32 random characters. Links issued using an earlier key must be reissued after key replacement. Signed links grant read access to anyone holding the link until expiry. Quotation acceptance still requires the assigned active customer account.

## Linking a guest enquiry to a customer

Treat the reference as a tracking identifier. Staff verify the request separately through the original contact channel, confirm the customer has an active verified Firebase account, and identify that account by UID. A trusted operator can then attach that UID only to the confirmed, still-unassigned record in an approved environment and record the actor, target and evidence in the audit trail. An email supplied during form submission or a reference number alone does not establish ownership. There is no customer self-claim endpoint. The audited, transactional staff workflow remains open.

## Quotation persistence and shared links

The staff UI validates drafts and sent quotations with the Express totals endpoint before writing to Firestore. The existing customer rules constrain decisions to the assigned account and prevent financial field changes. Financial integrity at the persistence boundary remains open because staff Firestore writes can bypass UI validation. A trusted service must calculate and atomically persist the quotation, items, and revision, with direct staff financial writes removed once that service is verified.

The current HMAC link grants access to an embedded quotation snapshot until expiry. A snapshot cannot reflect revocation or changes to the source quotation. The next implementation should store only a digest of an opaque share token alongside the quotation ID, immutable revision ID, expires-at timestamp, revoked-at timestamp and issuing staff UID. The lookup endpoint should resolve it server-side, return a redacted document, and reject revoked or stale revisions. The delivery path needs an isolated credential or local emulator identity with narrowly scoped access. Avoid introducing any customer self-claim or anonymous document read to support link resolution.

## Growth intake configuration

Use a dedicated Firebase project for an isolated preview and match its project and database across the Vite and server configurations. Supply `FIRESTORE_SERVICE_ACCOUNT_JSON` only as a server-side secret, with a dedicated Firestore identity scoped to the intended project or database. Set `GROWTH_HASH_SECRET` to a stable random secret of at least 32 characters. Changing it changes deduplication keys, so plan a migration before rotation. Never apply a `VITE_` prefix to either value.

The server stores growth registrations and quota counters privately. Matching submissions are deduplicated by normalised email, form kind and product, and registration does not update, disclose or reactivate an existing lead. One durable per-source quota permits eight new registrations per 15-minute window. Vercel supplies the forwarding identity. On the standalone server the socket address is used. Review retention and cleanup for rate counters, lead records and audit logs before enabling real collection. No TTL or paid feature was enabled.

Sales staff and administrators can manage registrations through a verified Firebase session. Partner approval and rejection are restricted to administrators. The CSV action is offered to administrators and includes filtered personal data. Any authorised staff member with list access can still process data their browser has received. Invitations record a stage only, with no email automation. Qualified and converted figures reflect current stages, not a historical funnel.

Use a local test host and project for verification. The browser cannot read or write the private collections, and REST service identity is required. Production Firestore resources were not modified.

## Growth and publication rollout controls

Use an isolated preview database with server-only `FIRESTORE_SERVICE_ACCOUNT_JSON` and `GROWTH_HASH_SECRET`, along with consistent Firebase project and database variables. Configure the indexes in `firestore.indexes.json` in that isolated environment before paginated filtering and analytics verification. Collection rules block direct browser access. The service identity bypasses those rules. Scope its effective IAM permissions to the necessary data operations and intended isolated database or project. Avoid project Owner, Editor or broad administrator roles. Review the impact of entitlements before any production rollout. [Firestore IAM roles and permissions](https://docs.cloud.google.com/iam/docs/roles-permissions/firestore)

Sales officers can see and update only leads assigned to their Firebase UID. Administrators control assignment, partner decisions, CSV export and cohort analytics. Each export is capped at 50 filtered records and writes an audit event before responding. Local staff may view assigned contact details for follow-up only. Treat export files as sensitive, restrict onward sharing and delete local exports once their stated use ends.

The quota counts valid attempts, including retries, before contact lookup. Within a 15-minute window the ninth attempt is rejected, and a bounded warm-instance cache suppresses further reads for sources already known to be over quota. Vercel-provided `x-vercel-forwarded-for` is accepted only on its runtime with one valid IP. Standalone mode uses the socket address. Distributed sources can still generate Firestore reads. Review approved edge controls and monitor spend before exposing public intake. [Vercel request headers](https://vercel.com/docs/headers/request-headers)

Quota records store a Firestore timestamp expiry. TTL is not configured. Propose deleting expired buckets during authorised maintenance until a retention policy and budget are approved. For leads, document the agreed retention window, verify opt-out or deletion requests privately through the original contact channel, suppress further outreach immediately, and review before deleting PII or archives. Existing opt-outs are terminal in the staff workflow. Approve a minimal non-contact suppression record or an appropriate deletion/suppression procedure before automated deletion. TTL deletion is billable and requires separate approval. [Firestore TTL](https://firebase.google.com/docs/firestore/ttl) · [Firestore billing](https://firebase.google.com/docs/firestore/pricing)

Publication creates an immutable revision, replaces the public projection and writes an audit event in the same commit. Each revision links to its predecessor. When replacing a pre-history release, the commit archives the previous record as `legacy`. Staff with draft access can begin at `GET /api/admin/product-revisions/:slug/current` and follow `previousRevisionId` through the same endpoint. Revision access is server-side and responses contain the approved projection only. Publication adds one Firestore write for each revision, plus one write if it archives a legacy record.
See [Increment 4 security and preview](INCREMENT_4_READINESS.md) for dependency remediation, founder approval policy, retention decisions and preview environment requirements.
