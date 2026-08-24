-- Run this once in the Supabase SQL editor. Replaces the per-event
-- texture_url field (migration 004) with a simple on/off toggle — the app
-- now ships with one built-in paper-grain texture rather than taking a
-- pasted URL per event. Safe to run whether or not 004 was ever applied.
alter table events add column if not exists paper_texture boolean not null default false;
alter table events drop column if exists texture_url;
