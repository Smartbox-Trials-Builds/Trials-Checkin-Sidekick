create table public.sidekick_desktop_links(helper_id uuid primary key references auth.users(id) on delete cascade,owner_id uuid references auth.users(id) on delete set null,pair_hash text not null unique check(length(pair_hash)=64),heartbeat timestamptz not null default clock_timestamp());
create table public.sidekick_zip_jobs(id uuid primary key,owner_id uuid not null references auth.users(id) on delete cascade,helper_id uuid not null references public.sidekick_desktop_links(helper_id) on delete cascade,payload jsonb not null,status text not null default 'pending' check(status in ('pending','running','done','failed','expired')),result jsonb,created_at timestamptz not null default clock_timestamp(),expires_at timestamptz not null default clock_timestamp()+interval '2 minutes');
create index sidekick_zip_jobs_helper on public.sidekick_zip_jobs(helper_id,status,created_at);
alter table public.sidekick_desktop_links enable row level security;
alter table public.sidekick_zip_jobs enable row level security;
revoke all on public.sidekick_desktop_links,public.sidekick_zip_jobs from anon,authenticated;
grant select on public.sidekick_desktop_links,public.sidekick_zip_jobs to authenticated;
create policy "Paired users see their helper" on public.sidekick_desktop_links for select to authenticated using(helper_id=(select auth.uid()) or owner_id=(select auth.uid()));
create policy "Participants see encrypted zip jobs" on public.sidekick_zip_jobs for select to authenticated using(owner_id=(select auth.uid()) or helper_id=(select auth.uid()));
create function sidekick_private.register_desktop(p_hash text) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid pairing registration'; end if;
 insert into public.sidekick_desktop_links(helper_id,pair_hash) values(auth.uid(),p_hash) on conflict(helper_id) do update set heartbeat=clock_timestamp();
 return jsonb_build_object('helper_id',auth.uid()); end; $$;
revoke all on function sidekick_private.register_desktop(text) from public,anon;
grant execute on function sidekick_private.register_desktop(text) to authenticated;
create function public.sidekick_register_desktop(p_hash text) returns jsonb language sql security invoker set search_path='' as $$ select sidekick_private.register_desktop(p_hash); $$;
revoke all on function public.sidekick_register_desktop(text) from public,anon;
grant execute on function public.sidekick_register_desktop(text) to authenticated;
create function sidekick_private.pair_desktop(p_hash text) returns jsonb language plpgsql security definer set search_path='' as $$ declare target uuid; begin
 if not exists(select 1 from public.sidekick_user_profiles where user_id=auth.uid()) then raise exception 'Save your Sidekick profile first'; end if;
 update public.sidekick_desktop_links set owner_id=auth.uid() where pair_hash=p_hash and (owner_id is null or owner_id=auth.uid()) and heartbeat>clock_timestamp()-interval '30 seconds' returning helper_id into target;
 if target is null then raise exception 'Pairing code unavailable. Keep the helper open and check the code'; end if;
 return jsonb_build_object('helper_id',target); end; $$;
revoke all on function sidekick_private.pair_desktop(text) from public,anon;
grant execute on function sidekick_private.pair_desktop(text) to authenticated;
create function public.sidekick_pair_desktop(p_hash text) returns jsonb language sql security invoker set search_path='' as $$ select sidekick_private.pair_desktop(p_hash); $$;
revoke all on function public.sidekick_pair_desktop(text) from public,anon;
grant execute on function public.sidekick_pair_desktop(text) to authenticated;
create function sidekick_private.desktop_poll() returns jsonb language plpgsql security definer set search_path='' as $$ declare job public.sidekick_zip_jobs%rowtype; begin
 update public.sidekick_desktop_links set heartbeat=clock_timestamp() where helper_id=auth.uid();
 update public.sidekick_zip_jobs set status='expired' where helper_id=auth.uid() and status='pending' and expires_at<=clock_timestamp();
 select * into job from public.sidekick_zip_jobs where helper_id=auth.uid() and status='pending' and expires_at>clock_timestamp() order by created_at limit 1 for update skip locked;
 if found then update public.sidekick_zip_jobs set status='running' where id=job.id; return jsonb_build_object('id',job.id,'payload',job.payload); end if;
 return null; end; $$;
