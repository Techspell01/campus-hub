# Campus Hub

Events, clubs, announcements, QR ticketing and volunteer duty rosters for a
college — built with Next.js 16, Postgres and Tailwind 4.

There is no seed or demo content. A fresh install starts empty, and the first
account you create becomes a coordinator so you can fill it in.

---

## Run it locally

```bash
npm install
npm run db:migrate     # creates ./.data/pg
npm run dev            # http://localhost:3000
```

No database to install and no account to sign up for. With `DATABASE_URL`
unset, the app runs on **PGlite** — real Postgres compiled to WebAssembly,
stored in `.data/pg`. It uses the same schema and the same migrations as
production, so what works locally works deployed.

To start over, delete `.data` and run `npm run db:migrate` again.

> PGlite is single-process. Don't open `.data/pg` from another script while
> `npm run dev` is running.

### First run

1. Open the app and click **Create an account**.
2. That first account is made a **coordinator** automatically.
3. Go to **Admin** → add a club → create an event → tick **Published**.
4. Add the event's coordinators so the WhatsApp directory works.

---

## Deploy to Vercel + Neon

Both have a permanent free tier and neither asks for a card.

### 1. Create the database

Sign up at [neon.com](https://neon.com) and create a project. On the project
dashboard click **Connect**, leave **Connection pooling** on, and copy the
string — the host ends in `-pooler`.

Use the pooled string for `DATABASE_URL`: serverless functions open a
connection per invocation, and the pooler is what stops that exhausting
Postgres' connection limit.

If a migration ever fails oddly, re-run it with the **direct** string (toggle
connection pooling off to reveal it). Neon's pooler runs in transaction mode,
which doesn't keep session state that some DDL tools expect.

### 2. Push to GitHub, then import into Vercel

At [vercel.com](https://vercel.com) → *Add New Project* → import the repo.

### 3. Set the environment variables

In *Project Settings → Environment Variables*:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | The Neon pooled connection string. |
| `TICKET_SECRET` | yes | Min. 16 chars. Signs every ticket QR. |
| `COORDINATOR_EMAILS` | no | Comma-separated emails granted coordinator on sign-up. |

Generate a ticket secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

**Changing `TICKET_SECRET` invalidates every pass already issued.** Set it once,
before your first real event.

### 4. Apply the migrations

Migrations are not run automatically — a deploy should never silently alter your
data. From your machine, once per schema change:

```bash
DATABASE_URL="postgresql://…" npm run db:migrate
```

### 5. Check it came up

`https://your-app.vercel.app/api/health` should return
`{"status":"ok","database":"reachable"}`. It runs a real query, so it fails if
the app is up but Postgres isn't.

Then sign up — the first account is your coordinator.

---

## Things worth knowing before an event

**The camera needs HTTPS.** QR scanning uses `getUserMedia`, which browsers only
expose on HTTPS or `localhost`. Vercel gives you HTTPS. If you ever run this on
a plain-http LAN address, the scanners fall back to manual code entry.

**The roster polls every 3 seconds.** It used to push over Server-Sent Events,
which needs the coordinator's browser and the volunteer's phone to reach the
same long-lived process — true on one server, false on serverless. Polling is
the honest version of that feature on Vercel.

**Free-tier Neon sleeps after ~5 minutes idle** and takes a moment to wake. Load
a page a few minutes before the doors open.

**Vercel's Hobby plan is licensed for non-commercial use.** A college club app
is fine. Selling tickets for money through it is not.

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and run |
| `npm run lint` | ESLint |
| `npm run db:generate` | Turn schema changes into SQL in `drizzle/` |
| `npm run db:migrate` | Apply migrations (local, or remote via `DATABASE_URL`) |
| `npm run db:studio` | Browse the database in a GUI |

---

## How it's put together

```
src/
  app/              routes — public, /admin (coordinators), /api
  components/       UI, grouped by feature
  db/               Drizzle schema + connection (Neon or PGlite)
  server/
    auth/           password hashing, sessions, route guards
    repositories/   every database query lives here
    actions/        server actions for forms
  lib/              types, formatting, WhatsApp links, styling tokens
drizzle/            generated SQL migrations — commit these
```

**Authentication** is scrypt password hashing plus opaque session cookies
(`httpOnly`, `sameSite=lax`). Only a SHA-256 of each session token is stored, so
a database dump can't be replayed as a login. Signing out revokes server-side.

**Ticket QRs** encode `/verify?c=<id>.<hmac>`. The signature is what makes an
edited or invented code fail. Redemption is a conditional update, so two gates
scanning the same pass can't both admit it.

**Duty check-in QRs** rotate every 30 seconds (an HMAC over a time window with a
per-session key), so a screenshot stops working about a minute after it's taken.

**Authorisation is enforced twice**: once on the page, and again inside every
server action and API route — an action is an HTTP endpoint regardless of which
page rendered its form.

---

## Not built yet

- Password reset and email verification (needs SMTP credentials).
- Image uploads for event posters — events use colour gradients.
- Undo for an accidental admission at the gate.
- The login throttle is per-instance and in-memory; a shared limiter would be
  needed across multiple regions.
