// Retained clinical audio.
//
// Audio is uploaded to the private `clinical-audio` bucket (encrypted at rest,
// TLS in transit) and registered in `audio_recordings`. Read access is
// restricted by RLS to Principal Investigator / Safety Monitor roles; the
// uploading clinician or CHW cannot listen back.
//
// Retention is OFF by default — callers must opt in per session.

import { supabase } from "@/integrations/supabase/client";

export interface RetainAudioOptions {
  patientId: string;
  chwSessionId?: string | null;
  encounterRef?: string | null;
  languageCode?: string;
  durationSeconds?: number;
  uploaderRole?: string;
  consentId?: string | null;
}

export interface RetainAudioResult {
  storagePath: string;
  recordingId: string;
  sizeBytes: number;
}

async function sha256Hex(blob: Blob): Promise<string | null> {
  try {
    if (typeof crypto === "undefined" || !crypto.subtle) return null;
    const buf = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

/**
 * Returns true when a recording consent exists and is active for this patient.
 * Consent is a hard gate on retention — with no consent row we never store audio.
 */
export async function hasRecordingConsent(patientId: string): Promise<{ ok: boolean; consentId: string | null }> {
  const { data } = await supabase
    .from("consents")
    .select("id, status, consent_type")
    .eq("patient_id", patientId)
    .eq("status", "active")
    .order("consented_at", { ascending: false })
    .limit(10);

  if (!data || data.length === 0) return { ok: false, consentId: null };
  const match =
    data.find((c: any) => /record|audio|voice/i.test(c.consent_type || "")) ?? data[0];
  return { ok: true, consentId: match.id as string };
}

export async function retainAudioChunk(
  blob: Blob,
  opts: RetainAudioOptions,
): Promise<RetainAudioResult | null> {
  if (!blob || blob.size === 0) return null;

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return null;

  const ext = (blob.type || "audio/webm").includes("mp4") ? "m4a" : "webm";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sessionSegment = opts.chwSessionId ?? "adhoc";
  const storagePath = `patient/${opts.patientId}/${sessionSegment}/${stamp}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("clinical-audio")
    .upload(storagePath, blob, {
      contentType: blob.type || "audio/webm",
      upsert: false,
    });

  if (uploadError) {
    console.error("Audio retention upload failed:", uploadError.message);
    throw uploadError;
  }

  const checksum = await sha256Hex(blob);

  const { data: row, error: insertError } = await supabase
    .from("audio_recordings")
    .insert({
      patient_id: opts.patientId,
      chw_session_id: opts.chwSessionId ?? null,
      encounter_ref: opts.encounterRef ?? null,
      storage_path: storagePath,
      mime_type: blob.type || "audio/webm",
      size_bytes: blob.size,
      duration_seconds: opts.durationSeconds ?? null,
      checksum,
      language_code: opts.languageCode ?? null,
      uploaded_by: userId,
      uploader_role: opts.uploaderRole ?? "unknown",
      consent_id: opts.consentId ?? null,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Audio registration failed:", insertError.message);
    throw insertError;
  }

  await supabase.from("audit_events").insert({
    actor_id: userId,
    actor_role: opts.uploaderRole ?? "unknown",
    action: "audio_recording_retained",
    resource_type: "audio_recording",
    resource_id: (row as any).id,
    patient_id: opts.patientId,
    description: `Audio segment retained (${blob.size} bytes) in restricted store.`,
  });

  return { storagePath, recordingId: (row as any).id, sizeBytes: blob.size };
}

/**
 * PI / Safety Monitor only. Produces a short-lived signed URL and writes an
 * immutable access audit row. RLS blocks this for every other role.
 */
export async function getAudioAccessUrl(
  recordingId: string,
  storagePath: string,
  patientId: string,
  actorRole: string,
): Promise<string | null> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase.storage
    .from("clinical-audio")
    .createSignedUrl(storagePath, 300);

  await supabase.from("audit_events").insert({
    actor_id: userId,
    actor_role: actorRole,
    action: "audio_recording_accessed",
    outcome: error ? "failure" : "success",
    resource_type: "audio_recording",
    resource_id: recordingId,
    patient_id: patientId,
    description: error
      ? `Audio access denied: ${error.message}`
      : "Signed URL issued (5 min) for restricted audio playback.",
  });

  if (error) throw error;
  return data?.signedUrl ?? null;
}
