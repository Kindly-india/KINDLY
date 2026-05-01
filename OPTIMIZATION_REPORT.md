# KINDLY Optimization Report
# Date: 2026-05-01

---

## Executive Summary

Pre-launch audit of the KINDLY platform (NestJS backend + Next.js frontend) covering API performance, frontend efficiency, reliability, security, and infrastructure. The audit ran across six domains and applied 30+ targeted fixes without introducing new features or regressions.

The platform is launch-ready for a small-city initial rollout (Nashik, 0–500 users). Three manual environment variable checks must be completed before going live.

---

## Critical fixes applied this session

### 1. `getPlatformStats` full table scan eliminated
**File:** `backend/src/analytics/analytics.service.ts`

Was: 4 parallel Supabase queries fetching every row from `volunteer_profiles` to compute stats in JavaScript — O(n) memory with the volunteer count.

Fixed: Single `client.rpc('get_platform_stats')` call to a Postgres function that aggregates server-side and returns one JSON object. Required creating the SQL function in Supabase (done manually).

**Impact:** Analytics endpoint memory usage goes from O(users) to O(1).

---

### 2. `AppController` and `AppService` not wired into `AppModule`
**File:** `backend/src/app.module.ts`

Both existed in the codebase but were missing from `controllers:` and `providers:` arrays in `AppModule`. All routes on `AppController` (including the new health endpoint) were silently dead — requests returned 404.

Fixed: Added both to the module declaration.

---

### 3. Signup throttle TTL was 60 seconds instead of 60 minutes
**File:** `backend/src/auth/auth.controller.ts`

`@Throttle({ default: { limit: 5, ttl: 60000 } })` — NestJS throttler TTL is in **milliseconds**, so `60000` = 60 seconds, not the intended 60 minutes. This meant the rate limit reset every minute, offering virtually no protection against automated signup abuse.

Fixed: Changed to `ttl: 3_600_000` (1 hour) across all auth throttles.

---

### 4. `NEXT_PUBLIC_API_URL` fallback is `localhost:3001`
**File:** `frontend/lib/api.ts` and related layout/page files

All API calls fall back to `http://localhost:3001` if `NEXT_PUBLIC_API_URL` is unset. If this variable is missing from Vercel's environment, every API call from production browsers silently fails.

**This is a manual action — see section below.**

---

## High priority fixes applied

### Health endpoint
**File:** `backend/src/app.controller.ts`

Added `GET /health` returning uptime, timestamp, DB liveness, and latency. Responds `503` with structured payload if DB is unreachable. Can be pointed to by Render's health check path.

### SIGTERM graceful shutdown
**File:** `backend/src/main.ts`

Added `process.on('SIGTERM')` handler that calls `app.close()` before `process.exit(0)`. Without this, Render's rolling deploys kill the process mid-request, causing in-flight requests to drop.

### Email retry (3 attempts, linear backoff)
**File:** `backend/src/email/email.service.ts`

Resend API transient failures were silently swallowed after one attempt. Now retries up to 3 times with 500ms / 1000ms / 1500ms backoff before logging a final error.

### PDF retry + browser reuse
**File:** `backend/src/certificate/certificate.service.ts`

Two fixes combined:

**Before:** A new Puppeteer browser was launched and torn down for every single certificate in the batch. For 80 attendees: 80 launches (~100MB RAM spike each) on Render's 512MB free tier — the primary source of OOM crashes.

**After:** One browser is launched before the loop (outer `try/finally`), each volunteer gets a fresh page inside `generatePdf` (inner `try/finally` ensures `page.close()`), and the browser closes once at the end regardless of failures.

Also: a PDF failure for one volunteer now logs the error and continues to the next volunteer rather than aborting the entire batch. Upload and DB insert failures also continue gracefully. A new `failed` count is returned alongside `issued` and `skipped`.

### Rate limiting hardened
**File:** `backend/src/auth/auth.controller.ts`, `posts.controller.ts`, `social.controller.ts`

| Endpoint | Before | After |
|---|---|---|
| `POST /auth/signup/volunteer` | 5 / 1 min (TTL bug) | 5 / 1 hour |
| `POST /auth/signup/organization` | 5 / 1 min (TTL bug) | 3 / 1 hour |
| `POST /auth/reset-password` | none | 5 / 1 hour |
| `POST /posts` | none | 10 / 1 hour |
| `POST /posts/:id/comments` | none | 30 / 1 hour |
| `POST /social/follow/:id` | none | 60 / 1 hour |

