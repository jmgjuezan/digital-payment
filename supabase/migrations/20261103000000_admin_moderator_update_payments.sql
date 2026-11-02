create policy "Admins and moderators can update payments"
  on public.payments for update to authenticated
  using (
    exists (
      select 1
      from public.user_roles as role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role::text in ('admin', 'moderator')
    )
  )
  with check (
    exists (
      select 1
      from public.user_roles as role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role::text in ('admin', 'moderator')
    )
  );