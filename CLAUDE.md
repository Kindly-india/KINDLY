# CLAUDE.md

This file is loaded automatically by Claude Code at the start of every session in this repo. It is the operating manual. Read this first, then read `KINDLY_VISION.md` and `ROADMAP.md` before writing any code.

---

## What KINDLY Is

KINDLY is a volunteering platform for Indian cities (currently: Nashik, Mumbai, Pune, Delhi, Bangalore, Chennai, Hyderabad, Kolkata). Two user types:

1. **Volunteers** — individuals (target: 19–26, tier-2 city) who discover and attend events.
2. **Organizations** — NGOs and groups that create events, manage attendance, and get analytics.

The product split is **75% volunteer-focused, 25% organization-focused**. Organizations get utility (data, attendance, analytics, certificates). Volunteers get experience (community, identity, belonging). When in doubt about a tradeoff, optimize for the volunteer.

For deeper product philosophy, see `KINDLY_VISION.md`. For what we are building and in what order, see `ROADMAP.md`.

---

## Tech Stack

**Backend** (NestJS + Supabase)
- NestJS modules: `auth`, `volunteer`, `organization`, `event`, `social`, `analytics`, `supabase`
- Auth: JWT via `@nestjs/jwt`, strategies in `auth/strategies/`, guards in `auth/guards/` (`JwtAuthGuard`, `OptionalJwtAuthGuard`)
- DB: Supabase (Postgres). Server uses `SUPABASE_SERVICE_ROLE_KEY` via `SupabaseService.getClient()`.
- Validation: `class-validator` DTOs, global `ValidationPipe` enabled in `main.ts`.
- Rate limiting: `@nestjs/throttler` global guard, 20 requests / 60s.
- CORS allowlist in `main.ts`: `https://www.kindly.co.in`, `https://kindly-sigma.vercel.app`, `http://localhost:3000`.

**Frontend** (Next.js + React + Tailwind)
- App Router (`page.tsx`, `layout.tsx`, `route.ts` patterns).
- Three navigation contexts:
  - Public/landing — `top-nav.tsx`, `mobile-nav.tsx`, `navigation.tsx`
  - Volunteer area — `volunteer-home-page.tsx`, `volunteer-mobile-nav.tsx`
  - Organization area — `org-top-nav.tsx`, `org-mobile-nav.tsx`, `org-home-page.tsx`
- `navbar-manager.tsx` decides which nav to show based on auth state and role.
- API calls go through `api.ts` (single file, ~1000 lines, all backend calls live there).
- Supabase client lives in `supabase.ts`.

**Deployment**
- Frontend: Vercel (`kindly-sigma.vercel.app`, custom domain `www.kindly.co.in`)
- Backend: Render (or similar — check existing config before assuming)

---

## Database Conventions (Supabase)

These conventions exist throughout the codebase — follow them for any new tables.

- Table names: snake_case, plural (`volunteer_profiles`, `event_registrations`, `follows`).
- Every table has a UUID `id` primary key.
- Profile tables key off `user_id` (the Supabase auth user id), NOT the profile `id`. This distinction matters — see the comments in `social_service.ts` for an example of where it bites.
- `is_verified` boolean on profile tables.
- Timestamps: `created_at`, `updated_at` defaults set in Postgres.

---

## Code Conventions

**Always check existing patterns before inventing new ones.**

- DTOs live next to their module's controller. Use `class-validator` decorators. Look at `create-event_dto.ts` and `update-volunteer-profile_dto.ts` as references.
- Services use the injected `SupabaseService` and call `.getClient()` for raw Supabase access. Don't import the Supabase client directly in services.
- Controllers stay thin. Business logic goes in services.
- For `api.ts` (frontend): every new endpoint gets a typed interface AND a function. Match the existing style — don't introduce a different HTTP wrapper.
- For new pages: check whether the user is volunteer, org, or public, and place the file alongside the matching nav (volunteer pages near `volunteer-*`, org pages near `org-*`).

---

## What NOT to Do

- **Don't build features not in `ROADMAP.md` without asking.** I have a sequence for a reason.
- **Don't redesign the database schema unilaterally.** Propose changes first, get confirmation, then write the migration.
- **Don't create new files when an existing file would do.** Especially in `api.ts` — extend it, don't fragment it.
- **Don't add dependencies without flagging them first.** Especially heavyweight ones (charting libraries, animation libraries, state managers).
- **Don't write code before exploring.** On a new task, first read the relevant existing files, summarize what's there, propose an approach, and wait for me to confirm. Only then write.
- **Don't touch the auth flow casually.** JWT, guards, and the volunteer/org distinction are load-bearing.

---

## How to Work With Me on This Project

1. When I give you a task, **start by reading the relevant existing files** and tell me what you found.
2. **Propose an approach** before writing code. List which files you'll touch and what the data shape will be.
3. **Wait for me to confirm** before generating large amounts of code.
4. **Make small, reviewable changes.** Prefer 5 small commits over 1 huge one.
5. **Ask when something is ambiguous.** Especially anything touching the volunteer experience — I have strong opinions and the strategy doc may not cover the specific case.
6. **If something in this file or the vision/roadmap is wrong or stale, tell me.** These are living documents.

---

## Current State of the Codebase (as of writing)

Already built:
- Auth (volunteer + org signup, login, JWT)
- Event CRUD (create, list, detail, registration, gallery)
- Volunteer profile (with skills, interests, social links, follow/unfollow, endorsements)
- Organization profile and event management
- Discovery page with filters
- Social search (volunteers + orgs)
- Event registration + history
- DTOs already include `proposedConnect` on events — the after-event field exists in the data model but isn't surfaced well in the UI yet.

Known gaps (do not assume these work — verify if the task touches them):
- Admin panel
- Real certificate generation
- Notification system
- Squad / cohort feature (not started)
- Personality-based onboarding (current signup is a plain form)
- Passport / visual stamp system on profile

See `ROADMAP.md` for the order I want to tackle these in.
