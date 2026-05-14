-- Layer 6: saved places for Explore.
--
-- Scope:
-- - Persist saved places and basic place metadata.
-- - No Google Places API, Google Maps, itinerary migration, or data migration.

create table if not exists public.saved_places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  stop_id uuid references public.trip_stops(id) on delete set null,
  location_ref_id uuid references public.location_refs(id) on delete set null,
  name text not null,
  type text,
  category text,
  address text,
  notes text,
  is_saved boolean not null default true,
  source text not null default 'manual',
  source_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, source, source_id)
);

create index if not exists saved_places_trip_id_idx
  on public.saved_places(trip_id);

create index if not exists saved_places_stop_id_idx
  on public.saved_places(stop_id);

create index if not exists saved_places_location_ref_id_idx
  on public.saved_places(location_ref_id);

drop trigger if exists set_saved_places_updated_at on public.saved_places;
create trigger set_saved_places_updated_at
before update on public.saved_places
for each row execute function public.set_updated_at();

alter table public.saved_places enable row level security;

drop policy if exists "Users can select saved places for their own trips" on public.saved_places;
create policy "Users can select saved places for their own trips"
on public.saved_places
for select
using (
  exists (
    select 1
    from public.trips
    where trips.id = saved_places.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert saved places for their own trips" on public.saved_places;
create policy "Users can insert saved places for their own trips"
on public.saved_places
for insert
with check (
  exists (
    select 1
    from public.trips
    where trips.id = saved_places.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can update saved places for their own trips" on public.saved_places;
create policy "Users can update saved places for their own trips"
on public.saved_places
for update
using (
  exists (
    select 1
    from public.trips
    where trips.id = saved_places.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips
    where trips.id = saved_places.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete saved places for their own trips" on public.saved_places;
create policy "Users can delete saved places for their own trips"
on public.saved_places
for delete
using (
  exists (
    select 1
    from public.trips
    where trips.id = saved_places.trip_id
      and trips.user_id = auth.uid()
  )
);
