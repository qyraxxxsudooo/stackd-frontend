-- Keep the internal top-up decision RPC pinned as well. It is executable only by service_role.
ALTER FUNCTION public.admin_decide_topup(uuid, text) SET search_path = '';