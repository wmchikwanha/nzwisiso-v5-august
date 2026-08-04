ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_context_check;
ALTER TABLE public.referrals ADD CONSTRAINT referrals_context_check CHECK (context = ANY (ARRAY['crisis_intervention'::text,'treatment_plan'::text,'general'::text,'chw_upward_referral'::text,'self_referral'::text,'facility_referral'::text]));
ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_urgency_check;
ALTER TABLE public.referrals ADD CONSTRAINT referrals_urgency_check CHECK (urgency = ANY (ARRAY['immediate'::text,'urgent'::text,'routine'::text,'emergency'::text]));
ALTER TABLE public.patients REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;