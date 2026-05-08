REVOKE EXECUTE ON FUNCTION public.chw_sessions_assign_number() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;