
CREATE TABLE public.chw_session_transcript_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.chw_sessions(id) ON DELETE CASCADE,
  chw_id uuid NOT NULL,
  chunk_index integer NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  duration_seconds numeric,
  language_code text,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, chunk_index)
);

CREATE INDEX idx_chw_transcript_chunks_session ON public.chw_session_transcript_chunks (session_id, chunk_index);

ALTER TABLE public.chw_session_transcript_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CHWs manage their own transcript chunks"
  ON public.chw_session_transcript_chunks
  FOR ALL TO authenticated
  USING (chw_id = auth.uid())
  WITH CHECK (chw_id = auth.uid());

CREATE POLICY "Admins read all transcript chunks"
  ON public.chw_session_transcript_chunks
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
