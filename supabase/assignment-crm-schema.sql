alter table public.sidekick_prep_notifications alter column row_number drop not null;
alter table public.sidekick_prep_notifications add column crm_id text check (crm_id is null or length(btrim(crm_id)) between 1 and 100);
drop function public.sidekick_assign_prep(uuid,integer,text,text);
drop function sidekick_private.assign_prep(uuid,integer,text,text);

create function sidekick_private.assign_prep(p_entry_id uuid, p_row_number integer, p_device_type text, p_priority text, p_crm_id text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 caller uuid := auth.uid();
 target public.sidekick_queue%rowtype;
 notification_id uuid;
begin
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
 delete from public.sidekick_queue where id=p_entry_id returning * into target;
 if not found then raise exception 'This user has already left the queue or been assigned.'; end if;
 insert into public.sidekick_prep_notifications(user_id,assigned_by,row_number,device_type,priority,crm_id)
   values(target.user_id,caller,p_row_number,p_device_type,p_priority,btrim(p_crm_id)) returning id into notification_id;
 return notification_id;
end;
$$;
revoke all on function sidekick_private.assign_prep(uuid,integer,text,text,text) from public,anon;
grant execute on function sidekick_private.assign_prep(uuid,integer,text,text,text) to authenticated;
create function public.sidekick_assign_prep(p_entry_id uuid, p_row_number integer, p_device_type text, p_priority text, p_crm_id text)
returns uuid language sql security invoker set search_path='' as $$
 select sidekick_private.assign_prep(p_entry_id,p_row_number,p_device_type,p_priority,p_crm_id);
$$;
revoke all on function public.sidekick_assign_prep(uuid,integer,text,text,text) from public,anon;
grant execute on function public.sidekick_assign_prep(uuid,integer,text,text,text) to authenticated;

