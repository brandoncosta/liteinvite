-- Run this once in the Supabase SQL editor to add the guest list feature
-- (CSV import + per-guest invite emails). Safe to run even if it already exists.
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  email text not null,
  -- Each guest gets their own link so the RSVP they submit can be matched
  -- back to them automatically, instead of guessing by name/email.
  invite_token text not null unique default encode(gen_random_bytes(8), 'hex'),
  invited_at timestamptz,          -- set when the invite email actually sends
  rsvp_id uuid references rsvps(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists guests_event_id_idx on guests(event_id);
create index if not exists guests_invite_token_idx on guests(invite_token);

alter table guests enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'guests' and policyname = 'public read/write via token'
  ) then
    create policy "public read/write via token" on guests for all using (true) with check (true);
  end if;
end $$;
