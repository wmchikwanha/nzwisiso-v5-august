import { supabase } from "@/integrations/supabase/client";

/**
 * Confidence calibration and logging.
 *
 * Every AI clinical output records the confidence it was produced with, and
 * whether the clinician subsequently overrode it. These records feed the drift
 * monitoring in the admin Model Registry.
 */

export interface ConfidenceLogInput {
  functionName: string;
  patientId?: string | null;
  encounterId?: string | null;
  rawConfidence?: number | null;
  modelVersionLabel?: string | null;
  promptTemplateId?: string | null;
}

/**
 * Shrink raw model confidence toward the base rate. Language models are
 * systematically overconfident, so a displayed figure must never be the raw one.
 */
export function calibrateConfidence(raw: number | null | undefined): number | null {
  if (raw === null || raw === undefined || Number.isNaN(raw)) return null;
  const clamped = Math.min(Math.max(raw, 0), 1);
  const SHRINKAGE = 0.8;
  const BASE_RATE = 0.5;
  return Number((BASE_RATE + SHRINKAGE * (clamped - BASE_RATE)).toFixed(3));
}

export function confidenceBand(calibrated: number | null): {
  label: string;
  tone: "high" | "moderate" | "low" | "unknown";
} {
  if (calibrated === null) return { label: "Confidence not reported", tone: "unknown" };
  if (calibrated >= 0.75) return { label: "Higher confidence", tone: "high" };
  if (calibrated >= 0.55) return { label: "Moderate confidence", tone: "moderate" };
  return { label: "Low confidence — treat with caution", tone: "low" };
}

/** Resolve the active model version row id so the log entry is traceable. */
async function activeModelVersionId(): Promise<string | null> {
  const { data } = await supabase
    .from("model_versions")
    .select("id")
    .eq("status", "active")
    .order("pinned_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function logAIConfidence(input: ConfidenceLogInput): Promise<string | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const modelVersionId = await activeModelVersionId();
    const { data, error } = await supabase
      .from("ai_confidence_log")
      .insert({
        function_name: input.functionName,
        patient_id: input.patientId ?? null,
        encounter_id: input.encounterId ?? null,
        model_version_id: modelVersionId,
        prompt_template_id: input.promptTemplateId ?? null,
        raw_confidence: input.rawConfidence ?? null,
        calibrated_confidence: calibrateConfidence(input.rawConfidence),
        created_by: userData?.user?.id ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  } catch (e) {
    console.error("Failed to log AI confidence", e);
    return null;
  }
}

export async function recordClinicianOverride(logId: string, reason: string): Promise<void> {
  try {
    await supabase
      .from("ai_confidence_log")
      .update({ clinician_override: true, clinician_override_reason: reason })
      .eq("id", logId);
  } catch (e) {
    console.error("Failed to record clinician override", e);
  }
}
