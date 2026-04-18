# ROADMAP.md

What we are building, in what order, and what "done" means for each. Phases are sequential — do not jump ahead without explicit confirmation.

For why we are building any of this, see `KINDLY_VISION.md`. For how to work in this codebase, see `CLAUDE.md`.

---

## Phase 1 — Foundation Fixes (do this first)

The platform must stop embarrassing the founder before we add anything new.

### 1.1 Admin panel
- A protected route accessible only to admin role.
- Lists all volunteers, all organizations, all events.
- Can verify / unverify orgs (`is_verified` toggle).
- Can soft-delete spam events.
- Can view basic platform metrics (total users, total events, total hours).
- **Done when:** founder can manage the platform without touching the database.

### 1.2 Real certificate generation
- After an event is marked completed and a volunteer is checked in, generate a downloadable PDF certificate.
- Includes: volunteer name, event title, organization name + logo, hours contributed, date, a unique verification ID.
- Stored in Supabase storage. Volunteer can re-download from their event history.
- **Done when:** a real volunteer can download a real certificate they would actually post on LinkedIn.

### 1.3 Notification system
- In-app notifications (bell icon, unread count).
- Email notifications for: registration confirmation, 24-hour reminder, event-cancelled, certificate-ready.
- Notification preferences in volunteer settings.
- **Done when:** a volunteer registers for an event and receives confirmation + reminder without the founder doing anything manually.

---

## Phase 2 — Identity Layer (the First Feeling)

This is where KINDLY starts to feel different from a directory.

### 2.1 Personality-based onboarding
- Replace the current registration form with a 5–6 question visual quiz.
- Example questions (final wording TBD, propose alternatives):
  - "Pick the Sunday that sounds most like you" — 4 image options
  - "You have 3 hours free. You'd rather…" — 4 illustrated options
- At the end, the volunteer is assigned an **archetype**: Protector, Builder, Connector, Explorer, Maker (or similar — final list TBD).
- Archetype is shown on the profile and used to personalize the home feed.
- **Backend changes:** add `archetype` field to `volunteer_profiles`. Update `VolunteerSignupDto` to accept quiz answers (or a separate post-signup endpoint).
- **Done when:** a new volunteer finishes signup having taken a quiz, and sees their archetype shown on their profile and home feed.

### 2.2 Surface "The Connect" properly in event UI
- The `proposedConnect` field already exists on `CreateEventDto`. Right now it's not prominent in the UI.
- Treat it as a first-class feature on the event card and event detail page. Show it with the same visual weight as time/location.
- On event creation, make it optional but visually encouraged ("What's the after-event hangout? Chai? Walk? Breakfast?").
- **Done when:** every new event in production has a Connect set, and volunteers can see it before they register.

### 2.3 Shareable volunteer profile redesign
- The profile data is rich; the presentation is not yet shareable.
- Redesign so a volunteer would actually send their KINDLY profile link to someone (the way they'd send an Instagram).
- Hero: cover photo from a real event they attended, large name, archetype badge, hours-given metric.
- Visible: list of past events with org logos, endorsements with org branding, social links, Squad (once 3.1 ships).
- Add OpenGraph tags so the link previews beautifully on WhatsApp / Instagram DMs.
- **Done when:** a profile link pasted into WhatsApp shows a beautiful preview card.

---

## Phase 3 — Retention Engine (Reasons to Come Back)

This is where KINDLY stops being a one-time interaction and becomes a habit.

### 3.1 Squads
- New table `squads` (id, name, created_at, archetype_focus_optional).
- New table `squad_members` (squad_id, user_id, role, joined_at).
- After a volunteer attends 2+ events in the same category alongside ≥3 other repeat attendees, trigger a "Form a Squad?" suggestion.
- Squads have: a chosen name, member list, shared total impact hours, a "monthly challenge" (attend at least one event together this month).
- Squads can register for an event together (group registration flow).
- **Done when:** real volunteers form real Squads through organic event attendance.

### 3.2 Weekly rhythm content
- Sunday evening: "This week on KINDLY" card on the home feed — photos, hours, new members.
- Wednesday: "Weekend ahead" card — events near you with current registration counts.
- Initially these can be manually curated by the founder for the first 3 months. Build the surface first, automate later.
- **Done when:** there is always something fresh on the home feed even when the volunteer hasn't done anything.

### 3.3 Real social feed (replace static social page)
- Show real photos from real events that real KINDLY members attended.
- Each post: event title, org, attendees who tagged themselves, photo gallery.
- Like / comment optional in v1 — focus on display first.
- **Done when:** the social page is a living feed of last weekend's events, not a static page.

---

## Phase 4 — Identity Attachment

Where KINDLY becomes part of how someone presents themselves.

### 4.1 The Passport
- Visual stamp collection on the profile. Each completed event = one stamp.
- Each stamp has: event name, date, org logo, small image.
- Designed to look like an actual passport — physical metaphor matters.
- **Done when:** a volunteer with 6+ events has a passport view they'd screenshot and post on their story.

### 4.2 Social graph surfacing
- After every event, show: "3 people from today's event also attended last month's beach cleanup."
- On profile: "You and Priya have attended 4 events together."
- On event detail: "Rahul (you follow) is going."
- **Done when:** the social graph is visible enough that volunteers feel they are building a network by showing up.

### 4.3 Streaks (the calm version)
- Monthly streak — "You've shown up every month for 4 months."
- No anxiety mechanics. No punishment for missing. Recognition only.
- **Done when:** volunteers with 3+ month streaks see their streak celebrated on the home feed.

---

## Always-On (Parallel to Every Phase)

These are not features. They are the founder's job.

- Show up to the first 20 events personally.
- Take photos. Post them. Seed the social feed manually until 3.3 ships.
- Remember names. Make introductions between volunteers in person.
- Maintain a recognizable visual identity at events (banner, color, vibe).
- Re-read `KINDLY_VISION.md` before every work session. Re-read these conversations before every product decision that feels hard.

---

## What We Are NOT Building (For Now)

To be explicit, so neither I nor Claude Code wastes time:

- A messaging / DM system. (Squads have group chats off-platform via WhatsApp for v1.)
- A donations / payments feature. KINDLY is not a giving platform.
- A separate mobile app. The web app is mobile-first. Native app comes after PMF.
- AI matchmaking, AI recommendations, AI anything. Manual curation until we have data worth recommending on.
- Multi-language support. English-first. Add Hindi/Marathi after Nashik works.

If you find yourself building something not on this roadmap, stop and ask first.
