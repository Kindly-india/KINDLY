# KINDLY Launch Audit Report
**Date:** 2026-04-19  
**Auditor:** Claude Code (automated diagnostic pass)  
**Scope:** Security, DB Integrity, Code Quality, Frontend UX, Production Readiness, Launch Blockers

---

## Executive Summary

| Severity | Count |
|----------|-------|
| BLOCKER  | 3     |
| MAJOR    | 8     |
| MINOR    | 7     |
| NITPICK  | 2     |

**Overall Readiness:** NOT READY FOR PUBLIC LAUNCH without addressing the 3 blockers.

**Top 3 fixes before any launch:**
1. **Add 'completed' and 'missed' to `event_registrations_status_check` DB constraint** — `completeEvent()` is silently failing or bypassing the constraint right now.
2. **Add ownership check to `GET /organizations/:id/volunteers`** — any authenticated user can pull another org's full volunteer list.
3. **Fix `admin.guard.ts` `.single()` → `.maybeSingle()`** — one missing row throws a 500 instead of a clean 403.

---

## BLOCKERS

### B-1 · DB Constraint Missing 'completed' and 'missed'
**Domain:** DB Integrity  
**File:** Supabase `event_registrations` table + `KINDLY/backend/src/event/event.service.ts` ~L700–707

The `event_registrations_status_check` constraint currently only allows:
```
'registered', 'checked_in', 'cancelled', 'absent'
```
But `completeEvent()` in `event.service.ts` writes both `'completed'` and `'missed'`:
```typescript
// Writes 'completed' — VIOLATES constraint
UPDATE event_registrations SET status = 'completed' WHERE event_id = ? AND status = 'checked_in';
// Writes 'missed' — VIOLATES constraint
UPDATE event_registrations SET status = 'missed' WHERE event_id = ? AND status = 'registered';
```
This means every event completion is either silently failing or the constraint is being bypassed by the service role key. Either outcome is unacceptable.

**Fix:**
```sql
ALTER TABLE event_registrations DROP CONSTRAINT event_registrations_status_check;
ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_status_check
  CHECK (status IN ('registered', 'checked_in', 'cancelled', 'absent', 'completed', 'missed'));
```

---

### B-2 · No Ownership Check on Org Volunteer List Endpoint
**Domain:** Security  
**File:** `KINDLY/backend/src/organization/organization.controller.ts` ~L43–46  
**File:** `KINDLY/backend/src/organization/organization.service.ts` (`getOrgVolunteers`)

`GET /organizations/:id/volunteers` is protected by `JwtAuthGuard` but does **not** verify that the requesting user is the owner of org `:id`. Any authenticated user (volunteer or org) can pass any org UUID and retrieve that org's full volunteer/registration list.

**Fix:** In `getOrgVolunteers` (or in the controller before calling it), resolve the requesting user's org ID from their JWT payload and compare it to `:id`. Throw `ForbiddenException` if they don't match.

---

### B-3 · `admin.guard.ts` Uses `.single()` — Throws 500 on Missing Row
**Domain:** Security / Reliability  
**File:** `KINDLY/backend/src/auth/guards/admin.guard.ts` ~L40

```typescript
const { data } = await supabase
  .from('volunteer_profiles')
  .select('is_admin')
  .eq('user_id', userId)
  .single()   // ← throws PGRST116 if row doesn't exist → unhandled → 500
```

If the admin's `volunteer_profiles` row is missing (deleted, not yet created, wrong table), this throws a Supabase `PGRST116` error instead of returning `false` / 403. Any route protected by `AdminGuard` becomes a 500 DOS vector.

**Fix:**
```typescript
.maybeSingle()
// then: if (!data?.is_admin) throw new ForbiddenException()
```

---

## MAJORS

### M-1 · `analytics.service.ts` Leaks User IDs and Full Event Objects to Server Logs
**Domain:** Security / Code Quality  
**File:** `KINDLY/backend/src/analytics/analytics.service.ts`

15+ `console.log` statements emit user IDs, event payloads, and internal query results to stdout. On Render (or any cloud platform), these logs are accessible in the dashboard and may be indexed. Remove or replace with a logger that can be disabled in production.

