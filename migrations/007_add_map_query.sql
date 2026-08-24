-- Optional precise address/coordinates for directions, separate from the
-- free-text `location` line guests see displayed on the card. Lets the
-- host pin an exact place even when `location` is informal.
alter table events add column if not exists map_query text;
