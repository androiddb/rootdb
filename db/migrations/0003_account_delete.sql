-- RootDB 0003 — account deletion RPC.
-- A user can delete their own account; auth.users row removal cascades
-- through public.profiles (and every personal table that references it).
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  delete from auth.users where id = me;
  if not found then raise exception 'account already removed'; end if;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
