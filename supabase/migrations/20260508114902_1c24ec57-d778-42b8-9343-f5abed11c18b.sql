-- =========================================================
-- CHW persona: sessions, referral targets, role-aware signup
-- =========================================================

-- 1. chw_sessions ----------------------------------------------------
CREATE TABLE public.chw_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chw_id          uuid NOT NULL,
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  session_number  integer NOT NULL DEFAULT 1,
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','completed','referred','archived')),
  narrative_text  text,
  transcript_language text,
  phq9_score      integer,
  phq9_severity   text,
  phq9_item9_flag boolean DEFAULT false,
  notes           text,
  started_at      timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chw_sessions_chw      ON public.chw_sessions(chw_id);
CREATE INDEX idx_chw_sessions_patient  ON public.chw_sessions(patient_id);
CREATE INDEX idx_chw_sessions_status   ON public.chw_sessions(status);

ALTER TABLE public.chw_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CHWs manage their own sessions"
  ON public.chw_sessions FOR ALL
  TO authenticated
  USING (chw_id = auth.uid())
  WITH CHECK (chw_id = auth.uid());

CREATE POLICY "Admins read all chw sessions"
  ON public.chw_sessions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger: enforce 5-session-per-patient lifetime cap & auto-number sessions
CREATE OR REPLACE FUNCTION public.chw_sessions_assign_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_count int;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM public.chw_sessions
  WHERE patient_id = NEW.patient_id;

  IF existing_count >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 sessions per patient reached';
  END IF;

  NEW.session_number := existing_count + 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_chw_sessions_assign_number
  BEFORE INSERT ON public.chw_sessions
  FOR EACH ROW EXECUTE FUNCTION public.chw_sessions_assign_number();

CREATE TRIGGER trg_chw_sessions_updated_at
  BEFORE UPDATE ON public.chw_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. referral_targets ------------------------------------------------
CREATE TABLE public.referral_targets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  target_type     text NOT NULL
                  CHECK (target_type IN ('nurse','psychiatrist','emergency_centre','clinic')),
  contact_phone   text,
  contact_email   text,
  address         text,
  notes           text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_targets_type   ON public.referral_targets(target_type);
CREATE INDEX idx_referral_targets_active ON public.referral_targets(is_active);

ALTER TABLE public.referral_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read active targets"
  ON public.referral_targets FOR SELECT
  TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage referral targets"
  ON public.referral_targets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_referral_targets_updated_at
  BEFORE UPDATE ON public.referral_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Zimbabwe-relevant defaults (admin can edit later)
INSERT INTO public.referral_targets (name, target_type, contact_phone, address, notes) VALUES
  ('Parirenyatwa Group of Hospitals - Annexe Psychiatric Unit', 'emergency_centre', '+263 242 791631', 'Mazowe St, Harare', 'Tertiary psychiatric referral'),
  ('Sally Mugabe Central Hospital - Psychiatric Department', 'emergency_centre', '+263 242 740440', 'Harare', 'Adult & adolescent psychiatry'),
  ('Ingutsheni Central Hospital', 'emergency_centre', '+263 292 472003', 'Bulawayo', 'Specialist psychiatric hospital'),
  ('Zimbabwe Republic Police - Emergency', 'emergency_centre', '995', 'National', 'Police emergency line'),
  ('Ambulance / Medical Emergency', 'emergency_centre', '994', 'National', 'National medical emergency'),
  ('Friendship Bench - Harare HQ', 'clinic', '+263 772 432 167', 'Harare', 'Lay-counsellor support network'),
  ('Community Psychiatric Nurse - Hotline', 'nurse', '+263 71 234 5678', 'National', 'Placeholder — replace with registered nurse details');

-- 3. referrals: link to chw_sessions --------------------------------
ALTER TABLE public.referrals
  ADD COLUMN chw_session_id uuid REFERENCES public.chw_sessions(id) ON DELETE SET NULL,
  ADD COLUMN target_id      uuid REFERENCES public.referral_targets(id) ON DELETE SET NULL;

-- 4. handle_new_user: read intended_role from metadata --------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
    NEW.email
  );

  -- Read intended_role from sign-up metadata; default to psychiatrist for back-compat
  BEGIN
    requested_role := COALESCE(NEW.raw_user_meta_data->>'intended_role', 'psychiatrist')::app_role;
  EXCEPTION WHEN invalid_text_representation THEN
    requested_role := 'psychiatrist'::app_role;
  END;

  -- Never auto-assign admin via signup metadata
  IF requested_role = 'admin' THEN
    requested_role := 'psychiatrist';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role);

  RETURN NEW;
END;
$$;

-- Make sure trigger exists on auth.users (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();