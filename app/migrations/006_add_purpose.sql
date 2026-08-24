-- Adds the "purpose" preset (invite / save-the-date / thank-you) that drives
-- the fixed headline shown on the card. Additive + idempotent.
alter table events add column if not exists purpose text not null default 'invite';