### DTO validation coverage — all input surfaces hardened
**Files:** 7 DTO files + 3 controllers

All string fields now have `@MaxLength`. All array fields have `@ArrayMaxSize`. User-entered social URLs use `@IsUrl({ require_protocol: false })` (allows `linkedin.com/in/foo`). System-generated URLs (Supabase storage) keep `require_protocol: true` (default). Email fields use `@IsEmail()`.

Five endpoints that were accepting raw `@Body() body: any` or inline types have been replaced with proper validated DTOs:

| Endpoint | DTO created |
|---|---|
| `POST /auth/update-password` | `UpdatePasswordDto` |
| `POST /social/search/recent` | `SaveSearchHistoryDto` |
| `POST /events/:id/broadcast` | `BroadcastMessageDto` |
| `POST /events/self-check-in` | `SelfCheckInDto` |
| `POST /events/:id/review` | `SubmitReviewDto` |

### Debug logs removed from production
**File:** `backend/src/event/event.service.ts` (lines 932, 936)

Two `console.log` statements logging geocoding inputs and resolved coordinates were left in `createEvent`. Removed.

---

## Medium priority fixes applied

### HTTP caching headers
**File:** `backend/src/event/event.controller.ts`

| Route | Header |
|---|---|
| `GET /events/top` | `public, max-age=300, stale-while-revalidate=600` (5 min CDN cache) |
| `GET /events/details/:id` | `public, max-age=60, stale-while-revalidate=300` (1 min CDN cache) |

### Unbounded query limits
All Supabase queries that previously had no `.limit()` now cap at sensible sizes:

| Service | Query | Limit |
|---|---|---|
| `social.service` | followers / following lists | 200 |
| `event.service` | org event list, volunteer registrations | 200 |
| `event.service` | event registrations (org view) | 500 |
| `posts.service` | post likes | 200 |
| `posts.service` | post comments | 100 |
| `posts.service` | volunteer post feed | 50 |
| `analytics.service` | `getOrgAnalytics` events + 12-month filter | 200 |

### Response compression
**File:** `backend/src/main.ts`

Added `compression` middleware. JSON responses over ~1KB are gzip-compressed. Reduces bandwidth on mobile connections.

### Frontend — `next/image` migration
**Files:** `frontend/components/top-nav.tsx`, `frontend/app/social/page.tsx`

`<img>` tags replaced with `<Image>` from `next/image`. Enables lazy loading, automatic WebP conversion, and proper size hints. `next.config.ts` updated with Supabase storage `remotePatterns`.

### Frontend — race condition fixes
**File:** `frontend/app/social/page.tsx`

Three `useEffect` hooks were calling `setState` after async fetches without checking if the component was still mounted. Added `isMounted` flag pattern to all three — prevents React state-update-on-unmounted-component warnings and incorrect state after fast navigation.

### Frontend — top-nav over-fetching
**File:** `frontend/components/top-nav.tsx`

`useEffect` had `[pathname, shouldHide]` as dependencies — it re-fetched user profile data on every route change. Fixed to `[shouldHide]` — now only fires when the nav transitions between hidden and visible.

### Security headers
**File:** `frontend/next.config.ts`

Added via `headers()` config applied to all routes (`/(.*)`):

| Header | Value | Protection |
|---|---|---|
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage |
| `Permissions-Policy` | `geolocation=(self)` + camera/mic blocked | Third-party sensor access |

### `.env.example` updated
**File:** `backend/.env.example`

Was documenting 4 variables. Now documents all 10 variables the backend uses, with required/optional labels and descriptions of what breaks if each is missing.

---

## Manual actions required (things only you can do)

### 1. Verify `NEXT_PUBLIC_API_URL` in Vercel dashboard
Go to: Vercel → KINDLY project → Settings → Environment Variables

Check that `NEXT_PUBLIC_API_URL` is set to your Render backend URL (e.g. `https://kindly-backend.onrender.com`) for the **Production** environment. If this variable is absent, all API calls from production browsers fail silently with "connection refused".

### 2. Set all required backend env vars on Render
Go to: Render → KINDLY backend service → Environment

