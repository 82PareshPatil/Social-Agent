# Social Agent

## Campaign onboarding

Signed-in users without a campaign are redirected from `/dashboard` to
`/create-campaign`. The two-step form collects a name, preset/custom icon, and
one of the two office images copied from `Free/public/offices` to `public/offices`.
Existing campaign owners go straight to the dashboard.

`20261029171337_create-campaign-onboarding.sql` is applied to the linked backend.
The current onboarding supports one campaign per user; the unique user constraint
also prevents duplicate submissions. Campaign rows use owner-only RLS.
Custom PNG/JPEG/WebP icons under 900 KB are stored in the public `campaign-icons`
bucket under the user's UUID; both URL and key are saved. Failed inserts clean up
new uploads. Other legacy application migrations remain unapplied.

## Local development

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the InsForge anon key.
3. Run `npm run check:backend` to verify the SDK connection.
4. Run `npm run dev`.

## InsForge backend

This repository uses the **Social Media Agent** InsForge project
(`7849e6c3-17a8-4d04-be08-88ac54ac3dae`).

Use `insforge` from `@/lib/insforge` for SDK calls, for example
`insforge.database.from('your_table')`. The current starter does not yet have
database queries in the UI. The `users` profile table has its own migration below;
the older application migrations remain in `Free/migrations`.

## User profiles

`users` in `db/schema.ts` maps `public.users`: `id` (the InsForge Auth UUID),
`name`, `email`, and `created_at`. Deleting the auth account cascades to its profile.
The versioned migration is `migrations/20261029165343_create-user-profiles.sql`.
It has been applied to the linked InsForge project.

Authentication actions and the OAuth callback initialize the current profile
using the `ensure_user_profile` RPC before redirecting to the dashboard. It creates
the current profile from the trusted auth identity or refreshes its email.
Browser code can use `ensureUserProfile()` from `@/lib/user-profile`.
`updateUserName(userId, name)` edits the display name.
RLS limits reads and name edits to the current user. Direct SDK inserts, deletes,
and changes to ID/email/creation date are disabled.

## Authentication

- `/sign-in`: email/password and Google sign-in.
- `/sign-up`: name/email/password, followed by email verification. The linked
  backend currently sends a six-digit code; link verification is also supported.
- `/dashboard`: requires a backend-validated session and loads the saved profile.
- `/api/auth/callback`: exchanges Google OAuth codes with a server-owned PKCE verifier.
- `/api/auth/refresh` and `proxy.ts`: refresh access cookies before protected pages render.

Auth mutations use InsForge SSR helpers in Server Actions. Refresh tokens stay in
httpOnly cookies. No admin API key or direct PostgreSQL credential is used for login.
Set `NEXT_PUBLIC_APP_URL` to the actual app origin (locally `http://localhost:3000`).
For deployment, configure that origin and its callback URL in InsForge's allowed
redirect settings. Google must remain enabled in the InsForge dashboard.

With the local app running, use `npm run check:auth` for route, validation,
rejected-credential, and Google initiation checks. This does not create test users
or send verification emails. Completing Google consent or email verification
requires a real account and is an interactive check.

## Direct PostgreSQL with Drizzle

- `db/index.ts` exports the server-only `db` client.
- `db/schema.ts` maps the 16 original application tables plus the linked user profile.
- `drizzle.config.ts` loads `.env.local` and `.env` for Drizzle Studio.

Set `DATABASE_URL` to the full PostgreSQL connection string from the InsForge
dashboard. Keep `sslmode=require` and never prefix this variable with `NEXT_PUBLIC_`.
Run `npm run db:check` for a read-only connection check, or `npm run db:studio`
to inspect your database locally.

Server code can import `db` from `@/db` and tables from `@/db/schema`.
Direct PostgreSQL credentials are privileged: authorize each request and filter
queries by the current user. Browser code should use the InsForge SDK.

The schema file is a typed query mapping, not a replacement for the original SQL.
`Free/migrations` remains authoritative for RLS policies, check constraints,
indexes, storage policies, and references to InsForge-managed `auth.users`.
Do not run Drizzle push/generate against this mapping to replace those migrations.
Apply backend migrations through the InsForge CLI after reviewing and testing them.

For backend administration, use `npx -y @insforge/cli` and the installed
InsForge skills. To set up another machine, log in, then run:

```powershell
npx -y @insforge/cli link --project-id 7849e6c3-17a8-4d04-be08-88ac54ac3dae
```

Retrieve the public anon key with `npx -y @insforge/cli secrets get ANON_KEY`
and set `NEXT_PUBLIC_INSFORGE_ANON_KEY` in `.env.local`.
Keep `.env`, `.env.local`, and `.insforge/project.json` out of Git.
Never place an admin API key in a `NEXT_PUBLIC_` variable.

Inngest remains the background job runner. For local jobs, run
`npm run inngest:dev`; production requires real Inngest event/signing keys.

## Verification

```powershell
npm run check:backend
npm run build
```
