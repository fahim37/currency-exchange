# ExchangeHub — Remaining setup

The application code is implemented. Your MongoDB Atlas connection is saved in the ignored `.env.local`, and the database schema/indexes and five payment-method templates are initialized. Real order intake is disabled.

## Required before opening the service

- [ ] **Create your administrator:** run `npm run admin:create` in an interactive terminal. Enter your email, name, and a hidden password. Sign in at `/login`, then open `/admin`.
- [ ] **Configure email in `.env.local`:** set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. This enables customer verification and password reset. Restart the server after changing environment variables.
- [ ] **Configure real receiving accounts:** in Admin → Methods & reserves, enter your actual bKash/Nagad numbers, Payoneer/Skrill emails, and supported USDT TRC20 address. Add clear payment instructions in both languages.
- [ ] **Set available reserves:** enter real available balances and enable the methods you will support. Seeded methods start disabled with zero balances.
- [ ] **Create exchange rates:** in Admin → Exchange rates, add each directional pair with its conversion rate, fee percentage, minimum, and maximum. The rate is receive units per one send unit.
- [ ] **Set service information:** configure notices and service hours in both languages, and optionally set `NEXT_PUBLIC_SUPPORT_EMAIL`.
- [ ] **Open order intake:** enable Administrator online and Accept new exchanges in Admin → Service settings after the above setup is complete.

## Local use

```powershell
npm run dev
```

Open http://localhost:3000. Keep `EXCHANGE_DEMO_MODE=false` when using real accounts and orders. Never commit `.env.local` or share database, authentication, or SMTP secrets.

## Before production deployment

- [ ] Choose a Node.js host, configure HTTPS, and set `BETTER_AUTH_URL` to the final origin.
- [ ] Configure environment secrets on the host; keep `BETTER_AUTH_SECRET` stable across instances.
- [ ] Allow the deployment host through Atlas network access and configure database backups.
- [ ] Verify your SMTP sender/domain and test delivery to a real inbox.
- [ ] Review the terms/privacy copy, business rules, payment-provider permissions, and data-retention policy.
- [ ] Optionally set `CRON_SECRET` and call `GET /api/maintenance` every minute with `Authorization: Bearer <CRON_SECRET>` for continuous expiry cleanup. Expiry also runs during application activity.
- [ ] Perform a final controlled operational check of real payment receipt, payout, cancellation, and refund reconciliation.

## Verification handoff

- TypeScript checks, ESLint, and a production build have passed.
- The latest calculation/validation and MongoDB integration run passed **16 tests**, including concurrency, duplicate TrxIDs, expired holds, ownership, payout references, cancellation, and refund reserve handling.
- The preceding full browser run passed **all 3 browser scenarios**: responsive themes/languages, customer checkout through admin payout, and SMTP verification/password reset.
- The final expanded run also passed: **16 calculation/integration tests, a production build, and all 3 browser scenarios**, including admin configuration saves, public masking, cross-origin rejection, and signing in after password reset. Its isolated validation database was removed.
- Re-run everything with `npm run validate:full` if necessary. It provisions and removes a separate `exchangehub_validation_*` database; it does not populate your application database with test orders.
- Production dependency audit reported **zero vulnerabilities**. The full audit still reports development-tool dependency advisories; review those before upgrading tooling. Do not force-upgrade Prisma to a version incompatible with MongoDB.

See `README.md` for commands, endpoints, financial lifecycle details, and the test workflow. No payment gateway, market-rate API, Redis, or OAuth API key is required for the implemented manual workflow.
