
-- ─── Tables ──────────────────────────────────────────────────
CREATE TABLE public.self_assessment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'started',
  demographics jsonb NOT NULL DEFAULT '{}'::jsonb,
  location_region text,
  latitude numeric,
  longitude numeric,
  risk_level text,
  triage_result jsonb,
  narrative_text text,
  ai_diagnostic_suggestions jsonb,
  document_urls text[] NOT NULL DEFAULT '{}',
  language_code text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
ALTER TABLE public.self_assessment_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.self_assessment_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.self_assessment_sessions(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  granted boolean NOT NULL DEFAULT false,
  consent_text_version text NOT NULL DEFAULT '1.0',
  language_code text NOT NULL DEFAULT 'en',
  ip_hash text,
  granted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.self_assessment_consents ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.self_assessment_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.self_assessment_sessions(id) ON DELETE CASCADE,
  tool_type text NOT NULL,
  responses jsonb NOT NULL,
  total_score integer NOT NULL,
  severity_level text,
  interpretation text,
  item_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.self_assessment_responses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_name text NOT NULL,
  facility_type text NOT NULL DEFAULT 'clinic',
  region text NOT NULL,
  province text,
  city text,
  latitude numeric,
  longitude numeric,
  services_offered text[] NOT NULL DEFAULT '{}',
  contact_phone text,
  contact_email text,
  website text,
  operating_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  subscription_tier text NOT NULL DEFAULT 'basic',
  is_active boolean NOT NULL DEFAULT true,
  accepts_referrals boolean NOT NULL DEFAULT true,
  specialisations text[] NOT NULL DEFAULT '{}',
  emergency_capable boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.facility_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.self_assessment_sessions(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL REFERENCES public.facilities(id),
  assigned_to uuid,
  status text NOT NULL DEFAULT 'pending',
  matched_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  sla_deadline timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  escalated boolean NOT NULL DEFAULT false,
  escalation_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.facility_referrals ENABLE ROW LEVEL SECURITY;

-- ─── RLS policies ────────────────────────────────────────────
CREATE POLICY "Admins view all sas sessions"
  ON public.self_assessment_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Recipients view referred sessions"
  ON public.self_assessment_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.facility_referrals fr
      JOIN public.facilities f ON f.id = fr.facility_id
      WHERE fr.session_id = self_assessment_sessions.id
        AND (f.created_by = auth.uid() OR fr.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Admins view all sas consents"
  ON public.self_assessment_consents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all sas responses"
  ON public.self_assessment_responses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Recipients view responses for referred sessions"
  ON public.self_assessment_responses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.facility_referrals fr
      JOIN public.facilities f ON f.id = fr.facility_id
      WHERE fr.session_id = self_assessment_responses.session_id
        AND (f.created_by = auth.uid() OR fr.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Anyone views active facilities"
  ON public.facilities FOR SELECT
  USING (is_active = true);
CREATE POLICY "Admins manage facilities"
  ON public.facilities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage all facility referrals"
  ON public.facility_referrals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Recipients view referrals for their facility"
  ON public.facility_referrals FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id = facility_referrals.facility_id AND f.created_by = auth.uid()
    )
    OR assigned_to = auth.uid()
  );
CREATE POLICY "Recipients update referrals for their facility"
  ON public.facility_referrals FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id = facility_referrals.facility_id AND f.created_by = auth.uid()
    )
    OR assigned_to = auth.uid()
  );

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX idx_sas_token ON public.self_assessment_sessions(session_token);
CREATE INDEX idx_sas_status ON public.self_assessment_sessions(status);
CREATE INDEX idx_facilities_region ON public.facilities(region);
CREATE INDEX idx_facilities_active ON public.facilities(is_active, accepts_referrals);
CREATE INDEX idx_facilities_type ON public.facilities(facility_type);
CREATE INDEX idx_fr_session ON public.facility_referrals(session_id);
CREATE INDEX idx_fr_facility ON public.facility_referrals(facility_id);
CREATE INDEX idx_fr_status ON public.facility_referrals(status);
CREATE INDEX idx_fr_assigned ON public.facility_referrals(assigned_to);

-- ─── Triggers ────────────────────────────────────────────────
CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facility_referrals_updated_at
  BEFORE UPDATE ON public.facility_referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Seed facilities ─────────────────────────────────────────
INSERT INTO public.facilities
  (facility_name, facility_type, region, province, city, latitude, longitude,
   contact_phone, contact_email, services_offered, specialisations, emergency_capable)
VALUES
  ('Parirenyatwa Hospital — Mental Health Unit','hospital','harare','Harare','Harare',
   -17.8095,31.0522,'+263 4 794411','mh@parirenyatwa.co.zw',
   ARRAY['psychiatry','inpatient','crisis','assessment'],
   ARRAY['adult psychiatry','child & adolescent','addictions'],true),
  ('Sally Mugabe Central Hospital — Psychiatric Services','hospital','harare','Harare','Harare',
   -17.8456,31.0123,'+263 4 742140','info@smch.org.zw',
   ARRAY['psychiatry','outpatient','crisis'],
   ARRAY['adult psychiatry','community outreach'],true),
  ('Ingutsheni Central Hospital','hospital','bulawayo','Bulawayo','Bulawayo',
   -20.1700,28.5814,'+263 9 235811','admin@ingutsheni.co.zw',
   ARRAY['psychiatry','inpatient','rehabilitation'],
   ARRAY['adult psychiatry','forensic psychiatry'],true),
  ('Friendship Bench — Mbare','chw','harare','Harare','Harare',
   -17.8650,31.0270,'+263 77 200 1234','mbare@friendshipbenchzimbabwe.org',
   ARRAY['lay-counselling','phq-9 screening','psychosocial support'],
   ARRAY['community mental health'],false),
  ('SADAG (South African Depression and Anxiety Group)','clinic','gauteng','Gauteng','Johannesburg',
   -26.1076,28.0567,'0800 567 567','help@sadag.org',
   ARRAY['helpline','counselling','referral'],
   ARRAY['depression','anxiety','suicide prevention'],true),
  ('Groote Schuur Hospital — Department of Psychiatry','hospital','western_cape','Western Cape','Cape Town',
   -33.9408,18.4651,'+27 21 404 9111','psychiatry@gsh.uct.ac.za',
   ARRAY['psychiatry','inpatient','outpatient','liaison'],
   ARRAY['adult psychiatry','neuropsychiatry'],true);
