create schema if not exists sidekick_private;
revoke all on schema sidekick_private from public;
grant usage on schema sidekick_private to authenticated;
create table public.sidekick_queue (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references public.sidekick_user_profiles(user_id) on delete cascade,
 name text not null,
 dashboard_initials text not null,
 joined_at timestamptz not null default clock_timestamp()
);
create index sidekick_queue_order on public.sidekick_queue(joined_at, id);
create table public.sidekick_prep_notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.sidekick_user_profiles(user_id) on delete cascade,
 assigned_by uuid references auth.users(id) on delete set null,
 row_number integer not null check(row_number > 0),
 created_at timestamptz not null default clock_timestamp(),
 dismissed_at timestamptz
);
create index sidekick_notifications_pending on public.sidekick_prep_notifications(user_id, created_at) where dismissed_at is null;
alter table public.sidekick_queue enable row level security;
alter table public.sidekick_prep_notifications enable row level security;
revoke all on public.sidekick_queue, public.sidekick_prep_notifications from anon, authenticated;
grant select on public.sidekick_queue, public.sidekick_prep_notifications to authenticated;
create policy "Onboarded users see the queue" on public.sidekick_queue for select to authenticated
 using (exists (select 1 from public.sidekick_user_profiles where user_id=(select auth.uid())));
create policy "Users see their prep notifications" on public.sidekick_prep_notifications for select to authenticated
 using (user_id=(select auth.uid()));
create function sidekick_private.queue_action(p_action text, p_entry_id uuid, p_row_number integer, p_notification_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
 caller uuid := auth.uid();
 profile public.sidekick_user_profiles%rowtype;
 target public.sidekick_queue%rowtype;
begin
 select * into profile from public.sidekick_user_profiles where user_id=caller;
 if not found then raise exception 'Complete your Sidekick profile first.'; end if;
 if p_action='join' then
   insert into public.sidekick_queue(user_id,name,dashboard_initials)
   values(caller,profile.name,profile.dashboard_initials)
   on conflict(user_id) do nothing;
 elsif p_action='leave' then
   delete from public.sidekick_queue where user_id=caller;
 elsif p_action='assign' then
   if profile.role <> 'Device Systems Coordinator' then
     raise exception 'Only Device Systems Coordinators can assign preps.';
   end if;
   if p_row_number is null or p_row_number < 1 then raise exception 'Enter a valid row number.'; end if;
   delete from public.sidekick_queue where id=p_entry_id returning * into target;
   if not found then raise exception 'This user has already left the queue or been assigned.'; end if;
   insert into public.sidekick_prep_notifications(user_id,assigned_by,row_number)
     values(target.user_id,caller,p_row_number);
 elsif p_action='dismiss' then
   update public.sidekick_prep_notifications set dismissed_at=clock_timestamp()
     where id=p_notification_id and user_id=caller and dismissed_at is null;
 else raise exception 'Unknown queue action.';
 end if;
end;
$$;
revoke all on function sidekick_private.queue_action(text,uuid,integer,uuid) from public,anon;
grant execute on function sidekick_private.queue_action(text,uuid,integer,uuid) to authenticated;
create function public.sidekick_queue_action(p_action text, p_entry_id uuid default null, p_row_number integer default null, p_notification_id uuid default null)
returns void language sql security invoker set search_path='' as $$
 select sidekick_private.queue_action(p_action,p_entry_id,p_row_number,p_notification_id);
$$;
revoke all on function public.sidekick_queue_action(text,uuid,integer,uuid) from public,anon;
grant execute on function public.sidekick_queue_action(text,uuid,integer,uuid) to authenticated;
alter publication supabase_realtime add table public.sidekick_queue, public.sidekick_prep_notifications;
