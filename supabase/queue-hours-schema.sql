create extension if not exists pg_cron;

create function sidekick_private.queue_is_open(p_at timestamptz default clock_timestamp())
returns boolean language sql stable set search_path='' as $$
 select (p_at at time zone 'America/Chicago')::time >= time '07:00'
    and (p_at at time zone 'America/Chicago')::time < time '20:00';
$$;
revoke all on function sidekick_private.queue_is_open(timestamptz) from public,anon;
grant execute on function sidekick_private.queue_is_open(timestamptz) to authenticated;

create function sidekick_private.queue_cutoff(p_at timestamptz default clock_timestamp())
returns timestamptz language sql stable set search_path='' as $$
 select (((p_at at time zone 'America/Chicago')::date
   - case when (p_at at time zone 'America/Chicago')::time < time '20:00' then 1 else 0 end)
   + time '20:00') at time zone 'America/Chicago';
$$;
revoke all on function sidekick_private.queue_cutoff(timestamptz) from public,anon;
grant execute on function sidekick_private.queue_cutoff(timestamptz) to authenticated;

create function sidekick_private.enforce_queue_hours()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not sidekick_private.queue_is_open() then
   raise exception 'Device Prep Queue is closed. Join between 7 AM and 8 PM Central time.';
 end if;
 return new;
end;
$$;
revoke all on function sidekick_private.enforce_queue_hours() from public,anon,authenticated;
create trigger sidekick_queue_hours before insert on public.sidekick_queue
for each row execute function sidekick_private.enforce_queue_hours();

create function sidekick_private.clear_closed_queue()
returns void language sql security definer set search_path='' as $$
 delete from public.sidekick_queue where joined_at <= sidekick_private.queue_cutoff();
$$;
revoke all on function sidekick_private.clear_closed_queue() from public,anon,authenticated;
select cron.schedule('sidekick-prep-queue-nightly-clear','* * * * *','select sidekick_private.clear_closed_queue()');
select sidekick_private.clear_closed_queue();

alter policy "Onboarded users see the queue" on public.sidekick_queue
using (sidekick_private.queue_is_open()
 and joined_at > sidekick_private.queue_cutoff()
 and exists(select 1 from public.sidekick_user_profiles where user_id=(select auth.uid())));

create function public.sidekick_queue_hours()
returns jsonb language sql security invoker set search_path='' as $$
 select jsonb_build_object('is_open',sidekick_private.queue_is_open(),
   'timezone','America/Chicago');
$$;
revoke all on function public.sidekick_queue_hours() from public,anon;
grant execute on function public.sidekick_queue_hours() to authenticated;

create or replace function sidekick_private.assign_prep(p_entry_id uuid, p_row_number integer, p_device_type text, p_priority text, p_crm_id text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 caller uuid := auth.uid();
 target public.sidekick_queue%rowtype;
 notification_id uuid;
begin
 if not sidekick_private.queue_is_open() then raise exception 'Device Prep Queue is closed. Assign between 7 AM and 8 PM Central time.'; end if;
 if not exists(select 1 from public.sidekick_user_profiles where user_id=caller and role='Device Systems Coordinator') then
   raise exception 'Only Device Systems Coordinators can assign preps.';
 end if;
 if p_row_number is not null and p_row_number < 1 then raise exception 'Enter a valid row number.'; end if;
 if p_device_type is null or p_device_type not in ('Talkpad','Zuvo','Gridpad','Wego') then
   raise exception 'Select a valid device type.';
 end if;
 if p_priority is null or p_priority not in ('Expedite','Funded rental','Ship request','Daily queue') then
   raise exception 'Select a valid priority.';
 end if;
 if p_crm_id is null or length(btrim(p_crm_id)) not between 1 and 100 then raise exception 'Enter a CRM ID (up to 100 characters).'; end if;
 delete from public.sidekick_queue where id=p_entry_id and joined_at > sidekick_private.queue_cutoff() returning * into target;
 if not found then raise exception 'This user has already left the queue or been assigned.'; end if;
 insert into public.sidekick_prep_notifications(user_id,assigned_by,row_number,device_type,priority,crm_id)
   values(target.user_id,caller,p_row_number,p_device_type,p_priority,btrim(p_crm_id)) returning id into notification_id;
 return notification_id;
end;
$$;

-- Scheduler management is administrator-only.
revoke all on schema cron from public,anon,authenticated;
revoke all on all tables in schema cron from public,anon,authenticated;
revoke all on all functions in schema cron from public,anon,authenticated;
