import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Eye, FileText, ArrowUpRight } from "lucide-react";

export function CHWHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [openSession, setOpenSession] = useState<any | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [phq9, setPhq9] = useState<any | null>(null);
  const [chunks, setChunks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: sessions } = await supabase
        .from("chw_sessions")
        .select("*")
        .eq("chw_id", user.id)
        .neq("status", "active")
        .order("ended_at", { ascending: false });

      if (!sessions?.length) {
        setRows([]);
        return;
      }
      const pids = Array.from(new Set(sessions.map((s) => s.patient_id)));
      const { data: pats } = await supabase
        .from("patients")
        .select("id, patient_identifier")
        .in("id", pids);
      const map = new Map((pats || []).map((p) => [p.id, p.patient_identifier]));
      setRows(sessions.map((s) => ({ ...s, patient_name: map.get(s.patient_id) || "Unknown" })));
    })();
  }, [user]);

  const openDetails = async (row: any) => {
    setOpenSession(row);
    setReferrals([]);
    setPhq9(null);
    setChunks([]);

    const [{ data: refs }, { data: scr }, { data: chs }] = await Promise.all([
      supabase
        .from("referrals")
        .select("*")
        .eq("chw_session_id", row.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("screening_assessments")
        .select("*")
        .eq("patient_id", row.patient_id)
        .eq("tool_type", "PHQ9")
        .order("administered_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("chw_session_transcript_chunks")
        .select("*")
        .eq("session_id", row.id)
        .order("chunk_index", { ascending: true }),
    ]);
    setReferrals(refs || []);
    setPhq9(scr || null);
    setChunks(chs || []);
  };

  if (!rows.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No completed sessions yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex justify-between items-center gap-2">
                <span>
                  {r.patient_name} — Session #{r.session_number}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{r.status}</Badge>
                  {r.phq9_item9_flag && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" /> Item 9
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="text-muted-foreground">
                {new Date(r.started_at).toLocaleString()} →{" "}
                {r.ended_at ? new Date(r.ended_at).toLocaleString() : "ongoing"}
              </div>
              {r.phq9_score != null && (
                <div>
                  PHQ-9: {r.phq9_score}/27 ({r.phq9_severity})
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => openDetails(r)}>
                <Eye className="h-4 w-4 mr-2" /> View full session
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!openSession} onOpenChange={(o) => !o && setOpenSession(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          {openSession && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {openSession.patient_name} — Session #{openSession.session_number}
                </DialogTitle>
                <DialogDescription>
                  {new Date(openSession.started_at).toLocaleString()}
                  {openSession.ended_at &&
                    ` → ${new Date(openSession.ended_at).toLocaleString()}`}
                  {" · "}
                  <Badge variant="outline" className="ml-1">
                    {openSession.status}
                  </Badge>
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-4">
                  {openSession.phq9_item9_flag && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Safety alert:</strong> Client endorsed PHQ-9 Item 9 (thoughts
                        of self-harm) during this session.
                      </AlertDescription>
                    </Alert>
                  )}

                  {openSession.phq9_score != null && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">PHQ-9 Screening</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge>{openSession.phq9_severity}</Badge>
                          <span>Score: {openSession.phq9_score}/27</span>
                        </div>
                        {phq9?.responses && Array.isArray(phq9.responses) && (
                          <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t">
                            {(phq9.responses as number[]).map((v, i) => (
                              <div key={i} className="flex justify-between">
                                <span className="text-muted-foreground">Q{i + 1}</span>
                                <span className="font-medium">{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {phq9?.interpretation && (
                          <p className="text-xs text-muted-foreground pt-2 border-t">
                            {phq9.interpretation}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Conversation Transcript
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {chunks.length > 0 ? (
                        <ol className="space-y-3">
                          {chunks.map((c) => {
                            const start = new Date(c.started_at);
                            const end = new Date(c.ended_at);
                            const duration =
                              c.duration_seconds != null
                                ? Number(c.duration_seconds).toFixed(1)
                                : ((end.getTime() - start.getTime()) / 1000).toFixed(1);
                            return (
                              <li
                                key={c.id}
                                className="border-l-2 border-primary/40 pl-3 space-y-1"
                              >
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-mono">
                                    {start.toLocaleTimeString()} – {end.toLocaleTimeString()}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    #{c.chunk_index + 1}
                                  </Badge>
                                  <span>{duration}s</span>
                                  {c.language_code && (
                                    <Badge variant="secondary" className="text-xs">
                                      {c.language_code}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {c.text}
                                </p>
                              </li>
                            );
                          })}
                        </ol>
                      ) : openSession.narrative_text ? (
                        <>
                          <p className="text-xs text-muted-foreground mb-2">
                            Per-chunk timestamps not available for this session (recorded before
                            chunk-level capture was enabled). Showing combined narrative:
                          </p>
                          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                            {openSession.narrative_text}
                          </pre>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No transcript captured for this session.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {openSession.notes && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">CHW Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{openSession.notes}</p>
                      </CardContent>
                    </Card>
                  )}

                  {referrals.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4" /> Referrals from this session
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {referrals.map((r) => (
                          <div
                            key={r.id}
                            className="text-sm border rounded-md p-2 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{r.referral_type}</span>
                              <Badge
                                variant={
                                  r.urgency === "emergency" ? "destructive" : "secondary"
                                }
                              >
                                {r.urgency}
                              </Badge>
                            </div>
                            {r.destination && (
                              <div className="text-xs text-muted-foreground">
                                To: {r.destination}
                              </div>
                            )}
                            {r.reason && <div className="text-xs">{r.reason}</div>}
                            {r.notes && (
                              <div className="text-xs whitespace-pre-wrap">{r.notes}</div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
