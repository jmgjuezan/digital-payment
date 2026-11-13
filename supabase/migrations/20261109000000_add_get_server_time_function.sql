create or replace function public.get_server_time()
returns timestamptz
language sql
volatile
security invoker
set search_path = ''
as $$
  select pg_catalog.clock_timestamp();
$$;

revoke all on function public.get_server_time() from public;
grant execute on function public.get_server_time() to authenticated, service_role;
