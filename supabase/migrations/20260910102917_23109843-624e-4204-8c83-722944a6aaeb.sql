-- 1. Pilot config
CREATE TABLE public.pilot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_mode boolean NOT NULL DEFAULT true,
  allow_real_data boolean NOT NULL DEFAULT false,
  pilot_version text NOT NULL DEFAULT 'v1.0',
  pilot_end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pilot_config TO authenticated;
GRANT SELECT ON public.pilot_config TO anon;
GRANT ALL ON public.pilot_config TO service_role;

ALTER TABLE public.pilot_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pilot config"
  ON public.pilot_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can update pilot config"
  ON public.pilot_config FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_pilot_config_updated_at
  BEFORE UPDATE ON public.pilot_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.pilot_config (pilot_mode, allow_real_data, pilot_version, pilot_end_date)
VALUES (true, false, 'v1.0-pilot', NULL);

-- 2. Synthetic flags
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS synthetic boolean NOT NULL DEFAULT true;
ALTER TABLE public.chw_sessions ADD COLUMN IF NOT EXISTS synthetic boolean NOT NULL DEFAULT true;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS synthetic boolean NOT NULL DEFAULT true;
ALTER TABLE public.screening_assessments ADD COLUMN IF NOT EXISTS synthetic boolean NOT NULL DEFAULT true;
ALTER TABLE public.audio_recordings ADD COLUMN IF NOT EXISTS synthetic boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.enforce_synthetic_in_pilot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.pilot_config WHERE pilot_mode = true) THEN
    NEW.synthetic := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_patients_synthetic BEFORE INSERT ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.enforce_synthetic_in_pilot();
CREATE TRIGGER trg_chw_sessions_synthetic BEFORE INSERT ON public.chw_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_synthetic_in_pilot();
CREATE TRIGGER trg_assessments_synthetic BEFORE INSERT ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_synthetic_in_pilot();
CREATE TRIGGER trg_screening_assessments_synthetic BEFORE INSERT ON public.screening_assessments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_synthetic_in_pilot();
CREATE TRIGGER trg_audio_recordings_synthetic BEFORE INSERT ON public.audio_recordings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_synthetic_in_pilot();

-- 3. AI provenance columns
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS model_id text,
  ADD COLUMN IF NOT EXISTS model_version text,
  ADD COLUMN IF NOT EXISTS prompt_template_id text,
  ADD COLUMN IF NOT EXISTS prompt_template_version text,
  ADD COLUMN IF NOT EXISTS provenance jsonb;

ALTER TABLE public.diagnostic_formulations
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS model_id text,
  ADD COLUMN IF NOT EXISTS model_version text,
  ADD COLUMN IF NOT EXISTS prompt_template_id text,
  ADD COLUMN IF NOT EXISTS prompt_template_version text,
  ADD COLUMN IF NOT EXISTS provenance jsonb;

ALTER TABLE public.treatment_notes
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS model_id text,
  ADD COLUMN IF NOT EXISTS model_version text,
  ADD COLUMN IF NOT EXISTS prompt_template_id text,
  ADD COLUMN IF NOT EXISTS prompt_template_version text,
  ADD COLUMN IF NOT EXISTS provenance jsonb;

ALTER TABLE public.self_assessment_sessions
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS model_id text,
  ADD COLUMN IF NOT EXISTS model_version text,
  ADD COLUMN IF NOT EXISTS prompt_template_id text,
  ADD COLUMN IF NOT EXISTS prompt_template_version text,
  ADD COLUMN IF NOT EXISTS provenance jsonb;

ALTER TABLE public.patient_intake_sessions
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS model_id text,
  ADD COLUMN IF NOT EXISTS model_version text,
  ADD COLUMN IF NOT EXISTS prompt_template_id text,
  ADD COLUMN IF NOT EXISTS prompt_template_version text,
  ADD COLUMN IF NOT EXISTS provenance jsonb;

-- 4. created_by where missing
ALTER TABLE public.chw_sessions ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.screening_assessments ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.treatment_notes ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.diagnostic_formulations ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.audio_recordings ADD COLUMN IF NOT EXISTS created_by uuid;