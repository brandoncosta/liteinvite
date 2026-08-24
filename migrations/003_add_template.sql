-- Run this once in the Supabase SQL editor to add multiple card styles.
-- `layout` (centered/left/accent/photo) is retired in favor of `template`
-- (editorial/poster/linework/stacked/photo) — we leave the old `layout`
-- column in place rather than dropping it (it still has a default, so the
-- app can simply stop sending it on insert), so this is non-destructive
-- and existing rows keep working.
alter table events add column if not exists template text not null default 'editorial';