**Fix:** Delete all `console.log` calls in `analytics.service.ts` (and audit `social.service.ts`, `event.service.ts` for the same).

---

### M-2 · Image Upload Validation Not Called in Two Upload Handlers
**Domain:** Security  
**File:** `KINDLY/backend/src/event/event.service.ts` (`uploadEventImage`, `uploadOrgSignature`)

A `validateImageFile` function exists but is not invoked in `uploadEventImage` or `uploadOrgSignature`. Malicious users can upload arbitrary file types.

**Fix:** Call `validateImageFile(file)` (or equivalent) at the top of both handlers before any Supabase storage operation.

---

### M-3 · `submitReview` Does Not Verify Attendance
**Domain:** Security / Data Integrity  
**File:** `KINDLY/backend/src/event/event.service.ts` (`submitReview`)

Any authenticated volunteer can post a review for any event — there is no check that `user_id` has a `checked_in` or `completed` registration for that `event_id`. This allows fake reviews from people who never attended.

**Fix:** Before inserting a review, query `event_registrations` for a row where `event_id = $eventId AND user_id = $userId AND status IN ('checked_in', 'completed')`. Throw `ForbiddenException` if none found.

---

### M-4 · `localhost:3000` in Production CORS Allowlist
**Domain:** Security  
**File:** `KINDLY/backend/src/main.ts` ~L23

```typescript
origin: ['https://www.kindly.co.in', 'https://kindly-sigma.vercel.app', 'http://localhost:3000']
```

`http://localhost:3000` in the CORS origin list means any page served at that address on a visitor's own machine can make credentialed requests to the production API. This is low-risk in practice but is a config hygiene issue that should be cleaned up before launch.

**Fix:** Move `http://localhost:3000` behind an `if (process.env.NODE_ENV !== 'production')` guard, or remove it entirely from the production deployment env.

---

### M-5 · `event_date` Selected from `event_registrations` in Analytics Query
**Domain:** DB Integrity / Code Quality  
**File:** `KINDLY/backend/src/analytics/analytics.service.ts` ~L31

The analytics service selects `event_date` directly from `event_registrations`, but that column lives on the `events` table, not on `event_registrations`. This results in silent `null` returns for date-related analytics breakdowns.

**Fix:** Join to `events` (already done elsewhere in the service for other columns) and pull `event_date` from the joined relation.

---

### M-6 · No Error Monitoring in Production
**Domain:** Production Readiness

There is no Sentry, LogRocket, Datadog, or equivalent integration on either frontend or backend. Errors in production are invisible unless a user reports them. This is acceptable for a closed beta but is a launch blocker for a public release.

**Fix:** Add Sentry to both the NestJS backend (`@sentry/node`) and the Next.js frontend (`@sentry/nextjs`). The free tier is sufficient for launch scale.

---

### M-7 · `follows` Table Has 3 Duplicate Unique Constraints
**Domain:** DB Integrity  
**File:** Supabase `follows` table

The `follows` table has three separate unique constraints all covering `(follower_id, following_id)`. Duplicate constraints add write overhead and index bloat with no benefit.

**Fix:**
```sql
-- Keep one, drop the redundant two:
ALTER TABLE follows DROP CONSTRAINT <duplicate_constraint_name_1>;
ALTER TABLE follows DROP CONSTRAINT <duplicate_constraint_name_2>;
```
Identify the constraint names via `\d follows` in psql or the Supabase table inspector.

---

### M-8 · Missing ON DELETE Behavior on Two Foreign Keys
**Domain:** DB Integrity

- `event_broadcasts_organization_id_fkey` — defaults to NO ACTION. If an org is deleted, orphan broadcast rows remain.
- `org_reviews_event_id_fkey` — defaults to NO ACTION. If an event is deleted, orphan review rows remain.

Both should be `ON DELETE CASCADE` (or `SET NULL` if you want to preserve reviews for deleted events, with a nullable FK).

