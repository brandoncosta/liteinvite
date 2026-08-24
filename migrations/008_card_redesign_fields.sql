-- Ground-up card redesign: a custom headline for the "custom" purpose, and
-- optional name-forward fields for the wedding/engagement-style templates.
alter table events add column if not exists custom_headline text;
alter table events add column if not exists partner1 text;
alter table events add column if not exists partner2 text;
