-- Schema deployed by the create_sidekick_user_profiles Supabase migration.
-- Roles below are profile labels, not authorization roles.
create table public.sidekick_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  dashboard_initials text not null check (char_length(btrim(dashboard_initials)) between 1 and 20),
  role text not null check (role in ('Device Coordinator', 'Device Systems Coordinator')),
  created_at timestamptz not null default now()
);
alter table public.sidekick_user_profiles enable row level security;
revoke all on public.sidekick_user_profiles from anon, authenticated;
grant select, insert, update on public.sidekick_user_profiles to authenticated;
create policy "Users read their own profile"
  on public.sidekick_user_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert their own profile"
  on public.sidekick_user_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update their own profile"
  on public.sidekick_user_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