**Fix:**
```sql
ALTER TABLE event_broadcasts
  DROP CONSTRAINT event_broadcasts_organization_id_fkey,
  ADD CONSTRAINT event_broadcasts_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE org_reviews
  DROP CONSTRAINT org_reviews_event_id_fkey,
  ADD CONSTRAINT org_reviews_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
```

---

## MINORS

### N-1 · All 7 Backend Test Spec Files Are Stubs
**Domain:** Code Quality  
**Files:** `*.spec.ts` across all NestJS modules

Every spec file contains only the default NestJS scaffold (`it('should be defined', ...)`). There are zero real tests. This is not a launch blocker but means regressions in auth, event, and volunteer logic are caught only by users.

---

### N-2 · No OpenGraph / Social Preview Meta Tags
**Domain:** Frontend UX / Production Readiness

None of the public-facing pages (`/`, `/how-it-works`, `/for-volunteers`) have `og:title`, `og:description`, or `og:image` meta tags. Links shared on WhatsApp, Instagram, or LinkedIn will render as blank previews — a high-impact miss for a social-first product targeting 19–26 year olds.

---

### N-3 · No robots.txt or sitemap.xml
**Domain:** Production Readiness

The Next.js app has no `robots.txt` or `sitemap.xml`. Search engines will crawl everything including auth pages. For a public launch, a minimal `robots.txt` (disallow `/login`, `/signup`, `/org-*`) and a sitemap for public pages are needed.

---

### N-4 · `RESEND_API_KEY` Not in Startup Env Var Check
**Domain:** Production Readiness  
**File:** `KINDLY/backend/src/main.ts`

The startup guard checks for required env vars but `RESEND_API_KEY` is missing from the list. If the key is absent, email sends will silently fail — the app boots but users never receive confirmation emails.

**Fix:** Add `'RESEND_API_KEY'` to the required env var array in `main.ts`.

---

### N-5 · Category Color Maps Duplicated Across 4 Frontend Files
**Domain:** Code Quality

The event category → color mapping (e.g. `environment → green`, `education → blue`) is hardcoded in at least 4 separate frontend files. No single source of truth exists. A new category added to the backend requires 4 separate frontend edits.

**Fix:** Extract to `KINDLY/frontend/lib/categories.ts` and import from there.

---

### N-6 · `JWT_SECRET` Configured in Unused `jwt.strategy.ts`
**Domain:** Code Quality  
**File:** `KINDLY/backend/src/auth/strategies/jwt.strategy.ts`

The strategy file reads `JWT_SECRET` from env but the actual JWT configuration is handled elsewhere. The file appears to be a scaffold that was never wired up. Dead code that could confuse future contributors.

---

### N-7 · `localStorage.clear()` on Logout Clears All Storage
**Domain:** Frontend UX  
**File:** `KINDLY/frontend/app/volunteers/[id]/page.tsx` ~L509

`localStorage.clear()` nukes everything in localStorage, including any non-session data that might be stored by third-party scripts or future features. Should be scoped:
```typescript
localStorage.removeItem('token')
localStorage.removeItem('userRole')
// etc.
```

---

## NITPICKS

### P-1 · Empty `alt=""` on Notification and Report Avatars
**Files:** `org-top-nav.tsx` (notification actor avatar), analytics/report page volunteer avatar  
Screen readers will skip these images entirely. Use a meaningful alt like `alt={n.actor_name ?? 'User avatar'}`.

---

### P-2 · `console.log` in `main.ts` Startup
**File:** `KINDLY/backend/src/main.ts` ~L45  
`console.log('Application is running on port ...')` — minor, but use `Logger` from `@nestjs/common` to match the rest of the app's logging pattern.

---

## Domain-by-Domain Detail

### Domain 1 — Security
| # | Finding | Severity |
|---|---------|----------|
| 1 | No ownership check on `GET /organizations/:id/volunteers` | BLOCKER |
| 2 | `admin.guard.ts` `.single()` → 500 on missing row | BLOCKER |
| 3 | `localhost:3000` in production CORS allowlist | MAJOR |
| 4 | Image upload validation not called in 2 handlers | MAJOR |
| 5 | `submitReview` allows unattended reviews | MAJOR |
| 6 | 15+ `console.log` leaking user data in analytics service | MAJOR |

