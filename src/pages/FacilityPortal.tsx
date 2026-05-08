import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2, Inbox, AlertTriangle, ArrowLeft, Phone, Mail, Globe, Clock, ShieldAlert,
  ChevronRight, Loader2, CheckCircle2, XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";

type Referral = {
  id: string;
  status: string;
  matched_at: string;
  sla_deadline: string;
  escalated: boolean;
  notes: string | null;
  session_id: string;
  facility_id: string;
};

type Session = {
  id: string;
  language_code: string;
  location_region: string | null;
  demographics: any;
  narrative_text: string | null;
  risk_level: string | null;
  ai_diagnostic_suggestions: any;
  created_at: string;
};

type ScreeningResponse = {
  id: string;
  tool_type: string;
  total_score: number;
  severity_level: string | null;
  interpretation: string | null;
  item_flags: any;
};

export default function FacilityPortal() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [openReferral, setOpenReferral] = useState<Referral | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [screenings, setScreenings] = useState<ScreeningResponse[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Facility Portal — Inbound Referrals | Nzwisiso";
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    void loadReferrals();
  }, [user]);

  const loadReferrals = async () => {
    const { data, error } = await supabase
      .from("facility_referrals")
      .select("*")
      .order("matched_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load referrals", description: error.message, variant: "destructive" });
      return;
    }
    setReferrals(data ?? []);
  };

  const openClinicalView = async (r: Referral) => {
    setOpenReferral(r);
    setSession(null);
    setScreenings([]);
    const [s, resp] = await Promise.all([
      supabase.from("self_assessment_sessions").select("*").eq("id", r.session_id).maybeSingle(),
      supabase.from("self_assessment_responses").select("*").eq("session_id", r.session_id).order("completed_at", { ascending: false }),
    ]);
    if (s.error) {
      toast({ title: "Cannot load session", description: s.error.message, variant: "destructive" });
      return;
    }
    setSession(s.data as Session);
    setScreenings((resp.data ?? []) as ScreeningResponse[]);
  };

  const updateStatus = async (status: "accepted" | "declined" | "escalated" | "closed") => {
    if (!openReferral) return;
    setBusy(true);
    const patch: any = { status };
    if (status === "accepted") patch.accepted_at = new Date().toISOString();
    if (status === "escalated") patch.escalated = true;
    const { error } = await supabase.from("facility_referrals").update(patch).eq("id", openReferral.id);
    setBusy(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Referral ${status}` });
    setOpenReferral(null);
    void loadReferrals();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return null;

  const pending = referrals.filter(r => r.status === "pending");
  const accepted = referrals.filter(r => r.status === "accepted");
  const archived = referrals.filter(r => ["declined", "closed", "escalated"].includes(r.status));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg"><Building2 className="h-6 w-6 text-primary-foreground" /></div>
            <div>
              <h1 className="text-2xl font-bold">Facility Portal</h1>
              <p className="text-sm text-muted-foreground">Inbound self-referrals from the public assessment</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Clinician dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {openReferral && session ? (
          <ClinicalView
            referral={openReferral}
            session={session}
            screenings={screenings}
            onBack={() => setOpenReferral(null)}
            onAction={updateStatus}
            busy={busy}
          />
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full max-w-xl mx-auto mb-6 grid-cols-3">
              <TabsTrigger value="pending"><Inbox className="h-4 w-4 mr-2" /> Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="accepted"><CheckCircle2 className="h-4 w-4 mr-2" /> Accepted ({accepted.length})</TabsTrigger>
              <TabsTrigger value="archive"><XCircle className="h-4 w-4 mr-2" /> Archive ({archived.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending"><ReferralList items={pending} onOpen={openClinicalView} emptyText="No pending referrals." /></TabsContent>
            <TabsContent value="accepted"><ReferralList items={accepted} onOpen={openClinicalView} emptyText="No accepted referrals." /></TabsContent>
            <TabsContent value="archive"><ReferralList items={archived} onOpen={openClinicalView} emptyText="Nothing in archive." /></TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ReferralList({ items, onOpen, emptyText }: { items: Referral[]; onOpen: (r: Referral) => void; emptyText: string }) {
  if (items.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-12">{emptyText}</p>;
  }
  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {items.map((r) => {
        const slaMs = new Date(r.sla_deadline).getTime() - Date.now();
        const hoursLeft = Math.max(0, Math.round(slaMs / 3_600_000));
        return (
          <button key={r.id} onClick={() => onOpen(r)} className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">Self-referral · {new Date(r.matched_at).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Status: <span className="capitalize">{r.status}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={hoursLeft < 12 ? "destructive" : "secondary"} className="text-xs">
                  <Clock className="w-3 h-3 mr-1" /> {hoursLeft}h SLA
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ClinicalView({
  referral, session, screenings, onBack, onAction, busy,
}: {
  referral: Referral; session: Session; screenings: ScreeningResponse[];
  onBack: () => void; onAction: (s: "accepted" | "declined" | "escalated" | "closed") => void; busy: boolean;
}) {
  const phq9 = screenings.find(s => s.tool_type === "PHQ-9");
  const ai = session.ai_diagnostic_suggestions;
  const isCrisis = session.risk_level === "crisis";

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back to inbox</Button>

      {isCrisis && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <p className="font-semibold text-destructive text-sm">High-risk indicator: PHQ-9 Item 9 ≥ 1</p>
              <p className="text-xs text-muted-foreground mt-1">Self-reported suicidal ideation. Prioritise contact.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Patient context</CardTitle>
          <CardDescription>Self-reported, anonymised. No PII.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><strong>Age band:</strong> {session.demographics?.age_band ?? "—"}</p>
          <p><strong>Gender:</strong> {session.demographics?.gender ?? "—"}</p>
          <p><strong>Region:</strong> {session.location_region ?? "—"}</p>
          <p><strong>Language:</strong> {session.language_code}</p>
          <p><strong>Submitted:</strong> {new Date(session.created_at).toLocaleString()}</p>
        </CardContent>
      </Card>

      {phq9 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">PHQ-9</CardTitle>
            <CardDescription>{phq9.interpretation}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p><strong>Score:</strong> {phq9.total_score}/27 ({phq9.severity_level})</p>
            {phq9.item_flags?.suicidal_ideation && (
              <p className="text-destructive mt-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Item 9 flagged: {phq9.item_flags?.q9_score}</p>
            )}
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
            <CardTitle className="text-lg flex items-center gap-2">
              AI Diagnostic Suggestions
              <Badge variant="outline" className="text-xs">For clinical review only</Badge>
            </CardTitle>
            <CardDescription>
              AI-generated suggestion requiring clinical review. The patient has NOT seen this. Final diagnosis is yours.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            {ai.primary_consideration && (
              <div>
                <p className="font-semibold">Primary consideration</p>
                <p className="text-muted-foreground">
                  <strong>{ai.primary_consideration.code}</strong> · {ai.primary_consideration.name}
                  {typeof ai.primary_consideration.confidence === "number" && ` (${ai.primary_consideration.confidence}%)`}
                </p>
                {ai.primary_consideration.reasoning && <p className="mt-1">{ai.primary_consideration.reasoning}</p>}
              </div>
            )}
            {Array.isArray(ai.differential) && ai.differential.length > 0 && (
              <div>
                <p className="font-semibold">Differential</p>
                <ul className="list-disc list-inside text-muted-foreground">
                  {ai.differential.map((d: any, i: number) => (
                    <li key={i}><strong>{d.code}</strong> · {d.name} {typeof d.confidence === "number" && `(${d.confidence}%)`}</li>
                  ))}
                </ul>
              </div>
            )}
            {ai.cultural_formulation && (
              <div><p className="font-semibold">Cultural formulation</p><p className="text-muted-foreground">{ai.cultural_formulation}</p></div>
            )}
            {Array.isArray(ai.clinical_alerts) && ai.clinical_alerts.length > 0 && (
              <div><p className="font-semibold">Clinical alerts</p>
                <ul className="list-disc list-inside text-muted-foreground">{ai.clinical_alerts.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>
              </div>
            )}
            {Array.isArray(ai.recommended_next_steps) && ai.recommended_next_steps.length > 0 && (
              <div><p className="font-semibold">Recommended next steps</p>
                <ul className="list-disc list-inside text-muted-foreground">{ai.recommended_next_steps.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
            {ai.raw && <pre className="text-xs whitespace-pre-wrap">{ai.raw}</pre>}
          </CardContent>
        </Card>
      )}

      {referral.status === "pending" && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Triage actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => onAction("accepted")} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Accept
            </Button>
            <Button variant="destructive" onClick={() => onAction("escalated")} disabled={busy}>
              <AlertTriangle className="w-4 h-4 mr-2" /> Escalate
            </Button>
            <Button variant="outline" onClick={() => onAction("declined")} disabled={busy}>
              <XCircle className="w-4 h-4 mr-2" /> Decline
            </Button>
          </CardContent>
        </Card>
      )}
      {referral.status === "accepted" && (
        <Card>
          <CardContent className="py-4 flex justify-end">
            <Button variant="outline" onClick={() => onAction("closed")} disabled={busy}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as closed
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
