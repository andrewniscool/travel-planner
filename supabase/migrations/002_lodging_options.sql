-- Layer 6: lodging options for Hotels / Lodging.
--
-- Scope:
-- - Persist lodging candidates and selected/saved status.
-- - No hotel search APIs, booking APIs, Google Places, or data migration.

create table if not exists public.lodging_options (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  stop_id uuid references public.trip_stops(id) on delete set null,
  location_ref_id uuid references public.location_refs(id) on delete set null,
  name text not null,
  address text,
  neighborhood text,
  check_in date,
  check_out date,
  price_per_night numeric,
  total_cost numeric,
  booking_url text,
  confirmation_code text,
  notes text,
  is_selected boolean not null default false,
  is_saved boolean not null default false,
  source text not null default 'manual',
  source_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, source, source_id)
);

create index if not exists lodging_options_trip_id_idx
  on public.lodging_options(trip_id);

create index if not exists lodging_options_stop_id_idx
  on public.lodging_options(stop_id);

create index if not exists lodging_options_location_ref_id_idx
  on public.lodging_options(location_ref_id);

drop trigger if exists set_lodging_options_updated_at on public.lodging_options;
create trigger set_lodging_options_updated_at
before update on public.lodging_options
for each row execute function public.set_updated_at();

alter table public.lodging_options enable row level security;

drop policy if exists "Users can select lodging for their own trips" on public.lodging_options;
create policy "Users can select lodging for their own trips"
on public.lodging_options
for select
using (
  exists (
    select 1
    from public.trips
    where trips.id = lodging_options.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert lodging for their own trips" on public.lodging_options;
create policy "Users can insert lodging for their own trips"
on public.lodging_options
for insert
with check (
  exists (
    select 1
    from public.trips
    where trips.id = lodging_options.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can update lodging for their own trips" on public.lodging_options;
create policy "Users can update lodging for their own trips"
on public.lodging_options
for update
using (
  exists (
    select 1
    from public.trips
    where trips.id = lodging_options.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips
    where trips.id = lodging_options.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete lodging for their own trips" on public.lodging_options;
create policy "Users can delete lodging for their own trips"
on public.lodging_options
for delete
using (
  exists (
    select 1
    from public.trips
    where trips.id = lodging_options.trip_id
      and trips.user_id = auth.uid()
  )
);
