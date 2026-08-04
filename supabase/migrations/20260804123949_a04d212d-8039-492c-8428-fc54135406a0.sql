-- Grant PI role to the project owner
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'principal_investigator'::app_role FROM auth.users WHERE lower(email) = 'wmchikwanha@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ============ audio_recordings ============
CREATE TABLE public.audio_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  chw_session_id uuid REFERENCES public.chw_sessions(id) ON DELETE SET NULL,
  encounter_ref text,
  storage_path text NOT NULL UNIQUE,
  mime_type text NOT NULL DEFAULT 'audio/webm',
  size_bytes bigint NOT NULL DEFAULT 0,
  duration_seconds numeric,
  checksum text,
  language_code text,
  uploaded_by uuid NOT NULL,
  uploader_role text NOT NULL DEFAULT 'unknown',
  consent_id uuid REFERENCES public.consents(id) ON DELETE SET NULL,
  retention_until timestamptz NOT NULL DEFAULT (now() + interval '5 years'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.audio_recordings TO authenticated;
GRANT ALL ON public.audio_recordings TO service_role;
ALTER TABLE public.audio_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Uploaders can register their own recordings"
ON public.audio_recordings FOR INSERT TO authenticated
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Only PI and Safety Monitor can read recordings"
ON public.audio_recordings FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'principal_investigator')
  OR public.has_role(auth.uid(), 'safety_monitor')
);

CREATE POLICY "Only PI can amend retention metadata"
ON public.audio_recordings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'principal_investigator'))
WITH CHECK (public.has_role(auth.uid(), 'principal_investigator'));

CREATE TRIGGER trg_audio_recordings_updated_at
BEFORE UPDATE ON public.audio_recordings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_audio_recordings_patient ON public.audio_recordings(patient_id);
CREATE INDEX idx_audio_recordings_session ON public.audio_recordings(chw_session_id);

-- ============ storage policies for clinical-audio ============
CREATE POLICY "Authenticated can upload clinical audio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'clinical-audio' AND owner = auth.uid());

CREATE POLICY "Only PI and Safety Monitor can read clinical audio"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'clinical-audio'
  AND (
    public.has_role(auth.uid(), 'principal_investigator')
    OR public.has_role(auth.uid(), 'safety_monitor')
  )
);

-- ============ fhir_resources ============
CREATE TABLE public.fhir_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  source_table text,
  source_id uuid,
  resource jsonb NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource_type, resource_id, version)
);

GRANT SELECT, INSERT ON public.fhir_resources TO authenticated;
GRANT ALL ON public.fhir_resources TO service_role;
ALTER TABLE public.fhir_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can append FHIR resources"
ON public.fhir_resources FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Care team can read FHIR resources"
ON public.fhir_resources FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'psychiatrist')
  OR public.has_role(auth.uid(), 'principal_investigator')
  OR public.has_role(auth.uid(), 'safety_monitor')
);

CREATE INDEX idx_fhir_resources_patient ON public.fhir_resources(patient_id);
CREATE INDEX idx_fhir_resources_type ON public.fhir_resources(resource_type);