revoke all on function sidekick_private.desktop_poll() from public,anon;
grant execute on function sidekick_private.desktop_poll() to authenticated;
create function public.sidekick_desktop_poll() returns jsonb language sql security invoker set search_path='' as $$ select sidekick_private.desktop_poll(); $$;
revoke all on function public.sidekick_desktop_poll() from public,anon;
grant execute on function public.sidekick_desktop_poll() to authenticated;
create function sidekick_private.request_zip(p_helper uuid,p_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$ declare job public.sidekick_zip_jobs%rowtype; begin
 if not exists(select 1 from public.sidekick_desktop_links where helper_id=p_helper and owner_id=auth.uid() and heartbeat>clock_timestamp()-interval '30 seconds') then raise exception 'Desktop helper is offline or not paired'; end if;
 if p_id is null or jsonb_typeof(p_payload)<>'object' or length(p_payload::text)>12000 or not(p_payload ? 'iv' and p_payload ? 'data') then raise exception 'Invalid encrypted request'; end if;
 select * into job from public.sidekick_zip_jobs where id=p_id;
 if found then if job.owner_id<>auth.uid() or job.helper_id<>p_helper then raise exception 'Invalid request owner'; end if; return jsonb_build_object('id',job.id,'status',job.status); end if;
 if exists(select 1 from public.sidekick_zip_jobs where helper_id=p_helper and status in ('pending','running')) then raise exception 'The helper has an unfinished request. Check its status before continuing'; end if;
 insert into public.sidekick_zip_jobs(id,owner_id,helper_id,payload) values(p_id,auth.uid(),p_helper,p_payload);
 return jsonb_build_object('id',p_id,'status','pending'); end; $$;
revoke all on function sidekick_private.request_zip(uuid,uuid,jsonb) from public,anon;
grant execute on function sidekick_private.request_zip(uuid,uuid,jsonb) to authenticated;
create function public.sidekick_request_zip(p_helper uuid,p_id uuid,p_payload jsonb) returns jsonb language sql security invoker set search_path='' as $$ select sidekick_private.request_zip(p_helper,p_id,p_payload); $$;
revoke all on function public.sidekick_request_zip(uuid,uuid,jsonb) from public,anon;
grant execute on function public.sidekick_request_zip(uuid,uuid,jsonb) to authenticated;
create function sidekick_private.finish_zip(p_id uuid,p_ok boolean,p_result jsonb) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if length(p_result::text)>12000 or jsonb_typeof(p_result)<>'object' then raise exception 'Invalid encrypted result'; end if;
 update public.sidekick_zip_jobs set status=case when p_ok then 'done' else 'failed' end,result=p_result where id=p_id and helper_id=auth.uid() and status='running';
 return jsonb_build_object('ok',found); end; $$;
revoke all on function sidekick_private.finish_zip(uuid,boolean,jsonb) from public,anon;
grant execute on function sidekick_private.finish_zip(uuid,boolean,jsonb) to authenticated;
create function public.sidekick_finish_zip(p_id uuid,p_ok boolean,p_result jsonb) returns jsonb language sql security invoker set search_path='' as $$ select sidekick_private.finish_zip(p_id,p_ok,p_result); $$;
revoke all on function public.sidekick_finish_zip(uuid,boolean,jsonb) from public,anon;
grant execute on function public.sidekick_finish_zip(uuid,boolean,jsonb) to authenticated;

create unique index sidekick_zip_one_active on public.sidekick_zip_jobs(helper_id) where status in ('pending','running');
