import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronRight, Clock, AlertTriangle, CheckCircle2, XCircle, ShieldAlert, Loader2 } from "lucide-react";

type Referral = { id: string; status: string; matched_at: string; sla_deadline: string; session_id: string; facility_id: string };
type Session = { id: string; language_code: string; location_region: string | null; demographics: any; narrative_text: string | null; risk_level: string | null; ai_diagnostic_suggestions: any; created_at: string };
type Resp = { id: string; tool_type: string; total_score: number; severity_level: string | null; interpretation: string | null; item_flags: any };

export const CHWSelfReferrals = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Referral[]>([]);
  const [open, setOpen] = useState<Referral | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [resps, setResps] = useState<Resp[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("facility_referrals").select("*").order("matched_at", { ascending: false });
    if (error) { toast({ title: "Failed to load", description: error.message, variant: "destructive" }); return; }
    setItems(data ?? []);
  };

  useEffect(() => { void load(); }, []);

  const openItem = async (r: Referral) => {
    setOpen(r); setSession(null); setResps([]);
    const [s, rs] = await Promise.all([
      supabase.from("self_assessment_sessions").select("*").eq("id", r.session_id).maybeSingle(),
      supabase.from("self_assessment_responses").select("*").eq("session_id", r.session_id),
    ]);
    if (s.data) setSession(s.data as any);
    if (rs.data) setResps(rs.data as any);
  };

  const act = async (status: "accepted" | "escalated" | "closed") => {
    if (!open) return;
    setBusy(true);
    const patch: any = { status };
    if (status === "accepted") patch.accepted_at = new Date().toISOString();
    if (status === "escalated") patch.escalated = true;
    const { error } = await supabase.from("facility_referrals").update(patch).eq("id", open.id);
    setBusy(false);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Referral ${status}` });
    setOpen(null); void load();
  };

  if (open && session) {
    const phq9 = resps.find(r => r.tool_type === "PHQ-9");
    const isCrisis = session.risk_level === "crisis";
    const ai = session.ai_diagnostic_suggestions;
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={() => setOpen(null)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        {isCrisis && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-semibold text-destructive text-sm">High-risk indicator (PHQ-9 Item 9)</p>
                <p className="text-xs text-muted-foreground">Refer up to a clinician immediately.</p>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader><CardTitle className="text-lg">Patient context</CardTitle><CardDescription>Self-reported, anonymised.</CardDescription></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><strong>Age:</strong> {session.demographics?.age_band ?? "—"} · <strong>Gender:</strong> {session.demographics?.gender ?? "—"}</p>
            <p><strong>Region:</strong> {session.location_region ?? "—"} · <strong>Language:</strong> {session.language_code}</p>
          </CardContent>
        </Card>
        {phq9 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">PHQ-9</CardTitle><CardDescription>{phq9.interpretation}</CardDescription></CardHeader>
            <CardContent className="text-sm">
              <p><strong>Score:</strong> {phq9.total_score}/27 ({phq9.severity_level})</p>
              {phq9.item_flags?.suicidal_ideation && <p className="text-destructive mt-2">Item 9 flagged: {phq9.item_flags?.q9_score}</p>}
            </CardContent>
          </Card>
        )}
        {session.narrative_text && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Self-reported narrative</CardTitle></CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap text-muted-foreground">{session.narrative_text}</CardContent>
          </Card>
        )}
        {ai && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg">Clinical context (for upward referral)</CardTitle>
              <CardDescription>AI-generated suggestion. Use only to brief the clinician you refer to.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {ai.primary_consideration && <p><strong>{ai.primary_consideration.code}</strong> · {ai.primary_consideration.name}</p>}
              {ai.cultural_formulation && <p className="text-muted-foreground">{ai.cultural_formulation}</p>}
            </CardContent>
          </Card>
        )}
        {open.status === "pending" && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={() => act("accepted")} disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Accept
              </Button>
              <Button variant="destructive" onClick={() => act("escalated")} disabled={busy}>
                <AlertTriangle className="w-4 h-4 mr-2" /> Escalate to clinician
              </Button>
              <Button variant="outline" onClick={() => act("closed")} disabled={busy}>
                <XCircle className="w-4 h-4 mr-2" /> Close
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-12">No inbound self-referrals yet.</p>;
  }

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {items.map((r) => {
        const hoursLeft = Math.max(0, Math.round((new Date(r.sla_deadline).getTime() - Date.now()) / 3_600_000));
        return (
          <button key={r.id} onClick={() => openItem(r)} className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent/30">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">Self-referral · {new Date(r.matched_at).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground capitalize mt-1">Status: {r.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={hoursLeft < 12 ? "destructive" : "secondary"} className="text-xs"><Clock className="w-3 h-3 mr-1" /> {hoursLeft}h SLA</Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
