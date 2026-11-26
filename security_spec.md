# DayTech Solutions — Firestore Security Rules Specification

## 1. Data Invariants
1. **Zero Hardcoded Privileged Emails**: Administrative authority is never granted via literal email checks. Initial provisioning requires an authorised Firebase operator to update a verified user's Firestore profile. Existing staff roles remain effective and should be reviewed before rollout.
2. **No Public Role Escalation & Active Account Enforcement**: A user creating `/users/{userId}` can only self-register as `role: 'client'` and `active: true`. Deactivated users (`active: false`) are synchronously blocked from all authenticated client and staff operations across `/users`, `/enquiries`, `/demoBookings`, `/supportTickets`, `/projects`, `/quotations`, and `/auditLogs`.
3. **Least-Privilege Role Separation**:
   - `super_admin`: Full platform control, role assignment including `super_admin`.
   - `admin`: User account activation and non-super-admin role assignments, audit log reads, full operational overrides.
   - `sales_officer`: Enquiries, demo bookings, contact messages, and quotations.
   - `project_manager`: Client delivery projects.
   - `support_officer`: Support tickets and contact desk messages.
   - `content_manager`: CMS settings and CMS entries (`draft` and `published`).
   - `client`: Strict ownership isolation (`ownerUid`, `submitterUid`, or `clientUid == request.auth.uid`) and self-service quotation acceptance/decline only while `status == 'Sent'`.
4. **PII Isolation**: User emails and telephone numbers reside under `/users/{userId}/private/info` and are readable only by `request.auth.uid == userId` or verified active `admin`/`super_admin`.
5. **Public Lead Create-Only Boundary**: Unauthenticated visitors may `create` `/enquiries/{enquiryId}`, `/demoBookings/{demoId}`, and `/contactMessages/{contactId}` only with validated schema fields, `consentAccepted == true` (for enquiries), initial workflow status, and `request.time` server timestamps. Public `get`, `list`, `update`, and `delete` are forbidden.
6. **Immutable Audit Logs**: `/auditLogs/{logId}` rejects all updates and deletes. Reads require verified active `admin`/`super_admin`.
7. **CMS Draft Isolation**: Public visitors may only `get` or `list` `/cmsSettings/{settingId}` and `/cmsContent/{entryId}` documents where `status == 'published'`. Draft documents are restricted exclusively to `content_manager`, `admin`, and `super_admin`.

## 2. Adversarial Payloads Blocked ("Dirty Dozen+")
1. Self-promotion payload on `/users/{uid}` with `role: 'super_admin'` -> **DENIED**.
2. Browser read or write at `/system/bootstrap` -> **DENIED**.
3. Deactivated account (`active: false`) creating a support ticket, reading a quotation, or updating a profile -> **DENIED**.
4. Standard `admin` attempting to demote or modify a `super_admin`, or promote a user to `super_admin` -> **DENIED**.
5. Cross-role privilege abuse (`support_officer` creating a quotation or `content_manager` reading `/auditLogs`) -> **DENIED**.
6. Shadow field injection on `/enquiries/{id}` adding `isVerified: true` -> **DENIED** via `keys().hasOnly(...)`.
7. Public `list` query on `/enquiries` or `/quotations` by anonymous or non-owning user -> **DENIED**.
8. Public `get` or `list` of `/cmsContent/{id}` or `/cmsSettings/{id}` with `status: 'draft'` -> **DENIED**.
9. Forged backdated `createdAt` timestamp on `/demoBookings/{id}` -> **DENIED** (`createdAt == request.time`).
10. Oversized 1.5KB document ID poisoning on `/enquiries/{id}` -> **DENIED** via `isValidId(id)`.
11. Cross-tenant ticket read on `/supportTickets/{id}` where `ownerUid != request.auth.uid` -> **DENIED**.
12. Client creating a quotation or tampering with `subtotal`, `discountPercent`, `taxAmount`, `totalAmount`, or `/items` -> **DENIED**.
13. Deleting or tampering with `/auditLogs/{id}` -> **DENIED**.
14. Unverified email account (`email_verified == false`) attempting authenticated writes or CMS modifications -> **DENIED**.
