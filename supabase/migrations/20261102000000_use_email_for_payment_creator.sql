drop policy if exists "Users can add their own payments" on public.payments;

alter table public.payments
  add column created_by_email text;

update public.payments as payment
set created_by_email = role_record.email
from public.user_roles as role_record
where role_record.user_id = payment.created_by;

do $$
begin
  if exists (
    select 1
    from public.payments
    where created_by_email is null or btrim(created_by_email) = ''
  ) then
    raise exception 'Cannot migrate payment creators: each created_by UUID must match a user_roles row with a non-empty email.';
  end if;
end;
$$;

alter table public.payments
  drop column created_by;

alter table public.payments
  rename column created_by_email to created_by;

alter table public.payments
  alter column created_by set not null;

create policy "Users can add their own payments"
  on public.payments for insert to authenticated
  with check (
    exists (
      select 1
      from public.user_roles as role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role::text in ('admin', 'user')
        and role_record.email = payments.created_by
    )
  );