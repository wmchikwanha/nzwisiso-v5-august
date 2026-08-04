import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InputZone } from "@/components/InputZone";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PHQ9Form } from "@/components/screening/PHQ9Form";
import { CHWReferralPicker } from "./CHWReferralPicker";
import { retainAudioChunk, hasRecordingConsent } from "@/lib/audio/retention";
import { persistChwSessionFhir } from "@/lib/fhir/persist";

import {
  Save,
  CheckCircle2,
  Trash2,
  ArrowUpRight,
  ClipboardList,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

interface ChwSession {
  id: string;
  chw_id: string;
  patient_id: string;
  session_number: number;
  status: string;
  narrative_text: string | null;
  phq9_score: number | null;
  phq9_severity: string | null;
  phq9_item9_flag: boolean | null;
  notes: string | null;
  started_at: string;
}

interface Props {
  sessionId: string;
  onExit: () => void;
}

export function CHWSessionWorkspace({ sessionId, onExit }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<ChwSession | null>(null);
  const [patientName, setPatientName] = useState<string>("");
  const [narrative, setNarrative] = useState("");
  const [showPhq9, setShowPhq9] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retainAudio, setRetainAudio] = useState(false);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [consentOk, setConsentOk] = useState(false);
  const [retainedCount, setRetainedCount] = useState(0);


  useEffect(() => {
    (async () => {
      const { data: s } = await supabase
        .from("chw_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (s) {
        setSession(s as ChwSession);
        setNarrative((s as ChwSession).narrative_text || "");
        const { data: p } = await supabase
          .from("patients")
          .select("patient_identifier")
          .eq("id", (s as ChwSession).patient_id)
          .single();
        setPatientName(p?.patient_identifier || "Client");
        const consent = await hasRecordingConsent((s as ChwSession).patient_id);
        setConsentOk(consent.ok);
        setConsentId(consent.consentId);
      }
    })();
  }, [sessionId]);


  const refreshSession = async () => {
    const { data } = await supabase.from("chw_sessions").select("*").eq("id", sessionId).single();
    if (data) setSession(data as ChwSession);
  };

  const persist = async (status: ChwSession["status"], extra: Partial<ChwSession> = {}) => {
    if (!user || !session) return false;
    setSaving(true);
    const ended = status === "active" ? null : new Date().toISOString();
    const { error } = await supabase
      .from("chw_sessions")
      .update({
        narrative_text: narrative,
        status,
        ended_at: ended,
        ...extra,
      })
      .eq("id", sessionId);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return false;
    }
    await supabase.from("audit_events").insert({
      actor_id: user.id,
      actor_role: "chw",
      action: `chw_session_${status}`,
      resource_type: "chw_session",
      resource_id: sessionId,
      patient_id: session.patient_id,
      description: `Session #${session.session_number} for ${patientName} → ${status}`,
    });

    // Write-through: append FHIR R4 resources for completed / referred sessions.
    if (status !== "active") {
      const { data: patient } = await supabase
        .from("patients")
        .select("id, patient_identifier, gender, date_of_birth, language_preference")
        .eq("id", session.patient_id)
        .single();
      await persistChwSessionFhir({
        session: {
          ...session,
          status,
          narrative_text: narrative,
          ended_at: ended,
          ...(extra as any),
        },
        patient: (patient as any) ?? null,
      });
    }
    return true;
  };

  const handleSavePause = async () => {
    if (await persist("active")) {
      toast({ title: "Saved", description: "Session paused. Resume anytime." });
      onExit();
    }
  };

  const handleSaveClose = async () => {
    if (await persist("completed")) {
      toast({ title: "Session completed", description: "Client record archived for future visits." });
      onExit();
    }
  };


  const handleDiscard = async () => {
    if (!session || !user) return;
    setSaving(true);
    // Discard: blank narrative + flag archived, then delete the row entirely so no recording metadata remains.
    await supabase
      .from("chw_sessions")
      .update({ narrative_text: null, phq9_score: null, phq9_severity: null, phq9_item9_flag: false })
      .eq("id", sessionId);
    const { error } = await supabase.from("chw_sessions").delete().eq("id", sessionId);
    setSaving(false);
    if (error) {
      toast({ title: "Could not discard", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.from("audit_events").insert({
      actor_id: user.id,
      actor_role: "chw",
      action: "chw_session_discarded",
      resource_type: "chw_session",
      resource_id: sessionId,
      patient_id: session.patient_id,
      description: "Session discarded — narrative and audio not retained.",
    });
    toast({ title: "Session discarded", description: "Nothing was saved." });
    onExit();
  };

  if (!session) {
    return <div className="text-center py-12 text-muted-foreground">Loading session…</div>;
  }

  const item9Flag = session.phq9_item9_flag;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Session #{session.session_number} of 5</Badge>
          <Badge>{patientName}</Badge>
        </div>
      </div>

      {item9Flag && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Safety alert:</strong> The client endorsed PHQ-9 Item 9 (thoughts of self-harm).
            An <strong>upward referral is required</strong> before closing this session. Stay with
            the client, follow the safety script, and contact an emergency facility now.
          </AlertDescription>
        </Alert>
      )}

      {/* Audio + narrative — same recording schema as clinician */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation Capture</CardTitle>
          <CardDescription>
            Record the client conversation. Transcription runs automatically. CHWs do not run AI
            clinical processing — the transcript is saved with the session for the clinician's
            review on referral.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-start justify-between gap-4 rounded-md border p-3">
            <div className="space-y-1">
              <Label htmlFor="retain-audio" className="text-sm font-medium">
                Retain audio for research review
              </Label>
              <p className="text-xs text-muted-foreground">
                {consentOk
                  ? "Off by default. When on, each recorded segment is stored encrypted and can only be played back by the Principal Investigator or Safety Monitor. Every access is audited."
                  : "Unavailable — no active recording consent on file for this client. Audio is transcribed and discarded."}
                {retainedCount > 0 && ` ${retainedCount} segment(s) retained this session.`}
              </p>
            </div>
            <Switch
              id="retain-audio"
              checked={retainAudio}
              disabled={!consentOk}
              onCheckedChange={setRetainAudio}
            />
          </div>

          <InputZone
            value={narrative}
            onChange={setNarrative}
            isProcessing={false}
            selectedPatientId={session.patient_id}
            onPatientSelect={() => {
              /* CHW workspace is locked to the active session's patient */
            }}
            onAudioCaptured={
              retainAudio && consentOk
                ? async (blob, meta) => {
                    try {
                      const res = await retainAudioChunk(blob, {
                        patientId: session.patient_id,
                        chwSessionId: sessionId,
                        languageCode: meta.languageCode,
                        uploaderRole: "chw",
                        consentId,
                      });
                      if (res) setRetainedCount((n) => n + 1);
                    } catch (e: any) {
                      toast({
                        title: "Audio not retained",
                        description: e?.message || "Upload failed — transcript is still saved.",
                        variant: "destructive",
                      });
                    }
                  }
                : undefined
            }

            onChunkTranscribed={async (chunk) => {
              if (!user) return;
              // Find next chunk_index for this session
              const { data: existing } = await supabase
                .from("chw_session_transcript_chunks")
                .select("chunk_index")
                .eq("session_id", sessionId)
                .order("chunk_index", { ascending: false })
                .limit(1);
              const nextIndex = existing && existing.length > 0 ? (existing[0].chunk_index as number) + 1 : 0;
              const { error } = await supabase.from("chw_session_transcript_chunks").insert({
                session_id: sessionId,
                chw_id: user.id,
                chunk_index: nextIndex,
                started_at: chunk.startedAt,
                ended_at: chunk.endedAt,
                duration_seconds: chunk.durationSeconds,
                language_code: chunk.languageCode,
                text: chunk.text,
              });
              if (error) {
                console.error("Failed to save transcript chunk:", error);
                toast({
                  title: "Transcript chunk not saved",
                  description: error.message,
                  variant: "destructive",
                });
              }
            }}
          />
        </CardContent>
      </Card>

      {/* PHQ-9 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> PHQ-9 Screening
          </CardTitle>
          <CardDescription>
            The PHQ-9 is the only screening tool available to CHWs. Item 9 ≥ 1 forces an emergency
            referral.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session.phq9_score != null ? (
            <div className="flex items-center justify-between">
              <div>
                <Badge>{session.phq9_severity}</Badge>{" "}
                <span className="ml-2 text-sm">Score: {session.phq9_score}/27</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPhq9(true)}>
                Re-administer
              </Button>
            </div>
          ) : showPhq9 ? (
            <PHQ9Form
              patientId={session.patient_id}
              onComplete={async () => {
                const { data: latest } = await supabase
                  .from("screening_assessments")
                  .select("*")
                  .eq("patient_id", session.patient_id)
                  .eq("tool_type", "PHQ9")
                  .order("administered_at", { ascending: false })
                  .limit(1)
                  .single();
                if (latest) {
                  const responses = (latest as any).responses as number[] | null;
                  const item9 = Array.isArray(responses) ? (responses[8] || 0) >= 1 : false;
                  await supabase
                    .from("chw_sessions")
                    .update({
                      phq9_score: latest.total_score,
                      phq9_severity: latest.severity_level,
                      phq9_item9_flag: item9,
                    })
                    .eq("id", sessionId);
                  await refreshSession();
                  if (item9) setShowReferral(true);
                }
                setShowPhq9(false);
              }}
            />
          ) : (
            <Button onClick={() => setShowPhq9(true)}>Administer PHQ-9</Button>
          )}
        </CardContent>
      </Card>

      {/* Referral */}
      {showReferral && (
        <CHWReferralPicker
          patientId={session.patient_id}
          patientName={patientName}
          narrativeText={narrative}
          phq9Score={session.phq9_score}
          phq9Severity={session.phq9_severity}
          chwSessionId={sessionId}
          forceEmergency={!!item9Flag}
          onSuccess={onExit}
          onCancel={() => setShowReferral(false)}
        />
      )}

      {/* Action bar */}
      {!showReferral && (
        <Card>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-2">
            <Button variant="outline" onClick={handleSavePause} disabled={saving}>
              <Save className="h-4 w-4 mr-2" /> Save & Pause
            </Button>
            <Button variant="default" onClick={handleSaveClose} disabled={saving || item9Flag}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Save & Close
            </Button>
            <Button variant="secondary" onClick={() => setShowReferral(true)}>
              <ArrowUpRight className="h-4 w-4 mr-2" /> Refer Up
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={saving}>
                  <Trash2 className="h-4 w-4 mr-2" /> End without Save
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Discard this session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The narrative, transcript and any audio captured will be permanently deleted.
                    Use this when the recording was started by mistake.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep session</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDiscard}>Discard everything</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {item9Flag && (
              <div className="md:col-span-4 text-xs text-destructive flex flex-wrap items-center gap-2">
                <span>
                  A suicidality flag (PHQ-9 Item 9) is active, so this session must be escalated
                  before it can be closed.
                </span>
                <Button size="sm" variant="destructive" onClick={() => setShowReferral(true)}>
                  <ArrowUpRight className="h-4 w-4 mr-2" /> Send emergency referral
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      )}
    </div>
  );
}
