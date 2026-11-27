# DayTech platform foundation

DayTech Products owns the public product catalogue. Enterprise, Cloud and AI describe implementation and service lines. Academy owns published learning material. Partners collects expressions of interest through the contact workflow while approvals and financial workflows are designed. Labs may publish approved summaries. Keep unpublished experiments, proprietary source and operational research private.

## Product ownership and publication

Retain eleven stable slugs. Internal priority 1 is Inventory, HotelOS and Schools. Priority 2 is HR, Rentals, CRM and Finance. Priority 3 is SACCO, Farm, WaterOps and Meet. These are proposed commercial priorities for an authorised workflow, with no implied delivery dates. WaterOps requires written IP and employment clearance before release.

Use public release projections separate from private operational records. Public projections carry version, approved URLs, verified capabilities, approved prices and publication dates. Internal records carry owner, priority, unpublished drafts, review evidence and release notes. A staff author proposes a transition, a publisher records evidence and approves release, and the backend atomically updates the public projection and immutable audit record. Deny public access to private drafts and validate destinations against approved HTTPS origins. A public release must not follow merely from changing a lifecycle label.

## DayTech Core boundaries

Keep the corporate React platform responsible for discovery, acquisition, support, quotations and verified product links. Deploy commercial products independently with their own release pipelines, data stores and service identities. Exchange narrowly scoped identities and entitlements through a future versioned API. Treat tenant identity as server-derived. Product services check tenant membership and entitlements independently. Never use website publication state as a permission grant.

Build shared authentication, organisation membership, onboarding, tenant-scoped RBAC, audit events and UI primitives first. Add notifications, reporting and integration contracts after tenant isolation tests. Offline sync needs explicit record ownership, conflict resolution and revocation behaviour.

## Licence Manager design

Model plans, entitlement versions, customer organisations, grants, subscription events and deployment activations separately. Future grants can represent trials, recurring subscriptions, enterprise, white-label and on-premise licences. Bind limits to authenticated tenants and apply them on the product server. Webhook ingestion requires independent signature verification, idempotency and reconciliation. Offline verification should use signed, expiring grants with key rotation and bounded grace periods. Cancellation must preserve a scoped path to export entitled customer data. Real billing and licence enforcement require separate approval.

## IP and launch controls

Maintain a dependency and licence inventory, attribution notices, an SBOM for each release, and provenance for original source, contributed work and assets. Evaluate and document licence compatibility rather than assuming any particular dependency is cleared. A public repository lets third parties inspect and copy the published material, subject to applicable rights and licence terms. Keep original commercial modules and confidential release tools in separately authorised private repositories. Do not change repository visibility or history without approval.

## Implemented increment

Public lifecycle labels, Schools and Rentals routes, product-specific interest via the existing contact desk, partner interest and Academy information are in this branch. Dedicated consent-aware registration, lead assignment and analytics, admin publishing and pricing, customer entitlements, free tools and a full homepage redesign remain future implementation. Academy delivery remains Milestone 4.
