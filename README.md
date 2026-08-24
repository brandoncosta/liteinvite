# LiteInvite

Stripped-down invite/RSVP site. No accounts, no bloat.

Flow: create event → share link → guests RSVP (yes/no/maybe) → host sends
updates/reminders by group → after the event, host sends thank-you notes
(shared message + optional personal line per guest).

## Stack

- Next.js (App Router) + TypeScript
- Supabase (Postgres) for storage — two tables, `events` and `rsvps`
- Resend for outbound email

No user accounts. A host is identified by a private `edit_token` (the
dashboard URL) and guests use a public `view_token` (the invite URL).
Both are random hex strings — treat the dashboard link like a password
and don't share it.

## Setup

1. **Supabase**
   - Create a project at supabase.com (free tier is plenty for this).
   - In the SQL editor, run `schema.sql` from this repo (new install), or
     if you already have a database, run the files in `migrations/` in
     order instead — `001_add_host_email.sql`, then `002_add_guests_table.sql`.
   - Copy your Project URL and `service_role` key (Settings → API) into `.env.local`.
   - Set `NEXT_PUBLIC_SITE_URL` too — every outgoing email builds its links
     from this. Leave it unset and emails will contain relative paths like
     `/dashboard/abc123` that don't work when clicked.

2. **Resend**
   - Create an account at resend.com (free tier: 3,000 emails/month).
   - Grab an API key.
   - To send from your own address (e.g. `invites@liteinvite.rsvp`) once you
     own the domain, verify it under Resend → Domains and set `EMAIL_FROM`.
     Until then, Resend's test sender works for your own inbox only.

3. **Install and run**
   ```
   cp .env.local.example .env.local   # fill in the values above
   npm install
   npm run dev
   ```
   App runs at http://localhost:3000.

## What's intentionally left out (v1)

- No login/auth — the edit_token *is* the access control. Simple, but
  means anyone with the dashboard link can manage the event. Fine for
  personal use; add real auth later if that changes.
- No image upload/hosting — the "photo" layout takes a pasted image URL.
  Swap in Supabase Storage or UploadThing later if you want real uploads.
- No SMS — email only, per the plan to skip texts.
- RLS policies in `schema.sql` are wide open (`using (true)`) because
  access control happens through the tokens in the API routes, not
  Supabase's policies. The service role key (server-only, never exposed
  to the browser) is what actually talks to the database — the anon key
  is never used client-side, so this is safe as long as `SUPABASE_SERVICE_ROLE_KEY`
  stays out of any client-facing code.

## Structure

```
schema.sql                        — the whole data model, 3 tables
lib/supabase.ts                   — server client + shared types
lib/email.ts                      — shared HTML email template
lib/csv.ts                        — CSV parsing + header guessing for guest import
lib/maps.ts                       — Google Maps link builder (no API key needed)
components/InviteCard.tsx         — the 4-layout x 5-theme card system
components/CopyLink.tsx           — link chip + copy button
app/page.tsx                      — create event
app/e/[token]/                    — public RSVP page (personalizes via ?g=<invite_token>)
app/dashboard/[editToken]/        — host dashboard: invite list (CSV import + send), RSVPs, update sender, thank-you sender
app/api/events, /rsvp, /message, /thankyou, /guests, /guests/invite — route handlers
```

## Guest invite list

Previously the only way to reach guests was one shared link the host had
to send themselves. Now the dashboard's "Invite list" tab lets the host
build an actual contact list — CSV import (any CSV: Evite export, Google
Contacts, a spreadsheet — you map the columns yourself since there's no
single standard format) or adding people one at a time — and send each of
them a personalized invite email. Each guest gets a unique link
(`/e/<event>?g=<invite_token>`) so their RSVP links back to their row on
the dashboard automatically, without needing accounts or exact name/email
matching. The old single shared link still works too, for anyone not on
the imported list.