### Domain 2 — DB Integrity
| # | Finding | Severity |
|---|---------|----------|
| 1 | `event_registrations_status_check` missing 'completed'/'missed' | BLOCKER |
| 2 | `event_date` selected from wrong table in analytics query | MAJOR |
| 3 | `follows` table has 3 duplicate unique constraints | MAJOR |
| 4 | Missing ON DELETE CASCADE on 2 FKs | MAJOR |

> **Note:** SQL Query 4 (orphan row checks) and Query 5 (index audit) results may have been truncated in transmission. If those queries showed orphan rows or missing indexes on high-traffic columns (`event_registrations.event_id`, `follows.follower_id`), those findings should be added here.

### Domain 3 — Code Quality
| # | Finding | Severity |
|---|---------|----------|
| 1 | All 7 backend test spec files are stubs | MINOR |
| 2 | Category color maps duplicated in 4 files | MINOR |
| 3 | Unused `JWT_SECRET` config in `jwt.strategy.ts` | MINOR |
| 4 | `console.log` startup in `main.ts` | NITPICK |

### Domain 4 — Frontend UX
| # | Finding | Severity |
|---|---------|----------|
| 1 | No OpenGraph meta tags on public pages | MINOR |
| 2 | `localStorage.clear()` on logout | MINOR |
| 3 | Empty `alt=""` on avatars | NITPICK |

### Domain 5 — Production Readiness
| # | Finding | Severity |
|---|---------|----------|
| 1 | No error monitoring (Sentry) | MAJOR |
| 2 | No robots.txt or sitemap.xml | MINOR |
| 3 | `RESEND_API_KEY` missing from startup env check | MINOR |

### Domain 6 — Launch Blockers Cross-check
All 3 blockers identified above. No additional cross-domain blockers found.

---

## Non-Code Actions Needed

1. **Run the DB constraint migration** (B-1) in Supabase SQL editor — this cannot be done from application code.
2. **Set up Sentry project** for both frontend and backend — requires Sentry account and DSN env vars.
3. **Add OpenGraph images** — requires design assets (1200×630px images for landing pages).
4. **Add `robots.txt` and `sitemap.xml`** to `KINDLY/frontend/public/`.
5. **Audit Render environment variables** — confirm `RESEND_API_KEY` and all other required vars are set in the Render dashboard.
6. **Re-run SQL Query 4 and 5** if results were truncated — confirm no orphan rows and check for missing indexes on `event_registrations(event_id)`, `event_registrations(user_id)`, `follows(follower_id, following_id)`.

---

## Recommended Fix Order

**Before any public launch:**
1. B-1: DB constraint migration (5 min SQL)
2. B-2: Ownership check on org volunteers endpoint (30 min)
3. B-3: `admin.guard.ts` `.maybeSingle()` fix (5 min)
4. M-4: Remove `localhost:3000` from production CORS (5 min)
5. M-2: Call `validateImageFile` in upload handlers (15 min)

**Before marketing / public sharing:**
6. N-2: Add OpenGraph meta tags to public pages
7. N-3: Add `robots.txt` + `sitemap.xml`
8. M-6: Set up Sentry (both services)

**Within first week post-launch:**
9. M-1: Remove `console.log` from `analytics.service.ts`
10. M-3: Add attendance check to `submitReview`
11. M-5: Fix `event_date` column source in analytics query
12. M-7: Drop duplicate unique constraints on `follows`
13. M-8: Add ON DELETE CASCADE to 2 FKs
14. N-4: Add `RESEND_API_KEY` to startup env check
15. N-5: Centralize category color/name map
16. N-7: Scope `localStorage` clear on logout

**Backlog (no urgency):**
17. N-1: Write real backend tests
18. N-6: Delete unused `jwt.strategy.ts` JWT config
19. P-1: Fix empty `alt` attributes
20. P-2: Replace startup `console.log` with NestJS `Logger`
