# Mongoose public website and separate dashboard

The public repository owns PostgreSQL data and its API. The separate dashboard is a Next.js application with its own URL, a password login, and a server-to-server proxy. Browser clients never receive database credentials or the pairing key.

## Prepare before production

1. Provision a PostgreSQL database, preferably a pooled Neon database in the same region as the public Vercel project. Enable backups and TLS. Set DATABASE_URL on the public project only. Use an isolated database for previews and testing.
2. In the dashboard repository, run `node scripts/generate-secrets.mjs`. Keep the generated admin password privately. Set DASHBOARD_PAIRING_KEY to the generated key on both projects. Set ADMIN_PASSWORD_HASH on the dashboard only. Generate new values before launch; never reuse test credentials.
3. In the public checkout, copy `.env.example` to `.env.local`, fill the values, run `npm ci`, then `npm run migrate`. Migration is idempotent and imports the five existing reviews with fixed IDs. Existing content is preserved. Run from the repository root using Node 22 or newer.
4. Set SITE_URL and NEXT_PUBLIC_SITE_URL to the exact public HTTPS origin. Set PUBLIC_SITE_URL on the dashboard to that same origin. Set DASHBOARD_URL to the exact dashboard HTTPS origin. Origin checks deliberately reject other domains. Give each preview its own matching origins and database.
5. Deploy the public repository and the dashboard repository as two independent Vercel Next.js projects (root directory `/`, Node 22+). Deploy only after environment variables and the migration are ready. `npm run build` is the build command for each.
6. Verify production sign-in, then submit a real test review, contact request and small portfolio image. Confirm dashboard actions appear on the public website. Remove test content using dashboard controls.

## What changes

- Reviews are published immediately, as requested. Optional business name, project description, rating and up to three photos. Admin may edit, hide/restore, delete the entire review, or delete individual photos. Modified review text is visibly labeled as edited by an administrator. Existing reviews are imported, including their current avatar images.
- Contact submissions are committed to the database before success is returned. Inbox status: new/read/done. Attachments are private, accessible only via authenticated dashboard downloads. Deleting a request removes its attachments.
- Portfolio uploads are categorized. Gallery reads combine uploads with existing `public/portfolio/<category>` files. Admin may hide/restore both sources and permanently delete uploaded images. Hiding a folder image excludes it from the gallery; its static URL remains available. To erase the original file, remove it from Git and redeploy. Folder additions continue working exactly as before.
- Business details are read on the server for the public header, footer, contact page and call-to-action. Social links appear only when populated. Values update on new page requests without redeployment.

## Uploads and performance

Uploaded images are decoded, restricted to JPG/PNG/WebP, resized to at most 1600 px, stripped of metadata and converted to WebP. Each source file is limited to 2 MB; public submissions allow 3 MB total, below Vercel's 4.5 MB function request limit. Reviews allow 3 photos; contact requests allow 5 files. PDFs are size/signature-checked and only downloadable as untrusted attachments, never displayed inline. No antivirus scanner is included.

Media bytes are stored transactionally in PostgreSQL, so no additional storage keys or external public bucket is required. This suits a small business website with modest image volume. Monitor database storage and backups; move media to private object storage if upload volume grows. Public uploaded images are delivered from the same origin. Image routes use no-store so hiding/deleting is reflected on subsequent requests; existing browser content cannot be recalled. Existing folder images retain Next.js image optimization and caching. Gallery loads 20 items at a time; the dashboard renders portfolio images in batches of 24.

## Security boundaries

- Parameterized SQL for all customer input. The migration's trusted SQL file is the only raw SQL execution. React renders review text as text, never HTML.
- Streamed request-size limits, input length/range validation, honeypot, strict Origin and fetch-header checks, actual image decoding, and database-backed atomic rate limiting across instances.
- Dashboard calls use HMAC-SHA256 over method, path, body digest, timestamp, nonce, content type and session. Requests expire after two minutes; used nonces are rejected. Admin sessions are random, stored hashed, expire after eight hours, and are revoked on logout. Login uses scrypt password hashes, constant-time comparison and shared attempt limits.
- Production cookies are Secure, HttpOnly and SameSite=Strict. Both sites restrict frame embedding; dashboard is noindex and no-store. No permissive cross-origin admin API is exposed. Keep HTTPS, database backups and server environment secrets in place.
- Administrative content mutations create an audit entry. Public requests do not log message text or personal details. Automatic publication permits abusive text to appear until an administrator removes it; monitor the dashboard regularly.
- Rotate the pairing key on BOTH deployments together. Rotating it disables old signed calls; to revoke all active admin sessions, run `DELETE FROM mongoose_sessions` with your trusted database management tool.

## Verification

Public: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
Dashboard: `npm run typecheck`, `npm run lint`, `npm run build`.
For both: check out the dashboard as a sibling folder named `mongoose-dashboard`, run `npm ci` in each, then `npm run test:e2e` from the public repository. The runner uses a disposable PostgreSQL-compatible PGlite instance, local servers, randomly generated credentials, API tests and Chromium mobile/desktop checks. It never connects to production. Results and screenshots are written to ignored `test-results/`.
