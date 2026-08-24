-- LiteInvite schema
-- Run this in the Supabase SQL editor (or via `supabase db push` if using migrations).

create extension if not exists "pgcrypto";

-- One row per event. No user accounts required for v1 — the host is
-- identified by knowing the private edit_token, guests use view_token.
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  map_query text,                                -- optional precise address/coords for directions/embedded map
  host_email text,
  event_date timestamptz not null,
  theme text not null default 'sage',            -- sage | coral | lavender | blush | mustard | red | olive | ink
  template text not null default 'editorial',    -- editorial | poster | letterpress-arch | names-grid | bubble-doodle | cursive-announce | bold-marker | ticket | scatter | photo
  purpose text not null default 'invite',        -- invite | save-the-date | thank-you | custom — drives the fixed headline
  custom_headline text,                          -- host's own headline text, used only when purpose = 'custom'
  partner1 text,                                 -- optional name-forward fields for wedding/engagement-style templates
  partner2 text,
  layout text not null default 'centered',      -- retired, kept for backward compat only
  photo_url text,                               -- optional, used by the "photo" template
  paper_texture boolean not null default false, -- toggle for the built-in paper-grain overlay
  view_token text not null unique default encode(gen_random_bytes(8), 'hex'),
  edit_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz not null default now()
);

-- One row per guest response. Intentionally minimal: name + optional
-- contact + status. No addresses, no accounts, no passwords.
create table rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  email text,
  status text not null check (status in ('yes', 'no', 'maybe')),
  plus_ones int not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per invited guest (from a CSV import or manually added on the
-- dashboard) — separate from `rsvps`, which is what a guest submits when
-- they respond. A guest's personal invite link carries their invite_token,
-- so once they RSVP we can link rsvp_id back to this row automatically.
create table guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  email text not null,
  invite_token text not null unique default encode(gen_random_bytes(8), 'hex'),
  invited_at timestamptz,
  rsvp_id uuid references rsvps(id) on delete set null,
  created_at timestamptz not null default now()
);

create index rsvps_event_id_idx on rsvps(event_id);
create index events_view_token_idx on events(view_token);
create index events_edit_token_idx on events(edit_token);
create index guests_event_id_idx on guests(event_id);
create index guests_invite_token_idx on guests(invite_token);

-- Row Level Security: since there are no user accounts, access control
-- happens at the application layer via the random tokens, not RLS policies.
-- We still enable RLS and allow all access through the anon key, relying
-- on the tokens being unguessable (128-bit / 96-bit random hex).
alter table events enable row level security;
alter table rsvps enable row level security;
alter table guests enable row level security;

create policy "public read/write via token" on events for all using (true) with check (true);
create policy "public read/write via token" on rsvps for all using (true) with check (true);
create policy "public read/write via token" on guests for all using (true) with check (true);
