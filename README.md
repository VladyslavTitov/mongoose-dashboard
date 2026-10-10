# Mongoose Dashboard

Separate, mobile-first Next.js admin website for Mongoose Signs & Advertising.

Manage automatically published reviews, contact requests and private attachments, categorized portfolio images, and public business details. Plain white interface, password login, and server-to-server authenticated pairing with mongoose-nextjs.

## Setup

Use Node 22+. Run `npm ci`, copy `.env.example` to `.env.local`, configure the public website URL and this dashboard's exact URL, then run `node scripts/generate-secrets.mjs`. Set the generated pairing key on both sites and the password hash here. Keep the generated password privately. No secrets belong in Git or NEXT_PUBLIC_ variables.

The public site requires PostgreSQL and its migration. Read `DEPLOYMENT.md` for complete production steps, storage limits and security boundaries.

```
npm run dev -- --port 3001
npm run typecheck
npm run lint
npm run build
```

Deploy this repository as an independent Vercel Next.js project. Configure PUBLIC_SITE_URL, DASHBOARD_URL, DASHBOARD_PAIRING_KEY and ADMIN_PASSWORD_HASH on Vercel before deployment. Production uses HTTPS only.

The integration/browser test runner lives in the public repository. Check out this repository beside it under the name mongoose-dashboard, then run `npm run test:e2e` in the public checkout.
