-- Shared daily total; stores no client, device, CRM, or email content.
create table sidekick_private.checkin_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  completion_id uuid not null,
  completed_at timestamptz not null,
  primary key (user_id, completion_id)
);
create index checkin_completions_time on sidekick_private.checkin_completions(completed_at);
alter table sidekick_private.checkin_completions enable row level security;
revoke all on sidekick_private.checkin_completions from public, anon, authenticated;
create policy "No direct access to checkin completions"
  on sidekick_private.checkin_completions for all to public using (false) with check (false);

create function sidekick_private.record_checkin(p_completion_id uuid, p_completed_at timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if not exists (select 1 from public.sidekick_user_profiles where user_id = auth.uid() and role = 'Device Coordinator') then
    return;
  end if;
  if p_completion_id is null or p_completed_at is null or p_completed_at > clock_timestamp() + interval '5 minutes' then
    raise exception 'Invalid check-in completion';
  end if;
  insert into sidekick_private.checkin_completions(user_id, completion_id, completed_at)
  values(auth.uid(), p_completion_id, p_completed_at)
  on conflict (user_id, completion_id) do nothing;
end;
$$;
revoke all on function sidekick_private.record_checkin(uuid,timestamptz) from public, anon, authenticated;
grant execute on function sidekick_private.record_checkin(uuid,timestamptz) to authenticated;
create function public.sidekick_record_checkin(p_completion_id uuid, p_completed_at timestamptz)
returns void language sql security invoker set search_path = '' as $$
  select sidekick_private.record_checkin(p_completion_id, p_completed_at);
$$;
revoke all on function public.sidekick_record_checkin(uuid,timestamptz) from public, anon;
grant execute on function public.sidekick_record_checkin(uuid,timestamptz) to authenticated;

create function sidekick_private.daily_checkin_total()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  today date := (clock_timestamp() at time zone 'America/Chicago')::date;
  total bigint;
begin
  if auth.uid() is null or not exists (
    select 1 from public.sidekick_user_profiles p
    join sidekick_private.device_systems_authorizations a using (user_id)
    where p.user_id = auth.uid() and p.role = 'Device Systems Coordinator'
  ) then raise exception 'Device Systems access required'; end if;
  select count(*) into total from sidekick_private.checkin_completions
  where completed_at >= (today::timestamp at time zone 'America/Chicago')
    and completed_at < ((today + 1)::timestamp at time zone 'America/Chicago');
  return jsonb_build_object('date', today, 'total', total);
end;
$$;
revoke all on function sidekick_private.daily_checkin_total() from public, anon, authenticated;
grant execute on function sidekick_private.daily_checkin_total() to authenticated;
create function public.sidekick_daily_checkin_total()
returns jsonb language sql security invoker set search_path = '' as $$
  select sidekick_private.daily_checkin_total();
$$;
revoke all on function public.sidekick_daily_checkin_total() from public, anon;
grant execute on function public.sidekick_daily_checkin_total() to authenticated;