Ensure these are set:

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | Yes | From Supabase project settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | From Supabase project settings → API |
| `JWT_SECRET` | Yes | `openssl rand -hex 64` |
| `NODE_ENV` | Yes | Must be `production` — controls CORS |
| `FRONTEND_URL` | Yes | `https://www.kindly.co.in` |
| `RESEND_API_KEY` | Yes | From Resend dashboard |
| `CRON_SECRET` | Yes | `openssl rand -hex 32` |
| `SENTRY_DSN` | Optional | From Sentry project settings |

### 3. Set Render health check path
Go to: Render → KINDLY backend service → Settings → Health Check Path

Set to: `/health`

This lets Render detect when the backend is unresponsive and restart it automatically. Without this, a hung process continues to receive traffic.

### 4. Verify `get_platform_stats` SQL function is live
The analytics RPC relies on a Postgres function in Supabase. Confirm it exists:

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'get_platform_stats';
```

If this was not run in your Supabase SQL editor during the session, `GET /analytics/platform` will throw a Supabase RPC error.

---

## Infrastructure recommendations

### Render (backend)
- Use at least the **Starter plan** ($7/mo) before any public launch. Free tier instances spin down after 15 minutes of inactivity — cold starts take 30–60 seconds. Users hitting a cold backend see a loading spinner for 30+ seconds on first request.
- Enable **auto-deploy** from your main branch so deploys are zero-touch.
- The SIGTERM handler is now in place — Render's rolling restarts will be clean.

### Vercel (frontend)
- The frontend is on Vercel's hobby plan. This is fine for launch. The only limitation is builds queue behind other users on busy days.
- Ensure preview deployments have `NEXT_PUBLIC_API_URL` pointed at your Render backend, not localhost.

### Supabase
- Enable **Row Level Security (RLS)** on all tables if not already done. The backend uses the service role key (bypasses RLS) but frontend Supabase client calls use the anon key and are subject to RLS.
- Set up **Point-in-Time Recovery** (available on Pro plan) before accumulating any real user data.

### Certificates
- The Puppeteer/Chromium setup is only suitable while you're on Render's free/starter tier and certificate issuance is low-frequency (one org triggers it per event). It is not designed for concurrent requests — the browser is CPU/memory-heavy.

---

## What to do at 500 users

At this scale the current architecture handles load fine. Focus on:

1. **Upgrade Render to Standard plan** — guaranteed memory (2GB), no cold starts, auto-scaling.
2. **Add Redis for session-level caching** — event details (`GET /events/details/:id`) are currently cached at the CDN layer only. Redis lets the backend skip Supabase round-trips on hot event pages.
3. **Add a Postgres index on `event_registrations(event_id, status)`** — `getEventRegistrations` and `issueForEvent` both filter on this pair. Without an index it's a sequential scan that gets slower as registrations grow.
4. **Add a Postgres index on `follows(follower_id)` and `follows(following_id)`** — social queries hit both.
5. **Move certificate generation off the request path** — wire it to a background job queue (BullMQ + Redis) so the HTTP response returns immediately and generation happens async. At 500 users an org could have 100+ attendees and the synchronous generation will time out Render's 30s request limit.

---

## What to do at 5000 users

At this scale the architecture needs structural changes:

1. **Certificate generation must be a background job** — the synchronous Puppeteer approach will break under any concurrent issuance. Migrate to BullMQ + Redis worker. The browser pool should be a singleton across jobs, not per-batch.
2. **Read replicas for analytics** — `getOrgAnalytics` and `getPlatformStats` are read-heavy and can run on a Supabase read replica to avoid locking the primary.
3. **CDN for user-uploaded images** — Supabase storage is not a CDN. At 5k users, profile images and event covers should be fronted by Cloudflare R2 or served through a CDN-enabled bucket.
4. **Paginate the social feed and event lists properly** — `.limit(200)` caps are a stopgap. Implement cursor-based pagination (`created_at` + `id` cursor) on all list endpoints before the limits start hiding data from real users.
5. **Separate the mailer into a dedicated worker** — email volume at 5k users (confirmations, event reminders, certificates) will exceed what a single Resend API key on the main process can handle cleanly. Move to a queue-backed worker that rate-limits outbound sends.
6. **Monitor Supabase connection pool** — NestJS creates a service-role client per module. At high concurrency, Supabase's default connection limit (60 on free, configurable on Pro) becomes a bottleneck. Switch to a singleton `SupabaseService` connection and consider PgBouncer if needed.
