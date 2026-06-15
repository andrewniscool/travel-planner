-- Layer 12: server-managed Google Places rate limits.
--
-- The table is intentionally inaccessible to browser roles. Only the Places
-- Edge Function's service-role client may consume the RPC below.

create table if not exists public.google_places_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, window_start),
  constraint google_places_rate_limits_request_count_check
    check (request_count >= 0)
);

alter table public.google_places_rate_limits enable row level security;

revoke all on table public.google_places_rate_limits
  from anon, authenticated;

create or replace function public.consume_google_places_rate_limit(
  p_user_id uuid,
  p_cost integer,
  p_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_window timestamptz := date_trunc('minute', now());
  next_count integer;
begin
  if p_user_id is null or p_cost < 1 or p_limit < 1 then
    return false;
  end if;

  delete from public.google_places_rate_limits
  where user_id = p_user_id
    and window_start < current_window - interval '5 minutes';

  insert into public.google_places_rate_limits (
    user_id,
    window_start,
    request_count,
    updated_at
  )
  values (
    p_user_id,
    current_window,
    p_cost,
    now()
  )
  on conflict (user_id, window_start)
  do update
    set request_count =
          public.google_places_rate_limits.request_count + excluded.request_count,
        updated_at = now()
  returning request_count into next_count;

  if next_count > p_limit then
    update public.google_places_rate_limits
    set request_count = request_count - p_cost,
        updated_at = now()
    where user_id = p_user_id
      and window_start = current_window;

    return false;
  end if;

  return true;
end;
$$;

revoke all on function public.consume_google_places_rate_limit(uuid, integer, integer)
  from public, anon, authenticated;

grant execute on function public.consume_google_places_rate_limit(uuid, integer, integer)
  to service_role;
