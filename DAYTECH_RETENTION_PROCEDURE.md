# Draft customer data retention maintenance

Owner approval is required for the policy, dates, operator and target environment. Exercise the procedure with synthetic data in an isolated project before production approval.

1. Record the approved retention intervals, environment, change ticket and responsible operator. The starting proposal is 12 months after last meaningful contact for unconverted interest and partner applications, a 24-hour grace window after quota expiry, and 12 months for security audit metadata.
2. Identify eligible records by timestamp in bounded batches with a stable cursor. Report counts and hold categories only. Exclude active customer work, contract records, current quotations, investigations and any records with unresolved consent or an unknown timestamp.
3. Segregate terminal opt-outs before any deletion. Preserve a minimal, scoped suppression digest, scope and event timestamp. Keep the hashing secret server-side. Verify duplicate intake still blocks contact across the proposed migration. Keep existing opted-out records in place until the suppression implementation passes and the operator has approval.
4. Obtain approval of the dry-run totals and cutoff. Confirm target project and named Firestore database against the change ticket. Use a separate least-privilege maintenance identity. Keep deletion, TTL setup and production credentials outside CI.
5. When execution is approved, compare each record against its dry-run update time and recheck holds. Skip changed records. Record aggregate counts, ticket ID, operator and exceptions in an append-only audit record, with no contact details.
6. Run post-maintenance checks for active customers, ownership, deduplication and opt-outs. Record any skipped or failed batches for a deliberate retry. Follow the approved privacy policy for handling exports and backups.

This document prepares the operating procedure. No deletion script, production run, TTL or scheduled automation is enabled. An owner must approve the retention and legal-hold rules before the implementation can safely decide which records to delete.
