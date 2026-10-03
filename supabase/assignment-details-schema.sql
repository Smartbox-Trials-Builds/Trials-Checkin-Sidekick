alter table public.sidekick_prep_notifications
 add column client_name text check(client_name is null or char_length(btrim(client_name)) between 1 and 200),
 add column device_type text check(device_type in ('Talkpad','Zuvo','Gridpad','Wego')),
 add column priority text check(priority in ('Expedite','Funded rental','Ship request','Daily queue'));

create or replace function sidekick_private.queue_action(p_action text, p_entry_id uuid, p_row_number integer, p_notification_id uuid)
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
   raise exception 'Update Sidekick to enter client, device type, and priority when assigning a prep.';
 elsif p_action='dismiss' then
   update public.sidekick_prep_notifications set dismissed_at=clock_timestamp()
     where id=p_notification_id and user_id=caller and dismissed_at is null;
 else raise exception 'Unknown queue action.';
 end if;
end;
$$;

create function sidekick_private.assign_prep(p_entry_id uuid, p_row_number integer, p_client_name text, p_device_type text, p_priority text)
returns void language plpgsql security definer set search_path='' as $$
declare
 caller uuid := auth.uid();
 target public.sidekick_queue%rowtype;
begin
 if not exists(select 1 from public.sidekick_user_profiles where user_id=caller and role='Device Systems Coordinator') then
   raise exception 'Only Device Systems Coordinators can assign preps.';
 end if;
 if p_row_number is null or p_row_number < 1 then raise exception 'Enter a valid row number.'; end if;
 if p_client_name is null or char_length(btrim(p_client_name)) not between 1 and 200 then
   raise exception 'Enter a client name (up to 200 characters).';
 end if;
 if p_device_type is null or p_device_type not in ('Talkpad','Zuvo','Gridpad','Wego') then
   raise exception 'Select a valid device type.';
 end if;
 if p_priority is null or p_priority not in ('Expedite','Funded rental','Ship request','Daily queue') then
   raise exception 'Select a valid priority.';
 end if;
 delete from public.sidekick_queue where id=p_entry_id returning * into target;
 if not found then raise exception 'This user has already left the queue or been assigned.'; end if;
 insert into public.sidekick_prep_notifications(user_id,assigned_by,row_number,client_name,device_type,priority)
   values(target.user_id,caller,p_row_number,btrim(p_client_name),p_device_type,p_priority);
end;
$$;
revoke all on function sidekick_private.assign_prep(uuid,integer,text,text,text) from public,anon;
grant execute on function sidekick_private.assign_prep(uuid,integer,text,text,text) to authenticated;
create function public.sidekick_assign_prep(p_entry_id uuid, p_row_number integer, p_client_name text, p_device_type text, p_priority text)
returns void language sql security invoker set search_path='' as $$
 select sidekick_private.assign_prep(p_entry_id,p_row_number,p_client_name,p_device_type,p_priority);
$$;
revoke all on function public.sidekick_assign_prep(uuid,integer,text,text,text) from public,anon;
grant execute on function public.sidekick_assign_prep(uuid,integer,text,text,text) to authenticated;
