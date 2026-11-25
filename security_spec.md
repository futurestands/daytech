# DayTech Solutions — Firestore Security Rules Specification (Phase 0 TDD)

## 1. Data Invariants
1. **No Public Role Escalation**: A user creating `/users/{userId}` can ONLY set `role: 'client'` and `active: true`, and `uid == request.auth.uid`. Staff/admin roles can only be assigned by a verified Administrator (`isAdmin()`).
2. **PII Isolation**: User emails and telephone numbers are stored in `/users/{userId}/private/info` and are strictly readable only by `request.auth.uid == userId` or `isAdmin()`.
3. **Public Lead Create-Only Boundary**: Unauthenticated or authenticated visitors may `create` `/enquiries/{enquiryId}`, `/demoBookings/{demoId}`, and `/contactMessages/{contactId}` ONLY with valid schema types, bounded string lengths, `consentAccepted == true` (for enquiries), initial status (`'New'` / `'Pending'`), and `request.time` server timestamps. Public `get`, `list`, `update`, and `delete` are forbidden.
4. **Client Record Ownership**: Support tickets and client projects require `isSignedIn()`, verified email, `ownerUid == request.auth.uid` on list/get, and block modification of `ownerUid` or `createdAt` on update.
5. **Terminal State Locking**: Enquiries in `'Archived'` or `'Converted'` state and Support Tickets in `'Closed'` state cannot be altered by non-admin users.
6. **Immutable Audit Logs**: `/auditLogs/{logId}` allows `create` by verified staff/admins with `actorUid == request.auth.uid` and `createdAt == request.time`, and strictly forbids `update` and `delete`.
7. **Formal Customer Quotations & Line Items**: `/quotations/{quotationId}` and `/quotations/{quotationId}/items/{itemId}` can only be created by verified staff (`isStaff()`) with matching `quotationNumber == quotationId`, `createdByUid == request.auth.uid`, valid non-negative totals, and `request.time` timestamps. Clients can only read their own `clientUid`-linked quotations and items, and can only transition a `'Sent'` quotation to `'Accepted'` or `'Declined'` via `affectedKeys().hasOnly(['status', 'updatedAt'])`. Accepted or Declined quotations are locked from non-admin edits.

## 2. Adversarial Payloads Blocked ("Dirty Dozen")
1. Self-promotion payload on `/users/{uid}` with `role: 'super_admin'` -> **DENIED**.
2. Shadow field injection on `/enquiries/{id}` adding `isVerified: true` -> **DENIED** via `keys().hasOnly(...)`.
3. Public `list` query on `/enquiries` by anonymous or client user -> **DENIED**.
4. Forged backdated `createdAt` timestamp on `/demoBookings/{id}` -> **DENIED** (`createdAt == request.time`).
5. Oversized 1.5KB document ID poisoning on `/enquiries/{id}` -> **DENIED** via `isValidId(id)`.
6. Unverified email account spoofing bootstrapped admin email (`email_verified == false`) -> **DENIED**.
7. Cross-tenant ticket read on `/supportTickets/{id}` where `ownerUid != request.auth.uid` -> **DENIED**.
8. Client mutating `ownerUid` on `/supportTickets/{id}` update -> **DENIED**.
9. Client modifying `status` of `/supportTickets/{id}` directly to `'Resolved'` or modifying `'Closed'` ticket -> **DENIED**.
10. Blank/oversized string value poisoning on `/contactMessages/{id}` (`message.size() > 3000`) -> **DENIED**.
11. Unconsented enquiry submission (`consentAccepted: false`) -> **DENIED**.
12. Deleting or tampering with `/auditLogs/{id}` -> **DENIED**.
13. Client creating a quotation on `/quotations/{id}` or altering `totalAmount` / `items` on an issued quotation -> **DENIED**.

