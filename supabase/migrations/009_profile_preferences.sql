-- Layer 9: profile details and notification preferences.
--
-- Scope:
-- - Persist profile fields currently edited on the Profile page.
-- - Keep auth-owned email/password lifecycle in Supabase Auth.

alter table public.profiles
  add column if not exists location text,
  add column if not exists website text,
  add column if not exists bio text,
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb;
