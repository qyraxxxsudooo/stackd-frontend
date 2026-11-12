-- SECURITY FIX (found while auditing): public.admin_add_balance is SECURITY DEFINER with no caller check and EXECUTE granted to
-- anon/authenticated/PUBLIC, so any visitor could call rpc('admin_add_balance') and credit any account. Nothing in the frontend calls it.
revoke execute on function public.admin_add_balance(uuid, numeric) from public, anon, authenticated;
