-- Layer 6: budget expenses.
--
-- Scope:
-- - Persist user-added budget expense rows.
-- - Existing mock budget category allocations remain frontend fallback data.

create table if not exists public.budget_expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  stop_id uuid references public.trip_stops(id) on delete set null,
  category text not null,
  title text not null,
  amount numeric not null,
  expense_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists budget_expenses_trip_id_idx
  on public.budget_expenses(trip_id);

create index if not exists budget_expenses_stop_id_idx
  on public.budget_expenses(stop_id);

create index if not exists budget_expenses_trip_date_idx
  on public.budget_expenses(trip_id, expense_date);

drop trigger if exists set_budget_expenses_updated_at on public.budget_expenses;
create trigger set_budget_expenses_updated_at
before update on public.budget_expenses
for each row execute function public.set_updated_at();

alter table public.budget_expenses enable row level security;

drop policy if exists "Users can select budget expenses for their own trips" on public.budget_expenses;
create policy "Users can select budget expenses for their own trips"
on public.budget_expenses
for select
using (
  exists (
    select 1
    from public.trips
    where trips.id = budget_expenses.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert budget expenses for their own trips" on public.budget_expenses;
create policy "Users can insert budget expenses for their own trips"
on public.budget_expenses
for insert
with check (
  exists (
    select 1
    from public.trips
    where trips.id = budget_expenses.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can update budget expenses for their own trips" on public.budget_expenses;
create policy "Users can update budget expenses for their own trips"
on public.budget_expenses
for update
using (
  exists (
    select 1
    from public.trips
    where trips.id = budget_expenses.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips
    where trips.id = budget_expenses.trip_id
      and trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete budget expenses for their own trips" on public.budget_expenses;
create policy "Users can delete budget expenses for their own trips"
on public.budget_expenses
for delete
using (
  exists (
    select 1
    from public.trips
    where trips.id = budget_expenses.trip_id
      and trips.user_id = auth.uid()
  )
);
