import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Flag, Loader2 } from "lucide-react";

const INCIDENT_TYPES: { value: string; label: string }[] = [
  { value: "hallucination", label: "Made something up" },
  { value: "wrong_formulation", label: "Clinically wrong suggestion" },
  { value: "missed_crisis_cue", label: "Missed a risk or crisis cue" },
  { value: "unsafe_content", label: "Unsafe or inappropriate content" },
  { value: "injection_attempt", label: "Suspicious instruction in the text" },
  { value: "other", label: "Something else" },
];

const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

interface Props {
  /** Which AI feature produced the output being reported. */
  sourceFunction: string;
  patientId?: string | null;
  outputId?: string | null;
}

export const ReportAIIncidentDialog = ({ sourceFunction, patientId, outputId }: Props) => {
  const { session, userRole } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [incidentType, setIncidentType] = useState("wrong_formulation");
  const [severity, setSeverity] = useState("medium");
  const [description, setDescription] = useState("");

  const submit = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("ai_incidents").insert({
        reported_by: session.user.id,
        reporter_role: userRole ?? null,
        incident_type: incidentType,
        severity,
        description: description.trim(),
        source_function: sourceFunction,
        linked_patient_id: patientId ?? null,
        linked_ai_output_id: outputId ?? null,
      });
      if (error) throw error;
      toast({ title: "Report sent", description: "The safety team will review this." });
      setOpen(false);
      setDescription("");
    } catch (e: unknown) {
      toast({
        title: "Could not send report",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="h-3.5 w-3.5 mr-1.5" /> Report a problem
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a problem with this AI suggestion</DialogTitle>
          <DialogDescription>
            Your report is logged for safety review. Do not include any patient identifying details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>What went wrong?</Label>
            <Select value={incidentType} onValueChange={setIncidentType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INCIDENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>How serious is it?</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="incident-description">Describe what you saw</Label>
            <Textarea
              id="incident-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. The suggestion listed a condition with no supporting evidence in the session."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving || description.trim().length < 10}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
