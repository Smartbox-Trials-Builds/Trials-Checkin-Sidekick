create table sidekick_private.device_systems_authorizations(user_id uuid primary key references auth.users(id) on delete cascade);
revoke all on sidekick_private.device_systems_authorizations from public,anon,authenticated;
insert into sidekick_private.device_systems_authorizations(user_id) select user_id from public.sidekick_user_profiles where role='Device Systems Coordinator';
create function sidekick_private.verify_systems(p_code text) returns boolean language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if exists(select 1 from sidekick_private.device_systems_authorizations where user_id=auth.uid()) then return true; end if;
 if p_code is null or encode(sha256(convert_to(p_code,'UTF8')),'hex')<>'6dbd3eb08324ded762c794f412227c0ca37679966932cbca90c7dfb10cdc52ca' then return false; end if;
 insert into sidekick_private.device_systems_authorizations(user_id) values(auth.uid()) on conflict do nothing;
 return true; end; $$;
revoke all on function sidekick_private.verify_systems(text) from public,anon;
grant execute on function sidekick_private.verify_systems(text) to authenticated;
create function public.sidekick_verify_systems(p_code text default null) returns boolean language sql security invoker set search_path='' as $$ select sidekick_private.verify_systems(p_code); $$;
revoke all on function public.sidekick_verify_systems(text) from public,anon;
grant execute on function public.sidekick_verify_systems(text) to authenticated;
create function sidekick_private.enforce_systems_role() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if new.role='Device Systems Coordinator' and not exists(select 1 from sidekick_private.device_systems_authorizations where user_id=new.user_id) then raise exception 'Verify the Device Systems passcode before selecting this role'; end if;
 return new; end; $$;
revoke all on function sidekick_private.enforce_systems_role() from public,anon,authenticated;
create trigger sidekick_systems_role_verification before insert or update of role on public.sidekick_user_profiles for each row execute function sidekick_private.enforce_systems_role();
