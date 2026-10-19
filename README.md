# ExchangeHub

A bilingual, administrator-mediated currency exchange application built with Next.js 16 App Router, React, Tailwind CSS, shadcn-style Radix components, Motion, Better Auth, Prisma 6.19.3, and MongoDB Atlas.

## Start locally

```powershell
npm install
# Copy .env.example to .env.local if it does not exist, then configure it.
npm run db:push
npm run db:seed
npm run admin:create
npm run dev
```

Open http://localhost:3000. `.env.local` is ignored by Git. Never put credentials in tracked files or browser code. `npm run admin:create` asks for an email, name, and a hidden password; it creates a verified administrator and refuses to overwrite an existing user. There is no public admin registration or promotion API.

The seed is repeatable and preserves existing settings. It adds bKash, Nagad, Payoneer, Tether TRC20, and Skrill as **disabled methods with zero reserves**. It never inserts fabricated exchanges, rates, or administrators.

## Required services

| Variable                              | Purpose                                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`                        | Atlas connection string including the database name; transactions require a replica set |
| `BETTER_AUTH_SECRET`                  | Random secret of at least 32 characters; keep stable across instances                   |
| `BETTER_AUTH_URL`                     | Exact application origin; use HTTPS in production                                       |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | Transactional email for verification and password reset                                 |
| `SMTP_USER`, `SMTP_PASSWORD`          | Mail service credentials, when authentication is required                               |
| `NEXT_PUBLIC_SUPPORT_EMAIL`           | Optional public support address                                                         |
| `CRON_SECRET`                         | Optional private token for scheduled hold-expiry maintenance                            |

Generate an authentication secret locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. No payment gateway, currency-rate API, Redis, or OAuth key is needed. SMTP port 465 uses implicit TLS; port 587 uses STARTTLS when offered.

Configure payment accounts in **Admin → Methods & reserves**, add directional exchange pairs in **Exchange rates**, and then enable **Administrator online** and **Accept new exchanges** in **Service settings**. Use actual available reserves, excluding funds already committed to active checkouts. Rates represent receive units per one send unit, with the displayed percentage fee deducted from the send amount before conversion. Supported digital wallet validation currently covers **USDT TRC20 only**.

New customer signup requires working email delivery. The CLI-created administrator can sign in before SMTP is configured. Password recovery always requires email. Offline status and order-intake status prevent new checkouts; existing payment proofs remain accepted for review.

## Pages and APIs

- `/`: public calculator, masked exchange board, reserves, service notices, FAQ.
- `/exchange`: destination confirmation, a 15-minute payment window, proof submission, review.
- `/login`, `/signup`, `/forgot-password`, `/reset-password`: Better Auth account flows.
- `/dashboard`, `/dashboard/orders`, `/dashboard/orders/[id]`, `/dashboard/profile`: customer workspace and saved accounts.
- `/admin`: queue and reserve overview. Subpages: `orders`, `rates`, `methods`, `users`, `settings`, `audit`.
- `/api/public`: sanitized methods, rates, reserves, service settings, masked activity.
- `/api/auth/*`: Better Auth handlers and database-backed authentication limits.
- `/api/quotes`, `/api/quotes/[id]`: authenticated reservation and owned quote recovery.
- `/api/orders`, `/api/orders/[id]`: authenticated proof submission and owned order history.
- `/api/profile`: profile and saved account operations.
- `/api/admin/[resource]`, `/api/admin/orders/[id]`: admin-only management and guarded processing.

Mutation endpoints require a same-origin JSON request. Every authenticated API checks the session and current database role/ownership; cookie screening in `proxy.ts` alone never grants access. UI tables poll every ten seconds while visible. Financial values travel as strings and use decimal arithmetic; reserves are updated transactionally with version checks. Quotes preserve payment instructions, accounts, rates, fees, amounts, and the destination. Normalized payment TrxIDs and checkout request keys are uniquely indexed.

## Payment lifecycle

1. A server quote reserves outgoing funds for 15 minutes before payment instructions are revealed.
2. Submitted proof creates a `PENDING` order. Duplicate submissions for the same quote return the existing order; a reused TrxID on another quote is rejected.
3. Expired unpaid holds are released exactly once. Late proof is marked for manual review; processing must reacquire reserve.
4. An administrator confirms receipt and claims the order as `PROCESSING`. Only that administrator can finish or cancel a claimed order. Receipt increases the sending method's available reserve once.
5. `COMPLETED` requires a payout reference. Completed orders cannot be modified.
6. Cancellation requires a reason and releases the payout hold. A received payment creates a separate `PENDING` refund, immediately holding the refund amount out of available sending reserve. Recording its actual refund reference marks it `REFUNDED` without a second debit.

All admin mutations append audit events. The admin method editor uses optimistic version checks, so a reserve changed by another checkout cannot be silently overwritten. Operators must reconcile the recorded reserves against provider balances and handle disputed or ambiguous payment receipts manually.

Hold expiry runs when quotes or public data are requested and when the admin overview is loaded. For continuous cleanup, call `GET /api/maintenance` every minute with `Authorization: Bearer <CRON_SECRET>`. It also prunes expired request-limit records. No maintenance endpoint works without the configured secret. Restrict trusted reverse-proxy forwarding of client IP headers in production so authentication throttling receives a reliable client address.

## Themes, language, and preview

Bangla is the default. The header switches to English, and the theme selector offers light, dark, and system. Preferences persist in the browser; `next-themes` initializes the theme before paint. Motion respects reduced-motion preferences.

`EXCHANGE_DEMO_MODE=true` explicitly enables fictional preview rates, balances, and activity **only in development**. A visible banner identifies sample data. Real quote creation, proof submission, and admin writes are disabled in demo mode. Production always ignores the demo flag. Real data remains empty until configured; there is no silent sample-data fallback.

## Verification

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run validate:full
```

`npm test` runs calculation and validation checks; database integration tests are skipped unless `TEST_DATABASE_URL` names an isolated `exchangehub_validation_*` database. `validate:full` provisions a separate timestamped Atlas database, runs transactional integration tests, creates disposable test identities/payment settings, starts local SMTP capture, builds the application, and runs Chromium browser tests on port 3100. It drops **only that generated validation database** afterwards. Tests send no real emails or money and leave the configured application database untouched. The database user must be allowed to create and remove the validation database. Ports 2526, 3100, and 3102 must be available.

Browser checks cover languages/themes, responsive layouts, currency selection, customer checkout/tracking, cross-user and admin API access, payout processing, saved accounts, email verification, and password reset. Screenshots are saved in ignored `artifacts/`; failure traces appear in ignored `test-results/`.

## Production

Deploy to a Node.js host supporting Next.js, Prisma's MongoDB engine, and Atlas connectivity. Install with the lockfile, run `prisma generate`, run `npm run build`, and start with `npm start`. Configure real environment secrets before building and running. Apply schema/index changes with `db:push` against the intended database; do not use Prisma SQL migrations with MongoDB. Set up HTTPS, Atlas network access for the host, SMTP sender verification, regular database backups, and the optional cleanup schedule. Configure actual payment accounts/rates/reserves before opening intake. Review the operational terms, privacy copy, retention policy, and provider permissions for your business before launch.
