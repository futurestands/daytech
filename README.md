# DayTech Solutions — Digital Business Platform

**Tagline:** Technology. Innovation. Impact.

DayTech Solutions is a Uganda-based technology company serving clients across Africa and internationally in software development, IT infrastructure, artificial intelligence, business automation, cloud computing, cybersecurity, and digital transformation.

## Architecture Overview

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, React Router, Lucide Icons, Motion, Zod.
- **Backend & Persistence:**
  - **Cloud Firestore & Firebase Auth (`daytech-bba8f`):** Live cloud database persistence for quotation enquiries (`enquiries`), itemised customer quotations (`quotations` + `items` subcollection), demonstration bookings (`demoBookings`), contact desk messages (`contactMessages`), client delivery projects (`projects`), support tickets (`supportTickets`), RBAC user profiles (`users`), and immutable audit logs (`auditLogs`).
  - **Express (`server.ts`):** Development Vite middleware, SEO routes (`/sitemap.xml`, `/robots.txt`), public configuration endpoint (`/api/public-config`), and optional local-server fallback persistence (`data/daytech-store.json`) when running locally on Node.js.
- **Customer Quotation Generator:** Integrated in `/admin` (`Quotations & PDF`) and `/portal` (`Quotations & Proposals`), supporting catalogue presets, line items, discounts, VAT/tax calculations, client acceptance/decline, and A4 PDF export via browser print.
- **SEO Foundations:** Dynamic page titles, meta descriptions, canonical URLs, Open Graph tags, Schema.org JSON-LD, `/sitemap.xml`, and `/robots.txt` (disallowing `/admin` and `/portal`).

## Environment Variables & Feature Flags

All optional external integrations remain **disabled** (`false`) until credentials are configured:

- `VITE_FEATURE_FIREBASE` — Enabled when `"true"` or via `firebase-applet-config.json` (`daytech-bba8f`).
- `VITE_FEATURE_PAYMENTS` — Must be `"true"` to enable payment gateway integration.
- `VITE_FEATURE_GOOGLE_CALENDAR` — Must be `"true"` to enable calendar invite sync.
- `VITE_FEATURE_WHATSAPP` — Must be `"true"` alongside `OFFICIAL_WHATSAPP_NUMBER` to display the floating WhatsApp widget.
- `DEFAULT_CURRENCY` — Defaults to `UGX`.
- `DEFAULT_TIMEZONE` — Defaults to `Africa/Kampala`.

## Accessing the Administrative Dashboard (`/admin`) Securely

1. **Firebase Staff Sign-In:** Navigate to `/admin` and sign in with an authorised DayTech staff Google account (`super_admin`, `admin`, `sales_officer`, etc.). Public Google accounts default strictly to `client`.
2. **Local development only — Backend Server Key (`ADMIN_ACCESS_KEY`):** Set a strong secret in `ADMIN_ACCESS_KEY` in your server environment (never prefix with `VITE_`) to unlock the local server console via `x-admin-token`.

See [Firebase authentication and provisioning](SECURITY_GUIDE.md) for authorised domains and initial administrator setup.

## Local Installation & Running

1. Install dependencies:
   ```bash
   bun install --frozen-lockfile
   ```
2. Run development server (port 3000):
   ```bash
   npm run dev
   ```
3. Type-check, build, and lint Firestore rules:
   ```bash
   npm run lint
   npm run build
   npx eslint firestore.rules
   ```
