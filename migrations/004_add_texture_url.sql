-- Run this once in the Supabase SQL editor to support an optional paper
-- texture overlay on cards (pasted image URL, same pattern as photo_url —
-- no file upload/storage needed).
alter table events add column if not exists texture_url text;
