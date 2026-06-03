-- Layer 8: budget categories and allocations.
--
-- Scope:
-- - Persist per-trip and per-stop budget category allocations.
-- - Expenses remain in public.budget_expenses.

create table if not exists public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  stop_id uuid references public.trip_stops(id) on delete cascade,
  stop_key uuid generated always as (
    coalesce(stop_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) stored,
  name text not null,
  allocated numeric not null default 0,
  icon text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_categories_allocated_check check (allocated >= 0)
);

create unique index if not exists budget_categories_trip_stop_name_idx
  on public.budget_categories(trip_id, stop_key, name);

create index if not exists budget_categories_trip_id_idx
  on public.budget_categories(trip_id);

create index if not exists budget_categories_stop_id_idx
  on public.budget_categories(stop_id);

create index if not exists budget_categories_trip_order_idx
  on public.budget_categories(trip_id, order_index);

drop trigger if exists set_budget_categories_updated_at on public.budget_categories;
create trigger set_budget_categories_updated_at
before update on public.budget_categories
for each row execute function public.set_updated_at();

alter table public.budget_categories enable row level security;

drop policy if exists "Users can select budget categories for their own trips" on public.budget_categories;
create policy "Users can select budget categories for their own trips"
on public.budget_categories
for select
using (
  exists (
    select 1
    from public.trips
    where trips.id = budget_categories.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert budget categories for their own trips" on public.budget_categories;
create policy "Users can insert budget categories for their own trips"
on public.budget_categories
for insert
with check (
  exists (
    select 1
    from public.trips
    where trips.id = budget_categories.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can update budget categories for their own trips" on public.budget_categories;
create policy "Users can update budget categories for their own trips"
on public.budget_categories
for update
using (
  exists (
    select 1
    from public.trips
    where trips.id = budget_categories.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips
    where trips.id = budget_categories.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete budget categories for their own trips" on public.budget_categories;
create policy "Users can delete budget categories for their own trips"
on public.budget_categories
for delete
using (
  exists (
    select 1
    from public.trips
    where trips.id = budget_categories.trip_id
      and trips.user_id = auth.uid()
  )
);
