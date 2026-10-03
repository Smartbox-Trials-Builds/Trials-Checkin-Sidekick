drop function public.sidekick_assign_prep(uuid,integer,text,text,text);
drop function sidekick_private.assign_prep(uuid,integer,text,text,text);
alter table public.sidekick_prep_notifications drop column client_name;

create function sidekick_private.assign_prep(p_entry_id uuid, p_row_number integer, p_device_type text, p_priority text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 caller uuid := auth.uid();
 target public.sidekick_queue%rowtype;
 notification_id uuid;
begin
 if not exists(select 1 from public.sidekick_user_profiles where user_id=caller and role='Device Systems Coordinator') then
   raise exception 'Only Device Systems Coordinators can assign preps.';
 end if;
 if p_row_number is null or p_row_number < 1 then raise exception 'Enter a valid row number.'; end if;
 if p_device_type is null or p_device_type not in ('Talkpad','Zuvo','Gridpad','Wego') then
   raise exception 'Select a valid device type.';
 end if;
 if p_priority is null or p_priority not in ('Expedite','Funded rental','Ship request','Daily queue') then
   raise exception 'Select a valid priority.';
 end if;
 delete from public.sidekick_queue where id=p_entry_id returning * into target;
 if not found then raise exception 'This user has already left the queue or been assigned.'; end if;
 insert into public.sidekick_prep_notifications(user_id,assigned_by,row_number,device_type,priority)
   values(target.user_id,caller,p_row_number,p_device_type,p_priority) returning id into notification_id;
 return notification_id;
end;
$$;
revoke all on function sidekick_private.assign_prep(uuid,integer,text,text) from public,anon;
grant execute on function sidekick_private.assign_prep(uuid,integer,text,text) to authenticated;
create function public.sidekick_assign_prep(p_entry_id uuid, p_row_number integer, p_device_type text, p_priority text)
returns uuid language sql security invoker set search_path='' as $$
 select sidekick_private.assign_prep(p_entry_id,p_row_number,p_device_type,p_priority);
$$;
revoke all on function public.sidekick_assign_prep(uuid,integer,text,text) from public,anon;
grant execute on function public.sidekick_assign_prep(uuid,integer,text,text) to authenticated;

-- These policies authorize client-side WebSocket broadcasts. Never call
-- realtime.send() from SQL with a client name: that persists message payloads.
grant select,insert on realtime.messages to authenticated;
create policy "Users receive their own live client names"
on realtime.messages for select to authenticated using (
 extension='broadcast' and (select realtime.topic())='sidekick-clients:'||(select auth.uid())::text
);
create policy "Systems Coordinators send live client names"
on realtime.messages for insert to authenticated with check (
 extension='broadcast'
 and (select realtime.topic()) ~ '^sidekick-clients:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 and exists(select 1 from public.sidekick_user_profiles where user_id=(select auth.uid()) and role='Device Systems Coordinator')
);
