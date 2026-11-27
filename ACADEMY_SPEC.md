# DayTech Academy architecture

Academy is a Milestone 4 feature of the existing React site, Express API and Firebase project. Start with written tutorials and existing YouTube hosting. Reuse Firebase Authentication for learner and staff identity.

## Content and navigation

Public routes expose a catalogue, course outlines, searchable written tutorials, product documentation and troubleshooting guides. Product pages link to their own tutorials. Portal links lead to the learner dashboard after sign-in. Free published written lessons are readable by guests. Launch with accurate product documentation and source references for screenshots and examples.

Lessons support written steps, code examples, accessible screenshots, optional YouTube embeds and approved downloads. Load video only on request and supply written equivalents. Use compressed responsive images, captions, pagination and text search over published metadata. Do not cache private learner records in a shared cache.

## Firestore layout

| Collection | Access and fields |
| --- | --- |
| `academyCourses` | Published public metadata with slug, product, subject, summary, access tier, revision and publication date. Keep drafts readable by Academy staff. |
| `academyCourses/{id}/lessons` | Ordered, versioned lessons with text, resources, optional video ID and visibility. Require course publication and lesson visibility for public reads. |
| `academyEnrollments/{uid}/courses` | Active owner reads saved courses and progress. Store course revision, completion state and timestamps. Server validates completion transitions. |
| `academyAttempts/{uid}/attempts` | Owner-visible scores and feedback. Keep answer keys and assessment rules in a server-only collection. |
| `academyCertificates` | Server-issued certificates with course revision, completion date and opaque verification ID. Publish a minimal verification result with learner consent. |
| `academyEntitlements/{uid}/courses` | Server-managed access grants. Introduce premium checkout only after separate approval. |
| `academyStaff/{uid}` | Operator-managed instructor and publisher grants. Authors edit assigned courses, publishers review and publish, and staff actions create audit events. |

Keep drafts and published revisions separate so editing a draft cannot change the material attributed to an assessment or certificate. Give certificate issuance an idempotency key derived from learner, course and revision. Reject answer submissions from other accounts and issue certificates from verified completion records only.

## AI tutoring

An optional server-side tutor may cite approved, published lesson excerpts and link back to sources. Filter materials by the caller's entitlement before retrieval. Keep solution keys and other learners' records out of context. Reuse existing AI controls and provide a searchable text fallback. Enable new usage only with an approved budget and rate limits.

## Acceptance checks

- Guests can read published free tutorials and cannot read drafts or premium lesson bodies.
- A learner cannot read or change another learner's progress or submit another learner's assessment.
- Authors can edit assigned drafts and publishing requires the publisher role. Published lesson URLs remain stable across revisions.
- An incomplete or failed assessment cannot issue a certificate. A completed course issues at most one certificate per learner and revision.
- Written content and search work with video, tutoring and payments disabled. Product and portal links resolve on mobile and desktop.
