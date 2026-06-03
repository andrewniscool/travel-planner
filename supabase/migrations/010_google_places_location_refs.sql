-- Layer 10: Google Places metadata for reusable location refs.
--
-- Scope:
-- - Store the richer fields returned by the Places proxy.
-- - Keep the Google API key and live API calls in Edge Functions.

alter table public.location_refs
  add column if not exists display_name text,
  add column if not exists rating numeric,
  add column if not exists review_count integer,
  add column if not exists photo_urls text[] not null default '{}',
  add column if not exists website_uri text,
  add column if not exists national_phone_number text,
  add column if not exists international_phone_number text,
  add column if not exists regular_opening_hours text[] not null default '{}',
  add column if not exists price_level text,
  add column if not exists price_range text,
  add column if not exists google_maps_uri text,
  add column if not exists business_status text,
  add column if not exists raw_google_payload jsonb;

create unique index if not exists location_refs_user_google_place_id_unique_idx
  on public.location_refs(user_id, google_place_id)
  where google_place_id is not null;
