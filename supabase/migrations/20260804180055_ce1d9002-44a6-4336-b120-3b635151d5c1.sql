-- Clinicians can register their own facility (pending admin activation)
CREATE POLICY "Users can register a facility"
ON public.facilities FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view their own facilities"
ON public.facilities FOR SELECT TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can update their own facilities"
ON public.facilities FOR UPDATE TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Clinician directory for referral pickers (non-sensitive fields only)
CREATE OR REPLACE FUNCTION public.get_clinician_directory()
RETURNS TABLE (id uuid, full_name text, email text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.email, ur.role::text
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE ur.role IN ('psychiatrist'::app_role, 'admin'::app_role)
    AND p.status = 'active'
    AND auth.uid() IS NOT NULL
  ORDER BY p.full_name;
$$;

REVOKE ALL ON FUNCTION public.get_clinician_directory() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_clinician_directory() TO authenticated;