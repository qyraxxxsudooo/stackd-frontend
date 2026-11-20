-- Pin SECURITY DEFINER RPCs to an empty search_path.
-- Their non-system tables and helper functions are schema-qualified (public.* / auth.*).
ALTER FUNCTION public.cancel_order(uuid) SET search_path = '';
ALTER FUNCTION public.stackd_checkout(jsonb, text, uuid) SET search_path = '';
ALTER FUNCTION public.stackd_promo_preview(text, jsonb) SET search_path = '';
ALTER FUNCTION public.stackd_telegram_link_token() SET search_path = '';