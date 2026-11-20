-- Admin-only Telegram RPCs are called with the service_role client inside
-- telegram-webhook. Signed-in website users must not be able to invoke them
-- directly through PostgREST.
REVOKE EXECUTE ON FUNCTION public.admin_decide_topup(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.stackd_admin_cancel_order(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.stackd_admin_complete_order(uuid) FROM authenticated;
