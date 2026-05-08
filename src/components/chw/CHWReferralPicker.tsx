import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUpRight, Loader2, Phone, AlertTriangle, UserCheck } from "lucide-react";

interface ReferralTarget {
  id: string;
  name: string;
  target_type: "nurse" | "psychiatrist" | "emergency_centre" | "clinic";
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  notes: string | null;
}

interface ClinicianProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Props {
  patientId: string;
  patientName: string;
  narrativeText?: string;
  phq9Score?: number | null;
  phq9Severity?: string | null;
  chwSessionId?: string;
  forceEmergency?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TYPE_LABEL: Record<ReferralTarget["target_type"], string> = {
  nurse: "Nurse",
  psychiatrist: "Psychiatrist",
  emergency_centre: "Emergency Centre",
  clinic: "Clinic / Counsellor",
};

export function CHWReferralPicker({
  patientId,
  patientName,
  narrativeText,
  phq9Score,
  phq9Severity,
  chwSessionId,
  forceEmergency = false,
  onSuccess,
  onCancel,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [targets, setTargets] = useState<ReferralTarget[]>([]);
  const [clinicians, setClinicians] = useState<ClinicianProfile[]>([]);
  const [targetType, setTargetType] = useState<ReferralTarget["target_type"]>(
    forceEmergency ? "emergency_centre" : "psychiatrist"
  );
  const [targetId, setTargetId] = useState<string>("");
  const [clinicianId, setClinicianId] = useState<string>("");
  const [urgency, setUrgency] = useState<string>(forceEmergency ? "emergency" : "routine");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: tData } = await supabase
        .from("referral_targets")
        .select("*")
        .eq("is_active", true)
        .order("name");
      setTargets((tData as ReferralTarget[]) || []);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["psychiatrist", "admin"]);
      if (roles?.length) {
        const ids = roles.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ids);
        setClinicians(
          (profiles || []).map((p) => ({
            ...p,
            role: roles.find((r) => r.user_id === p.id)?.role || "psychiatrist",
          }))
        );
      }
    })();
  }, []);

  const filteredTargets = targets.filter((t) => t.target_type === targetType);
  const showRegisteredClinicians = targetType === "psychiatrist" || targetType === "nurse";

  const handleSubmit = async () => {
    if (!user) return;
    if (!targetId && !clinicianId) {
      toast({
        title: "Pick a destination",
        description: "Select a registered clinician or facility.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);

    const target = targets.find((t) => t.id === targetId);
    const clinician = clinicians.find((c) => c.id === clinicianId);
    const destinationLabel = clinician
      ? `${clinician.full_name} (${clinician.email})`
      : target
      ? `${target.name}${target.contact_phone ? ` — ${target.contact_phone}` : ""}`
      : "";

    const payload = {
      patient_id: patientId,
      recorded_by: user.id,
      context: "chw_upward_referral",
      referral_type: targetType,
      urgency,
      destination: clinicianId || destinationLabel || null,
      target_id: targetId || null,
      chw_session_id: chwSessionId || null,
      specialist_type: targetType,
      reason: reason || `CHW upward referral (${TYPE_LABEL[targetType]})`,
      notes: [
        phq9Score != null ? `PHQ-9 score: ${phq9Score} (${phq9Severity || "n/a"})` : "",
        narrativeText ? `\n--- Narrative ---\n${narrativeText}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      status: "active",
    };

    const { error: refErr } = await supabase.from("referrals").insert(payload);

    if (refErr) {
      toast({ title: "Error", description: refErr.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    if (chwSessionId) {
      await supabase
        .from("chw_sessions")
        .update({ status: "referred", ended_at: new Date().toISOString() })
        .eq("id", chwSessionId);
    }

    await supabase.from("audit_events").insert({
      actor_id: user.id,
      actor_role: "chw",
      action: "chw_upward_referral",
      resource_type: "referral",
      patient_id: patientId,
      description: `Referred ${patientName} to ${TYPE_LABEL[targetType]} (${urgency})`,
    });

    toast({ title: "Referral sent", description: destinationLabel });
    setSubmitting(false);
    onSuccess?.();
  };

  return (
    <Card className={forceEmergency ? "border-destructive" : "border-primary/30"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowUpRight className="h-5 w-5 text-primary" />
          Refer Up — {patientName}
        </CardTitle>
        <CardDescription>
          Send this client's session, transcript and PHQ-9 result to a clinician or facility.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {forceEmergency && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              Suicidality endorsed (PHQ-9 Item 9). An emergency referral is required before this
              session can be closed.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Refer to</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["psychiatrist", "nurse", "emergency_centre", "clinic"] as const).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={targetType === t ? "default" : "outline"}
                onClick={() => {
                  setTargetType(t);
                  setTargetId("");
                  setClinicianId("");
                }}
              >
                {TYPE_LABEL[t]}
              </Button>
            ))}
          </div>
        </div>

        {showRegisteredClinicians && clinicians.length > 0 && (
          <div className="space-y-2">
            <Label>Registered {TYPE_LABEL[targetType].toLowerCase()} on this platform</Label>
            <Select
              value={clinicianId}
              onValueChange={(v) => {
                setClinicianId(v);
                setTargetId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a registered clinician (optional)" />
              </SelectTrigger>
              <SelectContent>
                {clinicians.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-3 w-3" />
                      {c.full_name} — {c.email}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Facility / Directory</Label>
          <Select
            value={targetId}
            onValueChange={(v) => {
              setTargetId(v);
              setClinicianId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a facility" />
            </SelectTrigger>
            <SelectContent>
              {filteredTargets.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  No {TYPE_LABEL[targetType].toLowerCase()} entries yet.
                </div>
              ) : (
                filteredTargets.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex flex-col">
                      <span className="font-medium">{t.name}</span>
                      {t.contact_phone && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {t.contact_phone}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Urgency</Label>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="routine">Routine (within 24 h)</SelectItem>
              <SelectItem value="urgent">Urgent (same day)</SelectItem>
              <SelectItem value="emergency">Emergency (immediate)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Reason / concerns for clinician</Label>
          <Textarea
            placeholder="What you observed, concerns, what the client expressed…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        {phq9Score != null && (
          <div className="text-xs">
            <Badge variant="outline">PHQ-9: {phq9Score} ({phq9Severity})</Badge>
          </div>
        )}

        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowUpRight className="h-4 w-4 mr-2" />}
            Send Referral
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
