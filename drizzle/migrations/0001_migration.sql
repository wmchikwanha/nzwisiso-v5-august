CREATE OR REPLACE FUNCTION public.get_clinician_directory()
 RETURNS TABLE(id uuid, full_name text, email text, role text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.full_name, p.email, ur.role::text
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE ur.role IN ('psychiatrist'::app_role, 'admin'::app_role, 'mh_nurse'::app_role)
    AND p.status = 'active' AND auth.uid() IS NOT NULL
  ORDER BY p.full_name;
$$;
UPDATE public.user_roles SET role='mh_nurse' WHERE user_id IN (SELECT id FROM public.profiles WHERE email='demo.nurse@nzwisiso.test');