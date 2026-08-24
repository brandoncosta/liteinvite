-- Purpose-driven card fields for the rebuilt design system.
--   custom_eyebrow  — the small line above the headline, for purpose = 'custom'
--   honoree         — the one person a birthday/shower centers on
--   closing_line    — the footer line ("Dancing & merriment to follow")
-- partner1/partner2 and custom_headline already exist from migration 008.
alter table events add column if not exists custom_eyebrow text;
alter table events add column if not exists honoree text;
alter table events add column if not exists closing_line text;

-- Cached geocode of the venue, so the embedded OpenStreetMap view (which
-- needs coordinates, not an address) doesn't re-geocode on every page view.
alter table events add column if not exists map_lat double precision;
alter table events add column if not exists map_lng double precision;
