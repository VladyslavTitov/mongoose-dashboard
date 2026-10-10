# Verification — 10 October 2026

Both applications passed TypeScript checking, ESLint and Next.js production builds. The public application also passed all 5 security unit tests and all 22 end-to-end checks against disposable PostgreSQL-compatible storage and both real Next.js servers.

## End-to-end evidence

- Idempotent schema migration/import of five existing reviews.
- Unauthenticated admin endpoints denied; cross-origin sign-in denied.
- Password sign-in with a server-backed HttpOnly, SameSite=Strict session.
- Immediate review publication with optional photo, including SQL-looking text stored harmlessly.
- Administrator edits, hide/restore and edited-review labeling; hidden review photos excluded from public responses.
- Forged image rejection and shared database submission rate limiting.
- Contact submission stored in admin inbox, private image/PDF attachments, download disposition, and status changes.
- Dashboard portfolio upload, folder/upload hiding and authenticated previews for both sources.
- Business-detail changes reflected on public pages; unsafe social URLs rejected.
- Signed-request replay denied.
- Mobile public reviews: modal opens, optional business field, Escape closes, no horizontal overflow at 390 × 844.
- Actual browser review form submission with photo publishes and refreshes the visible list immediately.
- Actual browser contact form submission with photo arrives in the inbox.
- Mobile dashboard login and business-detail editor use live data without horizontal overflow.
- Desktop dashboard portfolio at 1440 × 1000 loads both image previews without browser runtime errors.
- Generated pairing key and admin password absent from browser bundles.
- Administrator deletion of uploaded portfolio images, review photos, reviews and contact requests.
- Logout revokes the stored admin session.

Unit tests separately cover streamed body limits without Content-Length, same-origin enforcement, identifier/text validation, HMAC binding, forged uploads, and image metadata stripping.

## Verification scope

Local Linux tests use a disposable PGlite PostgreSQL-compatible engine, TCP protocol adapter, and Chromium from a registry-distributed package. The test adapter uses one application DB connection because its protocol multiplexer does not fully emulate simultaneous PostgreSQL sessions. The production pool defaults to three connections.

No production database, customer records or production deployment was modified by testing. Deployment still requires PostgreSQL provisioning, migrations, private environment variables and HTTPS origins. Live Vercel smoke testing is a separate deployment check; see DEPLOYMENT.md. No external penetration test or antivirus scan was performed.
