alter table public.sidekick_zip_jobs add column progress integer not null default 0 check(progress between 0 and 100);
alter table public.sidekick_zip_jobs add column phase text not null default 'waiting' check(phase in ('waiting','zipping','verifying','saving','cleanup','done'));
create function sidekick_private.zip_progress(p_id uuid,p_percent integer,p_phase text) returns void language plpgsql security definer set search_path='' as $$ begin
 if p_percent is null or p_percent not between 0 and 99 or p_phase not in ('zipping','verifying','saving','cleanup') then raise exception 'Invalid progress'; end if;
 update public.sidekick_desktop_links set heartbeat=clock_timestamp() where helper_id=auth.uid();
 update public.sidekick_zip_jobs set progress=greatest(progress,p_percent),phase=p_phase where id=p_id and helper_id=auth.uid() and status='running';
end; $$;
revoke all on function sidekick_private.zip_progress(uuid,integer,text) from public,anon;
grant execute on function sidekick_private.zip_progress(uuid,integer,text) to authenticated;
create function public.sidekick_zip_progress(p_id uuid,p_percent integer,p_phase text) returns void language sql security invoker set search_path='' as $$ select sidekick_private.zip_progress(p_id,p_percent,p_phase); $$;
revoke all on function public.sidekick_zip_progress(uuid,integer,text) from public,anon;
grant execute on function public.sidekick_zip_progress(uuid,integer,text) to authenticated;
create function sidekick_private.zip_done_progress() returns trigger language plpgsql set search_path='' as $$ begin if new.status='done' then new.progress=100;new.phase='done';end if;return new;end; $$;
revoke all on function sidekick_private.zip_done_progress() from public,anon,authenticated;
create trigger sidekick_zip_done_progress before update of status on public.sidekick_zip_jobs for each row execute function sidekick_private.zip_done_progress();
