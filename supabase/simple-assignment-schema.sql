alter table public.sidekick_prep_notifications alter column device_type drop not null;
alter table public.sidekick_prep_notifications alter column priority drop not null;
alter table public.sidekick_prep_notifications add column assignment_request_id uuid;
alter table public.sidekick_prep_notifications add column dashboard_initials text;
create index sidekick_assignment_requests on public.sidekick_prep_notifications(assigned_by,assignment_request_id) where assignment_request_id is not null;
create function sidekick_private.assign_devices(p_count integer,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); ids uuid[]; result jsonb; target public.sidekick_queue%rowtype; notice uuid;
begin
 if not exists(select 1 from public.sidekick_user_profiles where user_id=caller and role='Device Systems Coordinator') then raise exception 'Only Device Systems Coordinators can assign devices.'; end if;
 if p_count is null or p_count not between 1 and 10 or p_request_id is null then raise exception 'Choose between 1 and 10 devices.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(caller::text || p_request_id::text,0));
 select jsonb_agg(jsonb_build_object('notification_id',id,'user_id',user_id,'dashboard_initials',dashboard_initials) order by created_at,id) into result from public.sidekick_prep_notifications where assigned_by=caller and assignment_request_id=p_request_id;
 if result is not null then return result; end if;
 if not sidekick_private.queue_is_open() then raise exception 'Device Prep Queue is closed. Assign between 7 AM and 8 PM Central time.'; end if;
 select array_agg(id order by joined_at,id) into ids from (select id,joined_at from public.sidekick_queue where joined_at>sidekick_private.queue_cutoff() and (reserved_by is null or reserved_until<=clock_timestamp()) order by joined_at,id limit p_count for update skip locked) selected;
 if coalesce(cardinality(ids),0)<p_count then raise exception 'Not enough available users. Choose a smaller count.'; end if;
 result:='[]'::jsonb;
 foreach notice in array ids loop
  delete from public.sidekick_queue where id=notice returning * into target;
  insert into public.sidekick_prep_notifications(user_id,assigned_by,assignment_request_id,dashboard_initials) values(target.user_id,caller,p_request_id,target.dashboard_initials) returning id into notice;
  result:=result||jsonb_build_array(jsonb_build_object('notification_id',notice,'user_id',target.user_id,'dashboard_initials',target.dashboard_initials));
 end loop;
 return result;
end; $$;
revoke all on function sidekick_private.assign_devices(integer,uuid) from public,anon;
grant execute on function sidekick_private.assign_devices(integer,uuid) to authenticated;
create function public.sidekick_assign_devices(p_count integer,p_request_id uuid) returns jsonb language sql security invoker set search_path='' as $$ select sidekick_private.assign_devices(p_count,p_request_id); $$;
revoke all on function public.sidekick_assign_devices(integer,uuid) from public,anon;
grant execute on function public.sidekick_assign_devices(integer,uuid) to authenticated;
