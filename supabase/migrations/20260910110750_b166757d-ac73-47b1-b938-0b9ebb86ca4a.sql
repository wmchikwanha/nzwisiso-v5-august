CREATE TABLE public.rules_engine_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  scoring_logic_hash text NOT NULL,
  pathway_logic_hash text NOT NULL,
  mhgap_version text NOT NULL DEFAULT 'mhGAP-IG v2.0 (2016)',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rules_engine_versions TO authenticated;
GRANT INSERT ON public.rules_engine_versions TO authenticated;
GRANT ALL ON public.rules_engine_versions TO service_role;

ALTER TABLE public.rules_engine_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can read rules engine versions"
  ON public.rules_engine_versions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can register rules engine versions"
  ON public.rules_engine_versions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.screening_assessments
  ADD COLUMN IF NOT EXISTS rules_version_id uuid REFERENCES public.rules_engine_versions(id);

ALTER TABLE public.screening_assessments
  DROP CONSTRAINT IF EXISTS screening_assessments_tool_type_check;

ALTER TABLE public.screening_assessments
  ADD CONSTRAINT screening_assessments_tool_type_check
  CHECK (tool_type = ANY (ARRAY['PHQ9','GAD7','PCL5','MMSE','PSQ','PRIMER5','SSQ14']));

INSERT INTO public.rules_engine_versions (version, scoring_logic_hash, pathway_logic_hash, mhgap_version)
VALUES ('1.0.0', 'scoring-v1.0.0', 'pathway-v1.0.0', 'mhGAP-IG v2.0 (2016)')
ON CONFLICT (version) DO NOTHING;