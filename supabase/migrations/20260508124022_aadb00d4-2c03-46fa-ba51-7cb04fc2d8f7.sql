
-- CHWs can view referrals routed to any CHW-type facility
CREATE POLICY "CHWs view CHW-type referrals"
  ON public.facility_referrals FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'chw')
    AND EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id = facility_referrals.facility_id AND f.facility_type = 'chw'
    )
  );

CREATE POLICY "CHWs update CHW-type referrals"
  ON public.facility_referrals FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'chw')
    AND EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id = facility_referrals.facility_id AND f.facility_type = 'chw'
    )
  );

-- CHWs can read the underlying session for those referrals
CREATE POLICY "CHWs view referred sessions via CHW facility"
  ON public.self_assessment_sessions FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'chw')
    AND EXISTS (
      SELECT 1 FROM public.facility_referrals fr
      JOIN public.facilities f ON f.id = fr.facility_id
      WHERE fr.session_id = self_assessment_sessions.id AND f.facility_type = 'chw'
    )
  );

CREATE POLICY "CHWs view responses via CHW facility"
  ON public.self_assessment_responses FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'chw')
    AND EXISTS (
      SELECT 1 FROM public.facility_referrals fr
      JOIN public.facilities f ON f.id = fr.facility_id
      WHERE fr.session_id = self_assessment_responses.session_id AND f.facility_type = 'chw'
    )
  );
