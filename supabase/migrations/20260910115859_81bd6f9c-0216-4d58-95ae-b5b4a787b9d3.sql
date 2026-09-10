
CREATE POLICY "No client access to rate limit counters"
ON public.rate_limit_counters FOR SELECT TO authenticated
USING (false);
