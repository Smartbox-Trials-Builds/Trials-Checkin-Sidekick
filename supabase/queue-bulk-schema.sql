alter table public.sidekick_queue
 add column reserved_by uuid references auth.users(id) on delete set null,
 add column reserved_until timestamptz,
 add column claim_id uuid;
alter table public.sidekick_prep_notifications add column queue_claim_id uuid unique;

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
 delete from public.sidekick_queue where id=p_entry_id and joined_at > sidekick_private.queue_cutoff() and (reserved_by is null or reserved_until <= clock_timestamp() or reserved_by=caller) returning * into target;
 if not found then raise exception 'This user has already left the queue or been assigned.'; end if;
 insert into public.sidekick_prep_notifications(user_id,assigned_by,row_number,device_type,priority,crm_id,queue_claim_id)
   values(target.user_id,caller,p_row_number,p_device_type,p_priority,btrim(p_crm_id),target.claim_id) returning id into notification_id;
 return notification_id;
end;
$$;


create function sidekick_private.claim_queue(p_count integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare caller uuid := auth.uid(); result jsonb;
begin
 if not exists(select 1 from public.sidekick_user_profiles where user_id=caller and role='Device Systems Coordinator') then raise exception 'Only Device Systems Coordinators can reserve queue users.'; end if;
 if not sidekick_private.queue_is_open() then raise exception 'Device Prep Queue is closed.'; end if;
 if p_count is null or p_count not between 1 and 100 then raise exception 'Reserve between 1 and 100 users at a time.'; end if;
 with candidates as (
   select id from public.sidekick_queue
   where joined_at > sidekick_private.queue_cutoff() and (reserved_by is null or reserved_until <= clock_timestamp())
   order by joined_at,id limit p_count for update skip locked
 ), claimed as (
   update public.sidekick_queue q set reserved_by=caller,reserved_until=clock_timestamp()+interval '15 minutes',claim_id=gen_random_uuid()
   from candidates c where q.id=c.id
   returning q.id,q.user_id,q.name,q.dashboard_initials,q.joined_at,q.reserved_until,q.claim_id
 ) select coalesce(jsonb_agg(to_jsonb(claimed) order by joined_at,id),'[]'::jsonb) into result from claimed;
 return result;
end;
$$;

create function sidekick_private.release_queue(p_claims uuid[])
returns void language sql security definer set search_path='' as $$
 update public.sidekick_queue set reserved_by=null,reserved_until=null,claim_id=null
 where reserved_by=auth.uid() and claim_id=any(p_claims);
$$;

create function sidekick_private.bulk_assign(p_items jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare caller uuid := auth.uid(); item jsonb; target public.sidekick_queue%rowtype;
 notice public.sidekick_prep_notifications%rowtype; result jsonb := '[]'::jsonb; token uuid; new_notice_id uuid;
begin
 if not exists(select 1 from public.sidekick_user_profiles where user_id=caller and role='Device Systems Coordinator') then raise exception 'Only Device Systems Coordinators can assign preps.'; end if;
 if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Send between 1 and 100 assignments.'; end if;
 if exists(select 1 from jsonb_array_elements(p_items) e group by e->>'claim_id' having count(*)>1) then raise exception 'Each queue reservation must occur only once.'; end if;
 -- Lock in a consistent order. A retry returns the same notification instead of sending twice.
 for item in select value from jsonb_array_elements(p_items) order by value->>'claim_id' loop
   token := (item->>'claim_id')::uuid;
   if token is null then raise exception 'Missing queue reservation.'; end if;
   perform pg_advisory_xact_lock(hashtextextended(token::text,0));
   select * into notice from public.sidekick_prep_notifications where queue_claim_id=token;
   if found then
     if notice.assigned_by is distinct from caller then raise exception 'This reservation belongs to another coordinator.'; end if;
   else
     select * into target from public.sidekick_queue where claim_id=token and reserved_by=caller for update;
     if not found or target.reserved_until <= clock_timestamp() then raise exception 'A queue reservation expired or its user left. Release reservations and bulk add again.'; end if;
     new_notice_id := sidekick_private.assign_prep(target.id,null,item->>'device_type',item->>'priority',item->>'crm_id');
     select * into notice from public.sidekick_prep_notifications where id=new_notice_id;
   end if;
   result := result || jsonb_build_array(jsonb_build_object('claim_id',token,'notification_id',notice.id,'user_id',notice.user_id));
 end loop;
 return result;
end;
$$;

revoke all on function sidekick_private.claim_queue(integer),sidekick_private.release_queue(uuid[]),sidekick_private.bulk_assign(jsonb) from public,anon;
grant execute on function sidekick_private.claim_queue(integer),sidekick_private.release_queue(uuid[]),sidekick_private.bulk_assign(jsonb) to authenticated;
create function public.sidekick_claim_queue(p_count integer) returns jsonb language sql security invoker set search_path='' as $$ select sidekick_private.claim_queue(p_count); $$;
create function public.sidekick_release_queue(p_claims uuid[]) returns void language sql security invoker set search_path='' as $$ select sidekick_private.release_queue(p_claims); $$;
create function public.sidekick_bulk_assign(p_items jsonb) returns jsonb language sql security invoker set search_path='' as $$ select sidekick_private.bulk_assign(p_items); $$;
revoke all on function public.sidekick_claim_queue(integer),public.sidekick_release_queue(uuid[]),public.sidekick_bulk_assign(jsonb) from public,anon;
grant execute on function public.sidekick_claim_queue(integer),public.sidekick_release_queue(uuid[]),public.sidekick_bulk_assign(jsonb) to authenticated;
