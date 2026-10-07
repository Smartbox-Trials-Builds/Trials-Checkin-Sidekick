create table public.sidekick_assignment_log (
 id uuid primary key default gen_random_uuid(), request_id uuid not null, assigned_by uuid not null,
 assigner_name text not null, initials text[] not null, created_at timestamptz not null default clock_timestamp(),
 unique(assigned_by,request_id)
);
create index sidekick_assignment_log_time on public.sidekick_assignment_log(created_at);
alter table public.sidekick_assignment_log enable row level security;
revoke all on public.sidekick_assignment_log from anon,authenticated;
grant select on public.sidekick_assignment_log to authenticated;
create policy "Systems users see current assignment log" on public.sidekick_assignment_log for select to authenticated using (
 created_at>sidekick_private.queue_cutoff() and exists(select 1 from public.sidekick_user_profiles where user_id=(select auth.uid()) and role='Device Systems Coordinator')
);
create function sidekick_private.log_assignment() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.assignment_request_id is not null then
 insert into public.sidekick_assignment_log(request_id,assigned_by,assigner_name,initials,created_at)
 select new.assignment_request_id,new.assigned_by,name,array[new.dashboard_initials],new.created_at from public.sidekick_user_profiles where user_id=new.assigned_by
 on conflict(assigned_by,request_id) do update set initials=public.sidekick_assignment_log.initials||excluded.initials;
 end if;
 return new;
end; $$;
revoke all on function sidekick_private.log_assignment() from public,anon,authenticated;
create trigger sidekick_assignment_log_insert after insert on public.sidekick_prep_notifications for each row execute function sidekick_private.log_assignment();
insert into public.sidekick_assignment_log(request_id,assigned_by,assigner_name,initials,created_at)
select n.assignment_request_id,n.assigned_by,p.name,array_agg(n.dashboard_initials order by n.created_at,n.id),min(n.created_at)
from public.sidekick_prep_notifications n join public.sidekick_user_profiles p on p.user_id=n.assigned_by
where n.assignment_request_id is not null and n.created_at>sidekick_private.queue_cutoff()
group by n.assignment_request_id,n.assigned_by,p.name;
create function sidekick_private.clear_assignment_log() returns void language sql security definer set search_path='' as $$ delete from public.sidekick_assignment_log where created_at<=sidekick_private.queue_cutoff(); $$;
revoke all on function sidekick_private.clear_assignment_log() from public,anon,authenticated;
select cron.schedule('sidekick-assignment-log-nightly-clear','* * * * *','select sidekick_private.clear_assignment_log()');
