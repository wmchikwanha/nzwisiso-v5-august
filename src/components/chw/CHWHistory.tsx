import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CHWHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

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
    <div className="space-y-3">
      {rows.map((r) => (
        <Card key={r.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex justify-between">
              <span>
                {r.patient_name} — Session #{r.session_number}
              </span>
              <Badge variant="outline">{r.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="text-muted-foreground">
              {new Date(r.started_at).toLocaleString()} →{" "}
              {r.ended_at ? new Date(r.ended_at).toLocaleString() : "ongoing"}
            </div>
            {r.phq9_score != null && (
              <div>
                PHQ-9: {r.phq9_score}/27 ({r.phq9_severity})
              </div>
            )}
            {r.narrative_text && (
              <div className="text-xs whitespace-pre-wrap line-clamp-3">{r.narrative_text}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
