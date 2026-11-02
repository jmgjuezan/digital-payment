create or replace function public.set_payment_created_by_from_user_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select role_record.email
  into new.created_by
  from public.user_roles as role_record
  where role_record.user_id = (select auth.uid())
    and role_record.role::text in ('admin', 'user')
    and role_record.email is not null
    and btrim(role_record.email) <> '';

  if new.created_by is null then
    raise exception 'An eligible user role with an email is required to create a payment.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger set_payment_created_by_before_insert
  before insert on public.payments
  for each row
  execute function public.set_payment_created_by_from_user_role();
