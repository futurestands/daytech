# Strategic Increment 4 security and preview

## Dependency advisories

These findings were reported against the Increment 3 lockfile. DayTech's Node runtime uses Express JSON handlers, native fetch and a separate `ws` integration. Its browser Firebase code uses the web SDK build. The Node Firestore SDK is also exercised by the emulator tests.

| Advisory | Original installation and use | Affected functionality and DayTech reachability | Fixed versions and action |
| --- | --- | --- | --- |
| [GHSA-x8mw-p69m-v3mx](https://github.com/advisories/GHSA-x8mw-p69m-v3mx) | Busboy 2.1.1 via Undici 5.28.4 in Vercel development tooling | Multipart parser denial of service. The Express API does not invoke it. | 3.2.1. Remove the type-only builder dependency and its obsolete parser chain. |
| [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j) | gRPC JS 1.9.16 transitive through Firestore | Server-side certificate authorisation. DayTech uses SDK client calls and does not operate a gRPC server. | 1.13.6 or 1.14.5+. Pin 1.14.7. This exceeds Firebase's declared minor range, so require emulator coverage and verify the SDK in preview. |
| [GHSA-9wv6-86v2-598j](https://github.com/advisories/GHSA-9wv6-86v2-598j) | 6.1.0 and 6.3.0 through Vercel development tooling, 0.1.13 through runtime Express | Regex backtracking from adjacent route parameters. 6.1.0 is affected. The other installed versions are already patched for this advisory. | 6.3.0 or 0.1.10 for the relevant lines. Remove the unused development tool and keep Express 0.1.13. |
| [GHSA-vrm6-8vpv-qv8q](https://github.com/advisories/GHSA-vrm6-8vpv-qv8q) | Undici 5.28.4 in Vercel development tooling | WebSocket decompression. DayTech uses `ws` for server WebSockets. | 6.24.0 or 7.24.0. Remove the old development dependency. |
| [GHSA-v9p9-hfj2-hcw8](https://github.com/advisories/GHSA-v9p9-hfj2-hcw8) | Undici 5.28.4 in Vercel development tooling | WebSocket negotiation and decompression. The development dependency is not called by DayTech WebSocket routes. | 6.24.0 or 7.24.0. Remove the old development dependency. |
| [GHSA-2m5v-pch6-74hx](https://github.com/advisories/GHSA-2m5v-pch6-74hx) | Undici 5.28.4 in Vercel development tooling | TLS client option handling. Express does not import this Undici installation. | 6.29.1, 7.30.1 or 8.12.2. Keep jsdom's 8.13.1 and remove 5.28.4. |
| [GHSA-qrxm-fqhp-jwvm](https://github.com/advisories/GHSA-qrxm-fqhp-jwvm) | Undici 5.28.4 in Vercel development tooling | TLS renegotiation handling. Express does not import this Undici installation. | 6.29.1, 7.30.1 or 8.12.2. Keep jsdom's 8.13.1 and remove 5.28.4. |
| [GHSA-vxpw-j846-p89q](https://github.com/advisories/GHSA-vxpw-j846-p89q) | Undici 5.28.4 in Vercel development tooling | WebSocket fragmentation. DayTech does not invoke this package's WebSocket client. | 6.27.0, 7.28.0 or 8.5.0. Keep jsdom's 8.13.1 and remove 5.28.4. |

The catch-all handler now uses the Express signature directly. Verify the host invokes that handler in preview. Check the actual managed Node runtime version separately because Bun audits the application lockfile. No advisory exception is proposed.

## Isolated preview approval checklist

- Approve a dedicated Firebase project with synthetic data and a protected Vercel Preview environment. Use a named database if the team can configure its rules and indexes independently. Never rely on the fallback web config for preview.
- Set `APP_URL` to the exact preview origin. Set `VITE_FEATURE_FIREBASE=true` and supply `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` and `VITE_FIREBASE_DATABASE_ID`. Verify both builds and server functions resolve the same project and database. Authorise only the exact preview hostname and required provider callbacks in Firebase Auth.
- Put `FIRESTORE_SERVICE_ACCOUNT_JSON`, `GROWTH_HASH_SECRET` and `QUOTATION_LINK_SECRET` in Preview-only server variables. Use separate independently generated secrets of at least 32 characters. Grant the identity only necessary Firestore data access in the isolated project. Keep service identities and preview users separate from production.
- Apply the committed rules and indexes only in the authorised preview. Seed all seven roles and two distinct client accounts using synthetic records. Verify rotated or revoked links, customer ownership, staff approval, terminal opt-outs, and proxy trust using the actual Vercel runtime and its `x-vercel-forwarded-for` contract.
- Keep `VITE_FEATURE_PAYMENTS`, `VITE_FEATURE_GOOGLE_CALENDAR`, `VITE_FEATURE_WHATSAPP` and `VITE_FEATURE_LIVE_VOICE` false. Leave `VITE_GOOGLE_MAPS_API_KEY`, `GEMINI_API_KEY`, and `ADMIN_ACCESS_KEY` unset. Use access-controlled error monitoring with redacted logs and exclude tokens, customer data and quotation URLs from telemetry.
- Confirm the owner's Vercel plan permits the intended commercial use. Approve limits for functions, bandwidth, storage and Firestore operations, with an owner responsible for responding to alerts. Budget alerts can lag and do not impose a hard cap. A normal growth registration uses about two reads and two writes, while release history adds one write and approval validation adds three reads per publish. Live pricing and usage require a separate plan review.

## Proposed retention policy for owner approval

Retain unconverted customer interest and partner applications for up to 12 months after last meaningful contact. Record a 24-hour grace window after quota expiry. Keep essential security audit metadata for 12 months unless contract or investigation requires preservation. Preserve opt-out enforcement using a keyed digest, scope and event time after removing contact data where policy permits. Until approved maintenance and role checks are in place, preserve terminal opt-out records and keep automated deletion disabled. Require dry-run counts, explicit authorisation, bounded batches, exclusion of records on hold, and an audited completion summary before any actual deletion.

## Approval and ownership policy

The founder can approve and publish when acting as authorised super administrator. Review, approval and publication remain separate actions. The publication audit records the approval ID, approving UID and publishing UID. This is a single-owner control when those UIDs match. Previously approved drafts without version-bound evidence must be reviewed and approved again before publishing.
