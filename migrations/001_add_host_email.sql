-- Run this once in the Supabase SQL editor if you already ran schema.sql
-- before host_email was added. Safe to run even if the column exists.
alter table events add column if not exists host_email text;
