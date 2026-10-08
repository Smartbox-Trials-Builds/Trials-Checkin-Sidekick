create function sidekick_private.queue_beta_access(p_code text) returns boolean language sql security definer set search_path='' as $$ select p_code is not null and encode(sha256(convert_to(p_code,'UTF8')),'hex')='6dbd3eb08324ded762c794f412227c0ca37679966932cbca90c7dfb10cdc52ca' and exists(select 1 from public.sidekick_user_profiles where user_id=auth.uid() and role='Device Systems Coordinator'); $$;
revoke all on function sidekick_private.queue_beta_access(text) from public,anon;
grant execute on function sidekick_private.queue_beta_access(text) to authenticated;
create function public.sidekick_queue_beta_access(p_code text) returns boolean language sql security invoker set search_path='' as $$ select sidekick_private.queue_beta_access(p_code); $$;
revoke all on function public.sidekick_queue_beta_access(text) from public,anon;
grant execute on function public.sidekick_queue_beta_access(text) to authenticated;
