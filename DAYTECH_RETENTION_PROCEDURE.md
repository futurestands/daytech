# Draft customer data retention maintenance

Owner approval is required for the policy, dates, operator and target environment. Exercise the procedure with synthetic data in an isolated project before production approval.

1. Record the approved retention intervals, environment, change ticket and responsible operator. The starting proposal is 12 months after last meaningful contact for unconverted interest and partner applications, a 24-hour grace window after quota expiry, and 12 months for security audit metadata.
2. Identify eligible records by timestamp in bounded batches with a stable cursor. Report counts and hold categories only. Exclude active customer work, contract records, current quotations, investigations and any records with unresolved consent or an unknown timestamp.
3. Segregate terminal opt-outs before any deletion. Preserve a minimal, scoped suppression digest, scope and event timestamp. Keep the hashing secret server-side. Verify duplicate intake still blocks contact across the proposed migration. Keep existing opted-out records in place until the suppression implementation passes and the operator has approval.
4. Obtain approval of the dry-run totals and cutoff. Confirm target project and named Firestore database against the change ticket. Use a separate least-privilege maintenance identity. Keep deletion, TTL setup and production credentials outside CI.
5. When execution is approved, compare each record against its dry-run update time and recheck holds. Skip changed records. Record aggregate counts, ticket ID, operator and exceptions in an append-only audit record, with no contact details.
6. Run post-maintenance checks for active customers, ownership, deduplication and opt-outs. Record any skipped or failed batches for a deliberate retry. Follow the approved privacy policy for handling exports and backups.

## Local dry run

Start a dedicated empty Firestore Emulator using project `demo-daytech-milestone`, seed synthetic records only, then run:

```sh
node --import tsx scripts/retention-dry-run.ts demo-daytech-milestone "(default)" 127.0.0.1:8086 365 365 24 365
```

The final four arguments are draft lead days, partner days, quota grace hours and audit days. The reader enforces the exact demo project and default database, loopback, an allowlisted field mask, at most 50 records per page and ten pages per collection. A truncated result describes only that bounded scan. The report contains an action, run ID, cutoff, policy, aggregate dispositions and a digest that changes when a document version or disposition changes. Keep the report with the change ticket.

Unmarked audit records go to review. The dry run identifies well-formed suppression candidates and preserves opted-out source records. The suppression shape contains the existing keyed digest, scope and event timestamp. The production intake path still depends on its existing deduplication record. Before any migration, implement lookup by the same keyed digest and scope, atomically keep suppression before removing personal fields, and verify suppression is effective under concurrent intake and after retries. Hold markers, version preconditions and an append-only audited operator action must be part of any subsequently approved apply operation.

The current command performs no writes. The owner must approve retention, legal holds, suppression migration and any future apply operation separately.
